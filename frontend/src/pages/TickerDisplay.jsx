import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function TickerDisplay() {
  const [games, setGames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevScores, setPrevScores] = useState({}); // track for animation

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/games");
        
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
        console.error(err);
      }
    };
    fetchGames();
    const intervalFetch = setInterval(fetchGames, 60000);
    return () => clearInterval(intervalFetch);
  }, []);

  useEffect(() => {
    if (games.length === 0) return;
    const intervalRotate = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 8000);
    return () => clearInterval(intervalRotate);
  }, [games]);

  if (games.length === 0)
    return <div className="text-white text-2xl flex justify-center items-center h-screen">Loading games...</div>;

  const game = games[currentIndex];
  // Using optional chaining (?. ) for safety
  const away = game.teams.find(t => t.homeAway === "away");
  const home = game.teams.find(t => t.homeAway === "home");

  // Ensure team objects exist before accessing scores
  if (!away || !home) return <div className="text-white text-2xl flex justify-center items-center h-screen">Error: Missing team data.</div>;

  const awayScoreNum = parseInt(away.score || 0);
  const homeScoreNum = parseInt(home.score || 0);
  const awayIsBold = awayScoreNum > homeScoreNum;
  const homeIsBold = homeScoreNum > awayScoreNum;

  /**
   * Renders the Logo and Score block with a surrounding container for the displayName.
   * This is the core structural fix.
   */
  const renderTeamCard = (team, boldScore, showDisplayNameBelow = true) => {
    // Determine score text color: Black if alternateColor is white, otherwise White.
    const scoreTextColor = 
      team.alternateColor?.toUpperCase() === "FFF" || team.alternateColor?.toUpperCase() === "FFFFFF"
        ? "text-black" // Black text for white background
        : "text-white"; // White text for any other background

    return (
      <div className="flex flex-col w-full">
        {/* 1. Logo and Score in a single row (flex-row) */}
        <div className="flex w-full h-28 rounded-xl overflow-hidden shadow-lg">
          
          {/* Logo on Left: Background is Primary Team Color */}
          <div className="flex-1/2 flex items-center justify-center p-2" style={{ backgroundColor: `#${team.color}` }}>
            <img src={team.logo} alt={team.abbreviation} className="w-20 h-20 object-contain" />
          </div>

          {/* Score on Right: Background is Alternate Color */}
          <motion.div
            className="flex-1/2 flex items-center justify-center"
            style={{ backgroundColor: `#${team.alternateColor}` }}
            animate={{ scale: prevScores[team.abbreviation] !== team.score ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Score is determined by the scoreTextColor logic */}
            <span className={`${scoreTextColor} text-5xl ${boldScore ? "font-extrabold" : "font-bold"}`}>
              {team.score || "-"}
            </span>
          </motion.div>
        </div>

        {/* 2. DisplayName Below the Logo/Score Row */}
        {showDisplayNameBelow && (
          <div className="text-center text-white font-bold text-xl mt-2">
            {team.displayName}
          </div>
        )}
      </div>
    );
  };

  // Assuming game.period, game.clock, and game.summary contain the required data
  const { period, clock, summary } = game; 
  
  // Format the Quarter/Time/Summary data for display
  const summaryDisplay = `Quarter: ${period || '-'} | Time: ${clock || '-'} | Summary: ${summary || 'No update'}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-4xl space-y-4" // Increased space-y for better separation
        >
          {/* Week Text (Mandatory Top Element) */}
          <div className="text-center bg-gray-800 py-2 text-white font-extrabold text-2xl rounded-xl">
            {game.weekText}
          </div>

          {/* Away Team (Visiting) */}
          {/* Display Name is centered BELOW the logo/score block (showDisplayNameBelow = true) */}
          {renderTeamCard(away, awayIsBold, true)}

          {/* Separator Line: Large White Horizontal Break */}
          <div className="w-full h-1 bg-white my-4"></div>

          {/* Home Team */}
          {/* Display Name is centered ABOVE the logo/score block (showDisplayNameBelow = false) */}
          <div className="text-center text-white font-bold text-xl mb-2">
            {home.displayName}
          </div>
          {renderTeamCard(home, homeIsBold, false)}

          {/* --- New Summary Card --- */}
          <div className="bg-blue-800 p-4 rounded-xl shadow-xl text-center">
            <p className="text-white text-xl font-bold">
              {summaryDisplay}
            </p>
          </div>
          {/* --- End New Summary Card --- */}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}