import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { readJson, writeJson } from "./utils/storage.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('json spaces', 2);

const uploadDir = path.join(process.cwd(), "server", "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  }
});
const upload = multer({ storage });
app.use("/uploads", express.static(uploadDir));

const SETTINGS_PATH = "./server/data/settings.json";
const CHARACTERS_PATH = "./server/data/characters.json";

let temporaryFiles = new Map(); // sessionId -> Set<filePath>
let fileToSession = new Map(); // filePath -> sessionId

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath))
      fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Erro ao deletar arquivo ${filePath}:`, error);
  }
};

const registerTemporaryFile = (sessionId, fileName) => {
  const fullPath = path.join(uploadDir, fileName);
  
  if (!temporaryFiles.has(sessionId)) {
    temporaryFiles.set(sessionId, new Set());
  }
  
  temporaryFiles.get(sessionId).add(fileName);
  fileToSession.set(fileName, sessionId);
};

const confirmFile = (fileName) => {
  const sessionId = fileToSession.get(fileName);
  if (sessionId && temporaryFiles.has(sessionId)) {
    temporaryFiles.get(sessionId).delete(fileName);
    fileToSession.delete(fileName);
  }
};

const cleanupSession = (sessionId) => {
  if (temporaryFiles.has(sessionId)) {
    const files = temporaryFiles.get(sessionId);
    files.forEach(fileName => {
      const fullPath = path.join(uploadDir, fileName);
      deleteFile(fullPath);
      fileToSession.delete(fileName);
    });
    temporaryFiles.delete(sessionId);
  }
};

const cleanupOldFiles = () => {
  try {
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;
    
    files.forEach(fileName => {
      const filePath = path.join(uploadDir, fileName);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtime.getTime();
      
      if (age > maxAge && fileToSession.has(fileName)) {
        deleteFile(filePath);
        
        const sessionId = fileToSession.get(fileName);
        if (sessionId && temporaryFiles.has(sessionId)) {
          temporaryFiles.get(sessionId).delete(fileName);
        }
        fileToSession.delete(fileName);
      }
    });
  } catch (error) {
    console.error('Erro na limpeza automática:', error);
  }
};

setInterval(cleanupOldFiles, 60 * 60 * 1000);

const defaultSettings = {
  general: { language: "pt-BR" },
  overlay: {
    show_icon: true,
    show_character_icon: true,
    show_health: true,
    show_name: true,
    font_size: 14,
    font_family: "Arial",
    font_color: "#FFFFFF",
    icons_size: 64,
    character_icon_size: 170,
    health_icon_file_path: null
  }
};
const defaultCharacters = [];
readJson(SETTINGS_PATH, defaultSettings);
readJson(CHARACTERS_PATH, defaultCharacters);

app.get("/api/settings", (req, res) => {
  try {
    const settings = readJson(SETTINGS_PATH, defaultSettings);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to read settings" });
  }
});

app.put("/api/settings", (req, res) => {
  try {
    const currentSettings = readJson(SETTINGS_PATH, defaultSettings);
    const settingsBody = { ...req.body };
    for (const key in settingsBody) {
      if (!currentSettings[key]) {
        return res.status(400).json({ error: `This key is not a setting: ${key}` });
      }
    }
    
    if (settingsBody.overlay && settingsBody.overlay.health_icon_file_path) {
      const newIconPath = settingsBody.overlay.health_icon_file_path;
      const currentIconPath = currentSettings.overlay.health_icon_file_path;
      
      if (currentIconPath && currentIconPath !== newIconPath) {
        const oldFileName = currentIconPath.replace('/uploads/', '');
        const oldFilePath = path.join(uploadDir, oldFileName);
        deleteFile(oldFilePath);
      }
      
      if (newIconPath) {
        const newFileName = newIconPath.replace('/uploads/', '');
        confirmFile(newFileName);
      }
    }
    
    const newSettings = { ...currentSettings, ...settingsBody };
    writeJson(SETTINGS_PATH, newSettings);
    io.emit("settingsUpdated", newSettings);
    res.status(201).json(newSettings);
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: "Field name must be 'file'" });
      }
      if (err.message.includes('Field name missing')) {
        return res.status(400).json({ error: "Field name 'file' is required" });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const sessionId = req.headers['x-session-id'] || 'default';
    const fileName = req.file.filename;
    const url = `/uploads/${fileName}`;
    
    registerTemporaryFile(sessionId, fileName);
    
    res.json({ url, fileName });
  });
});

app.post("/api/confirm-file", (req, res) => {
  const { fileName } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: "fileName is required" });
  }
  
  confirmFile(fileName);
  res.json({ success: true });
});

app.delete("/api/cleanup-session", (req, res) => {
  const sessionId = req.headers['x-session-id'] || 'default';
  cleanupSession(sessionId);
  res.json({ success: true });
});

app.delete("/api/delete-file", (req, res) => {
  const { fileName } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: "fileName is required" });
  }
  
  const fullPath = path.join(uploadDir, fileName);
  deleteFile(fullPath);
  
  const sessionId = fileToSession.get(fileName);
  if (sessionId && temporaryFiles.has(sessionId)) {
    temporaryFiles.get(sessionId).delete(fileName);
    fileToSession.delete(fileName);
  }
  
  res.json({ success: true });
});

app.get("/api/characters", (req, res) => {
  const chars = readJson(CHARACTERS_PATH, defaultCharacters);
  res.json(chars);
});

app.post("/api/characters", (req, res) => {
  const chars = readJson(CHARACTERS_PATH, defaultCharacters);
  const newChar = req.body;

  if (!newChar.name) return res.status(400).json({ error: "name required" });
  if (chars.find(c => c.name === newChar.name)) return res.status(409).json({ error: "Character already exists" });

  const characterWithId = {
    id: uuidv4(),
    ...newChar
  };

  if (characterWithId.icon) {
    const fileName = characterWithId.icon.replace('/uploads/', '');
    confirmFile(fileName);
  }

  chars.push(characterWithId);
  writeJson(CHARACTERS_PATH, chars);
  io.emit("charactersUpdated", chars);
  res.status(201).json(chars);
});

app.put("/api/characters/:id", (req, res) => {
  const id = req.params.id;
  const hp = req.body.hp;
  if (hp !== undefined && (isNaN(hp) || hp < 0))
    return res.status(400).json({ error: "HP must be a non-negative number" });

  const chars = readJson(CHARACTERS_PATH, defaultCharacters);
  const idx = chars.findIndex(c => c.id === id);

  if (idx === -1) return res.status(404).json({ error: "Character not found" });

  if (hp > chars[idx].maxHp)
    req.body.hp = chars[idx].maxHp;

  if (req.body.icon && req.body.icon !== chars[idx].icon) {
    if (chars[idx].icon) {
      const oldFileName = chars[idx].icon.replace('/uploads/', '');
      const oldFilePath = path.join(uploadDir, oldFileName);
      deleteFile(oldFilePath);
    }
    
    const newFileName = req.body.icon.replace('/uploads/', '');
    confirmFile(newFileName);
  }

  chars[idx] = { ...chars[idx], ...req.body };
  writeJson(CHARACTERS_PATH, chars);

  io.emit("charactersUpdated", chars);
  io.emit("characterUpdated", { id, character: chars[idx] });
  res.json(chars[idx]);
});

app.delete("/api/characters/:id", (req, res) => {
  const id = req.params.id;
  let chars = readJson(CHARACTERS_PATH, defaultCharacters);
  const characterToDelete = chars.find(c => c.id === id);
  
  if (characterToDelete && characterToDelete.icon) {
    const iconPath = characterToDelete.icon.replace('/uploads/', '');
    const fullIconPath = path.join(uploadDir, iconPath);
    deleteFile(fullIconPath);
  }
  
  const newChars = chars.filter(c => c.id !== id);
  writeJson(CHARACTERS_PATH, newChars);
  io.emit("charactersUpdated", newChars);
  res.json({ ok: true });
});

app.get("/overlay/:id", (req, res) => {
  const id = req.params.id;
  const settings = readJson(SETTINGS_PATH, defaultSettings);
  const chars = readJson(CHARACTERS_PATH, defaultCharacters);
  const character = chars.find(c => c.id === id) || null;

  const fontSize = settings.overlay.font_size || 14;
  const fontFamily = settings.overlay.font_family || "Poppins";
  const fontColor = settings.overlay.font_color || "#FFFFFF";
  const healthIconSize = settings.overlay.icons_size || 64;
  const characterIconSize = settings.overlay.character_icon_size || 170;
  const showName = settings.overlay.show_name !== false;
  const showHealth = settings.overlay.show_health !== false;
  const showIcon = settings.overlay.show_icon !== false;
  const showCharacterIcon = settings.overlay.show_character_icon !== false;
  const healthIconPath = settings.overlay.health_icon_file_path;

  const initialHtml = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Overlay - ${character ? character.name : 'Unknown'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
    <style>
      body { margin:0; background: transparent; }
      .character-overlay { 
        font-size: ${fontSize}px; 
        color: ${fontColor}; 
        font-family: "${fontFamily}", Arial, sans-serif; 
        display: flex; 
        flex-direction: column; 
        align-items: flex-start; 
        gap: 4px; 
      }
      .character-name { 
        font-weight: bold; 
        margin: 0; 
        ${!showName ? 'display: none;' : ''}
      }
      .hp-container { 
        display: flex; 
        align-items: center; 
        gap: 6px; 
        ${!showHealth ? 'display: none;' : ''}
      }
      .character-icon { 
        width: ${characterIconSize}px; 
        height: ${characterIconSize}px; 
        object-fit: contain;
        ${!showCharacterIcon ? 'display: none;' : ''}
      }
      .health-icon { 
        width: ${healthIconSize}px; 
        height: ${healthIconSize}px; 
        object-fit: contain;
        ${!showIcon ? 'display: none;' : ''}
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="character-overlay" id="characterOverlay">
        ${character && showName ? `<h3 class="character-name" id="characterName">${character.name || ''}</h3>` : ''}
        <div class="hp-container" id="hpContainer">
          ${character && character.icon && showCharacterIcon ? `<img src="${character.icon}" class="character-icon" id="characterIcon" />` : ''}
          ${healthIconPath && showIcon ? `<img src="${healthIconPath}" class="health-icon" id="healthIcon" />` : ''}
          <span id="hpText">${character ? `${character.hp ?? 0} / ${character.maxHp ?? 0}` : '—'}</span>
        </div>
      </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();

      function updateCharacterDisplay(char){
        const text = document.getElementById("hpText");
        const characterIcon = document.getElementById("characterIcon");
        const name = document.getElementById("characterName");
        
        if (!char) {
          text.innerText = '—';
          if (name) name.innerText = '';
          return;
        }
        
        text.innerText = (char.hp ?? 0) + " / " + (char.maxHp ?? 0);
        
        if (name) {
          name.innerText = char.name || '';
        }
        
        if (char.icon) {
          if (characterIcon) {
            characterIcon.src = char.icon;
          } else if (${showCharacterIcon}) {
            const img = document.createElement('img');
            img.id = 'characterIcon';
            img.className = 'character-icon';
            img.src = char.icon;
            document.getElementById('hpContainer').prepend(img);
          }
        }
      }

      // when server emits a specific character update
      socket.on('characterUpdated', (payload) => {
        if (payload && payload.id === "${id}") {
          updateCharacterDisplay(payload.character);
        }
      });

      // fallback: full list update
      socket.on('charactersUpdated', (chars) => {
        const char = (chars || []).find(c => c.id === "${id}");
        if (char) updateCharacterDisplay(char);
      });

      // initial load: ask server for characters
      fetch('/api/characters').then(r => r.json()).then(chars=>{
        const char = (chars || []).find(c => c.id === "${id}");
        if (char) updateCharacterDisplay(char);
      });

      // optional: listen settings
      socket.on('settingsUpdated', (s) => {
        const overlayElement = document.querySelector('.character-overlay');
        const nameElement = document.querySelector('.character-name');
        const hpContainer = document.querySelector('.hp-container');
        const characterIconElement = document.querySelector('.character-icon');
        const healthIconElement = document.querySelector('.health-icon');
        
        // Update font settings
        overlayElement.style.fontSize = (s.overlay.font_size || ${fontSize}) + 'px';
        overlayElement.style.color = s.overlay.font_color || '${fontColor}';
        overlayElement.style.fontFamily = '"' + (s.overlay.font_family || '${fontFamily}') + '", Arial, sans-serif';
        
        // Update visibility settings
        if (nameElement) {
          nameElement.style.display = s.overlay.show_name !== false ? 'block' : 'none';
        }
        if (hpContainer) {
          hpContainer.style.display = s.overlay.show_health !== false ? 'flex' : 'none';
        }
        if (characterIconElement) {
          characterIconElement.style.display = s.overlay.show_character_icon !== false ? 'block' : 'none';
        }
        
        // Update health icon
        if (healthIconElement) {
          healthIconElement.style.display = s.overlay.show_icon !== false ? 'block' : 'none';
          healthIconElement.style.width = (s.overlay.icons_size || ${healthIconSize}) + 'px';
          healthIconElement.style.height = (s.overlay.icons_size || ${healthIconSize}) + 'px';
          
          if (s.overlay.health_icon_file_path) {
            healthIconElement.src = s.overlay.health_icon_file_path;
          }
        } else if (s.overlay.health_icon_file_path && s.overlay.show_icon !== false) {
          // Create health icon if it doesn't exist
          const img = document.createElement('img');
          img.id = 'healthIcon';
          img.className = 'health-icon';
          img.src = s.overlay.health_icon_file_path;
          img.style.width = (s.overlay.icons_size || ${healthIconSize}) + 'px';
          img.style.height = (s.overlay.icons_size || ${healthIconSize}) + 'px';
          
          const container = document.getElementById('hpContainer');
          const hpText = document.getElementById('hpText');
          container.insertBefore(img, hpText);
        }
        
        // Update character icon size
        if (characterIconElement) {
          characterIconElement.style.width = (s.overlay.character_icon_size || ${characterIconSize}) + 'px';
          characterIconElement.style.height = (s.overlay.character_icon_size || ${characterIconSize}) + 'px';
        }
      });
    </script>
  </body>
  </html>
  `;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(initialHtml);
});

app.use(express.static(path.join(process.cwd(), "client", "dist")));

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
  });

  socket.on("updateCharacter", (payload) => {
    if (!payload || !payload.id) return;

    const chars = readJson(CHARACTERS_PATH, defaultCharacters);
    const idx = chars.findIndex(c => c.id === payload.id);

    if (idx === -1) return;

    chars[idx] = { ...chars[idx], ...payload.data };
    writeJson(CHARACTERS_PATH, chars);
    io.emit("characterUpdated", { id: payload.id, character: chars[idx] });
    io.emit("charactersUpdated", chars);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});