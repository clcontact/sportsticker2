// dataFetcher.js

import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- ESM Global Variable Definitions ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
const DATA_DIR = path.join(__dirname, 'data'); // Data directory remains constant

const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes (constant for all polls)

/**
 * Fetches JSON data from a specified URL and saves it to a specified file.
 * This is now a generic function.
 */
async function fetchDataAndSave(url, filename) {
    const FILE_PATH = path.join(DATA_DIR, filename);
    console.log(`[${new Date().toLocaleTimeString()}] Fetching data from: ${url}`);
    
    try {
        // 1. Fetch the data
        const response = await axios.get(url);
        const jsonData = response.data;

        // 2. Ensure the /data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // 3. Save the data
        const dataToSave = JSON.stringify(jsonData, null, 2);
        await fs.writeFile(FILE_PATH, dataToSave, 'utf8');
        
        console.log(`✅ Successfully saved data to: ${FILE_PATH}`);

    } catch (error) {
        console.error(`❌ Error fetching or saving data for ${filename}: ${error.message}`);
    }
}

/**
 * Initializes the immediate fetch and sets up the recurring interval based on inputs.
 * @param {string} url - The external API URL to fetch data from.
 * @param {string} filename - The name of the local file (e.g., 'nfl.json', 'mlb.json') to save data to.
 * @returns {number} The interval ID, allowing the calling function to clear it later.
 */
export function startDataPolling(url, filename) {
    if (!url || !filename) {
        throw new Error("startDataPolling requires a URL and a filename.");
    }
    
    console.log(`\nData polling service started for ${filename}. Polling every 5 minutes.`);
    
    // Create a wrapper function that calls fetchDataAndSave with the specific parameters
    const fetcher = () => fetchDataAndSave(url, filename);

    // 1. Run the function immediately
    fetcher();

    // 2. Set the interval
    const intervalId = setInterval(fetcher, FETCH_INTERVAL_MS);
    
    return intervalId; 
}

// Export the interval duration and directory for external use if needed
export const DATA_CONFIG = {
    DATA_DIR,
    FETCH_INTERVAL_MS
};