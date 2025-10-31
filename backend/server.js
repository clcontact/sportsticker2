// backend/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
//import { getCurrentGames, startTicker } from "./services/TickerDataService.js";
import {getCurrentGames, startTicker } from "./services/tickerDataService.js"
import { startDataPolling } from './services/dataFetcher.js';

// --- Define your feeds ---
const NFL_FEED = {
    url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl",
    file: "nfl_data.json",
    route: "nfl"
};
const MLB_FEED = {
    url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=baseball&league=mlb",
    file: "mlb_data.json",
    route: "mlb"
};
const EPL_FEED = {
    url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer&league=eng.1",
    file: "premier_data.json",
    route: "epl"
};
//https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer&league=eng.1
const FEEDS = [NFL_FEED, MLB_FEED, EPL_FEED];
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
app.get('/api/games/:league', (req, res) => {
    const league = req.params.league.toLowerCase();
    let filename;
    
    // Find the feed configuration based on the requested route
    const feedConfig = FEEDS.find(f => f.route === league);
    
    if (!feedConfig) {
        return res.status(400).json({ error: "Invalid league specified." });
    }

    const FILE_PATH = path.join(__dirname, 'data', feedConfig.file);

   res.json(getCurrentGames());
    // ... rest of the file reading logic ...
    
    // Example call in React would change to: 
    // axios.get("http://localhost:3000/api/games/nfl") 
});
// Start the ticker updates
startTicker(io, 15000);

server.listen(3000, () => {
  console.log("✅ Server running on port 3000");
  FEEDS.forEach(feed => {
          startDataPolling(feed.url, feed.file);
      });
  }
);
