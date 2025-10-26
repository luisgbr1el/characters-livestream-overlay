import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import path from "path";
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

const defaultSettings = {
  general: { language: "pt-BR" },
  characters: {
    font_size: 14,
    font_file_path: null,
    font_color: "#FFFFFF",
    icons_size: 64,
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

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
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

  // Generate unique ID for the character
  const characterWithId = {
    id: uuidv4(),
    ...newChar
  };

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
    
    try {
      import('fs').then(fs => {
        if (fs.existsSync(fullIconPath))
          fs.unlinkSync(fullIconPath);
      });
    } catch (error) {
      console.error('Error deleting icon file:', error);
    }
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

  const fontSize = settings.characters.font_size || 14;
  const fontColor = settings.characters.font_color || "#FFFFFF";
  const iconSize = settings.characters.icons_size || 64;

  const initialHtml = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Overlay - ${character ? character.name : 'Unknown'}</title>
    <style>
      body { margin:0; background: transparent; }
      .hp { font-size: ${fontSize}px; color: ${fontColor}; font-family: Arial, sans-serif; display:flex; align-items:center; gap:6px; }
      .icon { width: ${iconSize}px; height: ${iconSize}px; object-fit: contain; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="hp" id="hp">
        ${character && character.icon ? `<img src="${character.icon}" class="icon" id="hpIcon" />` : ''}
        <span id="hpText">${character ? `${character.hp ?? 0} / ${character.maxHp ?? 0}` : '—'}</span>
      </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();

      function updateCharacterDisplay(char){
        const text = document.getElementById("hpText");
        const icon = document.getElementById("hpIcon");
        if (!char) {
          text.innerText = '—';
          return;
        }
        text.innerText = (char.hp ?? 0) + " / " + (char.maxHp ?? 0);
        if (char.icon) {
          if (icon) icon.src = char.icon;
          else {
            const img = document.createElement('img');
            img.id = 'hpIcon';
            img.className = 'icon';
            img.src = char.icon;
            document.getElementById('root').prepend(img);
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
        document.querySelector('.hp').style.fontSize = (s.characters.font_size || ${fontSize}) + 'px';
        document.querySelector('.hp').style.color = s.characters.font_color || '${fontColor}';
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