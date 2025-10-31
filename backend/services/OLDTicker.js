// backend/services/tickerDataService.js
let games = [
  { id: 1, home: "Jaguars", away: "Raiders", homeScore: 0, awayScore: 0 },
  { id: 2, home: "Chiefs", away: "Bills", homeScore: 0, awayScore: 0 },
  { id: 3, home: "Seahawks", away: "Commanders", homeScore: 0, awayScore: 0 },
  { id: 4, home: "Ravens", away: "Dolphins", homeScore: 0, awayScore: 0 },
  { id: 5, home: "Bears", away: "Bengals", homeScore: 0, awayScore: 0 },
  { id: 6, home: "Vikings", away: "Lions", homeScore: 0, awayScore: 0 },
  { id: 7, home: "Panthers", away: "Packers", homeScore: 0, awayScore: 0 },
  { id: 8, home: "Broncos", away: "Texans", homeScore: 0, awayScore: 0 },
  { id: 9, home: "Falcons", away: "Patriots", homeScore: 0, awayScore: 0 },
  { id: 10, home: "49ers", away: "Giants", homeScore: 0, awayScore: 0 },
  { id: 11, home: "Colts", away: "Steelers", homeScore: 0, awayScore: 0 },
  { id: 12, home: "Chargers", away: "Titans", homeScore: 0, awayScore: 0 },
  { id: 13, home: "Saints", away: "Rams", homeScore: 0, awayScore: 0 },
  { id: 14, home: "Cowboys", away: "Cardinals", homeScore: 0, awayScore: 0 },
];

export function getCurrentGames() {
  return games;
}

export function startTickerDataService(io) {
  setInterval(() => {
    // Randomly increment scores
    games = games.map((g) => ({
      ...g,
      homeScore: g.homeScore + Math.floor(Math.random() * 2),
      awayScore: g.awayScore + Math.floor(Math.random() * 2),
    }));

    io.emit("gamesUpdate", games);
  }, 5000); // broadcast every 5 seconds
}
