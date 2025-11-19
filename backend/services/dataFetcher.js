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
const HEARTBEAT_FILEName = "dataFetcher_heartbeat.json";
fs.mkdirSync(hbDir, { recursive: true });

// --- NEW: Map to store active timeouts/intervals by a unique key (the file name) ---
// This map is CRITICAL for stopping active polling loops.
const activeTimeouts = new Map();

// --- Core Data Fetching Logic (No change needed here) ---

async function fetchDataAndSave(url, fileName, dataDir) {
  const filePath = path.join(dataDir, fileName);
  const feedName = fileName.split("_")[0].toUpperCase();
  // IMPORTANT: Use path.join(dataDir, HEARTBEAT_FILEName) if heartbeat file is in dataDir
  // Assuming you meant to use the global HEARTBEAT_FILE path defined near the top:
  const HEARTBEAT_FILE_STATUS = path.join(dataDir,HEARTBEAT_FILEName ); 

  try {
    emitStatusUpdate();
    //console.log(`\n⏳ Fetching ${feedName} data from: ${url}`);
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.text();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, data);

    //console.log(`✅ Successfully updated ${fileName} at ${new Date().toLocaleTimeString()}`);

    // ✅ Update heartbeat (successful fetch)
    fs.writeFileSync(
      HEARTBEAT_FILE_STATUS,
      JSON.stringify({ status: "Running", lastFetch: Date.now(), ok: true }, null, 2)
    );
    emitStatusUpdate();
  } catch (error) {
    console.error(`\n❌ Error fetching or saving ${fileName}: ${error.message}`);

    // ❌ Update heartbeat (error)
    fs.writeFileSync(
      HEARTBEAT_FILE_STATUS,
      JSON.stringify({ status: "Error", lastFetch: Date.now(), message: error.message }, null, 2)
    );
  }
}

// --- MODIFIED: startDataPolling to store its timeout ID ---

export function startDataPolling(url, file, dataDir) {
  // Use the file name as a unique key for tracking the timeout
  const pollKey = file; 

  // 1. CLEAR existing timeout if this feed is somehow already running
  if (activeTimeouts.has(pollKey)) {
    clearTimeout(activeTimeouts.get(pollKey));
    activeTimeouts.delete(pollKey);
    console.log(`♻️ Cleared previous poll for ${file}.`);
  }

  // Function to check if we are in active polling hours (logic remains the same)
  function isActivePollingTime(now = new Date()) {
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (day === 0 || day === 6) return true; // Weekend
    // Weekdays: 5 PM (17:00) to 11:50 PM (23:50)
    if (hour >= 17 && (hour < 23 || (hour === 23 && minute <= 50))) return true;

    return false;
  }

  // Core polling function
  async function poll() {
    const now = new Date();

    if (isActivePollingTime(now)) {
      await fetchDataAndSave(url, file, dataDir);
    } else {
      //console.log(`Skipping poll at ${now.toLocaleTimeString()} (outside active hours)`);
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
        // Calculate days to add until the next weekday (Mon-Fri) that starts after the end time.
        // Simplified approach: just schedule for tomorrow's 5 PM (the isActivePollingTime check handles weekends)
        nextPoll.setDate(now.getDate() + 1);
        nextPoll.setHours(17, 0, 0, 0);
        nextTimeout = nextPoll - now;
      }
    }

    // 2. Schedule the next poll and store the timeout ID
    const timeoutId = setTimeout(poll, nextTimeout);
    activeTimeouts.set(pollKey, timeoutId);
  }

  // Start polling immediately
  poll();
  console.log(`⏰ Polling started for ${file}. Key: ${pollKey}`);
}

// --- NEW EXPORT: Function to stop all polling loops ---

/**
 * Stops all currently active data polling loops by clearing all stored timeouts.
 * This should be called by the server before reloading configuration and starting new polls.
 */
export function stopAllPolling() {
  if (activeTimeouts.size === 0) {
    console.log("🛑 No active polling loops found to stop.");
    return;
  }
  
  for (const [key, timeoutId] of activeTimeouts.entries()) {
    clearTimeout(timeoutId);
    console.log(`🛑 Stopped polling for key: ${key}`);
  }
  activeTimeouts.clear();
  console.log("✅ All data polling loops successfully stopped.");
}

// --- Existing exports (no change) ---
export function getLatestFeed(feedType) {
    // ... existing function logic
}

function writeHeartbeat() {
    // ... existing function logic
}

// Write initial heartbeat and set interval (This runs independently of FEEDS config)
writeHeartbeat();
setInterval(writeHeartbeat, 10000);