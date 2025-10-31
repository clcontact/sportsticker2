import fs from "fs";
import path from "path";

const dataPath = path.resolve("./data/data.json");

// Module-scoped variable to hold current games
let games = [];
let ioInstance = null;

// 🔹 Load and flatten JSON file
function loadData() {
  try {
    const raw = fs.readFileSync(dataPath);
    const json = JSON.parse(raw);

    const leagues = json.sports?.flatMap((s) => s.leagues || []) || [];
    const events = leagues.flatMap((l) => l.events || []);

    games = events.map((e) => ({
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

    console.log(`✅ Loaded ${games.length} games from data.json`);
  } catch (err) {
    console.error("❌ Error reading data.json:", err);
    games = [];
  }
}

// 🔹 Broadcast current games to clients
function broadcastGames() {
  if (ioInstance) {
    ioInstance.emit("gameUpdate", games);
  }
}

// 🔹 Return current games (used by control routes or API)
export function getCurrentGames() {
  return games;
}

// 🔹 Start ticker service
export function startTicker(io, intervalMs = 15000) {
  ioInstance = io;
  loadData();
  broadcastGames();

  console.log(`📡 Broadcasting ${games.length} games every ${intervalMs / 1000}s`);

  // Auto reload on file changes
  fs.watchFile(dataPath, () => {
    console.log("♻️ Detected change in data.json – reloading...");
    loadData();
    broadcastGames();
  });

  // Periodic updates
  setInterval(() => {
    broadcastGames();
  }, intervalMs);
}