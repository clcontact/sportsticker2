// src/components/GameDetailsBroadcast.jsx
import React from "react";
import { motion } from "framer-motion";

export default function GameDetailsBroadcast({ gameDetail }) {
  if (!gameDetail || !gameDetail.teams) return null;

  const homeTeam = gameDetail.teams.find((t) => t.homeAway === "home") || {};
  const awayTeam = gameDetail.teams.find((t) => t.homeAway === "away") || {};

  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-gradient-to-b from-black to-gray-900 p-8 font-sans">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-10">
        <div className="flex flex-col items-center">
          <img src={awayTeam.logo} alt="Away Logo" className="w-36 h-36 object-contain drop-shadow-lg" />
          <p className="text-3xl font-extrabold">{awayTeam.displayName ?? awayTeam.abbreviation}</p>
          <p className="text-lg opacity-80">{awayTeam.record}</p>
        </div>

        <div className="flex flex-col items-center">
          <motion.p
            className="text-8xl font-black text-yellow-400 drop-shadow-lg tracking-tight"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1.02 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
          >
            {awayTeam.score ?? "--"} - {homeTeam.score ?? "--"}
          </motion.p>
          <p className="text-gray-400 text-lg mt-2">{gameDetail.status} • {gameDetail.period}</p>
        </div>

        <div className="flex flex-col items-center">
          <img src={homeTeam.logo} alt="Home Logo" className="w-36 h-36 object-contain drop-shadow-lg" />
          <p className="text-3xl font-extrabold">{homeTeam.displayName ?? homeTeam.abbreviation}</p>
          <p className="text-lg opacity-80">{homeTeam.record}</p>
        </div>
      </div>

      {/* Game Info */}
      <div className="text-center mb-8">
        <p className="text-2xl font-semibold text-gray-300">{gameDetail.weekText}</p>
        <p className="text-xl text-gray-400">{gameDetail.location}</p>
        <p className="text-lg text-gray-400">{gameDetail.broadcast}</p>
      </div>

      {/* Summary */}
      {gameDetail.summary && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 max-w-xl text-center mb-10">
          <p className="text-lg text-gray-200 italic">{gameDetail.summary}</p>
        </div>
      )}

      {/* Leaders */}
      <div className="grid grid-cols-1 gap-6 w-full max-w-3xl pb-8">
        {Array.isArray(gameDetail.leaders) && gameDetail.leaders.map((l, i) => (
          l.leader ? (
            <motion.div
              key={i}
              className="bg-white/10 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/20 flex items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
            >
              <img
                src={l.leader.playerPic}
                alt={l.leader.athleteName}
                className="w-28 h-28 object-cover rounded-full border-4 border-yellow-400 shadow-lg"
                style={{ aspectRatio: "1 / 1" }}
              />
              <div className="ml-5 flex flex-col">
                <p className="text-2xl font-bold">{l.leader.athleteName}</p>
                <p className="text-lg text-gray-300">{l.displayName}</p>
                <p className="text-sm text-gray-400 italic">{l.leader.teamDisplayName}</p>
                <p className="text-3xl text-yellow-400 mt-2">{l.leader.displayValue}</p>
              </div>
            </motion.div>
          ) : null
        ))}
      </div>
    </div>
  );
}
