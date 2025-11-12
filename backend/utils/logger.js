import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Paths ---
const LOG_DIR = path.join(__dirname, "../Data/logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, "server_actions.log");

// --- Socket Reference ---
let ioInstance = null;
export function setSocket(io) {
  ioInstance = io;
}

// --- Core Write Function ---
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  fs.appendFileSync(LOG_FILE, logEntry + "\n");
  const MAX_LOG_SIZE = 1 * 1024 * 1024; // 1 MB
  if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
    fs.writeFileSync(LOG_FILE, ""); // reset
  }
  // emit to socket.io clients
  if (ioInstance) {
    ioInstance.emit("logUpdate", logEntry);
  }
}

// --- Override console ---
const originalLog = console.log;
console.log = (...args) => {
  const message = args.join(" ");
  writeLog("INFO", message);
  originalLog(...args);
};

const originalError = console.error;
console.error = (...args) => {
  const message = args.join(" ");
  writeLog("ERROR", message);
  originalError(...args);
};

// --- Get recent lines ---
export function getRecentActions(limit = 10) {
  try {
    const data = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n");
    return data.slice(-limit).reverse(); // newest first
  } catch {
    return ["No recent actions found."];
  }
}
