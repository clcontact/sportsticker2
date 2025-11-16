import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import GameDetailsPage2 from "./GameDetailsPage2"; // your existing component
import "./GameDisplaySwitcher.css"; // for fade animation

const GameDisplaySwitcher = () => {
  const { league, gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [view, setView] = useState("stats"); // alternate between "stats" and "details"
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        //const res = await fetch(`http://localhost:3000/api/ncaagamesm/${gameId}`);
        const res = await fetch (`http://localhost:3000/api/gamesscoreboard/${league}/${gameId}`)
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setGameData(data);
      } catch (e) {
        setError(e.message);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [league, gameId]);

  // alternate the display every 20 seconds
  useEffect(() => {
    const swap = setInterval(() => {
      setView((v) => (v === "stats" ? "details" : "stats"));
    }, 20000);
    return () => clearInterval(swap);
  }, []);

  if (error) return <div className="text-red-500">{error}</div>;
  if (!gameData) return <div className="text-white text-2xl">Loading game...</div>;

  const comp = gameData.competitions?.[0];
  const home = comp?.competitors?.find((t) => t.homeAway === "home");
  const away = comp?.competitors?.find((t) => t.homeAway === "away");

  return (
    <div className="game-switcher-container">
      {/* --- SCOREBOARD FIXED AT TOP --- */}
      <div className="scoreboard-top">
        <div className="scoreboard-team">
          <img src={away?.team?.logo} className="team-logo" alt="away" />
          <div className="team-score">{away?.score}</div>
          <div className="team-name">{away?.team?.shortDisplayName}</div>
        </div>

        <div className="scoreboard-center">
          <div className="period">{comp?.status?.type?.shortDetail}</div>
          <div className="clock">{comp?.status?.displayClock}</div>
          <div className="venue">{comp?.venue?.fullName}</div>
        </div>

        <div className="scoreboard-team">
          <img src={home?.team?.logo} className="team-logo" alt="home" />
          <div className="team-score">{home?.score}</div>
          <div className="team-name">{home?.team?.shortDisplayName}</div>
        </div>
      </div>

      {/* --- SWITCHABLE CONTENT AREA --- */}
      <div className={`bottom-section fade ${view}`}>
        {view === "stats" ? (
          <div className="stats-layout">
            <div className="stats-team">
              <h2>Team Stats</h2>
              {(away?.statistics || []).map((s, i) => (
                <div key={i} className="stat-row">
                  <span>{s.displayName}</span>
                  <span>{s.displayValue}</span>
                </div>
              ))}
            </div>
            <div className="stats-team">
              <h2>Team Stats</h2>
              {(home?.statistics || []).map((s, i) => (
                <div key={i} className="stat-row">
                  <span>{s.displayName}</span>
                  <span>{s.displayValue}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // reuse your existing detailed layout (NFL drive, leaders, etc.)
          <div className="details-layout">
            <GameDetailsPage2 embedded={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDisplaySwitcher;
