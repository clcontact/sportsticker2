// server.js (CLEANED AND MODULARIZED)

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from "body-parser";

// --- MODULE IMPORTS ---
import { changeKioskUrl } from "./kioskController.js";
import { isChromeRunning, startChrome, restartChrome } from "./chromeSupervisor.js";
//import { setupGameRoutes, setupNCAAGameRoutes } from "./gameApi.js";
//import { setupUnifiedGameRoutes } from "./gameApi.js";
import { setupUnifiedGameRoutes } from "./gameApi.js";
import { setupGameDetailRoutes } from "./gameDetailApi.js";
import commandRouter from './routes/commandRouter.js';
import adminRouter from './routes/adminRouter.js'; // Assumes this handles Kiosk Control
import { getDisplayInfo, changeDisplay } from "./controller.js";

// --- SERVICE IMPORTS ---
import {getCurrentGames, startTicker, startNCAATicker } from "./services/tickerDataService.js"
import { startDataPolling } from './services/dataFetcher.js';
import { registerSocket } from "./services/monitorService.js";
import { setSocket } from "./utils/logger.js";
import { startGameTrackerPolling } from "./services/gameTrackerService.js";

// --- Path Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); 
const ABSOLUTE_DATA_DIR = path.join(__dirname, 'data');
// --------------------

//this is for the ncaam game tracker for now on the backend
let trackedGameId = null;

// ===============================================
// --- CONFIGURATION ---
// ===============================================
const RPI_IP = 'localhost'; 
const CDP_PORT = 9222;
const KIOSK_FRONTEND_BASE_URL = 'http://localhost:3001/LeagueTracker'; 

const NFL_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl", file: "nfl_data.json", route: "nfl" };
const MLB_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=baseball&league=mlb", file: "mlb_data.json", route: "mlb" };
const EPL_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer&league=eng.1", file: "premier_data.json", route: "epl" };
const NBA_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=basketball&league=nba", file: "nba_data.json", route: "nba" };
const NHL_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=hockey&league=nhl", file: "nhl_data.json", route: "nhl" };
const COLLEGE_FB_FEED = { url: "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard", file: "ncaaf_data.json", route: "ncaaf" };
const COLLEGE_BB_FEED = { url: "http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard", file: "ncaam_data.json", route: "ncaam" };
//
const NFLTRACKER_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl&team=phi", file: "nflGameTracker_data.json", route: "nfltracker" };
const FEEDS = [NFL_FEED, MLB_FEED, EPL_FEED,NBA_FEED,NHL_FEED,NFLTRACKER_FEED,COLLEGE_FB_FEED,COLLEGE_BB_FEED];

//const NCAA = [COLLEGE_FB_FEED,COLLEGE_BB_FEED];

// Group all Kiosk config for easy passing to routers
const KIOSK_CONFIG = { RPI_IP, CDP_PORT, KIOSK_FRONTEND_BASE_URL, FEEDS };

// ===============================================
// --- EXPRESS AND SOCKET.IO SETUP ---
// ===============================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
registerSocket(io);
// connect logger to socket
setSocket(io);
// EJS Configuration for Dynamic Pages (VIEWS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
// ===============================================
// --- ROUTE REGISTRATION (CLEANED) ---
// ===============================================

// 1. Data API Routes (Game Data)
//setupGameRoutes(app, FEEDS, ABSOLUTE_DATA_DIR);
//setupNCAAGameRoutes(app, NCAA, ABSOLUTE_DATA_DIR);
setupUnifiedGameRoutes(app, FEEDS, ABSOLUTE_DATA_DIR);
//setupUnifiedGameRoutes(app);
setupGameDetailRoutes(app, FEEDS, ABSOLUTE_DATA_DIR);

// 2. General Games Endpoint
app.get("/api/games", (req, res) => {
    res.json(getCurrentGames());
});
/** Get this working but not now.
app.get("/api/ncaagames", (req, res) => {
    res.json(getNCAACurrentGames());
});
*/

