// src/pages/GameDetailsPage2.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Ticker from "./Ticker";

const GameDetailsPage2 = () => {
  const { team, league } = useParams();

  const [scaleConfig] = useState({
    global: 1.0,
    scoreboard: 1.0,
    drive: 1.65,
    leaders: 1.4,
  });

  const [gameDetail, setGameDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchGameData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/nfltracker/${league}/${team}`
      );
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const g = data[0];
        setGameDetail({ ...g, teams: g.teams || [], leaders: g.leaders || [] });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  fetchGameData(); // initial fetch

  const interval = setInterval(fetchGameData, 5000); // fetch every 5 seconds
  return () => clearInterval(interval); // clean up on unmount
}, [league, team]);


  const applyFont = (base, section) =>
    `${base * scaleConfig.global * scaleConfig[section]}rem`;

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

  const getTeamById = (id) => gameDetail.teams.find((t) => t.id === id);

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
    <div
      className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center"
      style={{ paddingLeft: "32px", paddingRight: "32px" }} // horizontal padding added
    >
      {/* SCOREBOARD */}
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
              className="font-bold mb-1"
              style={{
                color: `#${t.color}`,
                fontSize: applyFont(1.8, "scoreboard"),
              }}
            >
              {t.abbreviation}
            </p>
            <p
              className="font-extrabold mb-1"
              style={{
                color: `#${t.color}`,
                fontSize: applyFont(4, "scoreboard"),
              }}
            >
              {t.score}
            </p>
            <p
              className="text-gray-400"
              style={{ fontSize: applyFont(1, "scoreboard") }}
            >
              {t.record}
            </p>
            {renderTimeoutDots(
              idx === 0
                ? gameDetail.situation?.awayTimeouts || 0
                : gameDetail.situation?.homeTimeouts || 0
            )}
          </div>
        ))}
      </div>

      {/* CURRENT DRIVE */}
      {gameDetail.situation && (
        <div className="bg-gray-700 rounded-2xl shadow-lg p-6 mb-6 w-full max-w-6xl">
          <h3
            className="text-yellow-400 font-bold mb-4"
            style={{ fontSize: applyFont(1.5, "drive") }}
          >
            Current Drive
          </h3>
          <div className="flex justify-between items-start text-gray-300 mb-4">
            <div>
              <p style={{ fontSize: applyFont(1.1, "drive") }}>
                <span className="font-bold text-white">Down:</span>{" "}
                {gameDetail.situation.down || "-"} &nbsp;
                <span className="font-bold text-white">Distance:</span>{" "}
                {gameDetail.situation.distance || "-"} &nbsp;
                <span className="font-bold text-white">Yard Line:</span>{" "}
                {gameDetail.situation.yardLine || "-"}
              </p>
              <p className="mt-1" style={{ fontSize: applyFont(1.1, "drive") }}>
                <span className="font-bold text-white">Possession:</span>{" "}
                {getTeamById(gameDetail.situation.possessionTeamId)
                  ?.abbreviation || "-"}
              </p>
            </div>
            <div
              className="text-right"
              style={{ fontSize: applyFont(1.1, "drive") }}
            >
              <p>
                <span className="font-bold text-white">Location:</span>{" "}
                {gameDetail.location}
              </p>
              <p>
                <span className="font-bold text-white">Time:</span>{" "}
                {gameDetail.clock || "-"}
              </p>
              <p>
                <span className="font-bold text-white">Broadcast:</span>{" "}
                {gameDetail.broadcast || "-"}
              </p>
            </div>
          </div>
          {gameDetail.situation.lastPlayText && (
            <div className="mt-2 bg-gray-800 rounded-xl p-4 text-gray-300">
              <p style={{ fontSize: applyFont(1, "drive") }}>
                <span className="font-bold text-white">Last Play:</span>{" "}
                {gameDetail.situation.lastPlayText}
              </p>
              <p style={{ fontSize: applyFont(1, "drive") }}>
                <span className="font-bold text-white">Drive:</span>{" "}
                {gameDetail.situation.driveDescription}
              </p>
              <p style={{ fontSize: applyFont(1, "drive") }}>
                <span className="font-bold text-white">Drive Start:</span>{" "}
                {gameDetail.situation.driveStart}{" "}
                <span className="font-bold text-white">Elapsed:</span>{" "}
                {gameDetail.situation.driveTimeElapsed}
              </p>
            </div>
          )}
        </div>
      )}

      {/* LEADERS */}
      <div className="flex flex-col w-full max-w-6xl gap-6">
        {(gameDetail.leaders || []).map(
          (leader, i) =>
            leader.leader && (
              <div
                key={leader.name || i}
                className="bg-gray-800 rounded-2xl p-6 flex items-center shadow-lg hover:shadow-yellow-500/80 transition-all duration-300"
              >
                <div className="relative flex-shrink-0 mr-6">
                  <img
                    src={leader.leader.playerPic}
                    alt={leader.leader.athleteName}
                    className="w-36 h-36 object-cover rounded-full border-4 border-yellow-400 shadow-md"
                  />
                  <img
                    src={getTeamById(leader.leader.teamId)?.logo}
                    alt={leader.leader.teamDisplayName}
                    className="absolute bottom-0 right-0 w-12 h-12 rounded-full border-2 border-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <h3
                    className="font-semibold text-yellow-400 mb-1 uppercase tracking-wide"
                    style={{ fontSize: applyFont(1.3, "leaders") }}
                  >
                    {leader.displayName}
                  </h3>
                  <p
                    className="font-bold text-white"
                    style={{ fontSize: applyFont(1.6, "leaders") }}
                  >
                    {leader.leader.athleteName}
                  </p>
                  <p
                    className="text-gray-400 mb-1"
                    style={{ fontSize: applyFont(1.1, "leaders") }}
                  >
                    #{leader.leader.jersey} • {leader.leader.position}
                  </p>
                  <p
                    className="text-gray-300 italic mb-1"
                    style={{ fontSize: applyFont(1, "leaders") }}
                  >
                    {leader.leader.teamDisplayName}
                  </p>
                  <p
                    className="text-yellow-400 font-extrabold animate-pulse"
                    style={{ fontSize: applyFont(1.8, "leaders") }}
                  >
                    {leader.leader.displayValue}
                  </p>
                </div>
              </div>
            )
        )}
      </div>

      {/* TICKER */}
      <div className="w-full fixed bottom-0 left-0">
        <Ticker />
      </div>
    </div>
  );
};

export default GameDetailsPage2;
