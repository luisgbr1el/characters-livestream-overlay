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
    return JSON.parse(raw || "null");
  } catch (err) {
    console.error("readJson error:", err);
    return fallback;
  }
}

export function writeJson(relPath, data) {
  const full = path.resolve(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2), "utf-8");
}