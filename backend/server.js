// backend/server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import cors from "cors";
import { controlRouter } from "./routes/control.js";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Use router (now imported as a named function)
app.use("/api/control", controlRouter(io));

// Root route
app.get("/", (req, res) => res.send("Sports Ticker Backend Running"));

// Watch settings for live updates
const configPath = path.resolve("./config/settings.json");

fs.watchFile(configPath, () => {
  const newSettings = JSON.parse(fs.readFileSync(configPath));
  io.emit("settingsUpdated", newSettings);
  console.log("Settings updated & broadcasted:", newSettings);
});

// WebSocket connections
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  const currentSettings = JSON.parse(fs.readFileSync(configPath));
  socket.emit("settingsUpdated", currentSettings);

  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});