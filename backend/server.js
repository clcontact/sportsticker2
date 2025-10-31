// backend/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getCurrentGames, startTickerDataService } from "./services/tickerDataService.js";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());

// Endpoint for ticker polling
app.get("/api/games", (req, res) => {
  res.json(getCurrentGames());
});

// Start ticker simulation (scores update)
startTickerDataService(io);

server.listen(3000, () => console.log("Server running on port 3000"));
