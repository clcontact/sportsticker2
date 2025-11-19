// server.js (CLEANED AND MODULARIZED)

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from "body-parser";
import { promises as fs, watch } from 'fs';
import fetch from "node-fetch"; // Added fetch import for the proxy routes

// --- MODULE IMPORTS ---
import { changeKioskUrl } from "./kioskController.js";
import { isChromeRunning, startChrome, restartChrome } from "./chromeSupervisor.js";
import { setupUnifiedGameRoutes } from "./gameApi.js"; // Keep this if you use it in initializeDynamicContent
import { setupGameScoreboardRoutes } from "./gamescoreboardApi.js" // Keep this
import { setupGameDetailRoutes } from "./gameDetailApi.js"; // Keep this
import commandRouter from './routes/commandRouter.js';
import adminRouter from './routes/adminRouter.js'; 
import { getDisplayInfo, changeDisplay } from "./controller.js";

// --- SERVICE IMPORTS ---
import {getCurrentGames, startTicker, startNCAATicker } from "./services/tickerDataService.js"
import { startDataPolling } from './services/dataFetcher.js';
import { registerSocket } from "./services/monitorService.js";
import { setSocket } from "./utils/logger.js";
import { startGameTrackerPolling } from "./services/gameTrackerService.js";

// --- DYNAMIC CONFIG & ROUTE MANAGEMENT IMPORTS ---
import { initializeDynamicContent } from "./routes/routeManager.js"; 

// --- Path Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); 
const ABSOLUTE_DATA_DIR = path.join(__dirname, 'data');
// --------------------

// ===============================================
// --- CONFIGURATION (FIXED ORDER) ---
// ===============================================
const RPI_IP = 'localhost'; 
const CDP_PORT = 9222;
const KIOSK_FRONTEND_BASE_URL = 'http://localhost:3001/LeagueTracker'; 

// --- DYNAMIC FEED CONFIGURATION SETUP ---
const CONFIG_FILENAME = 'feedConfig.json';
const CONFIG_PATH = path.join(__dirname, CONFIG_FILENAME);

// ⭐️ FIX: Declare FEEDS before KIOSK_CONFIG ⭐️
// Use 'let' so we can update this variable at runtime
let FEEDS = [];

// Group all Kiosk config for easy passing to routers (Now uses 'let' FEEDS)
const KIOSK_CONFIG = { RPI_IP, CDP_PORT, KIOSK_FRONTEND_BASE_URL, FEEDS };

/**
 * Loads the configuration from the JSON file and updates the FEEDS variable.
 */
// Watch the config file for changes (Debounced)
// The 'change' event fires when the file content changes.
function setupConfigWatcher() {
    watch(CONFIG_PATH, (eventType, filename) => {
        if (filename && eventType === 'change') {
            console.log(`\n\n🚨 Configuration change detected for ${filename}. Reloading...`);
            // Use a slight debounce delay (100ms) to ensure the writing process is complete
            setTimeout(loadFeedsConfig, 100); 
        }
    });
    console.log(`✅ Started watcher on ${CONFIG_FILENAME}`);
}

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
app.use(express.static("public"));
app.use('/assets', express.static('public'));

// ===============================================
// --- ROUTE REGISTRATION ---
// ===============================================

// 1. Data API Routes
app.get("/api/games", (req, res) => {
    res.json(getCurrentGames());
});

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

// 2. Admin Pages Routes
app.use('/admin', adminRouter(KIOSK_CONFIG, changeKioskUrl));

// 3. Remote Command API and Admin HTML
app.use('/api/remote', commandRouter); 
app.use('/api/commander', commandRouter); 
 
app.get('/commander', (req, res) => {
    res.render('commander_admin'); 
});
app.get("/controller", (req, res) => {
    res.sendFile(path.join(__dirname, "public/controller.html"));
});
app.get("/cp", (req, res) => {
    res.sendFile(path.join(__dirname, "public/control_panel.html"));
});

// 4. Chrome Management Routes
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

// 5. Client Facing Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});
app.get("/ncaam", (req, res) => {
    res.sendFile(path.join(__dirname, "public/ncaam.html"));
});
app.get("/main", (req, res) => {
    res.sendFile(path.join(__dirname, "public/mainSwitcher.html"));
});
app.get("/mainAdmin", (req, res) => {
    res.sendFile(path.join(__dirname, "public/mainSwitcherAdmin.html"));
});
app.get("/mainLeft", (req, res) => {
    res.sendFile(path.join(__dirname, "public/mainLeft.html"));
});
app.get("/mainRight", (req, res) => {
    res.sendFile(path.join(__dirname, "public/mainRight.html"));
});
app.get("/scoreboard/:league", (req, res) => {
    // Note: The original code used req.params.league.toLowerCase() twice, which is unnecessary
    res.sendFile(path.join(__dirname, "public/scoreboard.html"));
});
app.get("/ncaamtrack/:gameid", (req, res) => {
    const { gameid } = req.params;
    res.sendFile(path.join(__dirname, "public/ncaamtrack.html"));
});
app.get("/scoreboardSingle/:league/:gameid", (req, res) => {
    // Note: req.params.league and req.params.gameid already contain the values
    res.sendFile(path.join(__dirname, "public/scoreboardsingle.html"));
});

// 6. NCAA Mens basketball Proxy Endpoints
app.get("/api/ncaagamesm", async (req, res) => {
    try {
        const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard");
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get("/api/ncaagamesm/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard/${id}`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ===============================================
// --- SERVER STARTUP AND CONFIG MANAGEMENT ---
// ===============================================

/**
 * MODIFIED loadFeedsConfig:
 * Loads config, updates FEEDS, and re-initializes dynamic content if needed.
 */
async function loadFeedsConfig() {
    console.log(`Attempting to load config from: ${CONFIG_PATH}`);
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        const newFeeds = JSON.parse(data);
        
        if (JSON.stringify(FEEDS) !== JSON.stringify(newFeeds)) {
            // Update the global FEEDS variable (since it's 'let')
            FEEDS = newFeeds;
            console.log('✅ Feeds configuration successfully loaded/reloaded. Reinitializing...');
            
            // Re-initialize the FEEDS property of the KIOSK_CONFIG object (since it's 'const')
            KIOSK_CONFIG.FEEDS = FEEDS; 
            
            // *** CRITICAL STEP: RE-INITIALIZE DYNAMIC CONTENT ***
            // This handles stopping old services, re-registering routes, and restarting polling/ticker.
            initializeDynamicContent(app, FEEDS, ABSOLUTE_DATA_DIR, io, startDataPolling);

        } else {
            console.log('ℹ️ Config file changed, but content was identical. No action taken.');
        }

    } catch (error) {
        console.error('❌ ERROR loading feeds configuration:', error.message);
    }
}


async function startApp() {
    // 1. Load configuration first
    await loadFeedsConfig();
    setupConfigWatcher();

    // 2. Start the server
    server.listen(3000, () => {
        console.log("✅ Server running on port 3000");
        console.log(`✅ Kiosk Control Panel (Admin) available at http://localhost:3000/admin`);
        console.log(`✅ Remote Commander UI available at http://localhost:3000/commander`);
        
        // 🔹 Start high-frequency game tracker polling (near real-time)
        const GAME_TRACKER_FEED = {
            url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl", // example
            file: "live_tracker.json"
        };
        startGameTrackerPolling(GAME_TRACKER_FEED.url, GAME_TRACKER_FEED.file, ABSOLUTE_DATA_DIR);    
    });
}

// Execute the async startup function
startApp();