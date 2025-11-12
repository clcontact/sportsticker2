// services/gameTrackerService.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const TRACKER_INTERVAL_MS = 15 * 1000; // 15 seconds for near real-time

async function fetchGameTracker(url, fileName, dataDir) {
  const filePath = path.join(dataDir, fileName);
  const feedName = fileName.split("_")[0].toUpperCase();

  try {
    console.log(`\n⚡ [Tracker] Fetching ${feedName} live data from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.text();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, data);

    console.log(`✅ [Tracker] Updated ${fileName} at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error(`❌ [Tracker] Error fetching ${fileName}: ${error.message}`);
  }
}

export function startGameTrackerPolling(url, fileName, dataDir) {
  async function poll() {
    await fetchGameTracker(url, fileName, dataDir);
    setTimeout(poll, TRACKER_INTERVAL_MS);
  }
  poll();
  console.log(`🚀 Live Game Tracker polling started every ${TRACKER_INTERVAL_MS / 1000}s`);
}
