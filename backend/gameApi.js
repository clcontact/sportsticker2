import path from 'path';
import fs from 'fs';
const file = './data/ncaam_data.json';
const raw = fs.readFileSync(file, 'utf8');
console.log(raw.slice(0,500));
//import express from "express";
//import { getLatestFeed } from "./services/dataFetcher.js";
import { getLatestFeed } from "./services/dataFetcher.js";
/**
 * Parses ESPN feed JSON into a consistent array of game objects.
 * Handles both Pro leagues (NBA, NFL, NHL, MLB) and NCAA feeds.
 *
 * @param {object} data Raw JSON feed from ESPN
 * @returns {Array<object>} Array of games with standardized fields
 */

export function parseGames(data) {
  // Detect source type (college vs. professional)
  const isCollege = !!data.events; // NCAAF, NCAAM, etc.
  const isPro = !!data.sports; // EPL, NBA, NFL, etc.

  const games = [];

  if (isCollege) {
    for (const event of data.events || []) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const teams = comp.competitors?.map((team) => ({
        homeAway: team.homeAway,
        abbreviation: team.team?.abbreviation || "",
        displayName: team.team?.displayName || team.team?.name || "",
        color: team.team?.color || "000000",
        alternateColor: team.team?.alternateColor || "FFFFFF",
        score: team.score || "0",
        record:
          team.records?.find((r) => r.type === "total" || r.name === "overall")
            ?.summary || "",
        logo: team.team?.logo || "",
      }));

      games.push({
        id: event.id,
        shortName: event.shortName || event.name || "",
        weekText: event.week?.number ? `Week ${event.week.number}` : "",
        status: comp.status?.type?.description || event.status?.type?.description || "Unknown",
        summary: comp.status?.type?.shortDetail || event.status?.type?.shortDetail || "",
        period: comp.status?.period || 0,
        clock: comp.status?.displayClock || "",
        teams,
      });
    }
  } else if (isPro) {
    // Handle EPL / Pro Sports
    const leagues = data.sports?.flatMap((s) => s.leagues || []);
    for (const league of leagues) {
      for (const event of league.events || []) {
        const teams = event.competitors?.map((t) => ({
          homeAway: t.homeAway,
          abbreviation: t.abbreviation || "",
          displayName: t.displayName || t.name || "",
          color: t.color || "000000",
          alternateColor: t.alternateColor || "FFFFFF",
          score: t.score || "0",
          record: t.record || "",
          logo: t.logo || "",
        }));

        games.push({
          id: event.id,
          shortName: event.shortName || event.name || "",
          weekText: "",
          status:
            event.fullStatus?.type?.description ||
            event.status ||
            "Unknown",
          summary:
            event.fullStatus?.type?.shortDetail ||
            event.summary ||
            "",
          period: event.fullStatus?.period || event.period || null,
          clock: event.fullStatus?.displayClock || event.clock || "",
          teams,
        });
      }
    }
  }

  return games;
}






/**
 * Registers the /api/games/:league endpoint with the Express application.
 *
 * @param {object} app Express application instance.
 * @param {Array<object>} FEEDS Array of feed configuration objects.
 * @param {string} ABSOLUTE_DATA_DIR Absolute path to the directory containing data files.
 */
