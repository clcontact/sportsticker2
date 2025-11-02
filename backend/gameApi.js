import path from 'path';
import fs from 'fs';

/**
 * Registers the /api/games/:league endpoint with the Express application.
 *
 * @param {object} app Express application instance.
 * @param {Array<object>} FEEDS Array of feed configuration objects.
 * @param {string} ABSOLUTE_DATA_DIR Absolute path to the directory containing data files.
 */
function setupGameRoutes(app, FEEDS, ABSOLUTE_DATA_DIR) {
    
    app.get('/api/games/:league', (req, res) => {
        const league = req.params.league.toLowerCase();
        
        const feedConfig = FEEDS.find(f => f.route === league);
        
        if (!feedConfig) {
            return res.status(400).json({ error: "Invalid league specified." });
        }

        const FILE_PATH = path.join(ABSOLUTE_DATA_DIR, feedConfig.file);

        // Read and process the file content
        try {
            const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
            const data = JSON.parse(fileContent);
            
            // Data Transformation Logic
            const leagues = data.sports?.flatMap((s) => s.leagues || []) || [];
            const events = leagues.flatMap((l) => l.events || []);
                
            const games = events.map((e) => ({
                id: e.id,
                shortName: e.shortName,
                weekText: e.weekText,
                status: e.status,
                summary: e.summary,
                period: e.period,
                clock: e.clock,
                teams: e.competitors.map((c) => ({
                    homeAway: c.homeAway,
                    abbreviation: c.abbreviation,
                    color: c.color,
                    alternateColor: c.alternateColor,
                    score: c.score,
                    record: c.record,
                    logo: c.logo,
                })),
            }));

            res.json(games);

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`File not found for league ${league}: ${FILE_PATH}`);
                return res.status(404).json({ error: `Data file not found for ${league}.` });
            }
            
            console.error(`Error processing request for ${league}:`, error);
            res.status(500).json({ error: "An error occurred while retrieving game data." });
        }
    });
}

export {
    setupGameRoutes
};