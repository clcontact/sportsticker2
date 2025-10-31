import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- Configuration ---
// Define the supported leagues and their initial state
const LEAGUES = {
  nfl: { name: "NFL", file: "nfl_data.json", route: "nfl" },
  mlb: { name: "MLB", file: "mlb_data.json", route: "mlb" },
  epl: { name: "Premier League", file: "epl_data.json", route: "epl" },
};

export default function TickerDisplay() {
  const [games, setGames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevScores, setPrevScores] = useState({});
  // 🎯 New State: Set NFL as the default league
  const [currentLeague, setCurrentLeague] = useState(LEAGUES.nfl.route); 

  // Function to fetch the games for the current league
  const fetchGames = async () => {
    // 🎯 Dynamically construct the URL using the currentLeague state
    const API_URL = `http://localhost:3000/api/games/${currentLeague}`;
    
    try {
      const res = await axios.get(API_URL);
      
      const newScores = {};
      res.data.forEach(g => {
        g.teams.forEach(t => {
          newScores[t.abbreviation] = t.score;
        });
      });

      // Update games list
      setGames(res.data);
      // Update previous scores state
      setPrevScores(newScores); 
    } catch (err) {
      // Clear games on error so the loading message shows or handle error gracefully
      setGames([]);
      console.error(`Error fetching games for ${currentLeague}:`, err);
    }
  };

  useEffect(() => {
    // 🎯 Re-run the fetch when currentLeague changes
    fetchGames();
    const intervalFetch = setInterval(fetchGames, 60000); // Poll every 60 seconds (1 minute)
    return () => clearInterval(intervalFetch);
  }, [currentLeague]); // 🎯 Dependency Array includes currentLeague

  useEffect(() => {
    if (games.length === 0) return;
    const intervalRotate = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 8000);
    return () => clearInterval(intervalRotate);
  }, [games]);

  if (games.length === 0)
    // Display a more specific loading message
    return <div className="text-white text-2xl flex justify-center items-center h-screen">Loading {currentLeague.toUpperCase()} games...</div>;

  const game = games[currentIndex];
  const away = game.teams.find(t => t.homeAway === "away");
  const home = game.teams.find(t => t.homeAway === "home");

  if (!away || !home) return <div className="text-white text-2xl flex justify-center items-center h-screen">Error: Missing team data.</div>;

  const awayScoreNum = parseInt(away.score || 0);
  const homeScoreNum = parseInt(home.score || 0);
  const awayIsBold = awayScoreNum > homeScoreNum;
  const homeIsBold = homeScoreNum > awayScoreNum;

  const renderTeamCard = (team, boldScore, showDisplayNameBelow = true) => {
    const scoreTextColor = 
      team.alternateColor?.toUpperCase() === "FFF" || team.alternateColor?.toUpperCase() === "FFFFFF"
        ? "text-black"
        : "text-white";

    return (
      <div className="flex flex-col w-full">
        <div className="flex w-full h-28 rounded-xl overflow-hidden shadow-lg">
          <div className="flex-1/2 flex items-center justify-center p-2" style={{ backgroundColor: `#${team.color}` }}>
            <img src={team.logo} alt={team.abbreviation} className="w-20 h-20 object-contain" />
          </div>
          <motion.div
            className="flex-1/2 flex items-center justify-center"
            style={{ backgroundColor: `#${team.alternateColor}` }}
            animate={{ scale: prevScores[team.abbreviation] !== team.score ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className={`${scoreTextColor} text-5xl ${boldScore ? "font-extrabold" : "font-bold"}`}>
              {team.score || "-"}
            </span>
          </motion.div>
        </div>
        {showDisplayNameBelow && (
          <div className="text-center text-white font-bold text-xl mt-2">
            {team.displayName}
          </div>
        )}
      </div>
    );
  };

  const { period, clock, summary } = game;
  const summaryDisplay = `Quarter: ${period || '-'} | Time: ${clock || '-'} | Summary: ${summary || 'No update'}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 space-y-4">
      {/* 🎯 League Switcher Buttons */}
      <div className="flex space-x-4 p-2 bg-gray-900 rounded-full">
        {Object.keys(LEAGUES).map((key) => (
          <button
            key={key}
            onClick={() => setCurrentLeague(LEAGUES[key].route)}
            className={`px-4 py-2 font-bold rounded-full transition duration-150 ${
              currentLeague === LEAGUES[key].route 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {LEAGUES[key].name}
          </button>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-4xl space-y-4"
        >
          {/* Week Text (Now includes League Name) */}
          <div className="text-center bg-gray-800 py-2 text-white font-extrabold text-2xl rounded-xl">
            {LEAGUES[currentLeague].name} - {game.weekText}
          </div>

          {renderTeamCard(away, awayIsBold, true)}

          <div className="w-full h-1 bg-white my-4"></div>

          <div className="text-center text-white font-bold text-xl mb-2">
            {home.displayName}
          </div>
          {renderTeamCard(home, homeIsBold, false)}

          <div className="bg-blue-800 p-4 rounded-xl shadow-xl text-center">
            <p className="text-white text-xl font-bold">
              {summaryDisplay}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}