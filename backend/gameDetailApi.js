import path from 'path';
import fs from 'fs';

/**
 * Finds the first event in the array that matches the given team name 
 * in either the full 'name' or the 'shortName' property.
 */
function findEventByTeamName(events, teamName) {
    const searchName = teamName.toLowerCase();
    return events.find(event => {
        const nameMatch = event.name && event.name.toLowerCase().includes(searchName);
        const shortNameMatch = event.shortName && event.shortName.toLowerCase().includes(searchName);
        return nameMatch || shortNameMatch;
    });
}

/**
 * Registers the /api/games/:league/:team endpoint with the Express application.
 *
 * @param {object} app Express application instance.
 * @param {Array<object>} FEEDS Array of feed configuration objects.
 * @param {string} ABSOLUTE_DATA_DIR Absolute path to the directory containing data files.
 */
function setupGameDetailRoutes(app, FEEDS, ABSOLUTE_DATA_DIR) {
    //nfltracker
    //app.get('/api/games/:league/:team', (req, res) => {
    app.get('/api/nfltracker/:league/:team', (req, res) => {
        const league = req.params.league.toLowerCase();
        const team = req.params.team.toLowerCase();
        const feedConfig = FEEDS.find(f => f.route === league);

        console.log("league->"+ league);
        console.log("team->"+ team);
        console.log("feedConfig->"+ JSON.stringify(feedConfig));
        
        if (!feedConfig) {
            return res.status(400).json({ error: "Invalid league specified." });
        }

        const FILE_PATH = path.join(ABSOLUTE_DATA_DIR, feedConfig.file);

        // Read and process the file content
        try {
            const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
            const data = JSON.parse(fileContent);
            
            // NOTE: Using the provided logic for finding events in the feed structure
            const leagues = data.sports?.flatMap((s) => s.leagues || []) || []; 
            const events = leagues.flatMap((l) => l.events || []);

            // 1. Find the single event object
            const foundEvent = findEventByTeamName(events, team);

            // 2. Wrap the single event in an array (if found) to allow mapping, 
            //    otherwise use an empty array.
            const eventsToMap = foundEvent ? [foundEvent] : [];

            // 3. Map the event(s) to the desired structure
            const gameDetail = eventsToMap.map((e) => {
                
                // Helper function must be defined inside the map to access 'e.competitors'
                const getCompetitorDisplayName = (teamId) => {
                    const team = e.competitors.find(c => c.id === teamId);
                    return team ? team.displayName : 'Unknown Team';
                };

                return {
                    id: e.id,
                    date: e.date,
                    name: e.name,
                    location: e.location,
                    broadcast: e.broadcast,
                    shortName: e.shortName,
                    weekText: e.weekText,
                    status: e.status,
                    summary: e.summary,
                    period: e.period,
                    clock: e.clock,
                    situation: {
                        // Direct properties of situation
                        awayTimeouts: e.situation?.awayTimeouts || 0,
                        homeTimeouts: e.situation?.homeTimeouts || 0,
                        distance: e.situation?.distance || null,
                        yardLine: e.situation?.yardLine || null,
                        down: e.situation?.down || null,
                        possessionTeamId: e.situation?.possession|null, 

                        // Properties nested under lastPlay
                        lastPlayType: e.situation?.lastPlay?.type?.text, 
                        lastPlayText: e.situation?.lastPlay?.text,
                        driveDescription: e.situation?.lastPlay?.drive?.description,
                        driveResult: e.situation?.lastPlay?.drive?.result,
                        driveStart: e.situation?.lastPlay?.drive?.start?.text,
                        driveEnd: e.situation?.lastPlay?.drive?.end?.text,
                        driveTimeElapsed: e.situation?.lastPlay?.drive?.timeElapsed?.displayValue,
                    },
                    // Nested team data
                    teams: e.competitors.map((c) => ({
                        id: c.id,
                        homeAway: c.homeAway,
                        abbreviation: c.abbreviation,
                        color: c.color,
                        alternateColor: c.alternateColor,
                        score: c.score,
                        record: c.record,
                        logo: c.logo,
                    })),

                    // Nested Leaders data
                    leaders: e.leaders?.map((l) => ({
                        name: l.name,
                        displayName: l.displayName,
                        leader: l.leaders?.[0] ? {
                            displayValue: l.leaders[0].displayValue,
                            athleteName: l.leaders[0].athlete.displayName,
                            jersey: l.leaders[0].athlete.jersey,
                            // Use the helper function here!
                            teamId: l.leaders[0].athlete.team.id,
                            teamDisplayName: getCompetitorDisplayName(l.leaders[0].athlete.team.id), 
                            playerPic: l.leaders[0].athlete.headshot,
                            position: l.leaders[0].athlete.position.abbreviation,
                        } : null,
                    })) || []
                };
            });

            // This will now correctly return an array containing 0 or 1 mapped game details.
            res.json(gameDetail);
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
    setupGameDetailRoutes
};