import express from 'express';
import { exec } from 'child_process';
import 'dotenv/config'; // Loads environment variables directly

const router = express.Router();

// --- CONFIGURATION ---
// Get the secure key from environment variables
const SECRET_KEY = process.env.COMMAND_SECRET_KEY;

// Define your allowed commands and their shell scripts here.
// IMPORTANT: Adjust paths and service names for your setup.
const ALLOWED_COMMANDS = {
    // Command 1: Restart a specific system service (e.g., your backend service)
    'restart_backend_service': 'pm2 restart 0',

    // Command 2: Navigate to the frontend directory, rebuild, and potentially restart the web server sports-frontend
    //'build_and_deploy_frontend': 'cd /node/sportsticker2_0/frontend && pm2 restart 1 && npm run build &&  pm2 start 1',
    'build_and_deploy_frontend': 'pm2 restart 1',

    // Command 3: Simple server check
    'system_uptime': 'uptime',

    // Add future commands here:
    // 'command_key': 'shell_script_to_run'
};
// --- END CONFIGURATION ---

// Middleware for basic authentication using the X-Secret-Key header
const authenticate = (req, res, next) => {
    const providedKey = req.headers['x-secret-key'];
    if (!providedKey || providedKey !== SECRET_KEY) {
        return res.status(403).json({ success: false, error: 'Authorization required.' });
    }
    next();
};

/**
 * GET /commands - List all available commands for the frontend UI.
 */
router.get('/commands', (req, res) => {
    const commands = Object.keys(ALLOWED_COMMANDS).map(key => ({
        key: key,
        name: key.replace(/_/g, ' ').toUpperCase()
    }));
    res.json(commands);
});

/**
 * POST /command/execute - Execute a specific command securely.
 */
router.post('/command/execute', authenticate, (req, res) => {
    const { command } = req.body;

    if (!command || !ALLOWED_COMMANDS[command]) {
        return res.status(400).json({ success: false, error: `Invalid command: ${command}` });
    }

    const shellCommand = ALLOWED_COMMANDS[command];
    console.log(`[RemoteCommander] Executing: ${shellCommand}`);

    exec(shellCommand, { shell: '/bin/bash' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[RemoteCommander] Execution failed for ${command}: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Command execution failed on the server.',
                output: stderr || error.message,
            });
        }

        console.log(`[RemoteCommander] Command success: ${command}`);
        res.json({
            success: true,
            message: `Command "${command}" executed successfully.`,
            output: stdout,
        });
    });
});

export default router;