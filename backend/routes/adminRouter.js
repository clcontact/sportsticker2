import express from 'express';
import { getRecentActions } from "../utils/logger.js";
import { getActionHistory, getFetcherStatus } from "../services/monitorService.js";
// Removed unused imports: path, fs, dirname, fileURLToPath, __filename, and __dirname

// Export a function that accepts necessary dependencies
export default (config, changeKioskUrl) => {
    const router = express.Router(); 
    const { RPI_IP, KIOSK_FRONTEND_BASE_URL, FEEDS } = config;

    // Define buttons used by the main control panel
    const URL_BUTTONS = FEEDS.map(feed => ({
        label: `${feed.route.toUpperCase()} Live Scoreboard`,
        url: `${KIOSK_FRONTEND_BASE_URL}/${feed.route}/4`
    }));
    URL_BUTTONS.push({ label: "Blank Screen (About:Blank)", url: 'about:blank' });

    // --- API Endpoint ---
    router.post('/change-url', async (req, res) => {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, message: "URL is required." });
        }
        const result = await changeKioskUrl(url); 
        res.json(result);
    });

    // --- EJS View Routes ---

    // 1. Main Control Panel (Renders views/admin_panel.ejs) -> URL: /admin
    router.get('/', (req, res) => {
        res.render('admin_panel', { 
            activePage: 'control', 
            RPI_IP: RPI_IP, 
            URL_BUTTONS: URL_BUTTONS,
            baseUrl: '/admin' // Pass base path for nav links
        }); 
    });

    // 2. Feed Configuration (Renders views/admin_config.ejs) -> URL: /admin/config
    router.get('/config', (req, res) => {
        res.render('admin_config', {
            FEEDS: FEEDS,
            activePage: 'config',
            baseUrl: '/admin'
        });
    });

    // 3. System Status (Renders views/admin_status.ejs) -> URL: /admin/status
    router.get('/status', async (req, res) => {
        //const status = await getSystemStatus();
        //const actions = await getActionHistory();
        const actions = getRecentActions(10);

        res.render('admin_status', {
            baseUrl: '/admin',
            activePage: 'status',            
            status: getFetcherStatus(),
            actions            
        });
    });
    
    // 4. Commander Interface (Renders views/commander_admin.ejs) -> URL: /admin/commander
    router.get('/commander', (req, res) => {
        res.render('commander_admin', {
            activePage: 'commander',
            baseUrl: '/admin'
        });
    });

    // NOTE: The redundant admin_control_page.ejs and admin2_page.ejs are no longer routed.

    return router;
};
