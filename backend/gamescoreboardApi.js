export function setupGameScoreboardRoutes(app, FEEDS)
{
	app.get("/api/gamesscoreboard/:league", async (req, res) => {

		const league = req.params.league.toLowerCase();
		console.log('gamesscoreboard->league '+ league);
		const feedConfig = FEEDS.find(f => f.route === league);
		console.log('gamesscoreboard-> feedConfig.url->'+ feedConfig.url);
		if (!feedConfig) {
			return res.status(400).json({ error: "Invalid league specified." });
		}
	  try {
		const response = await fetch(
		  feedConfig.url
		);
		const data = await response.json();
		res.json(data);
	  } catch (err) {
		res.status(500).json({ error: err.message });
	  }
	});
    
	app.get("/api/gamesscoreboard/:league/:id", async (req, res) => {

		const league = req.params.league.toLowerCase();
        const id = req.params.id;
		console.log('gamesscoreboard->league '+ league);
        console.log('gamesscoreboard->id '+ id);
		const feedConfig = FEEDS.find(f => f.route === league);
        const urlScore = feedConfig.scoreUrl + "/" + id;
        console.log('gamesscoreboard->urlScore '+ urlScore);
		console.log('gamesscoreboard-> feedConfig.scoreUrl->'+ feedConfig.scoreUrl);
		if (!feedConfig) {
			return res.status(400).json({ error: "Invalid league specified." });
		}        
        try {
            const response = await fetch(urlScore);
            const data = await response.json();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
	});    
}