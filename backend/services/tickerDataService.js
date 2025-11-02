import fs from "fs";
import path from "path";

// ⭐️ Data directory will now be passed into startTicker ⭐️
let DATA_DIR = ""; 

// Remove the old hardcoded dataPath and the old 'games' array/loadData function

// A Map to hold the current games data, using the file name as the key.
// Key: file name (e.g., "nfl_data.json"), Value: array of flattened game objects
let allGamesData = new Map();
let ioInstance = null;
let watchListeners = {}; // To store and manage file watch handlers

// 🔹 Return current games (used by control routes or API)
// NOTE: This now returns the combined data from all files in the map.
export function getCurrentGames() {
 return Array.from(allGamesData.values()).flat();
}

// --- Helper Functions ---

/**
 * 🔹 Flattens and extracts game data from a single JSON file.
 * @param {string} filePath - The full path to the JSON file.
 * @returns {Array} - Array of flattened game objects.
 */
function loadSingleFile(filePath) {
  const fileName = path.basename(filePath);
  try {
	 	 // Check if the file exists before attempting to read
	 	 if (!fs.existsSync(filePath)) {
	 	 	 	 console.warn(`⚠️ File not found: ${fileName}. Skipping load.`);
	 	 	 	 return [];
	 	 }
	 	 
	 	 const raw = fs.readFileSync(filePath);
	 	 const json = JSON.parse(raw);

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

	 	 console.log(`✅ Loaded ${games.length} games from ${fileName}`);
	 	 return games;
	 } catch (err) {
	 	 console.error(`❌ Error reading or parsing ${fileName}:`, err);
	 	 return [];
	 }
}

/**
 * 🔹 Loads data from all monitored feeds and updates allGamesData map.
 * @param {Array<Object>} feeds - The array of feed objects (with a 'file' property).
 */
function loadAllData(feeds) {
	 const allGameObjects = [];
	 for (const feed of feeds) {
	 	 const fileName = feed.file;
    // ⭐️ USE THE GLOBAL DATA_DIR SET BY startTicker ⭐️
	 	 const filePath = path.join(DATA_DIR, fileName); 
	 	 
	 	 const games = loadSingleFile(filePath);
	 	 allGamesData.set(fileName, games);
	 	 allGameObjects.push(...games);
	 }
	 return allGameObjects;
}

// --- Ticker Service Functions ---

/**
 * 🔹 Broadcast current games to clients.
 * Combines data from all monitored files.
 */
function broadcastGames() {
	 if (ioInstance) {
	 	 // Combine all arrays of games from the Map values
	 	 const combinedGames = Array.from(allGamesData.values()).flat();
	 	 ioInstance.emit("gameUpdate", combinedGames);
	 	 console.log(`📡 Broadcasted a total of ${combinedGames.length} games.`);
	 }
}

/**
 * 🔹 Set up file watching for a single file defined in a feed.
 * @param {Object} feed - The feed object containing the 'file' name.
 */
function watchFeedFile(feed) {
	 const fileName = feed.file;
	 // ⭐️ USE THE GLOBAL DATA_DIR SET BY startTicker ⭐️
	 const filePath = path.join(DATA_DIR, fileName); 

	 // If already watching, unwatch first
	 if (watchListeners[fileName]) {
	 	 fs.unwatchFile(filePath, watchListeners[fileName]);
	 }

	 const listener = () => {
	 	 console.log(`♻️ Detected change in ${fileName} – reloading...`);
	 	 // Reload only the changed file
	 	 const games = loadSingleFile(filePath);
	 	 allGamesData.set(fileName, games); // Update the map with new data
	 	 broadcastGames(); // Broadcast the combined, updated data
	 };

	 fs.watchFile(filePath, listener);
	 watchListeners[fileName] = listener; // Store the listener reference
	 console.log(`👀 Now watching file: ${fileName}`);
}

// --- Exported Function ---

/**
 * 🔹 Start ticker service
 * @param {object} io - Socket.IO instance.
 * @param {Array<Object>} feeds - The array of feed objects (like FEEDS from server.js).
 * @param {string} dataDir - The absolute path to the data directory (new parameter).
 * @param {number} [intervalMs=15000] - Interval for periodic broadcast.
 */
export function startTicker(io, feeds, dataDir, intervalMs = 15000) {
	 ioInstance = io;
	 // ⭐️ SET THE GLOBAL DATA_DIR TO THE ABSOLUTE PATH ⭐️
	 DATA_DIR = dataDir; 

	 // 1. Initial load of all files from the defined feeds
	 const initialGames = loadAllData(feeds);
	 broadcastGames();

	 console.log(
	 	 `📡 Broadcasting ${initialGames.length} combined games every ${
	 	 	 intervalMs / 1000
   }s from ${feeds.length} feeds. (Data Dir: ${DATA_DIR})`
   );

// 2. Auto reload on file changes for ALL monitored feeds
  for (const feed of feeds) {
     watchFeedFile(feed);
  }

  // 3. Periodic updates
  setInterval(() => {
   broadcastGames();
 }, intervalMs);
}