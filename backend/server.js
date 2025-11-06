// server.js (CLEANED AND MODULARIZED)

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// --- MODULE IMPORTS ---
import { changeKioskUrl } from "./kioskController.js";
import { setupGameRoutes } from "./gameApi.js";
import { setupGameDetailRoutes } from "./gameDetailApi.js";
import commandRouter from './routes/commandRouter.js';
import adminRouter from './routes/adminRouter.js'; // Assumes this handles Kiosk Control

// --- SERVICE IMPORTS ---
import {getCurrentGames, startTicker } from "./services/tickerDataService.js"
import { startDataPolling } from './services/dataFetcher.js';
import { registerSocket } from "./services/monitorService.js";
//import "./utils/logger.js";
import { setSocket } from "./utils/logger.js";
// --- Path Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); 
const ABSOLUTE_DATA_DIR = path.join(__dirname, 'data');
// --------------------

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
const FEEDS = [NFL_FEED, MLB_FEED, EPL_FEED,NBA_FEED,NHL_FEED];

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

// ===============================================
// --- ROUTE REGISTRATION (CLEANED) ---
// ===============================================

// 1. Data API Routes (Game Data)
setupGameRoutes(app, FEEDS, ABSOLUTE_DATA_DIR);
setupGameDetailRoutes(app, FEEDS, ABSOLUTE_DATA_DIR);

// 2. General Games Endpoint
app.get("/api/games", (req, res) => {
    res.json(getCurrentGames());
});

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

// 5. Default Route (Removed old HTML string route app.get('/'))
// Redirects the root path to the new Kiosk Control Panel page
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 50px; text-align: center;">
            <h1 style="color: #4f46e5;">Kiosk Admin Console</h1>
            <p>Go to the admin panel:</p>
            <a href="/admin" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; border-radius: 8px; text-decoration: none;">Launch Admin 1</a>
        </div>
    `);
});


// ===============================================
// --- SERVER STARTUP AND POLLING ---
// ===============================================
startTicker(io, FEEDS, ABSOLUTE_DATA_DIR);

server.listen(3000, () => {
    console.log("✅ Server running on port 3000");
    console.log(`✅ Kiosk Control Panel (Admin) available at http://localhost:3000/admin`);
    console.log(`✅ Remote Commander UI available at http://localhost:3000/commander`);
    FEEDS.forEach(feed => {
        startDataPolling(feed.url, feed.file, ABSOLUTE_DATA_DIR); 
    });
});