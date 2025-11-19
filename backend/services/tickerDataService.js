import fs from "fs";
import path from "path";

// ⭐️ Global state management for dynamic reloading ⭐️
let DATA_DIR = ""; 
let ioInstance = null;

// Map to hold current games data (Key: file name, Value: array of flattened games)
let allGamesData = new Map();
let allNCAAGamesData = new Map();

// Map to store and manage file watch handlers (Key: file name, Value: listener function)
let watchListeners = {}; 

// Variable to hold the ID of the main broadcast interval
let broadcastIntervalId = null; 

const DEFAULT_BROADCAST_INTERVAL_MS = 15000;

// ========================================================
// --- PUBLIC ACCESSORS ---
// ========================================================

/**
 * Returns the combined array of all monitored regular season games.
 */
export function getCurrentGames() {
    return Array.from(allGamesData.values()).flat();
}

/**
 * Returns the combined array of all monitored NCAA games.
 */
export function getNCAACurrentGames() {
    return Array.from(allNCAAGamesData.values()).flat();
}

// ========================================================
// --- HELPER FUNCTIONS: Loaders (No major changes) ---
// ========================================================

/**
 * 🔹 Flattens and extracts game data from a single JSON file.
 * @param {string} filePath - The full path to the JSON file.
 * @returns {Array} - Array of flattened game objects.
 */
function loadSingleFile(filePath) {
    const fileName = path.basename(filePath);
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${fileName}. Skipping load.`);
            return [];
        }
        
        const raw = fs.readFileSync(filePath);
        const json = JSON.parse(raw);

        // Standard ESPN Scoreboard structure
        const leagues = json.sports?.flatMap((s) => s.leagues || []) || [];
        const events = leagues.flatMap((l) => l.events || []);

        // ⭐️ ORIGINAL FLATTENING LOGIC (Preserved) ⭐️
        const games = events.map((e) => ({
            id: e.id,
            shortName: e.shortName,
            weekText: e.weekText,
            status: e.status,
            summary: e.summary,
            period: e.period,
            clock: e.clock,
            teams: e.competitors.map((c) => ({
                homeAway: c.homeAway,
                abbreviation: c.abbreviation,
                color: c.color,
                alternateColor: c.alternateColor,
                score: c.score,
                record: c.record,
                logo: c.logo,
            })),
        }));

        //console.log(`✅ Loaded ${games.length} games from ${fileName}`);
        return games;
    } catch (err) {
        console.error(`❌ Error reading or parsing ${fileName}:`, err);
        return [];
    }
}

/**
 * 🔹 Flattens and extracts NCAA game data from a single JSON file.
 * (Preserved original NCAA logic)
 */
function loadSingleNCAAFile(filePath) {
    const fileName = path.basename(filePath);
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${fileName}. Skipping load.`);
            return [];
        }
        
        const raw = fs.readFileSync(filePath);
        const json = JSON.parse(raw);
        
        const events = json.events;
        
        const games = events.map((e) => ({
            id: e.id,
            uid: e.uid,
            date: e.date,
            name: e.name,
            shortName: e.shortName,
            weekText: e.week?.number ?? null,
            status: e.status?.type?.shortDetail ?? null,
            summary: e.summary ?? null,
            period: e.competitions[0]?.status?.period ?? null,
            clock: e.competitions[0]?.status?.clock ?? null,
            teams: e.competitions[0]?.competitors?.map((c) => ({
                homeAway: c.homeAway,
                abbreviation: c.team.abbreviation,
                color: c.team.color,
                alternateColor: c.team.alternateColor,
                score: c.score,
                record: c.records?.find(r => r.type === "total")?.summary ?? null,
                logo: c.team.logo,
                displayName: c.team.displayName,
                shortDisplayName: c.team.shortDisplayName
            })) ?? []
        }));

        return games;
    } catch (err) {
        console.error(`❌ Error reading or parsing ${fileName}:`, err);
        return [];
    }
}

/**
 * 🔹 Loads data from all monitored feeds and updates allGamesData map.
 */
function loadAllData(feeds, loaderFn, dataMap) {
    const allGameObjects = [];
    dataMap.clear(); // Clear existing data when reloading

    for (const feed of feeds) {
        const fileName = feed.file;
        const filePath = path.join(DATA_DIR, fileName); 
        
        const games = loaderFn(filePath);
        dataMap.set(fileName, games);
        allGameObjects.push(...games);
    }
    return allGameObjects;
}

// ========================================================
// --- BROADCAST & WATCH MANAGEMENT ---
// ========================================================

/**
 * 🔹 Broadcast current games to clients.
 */
function broadcastGames() {
    if (ioInstance) {
        // Combine all regular game arrays
        const combinedGames = Array.from(allGamesData.values()).flat();
        ioInstance.emit("gameUpdate", combinedGames);
        //console.log(`📡 Broadcasted a total of ${combinedGames.length} regular games.`);
    }
}

/**
 * 🔹 Broadcast current NCAA games to clients.
 */
function broadcastNCAAGames() {
    if (ioInstance) {
        // Combine all NCAA game arrays
        const combinedNCAAGames = Array.from(allNCAAGamesData.values()).flat();
        ioInstance.emit("ncaaGameUpdate", combinedNCAAGames); // Use a distinct event name
        //console.log(`📡 Broadcasted a total of ${combinedNCAAGames.length} NCAA games.`);
    }
}

/**
 * 🔹 Sets up file watching for a single file defined in a feed.
 * @param {Object} feed - The feed object containing the 'file' name.
 * @param {Map} dataMap - The global Map (allGamesData or allNCAAGamesData) to update.
 * @param {function} loaderFn - The specific loader function (loadSingleFile or loadSingleNCAAFile).
 * @param {function} broadcastFn - The specific broadcast function (broadcastGames or broadcastNCAAGames).
 */
