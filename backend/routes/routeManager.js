// routes/routeManager.js (New File)

import { setupUnifiedGameRoutes } from "../gameApi.js";
import { setupGameScoreboardRoutes } from "../gamescoreboardApi.js";
import { setupGameDetailRoutes } from "../gameDetailApi.js";
// You will need to import the new stopPolling function from dataFetcher.js
import { stopAllPolling } from "../services/dataFetcher.js"; 
// You will need a stopTicker function from tickerDataService.js (Placeholder for now)
import { stopTicker, startTicker } from "../services/tickerDataService.js"; 

// A map to store the previous set of initialized routes/feeds if needed for more complex cleanup.
// For now, we only need to manage the services.

/**
 * Re-initializes all dynamic API routes and restarts all dependent services
 * based on the new FEEDS configuration.
 * @param {express.Application} app - The main Express application instance.
 * @param {Array} newFeeds - The newly loaded FEEDS array.
 * @param {string} dataDir - The absolute path to the data directory.
 * @param {SocketIO.Server} io - The Socket.IO server instance.
 * @param {function} startDataPollingFn - Reference to startDataPolling function.
 */
export function initializeDynamicContent(app, newFeeds, dataDir, io, startDataPollingFn) {
    // 1. --- SERVICE CLEANUP ---
    console.log('🧹 Stopping all old polling and ticker services...');
    
    // Stop data polling based on old FEEDS (from dataFetcher.js)
    stopAllPolling(); 
    
    // Stop the main ticker service (assuming you implement this in tickerDataService.js next)
    stopTicker(); 

    // 2. --- ROUTE RE-REGISTRATION ---
    // In Express, registering the same GET route multiple times often just layers them.
    // Since these routes rely on the 'FEEDS' content, we re-run the setup functions 
    // to ensure they use the new data.
    console.log('🔄 Re-registering API routes...');
    
    // NOTE: If you remove a route from the config, the old route will still exist unless you 
    // use a cleaner Express Router approach, but for simple GETs, this is often acceptable.
    setupUnifiedGameRoutes(app, newFeeds, dataDir);
    setupGameScoreboardRoutes(app, newFeeds);
    setupGameDetailRoutes(app, newFeeds, dataDir);

    // 3. --- SERVICE RESTART ---
    console.log('🚀 Restarting new polling and ticker services...');
    
    // Restart ticker
    startTicker(io, newFeeds, dataDir);

    // Restart data polling for the new set of feeds
    newFeeds.forEach(feed => {
        startDataPollingFn(feed.url, feed.file, dataDir); 
    });
    
    console.log('✅ Dynamic content re-initialization complete.');
}