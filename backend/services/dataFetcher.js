// services/dataFetcher.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { emitStatusUpdate } from "./monitorService.js";

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute polling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hbDir = path.join(__dirname, "Data", "hb");
const HEARTBEAT_FILE = path.join(hbDir, "dataFetcher_heartbeat.json");
fs.mkdirSync(hbDir, { recursive: true });

async function fetchDataAndSave(url, fileName, dataDir) {
  const filePath = path.join(dataDir, fileName);
  const feedName = fileName.split("_")[0].toUpperCase();
  const HEARTBEAT_FILE = path.join(dataDir,HEARTBEAT_FILEName );

  try {
    emitStatusUpdate();
    console.log(`\n⏳ Fetching ${feedName} data from: ${url}`);
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.text();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, data);

    console.log(`✅ Successfully updated ${fileName} at ${new Date().toLocaleTimeString()}`);

    // ✅ Update heartbeat (successful fetch)
    fs.writeFileSync(
      HEARTBEAT_FILE,
      JSON.stringify({ status: "Running", lastFetch: Date.now(), ok: true }, null, 2)
    );
    emitStatusUpdate();
  } catch (error) {
    console.error(`\n❌ Error fetching or saving ${fileName}: ${error.message}`);

    // ❌ Update heartbeat (error)
    fs.writeFileSync(
      HEARTBEAT_FILE,
      JSON.stringify({ status: "Error", lastFetch: Date.now(), message: error.message }, null, 2)
    );
  }
}


export function startDataPolling(url, file, dataDir) {
  // Function to check if we are in active polling hours
  function isActivePollingTime(now = new Date()) {
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (day === 0 || day === 6) return true; // Weekend
    // Weekdays: 5 PM (17:00) to 11:50 PM (23:50)
    if (hour > 16 && (hour < 23 || (hour === 23 && minute <= 50))) return true;

    return false;
  }

  // Core polling function
  async function poll() {
    const now = new Date();

    if (isActivePollingTime(now)) {
      await fetchDataAndSave(url, file, dataDir);
    } else {
      console.log(`Skipping poll at ${now.toLocaleTimeString()} (outside active hours)`);
    }

    // Calculate next poll time
    let nextTimeout = POLL_INTERVAL_MS;

    if (!isActivePollingTime(now)) {
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();

      // Before 5 PM weekday → schedule at 5 PM today
      if (day >= 1 && day <= 5 && hour < 17) {
        const nextPoll = new Date(now);
        nextPoll.setHours(17, 0, 0, 0);
        nextTimeout = nextPoll - now;
      }
      // After 11:50 PM weekday → schedule at 5 PM next weekday
      else if (day >= 1 && day <= 5 && (hour > 23 || (hour === 23 && minute > 50))) {
        const nextPoll = new Date(now);
        nextPoll.setDate(now.getDate() + 1);
        nextPoll.setHours(17, 0, 0, 0);
        nextTimeout = nextPoll - now;
      }
    }

    setTimeout(poll, nextTimeout);
  }

  // Start polling immediately
  poll();
  console.log(`⏰ Polling started for ${file}`);
}
function writeHeartbeat() {
  //const HEARTBEAT_FILE = path.join('/backend/Data/hb/',HEARTBEAT_FILEName );
  const data = {
    status: "running",
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    hostname: 'localhost'
  };

  try {
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(data, null, 2));
    console.log(`💓 Heartbeat written at ${data.timestamp}`);
  } catch (err) {
    console.error("Error writing heartbeat:", err);
  }
}
writeHeartbeat();

// Then update it every 10 seconds
setInterval(writeHeartbeat, 10000);