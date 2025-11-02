import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// --- MODULE IMPORTS ---
import { changeKioskUrl } from "./kioskController.js";
import { setupGameRoutes } from "./gameApi.js";
import commandRouter from './routes/commandRouter.js'; // Use import for the router

// --- END MODULE IMPORTS ---

// --- Path Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); 
const ABSOLUTE_DATA_DIR = path.join(__dirname, 'data');
// --------------------

import {getCurrentGames, startTicker } from "./services/tickerDataService.js"
import { startDataPolling } from './services/dataFetcher.js';

// ===============================================
// --- KIOSK CONFIGURATION (EDIT THIS) ---
// ===============================================
const RPI_IP = 'localhost'; // !!! CHANGE THIS TO YOUR RPi's IP !!!
const CDP_PORT = 9222;
const KIOSK_FRONTEND_BASE_URL = 'http://localhost:3001/LeagueTracker'; 

// --- Define your feeds ---
const NFL_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl", file: "nfl_data.json", route: "nfl" };
const MLB_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=baseball&league=mlb", file: "mlb_data.json", route: "mlb" };
const EPL_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer&league=eng.1", file: "premier_data.json", route: "epl" };
const NBA_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=basketball&league=nba", file: "nba_data.json", route: "nba" };
const NHL_FEED = { url: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=hockey&league=nhl", file: "nhl_data.json", route: "nhl" };

const FEEDS = [NFL_FEED, MLB_FEED, EPL_FEED,NBA_FEED,NHL_FEED];

// Define buttons based on FEEDS
const URL_BUTTONS = FEEDS.map(feed => ({
    label: `${feed.route.toUpperCase()} Live Scoreboard`,
    url: `${KIOSK_FRONTEND_BASE_URL}/${feed.route}/4`
}));
URL_BUTTONS.push({ label: "Blank Screen (About:Blank)", url: 'about:blank' });

// ===============================================
// --- EXPRESS AND SOCKET.IO SETUP ---
// ===============================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================================
// --- ROUTE REGISTRATION ---
// ===============================================

// 1. Data API Routes (Modularized by gameApi.js)
setupGameRoutes(app, FEEDS, ABSOLUTE_DATA_DIR);

// 2. General Games Endpoint
app.get("/api/games", (req, res) => {
         res.json(getCurrentGames());
});

// 3. Kiosk Control API Endpoint (Uses kioskController.js)
app.post('/api/change-url', async (req, res) => {
    const { url } = req.body;
    if (!url) { return res.status(400).json({ success: false, message: 'Missing "url" parameter.' }); }
    const result = await changeKioskUrl(url, RPI_IP, CDP_PORT);
    return res.status(result.success ? 200 : 500).json(result);
});

// 4. Kiosk Control Panel HTML Route (GET /)
app.get('/', (req, res) => {
    const buttonsHtml = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 1.5rem;
            max-width: 500px;
            margin: 0 auto;
        ">
            ${URL_BUTTONS.map(button => `
                <button
                    class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 
                           rounded-xl shadow-lg transition duration-150 ease-in-out 
                           transform hover:scale-[1.02] active:scale-[0.98] w-full text-lg"
                    style="max-width: 100%; word-wrap: break-word;"
                    data-url="${button.url}"
                    onclick="changeUrl(this.getAttribute('data-url'))"
                >
                    ${button.label}
                </button>
            `).join('')}
        </div>
    `;

    try {
        let htmlContent = fs.readFileSync(path.join(__dirname, 'control_panel.html'), 'utf8');
        htmlContent = htmlContent.replace('', buttonsHtml);
        htmlContent = htmlContent.replace('{{RPI_IP}}', RPI_IP);
        res.send(htmlContent);
    } catch (e) {
        console.error("Error loading control_panel.html:", e.message);
        res.status(500).send("Error loading control panel template.");
    }
});
app.use('/api/remote', commandRouter);
// 2. Serve the static admin file on the /admin route
app.get('/admin', (req, res) => {
    // This sends the admin.html file located in the 'public' folder
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ===============================================
// --- SERVER STARTUP AND POLLING ---
// ===============================================
startTicker(io, FEEDS, ABSOLUTE_DATA_DIR);

server.listen(3000, () => {
         console.log("✅ Server running on port 3000");
         console.log(`✅ Kiosk Control Panel available at http://localhost:3000/`);
         FEEDS.forEach(feed => {
                            startDataPolling(feed.url, feed.file, ABSOLUTE_DATA_DIR); 
                    });
         }
);