// services/monitorService.js
import fs from "fs";
import path from "path";
import os from "os";

const HEARTBEAT_FILE = path.join(process.cwd(), "dataFetcher_heartbeat.json");

let ioInstance = null;

// Allow server.js to register socket.io instance
export function registerSocket(io) {
  ioInstance = io;
}
export function getActionHistory(){
  const data = {
    status: "test",
    timestamp: new Date().toISOString(),
    hostname: 'localhost'
  };

  return {data};
}
  
// Reads the current heartbeat file and memory status
export function getFetcherStatus() {
  const mem = process.memoryUsage();
  const memoryUsage = {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    rss: mem.rss,
    external: mem.external
  };

  try {
    if (!fs.existsSync(HEARTBEAT_FILE)) {
      return { status: "Stopped", message: "No heartbeat file found.", memoryUsage };
    }

    const raw = fs.readFileSync(HEARTBEAT_FILE, "utf-8");
    const data = JSON.parse(raw);

    const lastFetch = data.lastFetch ? Number(data.lastFetch) : 0;
    const ageMinutes = (Date.now() - lastFetch) / 60000;

    let status = "Stopped";
    let message = "";

    if (data.status === "Error") {
      status = "Error";
      message = data.message || "Fetch failed.";
    } else if (ageMinutes < 2) {
      status = "Running";
      message = "Active within last 2 minutes.";
    } else if (ageMinutes < 10) {
      status = "Idle";
      message = `No updates for ${ageMinutes.toFixed(1)} min`;
    } else {
      message = `No updates for ${ageMinutes.toFixed(1)} min`;
    }

    const uptimeMinutes = lastFetch
      ? ((Date.now() - lastFetch) / 60000).toFixed(1)
      : "0";

    return {
      status,
      message,
      uptimeMinutes,
      lastFetch: lastFetch ? new Date(lastFetch).toLocaleTimeString() : "—",
      memoryUsage
    };
  } catch (err) {
    console.error("Monitor read error:", err);
    return { status: "Error", message: err.message, memoryUsage };
  }
}


// Emits real-time updates via socket.io
export function emitStatusUpdate() {
  if (ioInstance) {
    ioInstance.emit("statusUpdate", getFetcherStatus());
  }
}
