// src/components/GameDetailsDashboard.jsx
import React from "react";

export default function GameDetailsDashboard({ gameDetail }) {
  if (!gameDetail || !gameDetail.teams) return null;

  const homeTeam = gameDetail.teams.find((t) => t.homeAway === "home") || {};
  const awayTeam = gameDetail.teams.find((t) => t.homeAway === "away") || {};

  return (
    <div
      className="flex flex-col min-h-screen text-white font-sans"
      style={{
        background: `linear-gradient(to bottom, #${awayTeam.color || "0a0a0a"} 0%, #${homeTeam.color || "1a1a1a"} 100%)`,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-8 bg-black/40 backdrop-blur-md">
        <div className="flex flex-col items-center">
          <img src={awayTeam.logo} alt="Away Logo" className="w-28 h-28 object-contain mb-2" />
          <p className="text-2xl font-bold">{awayTeam.displayName ?? awayTeam.abbreviation}</p>
          <p className="text-sm text-gray-300">{awayTeam.record}</p>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-7xl font-black text-white">{awayTeam.score ?? "--"} - {homeTeam.score ?? "--"}</p>
          <p className="text-gray-300 text-lg mt-2">{gameDetail.status} • {gameDetail.period}</p>
          <p className="text-gray-400 text-base">{gameDetail.clock}</p>
        </div>

        <div className="flex flex-col items-center">
          <img src={homeTeam.logo} alt="Home Logo" className="w-28 h-28 object-contain mb-2" />
          <p className="text-2xl font-bold">{homeTeam.displayName ?? homeTeam.abbreviation}</p>
          <p className="text-sm text-gray-300">{homeTeam.record}</p>
        </div>
      </div>

      {/* Game info */}
      <div className="text-center py-6 bg-black/30 backdrop-blur-md">
        <p className="text-2xl font-semibold">{gameDetail.weekText}</p>
        <p className="text-lg text-gray-300">{gameDetail.location}</p>
        <p className="text-lg text-gray-400">{gameDetail.broadcast}</p>
      </div>

      {/* Leaders */}
      <div className="grid grid-cols-1 gap-6 p-8 bg-black/40 backdrop-blur-lg flex-grow pb-8">
        {Array.isArray(gameDetail.leaders) && gameDetail.leaders.map((l, i) =>
          l.leader ? (
            <div key={i} className="flex items-center bg-white/10 p-5 rounded-2xl shadow-lg">
              <img
                src={l.leader.playerPic}
                alt={l.leader.athleteName}
                className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg"
                style={{ aspectRatio: "1 / 1" }}
              />
              <div className="ml-5">
                <p className="text-2xl font-semibold">{l.leader.athleteName}</p>
                <p className="text-lg text-gray-300">{l.displayName}</p>
                <p className="text-sm text-gray-400 italic">{l.leader.teamDisplayName}</p>
                <p className="text-3xl font-bold text-yellow-300 mt-2">{l.leader.displayValue}</p>
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
