// backend/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
//import { getCurrentGames, startTicker } from "./services/TickerDataService.js";
import {getCurrentGames, startTicker } from "./services/tickerDataService.js"
import { startDataPolling } from './services/dataFetcher.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());

// REST endpoint to get current games
app.get("/api/games", (req, res) => {
  res.json(getCurrentGames());
});

// Start the ticker updates
startTicker(io, 15000);

server.listen(3000, () => {
  console.log("✅ Server running on port 3000");
  startDataPolling();
  }
);