export function setupGameRoutes(app, FEEDS, ABSOLUTE_DATA_DIR) {
    
    app.get('/api/games/:league', (req, res) => {
        const league = req.params.league.toLowerCase();
        console.log('leagueSetupGames->league '+ league);
        const feedConfig = FEEDS.find(f => f.route === league);
        console.log('leagueSetupGames-> feedConfig.file->'+ feedConfig.file);
        if (!feedConfig) {
            return res.status(400).json({ error: "Invalid league specified." });
        }

        const FILE_PATH = path.join(ABSOLUTE_DATA_DIR, feedConfig.file);

        // Read and process the file content
        try {
            const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
            console.log('leagueSetupGames-> FILE_PATH->'+ FILE_PATH);
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
export function setupNCAAGameRoutes(app, NCAA, ABSOLUTE_DATA_DIR) {
       app.get('/api/ncaagames/:sport', (req, res) => {
        const sport = req.params.sport.toLowerCase();
        console.log('setupNCAAGameRoutes->league '+ sport);
        const feedConfig = NCAA.find(f => f.route === sport);
        console.log('setupNCAAGameRoutes-> feedConfig.file->'+ feedConfig.file);
        if (!feedConfig) {
            return res.status(400).json({ error: "Invalid league specified." });
        }

        const FILE_PATH = path.join(ABSOLUTE_DATA_DIR, feedConfig.file);

        // Read and process the file content
        try {
            const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
            console.log('leagueSetupGames-> FILE_PATH->'+ FILE_PATH);
            const data = JSON.parse(fileContent);
            
            // Data Transformation Logic
            const leagues = data.leagues?.flatMap((s) => s.leagues || []) || [];
            
            const events = data.events.flatMap((l) => l.events || []);
                
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
export function setupUnifiedGameRoutesNEWBROKE(app) {
  const router = express.Router();

  router.get("/:feedType", (req, res) => {
    const { feedType } = req.params; // e.g. "nba" or "ncaab"
    const data = getLatestFeed(feedType);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: `No data found for ${feedType}` });
    }

    // You can shape it here if needed, e.g. filter or map to a consistent format
    return res.json(data);
  });

  app.use("/api/games", router);
}
export function setupUnifiedGameRoutes(app, FEED_SETS, ABSOLUTE_DATA_DIR) {
  /**
   * FEED_SETS example:
   * [
   *   { route: 'nfl', file: 'nfl_data.json' },
   *   { route: 'nba', file: 'nba_data.json' },
   *   { route: 'ncaaf', file: 'ncaaf_data.json' },
   *   { route: 'ncaam', file: 'ncaam_data.json' }
   * ]
   */

  app.get("/api/games/:league", (req, res) => {
    const league = req.params.league.toLowerCase();
    //console.log('gameApi->league '+ league);
    const feedConfig = FEED_SETS.find(f => f.route === league);
    //console.log('gameApi->feedConfig '+ feedConfig);
    if (!feedConfig) {
      return res.status(400).json({ error: "Invalid league specified." });
    }

    const FILE_PATH = path.join(ABSOLUTE_DATA_DIR, feedConfig.file);

    try {
      const fileContent = fs.readFileSync(FILE_PATH, "utf8");
      //console.log(`Serving ${league} from ${FILE_PATH}`);
//console.log('Raw data:', fileContent.slice(0, 500)); // first 500 chars
      const data = JSON.parse(fileContent);
      const games = parseGames(data);
//console.log('gameApi->games '+ games);
      res.json(games);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.error(`File not found for ${league}: ${FILE_PATH}`);
        return res.status(404).json({ error: `Data file not found for ${league}.` });
      }

      console.error(`Error loading ${league}:`, error);
      res.status(500).json({ error: "An error occurred while retrieving game data." });
    }
  });
}


/*
export function setupUnifiedGameRoutesOLD(app, FEEDS, NCAA, ABSOLUTE_DATA_DIR) {
  app.get(['/api/games/:league', '/api/ncaagames/:sport'], (req, res) => {
    const isNCAA = req.path.startsWith('/api/ncaagames');
    const key = isNCAA ? req.params.sport.toLowerCase() : req.params.league.toLowerCase();

    console.log(`setupUnifiedGameRoutes -> requestType: ${isNCAA ? "NCAA" : "Pro"} -> key: ${key}`);

    // Choose correct feed list
    const feedList = isNCAA ? NCAA : FEEDS;
    const feedConfig = feedList.find(f => f.route === key);

    if (!feedConfig) {
      console.warn(`Invalid route -> ${key}`);
      return res.status(400).json({ error: "Invalid league or sport specified." });
    }

    const FILE_PATH = path.join(ABSOLUTE_DATA_DIR, feedConfig.file);

    try {
      const fileContent = fs.readFileSync(FILE_PATH, "utf8");
      console.log(`setupUnifiedGameRoutes -> reading file -> ${FILE_PATH}`);
      const data = JSON.parse(fileContent);

      // Try both JSON shapes dynamically
      let events = [];

      // Case 1: standard pro leagues → data.sports[x].leagues[x].events
      if (Array.isArray(data.sports)) {
        const leagues = data.sports.flatMap(s => s.leagues || []);
        events = leagues.flatMap(l => l.events || []);
      }
      // Case 2: NCAA format → data.leagues[].events OR data.events[]
      else if (Array.isArray(data.leagues)) {
        events = data.leagues.flatMap(l => l.events || []);
      } 
      else if (Array.isArray(data.events)) {
        events = data.events;
      }

      const games = events.map(e => ({
        id: e.id,
        shortName: e.shortName,
        weekText: e.weekText,
        status: e.status,
        summary: e.summary,
        period: e.period,
        clock: e.clock,
        teams: (e.competitors || []).map(c => ({
          homeAway: c.homeAway,
          abbreviation: c.abbreviation,
          color: c.color,
          alternateColor: c.alternateColor,
          score: c.score,
          record: c.record,
          logo: c.logo,
        })),
      }));

      console.log(`setupUnifiedGameRoutes -> ${key} -> ${games.length} games`);
      res.json(games);

    } catch (error) {
      if (error.code === "ENOENT") {
        console.error(`File not found for ${key}: ${FILE_PATH}`);
        return res.status(404).json({ error: `Data file not found for ${key}.` });
      }

      console.error(`Error processing ${key}:`, error);
      res.status(500).json({ error: "An error occurred while retrieving game data." });
    }
  });
}
  */