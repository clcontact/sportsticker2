import React, { useState, useEffect } from "react";

const GameDetailsPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const teamParam = urlParams.get("team")?.toLowerCase() ;
  const league = urlParams.get("league")?.toLowerCase() || "nfl";

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fontScale = 1;

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `http://localhost:3000/api/games/${league}/${teamParam}`
        );
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

        const data = await response.json();
        if (!data || data.length === 0)
          throw new Error(`No game found for ${teamParam}`);

        setGameData(data[0]);
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [teamParam, league]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">
        Loading game data...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-center">
        <div className="text-red-500 text-2xl mb-4">Error Loading Game</div>
        <div className="text-gray-400">{error}</div>
      </div>
    );

  if (!gameData)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">
        No game data available
      </div>
    );

  const awayTeam = gameData.teams?.find((t) => t.homeAway === "away");
  const homeTeam = gameData.teams?.find((t) => t.homeAway === "home");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* --- Header with team cards --- */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <TeamCard team={awayTeam} fontScale={fontScale} />

          {/* Center Game Info */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg text-center">
            <div className="text-gray-400 mb-2" style={{ fontSize: `${0.9 * fontScale}rem` }}>
              {gameData.weekText}
            </div>
            <div className="font-bold mb-4" style={{ fontSize: `${1.5 * fontScale}rem` }}>
              {gameData.summary}
            </div>
            <div className="text-gray-300 mb-2" style={{ fontSize: `${1 * fontScale}rem` }}>
              @ {gameData.location}
            </div>
            <div className="text-yellow-400 font-semibold" style={{ fontSize: `${1.1 * fontScale}rem` }}>
              {gameData.broadcast}
            </div>
          </div>

          <TeamCard team={homeTeam} fontScale={fontScale} />
        </div>

        {/* --- Game Info --- */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="font-bold mb-4 text-yellow-400" style={{ fontSize: `${1.3 * fontScale}rem` }}>
            Game Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Matchup" value={gameData.name} fontScale={fontScale} />
            <InfoRow label="Status" value={gameData.status} fontScale={fontScale} />
            <InfoRow label="Period" value={gameData.period} fontScale={fontScale} />
            <InfoRow label="Clock" value={gameData.clock} fontScale={fontScale} />
            <InfoRow label="Short Name" value={gameData.shortName} fontScale={fontScale} />
            <InfoRow label="Date" value={new Date(gameData.date).toLocaleString()} fontScale={fontScale} />
          </div>
        </div>

        {/* --- Situation --- */}
        {gameData.situation && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="font-bold mb-4 text-yellow-400" style={{ fontSize: `${1.3 * fontScale}rem` }}>
              Current Situation
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Down" value={gameData.situation.down} fontScale={fontScale} />
              <InfoRow label="Distance" value={gameData.situation.distance} fontScale={fontScale} />
              <InfoRow label="Yard Line" value={gameData.situation.yardLine} fontScale={fontScale} />
              <InfoRow label="Possession Team" value={gameData.situation.possessionTeamId} fontScale={fontScale} />
              <InfoRow label="Away Timeouts" value={gameData.situation.awayTimeouts} fontScale={fontScale} />
              <InfoRow label="Home Timeouts" value={gameData.situation.homeTimeouts} fontScale={fontScale} />
            </div>

            {/* --- Last Play Details --- */}
            {gameData.situation.lastPlayText && (
              <div className="mt-6 bg-gray-700 rounded-lg p-4">
                <h4 className="text-yellow-300 font-semibold mb-2">
                  Last Play: {gameData.situation.lastPlayType}
                </h4>
                <p className="text-gray-300 mb-2">{gameData.situation.lastPlayText}</p>
                <div className="text-sm text-gray-400">
                  <div>Drive Description: {gameData.situation.driveDescription}</div>
                  <div>Drive Result: {gameData.situation.driveResult}</div>
                  <div>
                    From {gameData.situation.driveStart} → {gameData.situation.driveEnd}
                  </div>
                  <div>Drive Time Elapsed: {gameData.situation.driveTimeElapsed}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Leaders --- */}
        {gameData.leaders && gameData.leaders.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-bold mb-4 text-yellow-400" style={{ fontSize: `${1.3 * fontScale}rem` }}>
              Game Leaders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gameData.leaders.map((leader, idx) =>
                leader.leader ? (
                  <div key={idx} className="bg-gray-700 rounded-lg p-4 flex flex-col items-center">
                    <h4 className="font-semibold mb-3 text-center text-gray-300" style={{ fontSize: `${1 * fontScale}rem` }}>
                      {leader.displayName}
                    </h4>
                    <div className="text-center">
                      <img
                        src={leader.leader.playerPic}
                        alt={leader.leader.athleteName}
                        className="w-20 h-20 rounded-full mx-auto mb-2 object-cover object-center border-2 border-gray-500"
                      />
                      <div className="font-bold mb-1" style={{ fontSize: `${1.1 * fontScale}rem` }}>
                        {leader.leader.athleteName}
                      </div>
                      <div className="text-gray-400 mb-1" style={{ fontSize: `${0.85 * fontScale}rem` }}>
                        #{leader.leader.jersey} • {leader.leader.position}
                      </div>
                      <div className="text-gray-400 mb-1" style={{ fontSize: `${0.85 * fontScale}rem` }}>
                        {leader.leader.teamDisplayName}
                      </div>
                      <div className="text-yellow-400 font-semibold" style={{ fontSize: `${0.95 * fontScale}rem` }}>
                        {leader.leader.displayValue}
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Subcomponents ---------- */

const TeamCard = ({ team, fontScale }) => {
  if (!team) return null;
  return (
    <div
      className="flex flex-col items-center justify-center p-6 rounded-lg"
      style={{ backgroundColor: `#${team.color}20` }}
    >
      <img
        src={team.logo}
        alt={team.abbreviation}
        className="w-32 h-32 mb-4 object-contain"
      />
      <h2 className="font-bold mb-2 text-center" style={{ fontSize: `${2 * fontScale}rem`, color: `#${team.color}` }}>
        {team.abbreviation}
      </h2>
      <div className="text-6xl font-bold mb-2" style={{ fontSize: `${4 * fontScale}rem`, color: `#${team.color}` }}>
        {team.score}
      </div>
      <div className="text-gray-400" style={{ fontSize: `${1 * fontScale}rem` }}>
        Record: {team.record}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, fontScale }) => (
  <div>
    <span className="text-gray-400" style={{ fontSize: `${0.95 * fontScale}rem` }}>
      {label}:
    </span>
    <span className="ml-2 font-semibold" style={{ fontSize: `${0.95 * fontScale}rem` }}>
      {value ?? "—"}
    </span>
  </div>
);

export default GameDetailsPage;