app.get("/displays", async (req, res) => {
  const ports = [9222, 9223];
  const results = await Promise.all(ports.map(p => getDisplayInfo(p)));
  res.json(results.flat());
});
app.get("/displays/info", async (req, res) => {
  const left = await getDisplayInfo(9222);
  const right = await getDisplayInfo(9223);
  res.json({ left, right });
});

app.post("/displays/change", changeDisplay);

// 3. Admin Pages Routes (Kiosk Control Panel and others)
// The adminRouter now handles the root Kiosk Control Panel page (at /admin) 
// and the /api/change-url endpoint (now /admin/change-url)
app.use('/admin', adminRouter(KIOSK_CONFIG, changeKioskUrl));

// 4. Remote Command API and Admin HTML
// The /api/remote is for the API calls (e.g., /api/remote/commands)
app.use('/api/remote', commandRouter); 
app.use('/api/commander', commandRouter); // 2. Mount it under the URL path /api/commander
// The /commander route serves the new "Pi Remote Commander" UI
 
app.get('/commander', (req, res) => {
    // Renders the new EJS template for the Pi Remote Commander UI
    res.render('commander_admin'); 
});
app.get("/controller", (req, res) => {
  res.sendFile(path.join(__dirname, "public/controller.html"));
});
/**Chrome management paths: */
app.get("/chrome/status", async (req, res) => {
  const left = await isChromeRunning(9222);
  const right = await isChromeRunning(9223);
  res.json({ left, right });
});

app.post("/chrome/start/:screen", async (req, res) => {
  const { screen } = req.params;
  const result = await startChrome(screen);
  res.json(result);
});

app.post("/chrome/restart/:screen", async (req, res) => {
  const { screen } = req.params;
  const result = await restartChrome(screen);
  res.json(result);
});
app.get("/supervisor", (req, res) => {
  res.sendFile(path.join(__dirname, "public/supervisor.html"));
});
// 5. Default Route (Removed old HTML string route app.get('/'))
// Redirects the root path to the new Kiosk Control Panel page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
app.get("/ncaam", (req, res) => {
  res.sendFile(path.join(__dirname, "public/ncaam.html"));
});
app.get("/ncaamtrack/:gameid", (req, res) => {
  const { gameid } = req.params;
  res.sendFile(path.join(__dirname, "public/ncaamtrack.html"));
});
/*
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 50px; text-align: center;">
            <h1 style="color: #4f46e5;">Kiosk Admin Console</h1>
            <p>Go to the admin panel:</p>
            <a href="/admin" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; border-radius: 8px; text-decoration: none;">Launch Admin 1</a>
        </div>
    `);
});
*/
//NCAA Mens basketball
// Proxy ESPN APIs to bypass CORS
app.get("/api/ncaagamesm", async (req, res) => {
  try {
    const response = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard"
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/ncaagamesm/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard/${id}`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store a "tracked" game id (if you want to preselect one for a display)
app.post("/api/track", (req, res) => {
  trackedGameId = req.body.gameId;
  res.json({ ok: true, gameId: trackedGameId });
});

app.get("/api/track", (req, res) => {
  res.json({ gameId: trackedGameId });
});
// ===============================================
// --- SERVER STARTUP AND POLLING ---
// ===============================================
startTicker(io, FEEDS, ABSOLUTE_DATA_DIR);
//startNCAATicker(io, NCAA, ABSOLUTE_DATA_DIR);

server.listen(3000, () => {
    console.log("✅ Server running on port 3000");
    console.log(`✅ Kiosk Control Panel (Admin) available at http://localhost:3000/admin`);
    console.log(`✅ Remote Commander UI available at http://localhost:3000/commander`);
    FEEDS.forEach(feed => {
        startDataPolling(feed.url, feed.file, ABSOLUTE_DATA_DIR); 
    });


    // 🔹 Start high-frequency game tracker polling (near real-time)
    const GAME_TRACKER_FEED = {
        url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl", // example
        file: "live_tracker.json"
    };
    startGameTrackerPolling(GAME_TRACKER_FEED.url, GAME_TRACKER_FEED.file, ABSOLUTE_DATA_DIR);    
});