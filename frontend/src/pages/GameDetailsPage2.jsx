// src/pages/GameDetailsPage2.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Ticker from "./Ticker";

const GameDetailsPage2 = () => {
  const { team, league } = useParams();

  const [gameDetail, setGameDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:3000/api/games/${league}/${team}`
        );

        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();

        if (!data || data.length === 0)
          throw new Error(`No game found for ${team.toUpperCase()}`);

        const g = data[0];
        setGameDetail({
          ...g,
          teams: g.teams || [],
          leaders: g.leaders || [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [league, team]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-3xl">Loading game data...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-3xl mb-4">Error Loading Game</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );

  if (!gameDetail)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-3xl">No game data available</div>
      </div>
    );

  const awayTeam = gameDetail.teams.find((t) => t.homeAway === "away");
  const homeTeam = gameDetail.teams.find((t) => t.homeAway === "home");

  const renderTimeoutDots = (count) => (
    <div className="flex space-x-1 mt-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-4 h-4 bg-yellow-400 rounded-full shadow-md"
        />
      ))}
    </div>
  );


  return (
    
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
      {/* SCOREBOARD WITH TIMEOUT DOTS BELOW */}
      <div className="flex justify-between items-center w-full max-w-6xl mb-6">
        {[awayTeam, homeTeam].map((t, idx) => (
          <div
            key={t.id || idx}
            className="flex-1 flex flex-col items-center bg-gray-800 rounded-3xl p-6 mx-2 shadow-lg"
          >
            <img
              src={t.logo}
              alt={t.abbreviation}
              className="w-40 h-40 object-contain mb-2"
            />
            <p
              className="text-3xl font-bold mb-1"
              style={{ color: `#${t.color}` }}
            >
              {t.abbreviation}
            </p>
            <p
              className="text-7xl font-extrabold mb-1"
              style={{ color: `#${t.color}` }}
            >
              {t.score}
            </p>
            <p className="text-gray-400 text-lg">{t.record}</p>
            {renderTimeoutDots(
              idx === 0
                ? gameDetail.situation?.awayTimeouts || 0
                : gameDetail.situation?.homeTimeouts || 0
            )}
          </div>
        ))}
      </div>

      {/* CURRENT DRIVE SECTION */}
      {gameDetail.situation && (
        <div className="bg-gray-700 rounded-2xl shadow-lg p-6 mb-6 w-full max-w-6xl">
          <h3 className="text-yellow-400 font-bold text-2xl mb-4">
            Current Drive
          </h3>
          <div className="flex justify-between items-start text-gray-300 mb-4">
            <div>
              <p>
                <span className="font-bold text-white">Down:</span>{" "}
                {gameDetail.situation.down || "-"} &nbsp;
                <span className="font-bold text-white">Distance:</span>{" "}
                {gameDetail.situation.distance || "-"} &nbsp;
                <span className="font-bold text-white">Yard Line:</span>{" "}
                {gameDetail.situation.yardLine || "-"}
              </p>
              <p className="mt-1">
                <span className="font-bold text-white">Possession:</span>{" "}
                {gameDetail.teams.find(
                  (t) => t.id === gameDetail.situation.possessionTeamId
                )?.displayName || "-"}
              </p>
            </div>
            <div className="text-right">
              <p>
                <span className="font-bold text-white">Location:</span>{" "}
                {gameDetail.location}
              </p>
              <p>
                <span className="font-bold text-white">Time:</span> {gameDetail.clock || "-"}
              </p>
              <p>
                <span className="font-bold text-white">Broadcast:</span>{" "}
                {gameDetail.broadcast || "-"}
              </p>
            </div>
          </div>

          {gameDetail.situation.lastPlayText && (
            <div className="mt-2 bg-gray-800 rounded-xl p-4 text-gray-300">
              <p>
                <span className="font-bold text-white">Last Play:</span>{" "}
                {gameDetail.situation.lastPlayText}
              </p>
              <p>
                <span className="font-bold text-white">Drive:</span>{" "}
                {gameDetail.situation.driveDescription}
              </p>
              <p>
                <span className="font-bold text-white">Drive Start:</span>{" "}
                {gameDetail.situation.driveStart}{" "}
                <span className="font-bold text-white">Drive End:</span>{" "}
                {gameDetail.situation.driveEnd}{" "}
                <span className="font-bold text-white">Elapsed:</span>{" "}
                {gameDetail.situation.driveTimeElapsed}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STACKED LEADERS */}
      <div className="flex flex-col w-full max-w-6xl gap-6">
        {(gameDetail.leaders || []).map(
          (leader, i) =>
            leader.leader && (
              <div
                key={leader.name || i}
                className="bg-gray-800 rounded-2xl p-6 flex items-center shadow-lg hover:shadow-yellow-500/80 hover:scale-105 transition-all duration-300"
              >
                <img
                  src={leader.leader.playerPic}
                  alt={leader.leader.athleteName}
                  className="w-36 h-36 object-cover rounded-full border-4 border-yellow-400 shadow-md mr-6 flex-shrink-0"
                />
                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold text-yellow-400 mb-1 uppercase tracking-wide">
                    {leader.displayName}
                  </h3>
                  <p className="font-bold text-white text-lg">
                    {leader.leader.athleteName}
                  </p>
                  <p className="text-gray-400 text-sm mb-1">
                    #{leader.leader.jersey} • {leader.leader.position}
                  </p>
                  <p className="text-gray-300 text-sm italic mb-1">
                    {leader.leader.teamDisplayName}
                  </p>
                  <p className="text-yellow-400 text-2xl font-extrabold animate-pulse">
                    {leader.leader.displayValue}
                  </p>
                </div>
              </div>
            )
        )}
      </div>
      {/* BROADCAST TICKER */}
      <div className="w-full fixed bottom-0 left-0">
        <Ticker />
      </div>
    </div>
    
  );
};

export default GameDetailsPage2;