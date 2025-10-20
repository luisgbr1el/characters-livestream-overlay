import fs from "fs";
import path from "path";

export function readJson(relPath, fallback = null) {
  const full = path.resolve(process.cwd(), relPath);
  try {
    if (!fs.existsSync(full)) {
      if (fallback !== null) {
        fs.writeFileSync(full, JSON.stringify(fallback, null, 2));
        return fallback;
      }
      return null;
    }
    const raw = fs.readFileSync(full, "utf-8");
    if (!raw || raw.trim() === "") {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("readJson error:", err);
    return fallback;
  }
}

export function writeJson(relPath, data) {
  const full = path.resolve(process.cwd(), relPath);
  try {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(full, jsonString, "utf-8");
  } catch (error) {
    throw error;
  }
}