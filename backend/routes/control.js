// backend/routes/control.js
import express from "express";
import fs from "fs";
import path from "path";

const configPath = path.resolve("./config/settings.json");

export function controlRouter(io) {
  const router = express.Router();

  // GET current settings
  router.get("/", (req, res) => {
    const settings = JSON.parse(fs.readFileSync(configPath));
    res.json(settings);
  });

  // POST new settings
  router.post("/", (req, res) => {
    const newSettings = req.body;
    fs.writeFileSync(configPath, JSON.stringify(newSettings, null, 2));
    io.emit("settingsUpdated", newSettings);
    console.log("🔄 Settings changed via control panel:", newSettings);
    res.json({ success: true, newSettings });
  });

  return router;
}
