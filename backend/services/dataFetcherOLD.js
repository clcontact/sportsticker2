// dataFetcher.js

import axios from 'axios';
import { promises as fs } from 'fs'; // Use promise-based fs for async/await
import path from 'path';
import { fileURLToPath } from 'url';
// --- ESM Global Variable Definitions ---
// These replace the CommonJS '__dirname' and '__filename'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
const DATA_DIR = path.join(__dirname, 'data');

const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
// --- Configuration ---
const URL = 'https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl';


const FILE_PATH = path.join(DATA_DIR, 'data.json');

/**
 * Fetches JSON data from ESPN and saves it to a local file.
 */
async function fetchDataAndSave() {
    console.log(`[${new Date().toLocaleTimeString()}] Fetching data from: ${URL}`);
    
    try {
        // 1. Fetch the data
        const response = await axios.get(URL);
        const jsonData = response.data;

        // 2. Ensure the /data directory exists
        // 'recursive: true' ensures the directory is created if it doesn't exist
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // 3. Save the data
        const dataToSave = JSON.stringify(jsonData, null, 2);
        await fs.writeFile(FILE_PATH, dataToSave, 'utf8');
        
        console.log(`✅ Successfully saved data to: ${FILE_PATH}`);

    } catch (error) {
        // Log error but keep the interval running
        console.error(`❌ Error fetching or saving data: ${error.message}`);
    }
}

/**
 * Initializes the immediate fetch and sets up the recurring interval.
 */
export function startDataPolling() {
    console.log(`\nData fetching module initialized. Polling every ${FETCH_INTERVAL_MS / 60000} minutes.`);
    
    // 1. Run the function immediately
    fetchDataAndSave();

    // 2. Set the interval to run repeatedly
    const intervalId = setInterval(fetchDataAndSave, FETCH_INTERVAL_MS);
    
    return intervalId; 
}