function watchFeedFile(feed, dataMap, loaderFn, broadcastFn) {
    const fileName = feed.file;
    const filePath = path.join(DATA_DIR, fileName); 

    // 1. Unwatch the old listener if one exists for this file
    if (watchListeners[fileName]) {
        fs.unwatchFile(filePath, watchListeners[fileName]);
        delete watchListeners[fileName];
    }

    const listener = () => {
        // console.log(`♻️ Detected change in ${fileName} – reloading...`);
        const games = loaderFn(filePath);
        dataMap.set(fileName, games); // Update the map with new data
        broadcastFn(); // Broadcast the combined, updated data
    };

    // 2. Set up the new watch and store the listener reference
    fs.watchFile(filePath, listener);
    watchListeners[fileName] = listener; 
    // console.log(`👀 Now watching file: ${fileName}`);
}

// ========================================================
// --- EXPORTED SERVICE MANAGEMENT FUNCTIONS ---
// ========================================================

/**
 * 🛑 Clears the main broadcast interval and stops all active file watchers.
 * CRITICAL for dynamic reloading.
 */
export function stopTicker() {
    // 1. Clear the main broadcast interval
    if (broadcastIntervalId) {
        clearInterval(broadcastIntervalId);
        broadcastIntervalId = null;
        console.log("🛑 Main Ticker broadcast interval stopped.");
    }
    
    // 2. Clear all active file watchers
    for (const fileName in watchListeners) {
        const filePath = path.join(DATA_DIR, fileName);
        fs.unwatchFile(filePath, watchListeners[fileName]);
        console.log(`🛑 Unwatched file: ${fileName}`);
    }
    watchListeners = {}; // Reset the map
    allGamesData.clear();
    allNCAAGamesData.clear();
    
    console.log("✅ All Ticker file watchers cleared.");
}

/**
 * 🚀 Start or restart the Ticker service for regular season games.
 * @param {object} io - Socket.IO instance.
 * @param {Array<Object>} feeds - The array of feed objects (like FEEDS from server.js).
 * @param {string} dataDir - The absolute path to the data directory.
 * @param {number} [intervalMs=15000] - Interval for periodic broadcast.
 */
export function startTicker(io, feeds, dataDir, intervalMs = DEFAULT_BROADCAST_INTERVAL_MS) {
    
    // Safety check: ensure old services are stopped before starting new ones
    if (broadcastIntervalId || Object.keys(watchListeners).length > 0) {
        console.warn("⚠️ Ticker service was already running. Stopping before restart.");
        stopTicker(); 
    }

    ioInstance = io;
    DATA_DIR = dataDir; 

    // 1. Initial load of all files
    const initialGames = loadAllData(feeds, loadSingleFile, allGamesData);
    broadcastGames();

    console.log(
        `🚀 Ticker started. Broadcasting ${initialGames.length} combined games every ${
            intervalMs / 1000
        }s from ${feeds.length} feeds. (Data Dir: ${DATA_DIR})`
    );

    // 2. Auto reload on file changes for ALL monitored feeds
    for (const feed of feeds) {
        watchFeedFile(feed, allGamesData, loadSingleFile, broadcastGames);
    }

    // 3. Periodic updates
    broadcastIntervalId = setInterval(() => {
        broadcastGames();
    }, intervalMs);
}


/**
 * 🚀 Start or restart the Ticker service for NCAA games.
 * Note: This function is kept separate but uses the same underlying management pattern.
 * @param {object} io - Socket.IO instance.
 * @param {Array<Object>} feeds - The array of NCAA feed objects.
 * @param {string} dataDir - The absolute path to the data directory.
 * @param {number} [intervalMs=15000] - Interval for periodic broadcast.
 */
export function startNCAATicker(io, feeds, dataDir, intervalMs = DEFAULT_BROADCAST_INTERVAL_MS) {
    // Note: Since both Ticker services currently share the global state 
    // (ioInstance, DATA_DIR, broadcastIntervalId, watchListeners), calling one will 
    // implicitly stop the other. In a larger app, you might want separate state variables.
    // For this unified dynamic config, we'll keep the single point of control.
    
    // Safety check: ensure old services are stopped before starting new ones
    if (broadcastIntervalId || Object.keys(watchListeners).length > 0) {
        console.warn("⚠️ Ticker service was already running. Stopping before restart.");
        stopTicker(); 
    }

    ioInstance = io;
    DATA_DIR = dataDir; 

    // 1. Initial load of all NCAA files
    const initialGames = loadAllData(feeds, loadSingleNCAAFile, allNCAAGamesData);
    broadcastNCAAGames();

    console.log(
        `🚀 NCAA Ticker started. Broadcasting ${initialGames.length} combined games every ${
            intervalMs / 1000
        }s from ${feeds.length} feeds. (Data Dir: ${DATA_DIR})`
    );

    // 2. Auto reload on file changes for ALL monitored feeds
    for (const feed of feeds) {
        // Use NCAA specific loader/broadcaster
        watchFeedFile(feed, allNCAAGamesData, loadSingleNCAAFile, broadcastNCAAGames);
    }

    // 3. Periodic updates (Use a separate interval ID if you want both tickers running simultaneously)
    // For simplicity and relying on the shared state model:
    broadcastIntervalId = setInterval(() => {
        // IMPORTANT: If you want both tickers to broadcast, you need to call both broadcast functions here
        broadcastGames();
        broadcastNCAAGames();
    }, intervalMs);
}