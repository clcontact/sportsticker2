import React, { useEffect, useRef, useState } from "react";

const Ticker = () => {
  const [games, setGames] = useState([]);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  const SCROLL_SPEED = 2; // pixels per frame

  const fetchGamesSnapshot = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/games/nfl");
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error("Error fetching games:", err);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchGamesSnapshot();
  }, []);

  useEffect(() => {
    if (games.length === 0) return;

    const container = containerRef.current;
    const scrollContent = scrollRef.current;

    if (!container || !scrollContent) return;

    scrollContent.style.transform = `translateX(${container.offsetWidth}px)`;
    let currentX = container.offsetWidth;
    let animationFrame;

    const scrollStep = () => {
      currentX -= SCROLL_SPEED;
      scrollContent.style.transform = `translateX(${currentX}px)`;

      if (currentX + scrollContent.offsetWidth > 0) {
        animationFrame = requestAnimationFrame(scrollStep);
      } else {
        // Once scroll is done, fetch latest snapshot
        fetchGamesSnapshot();
      }
    };

    animationFrame = requestAnimationFrame(scrollStep);

    return () => cancelAnimationFrame(animationFrame);
  }, [games]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        backgroundColor: "black",
        color: "yellow",
        overflow: "hidden",
        whiteSpace: "nowrap",
        height: "2.5rem",
        display: "flex",
        alignItems: "center",
        borderTop: "1px solid #555",
        position: "fixed",
        bottom: 0,
        left: 0,
        paddingLeft: "1rem",
      }}
    >
      <div ref={scrollRef} style={{ display: "inline-block" }}>
        {games.length === 0 ? (
          <span>Waiting for games...</span>
        ) : (
          games.map((g) => {
            const away = g.teams.find((t) => t.homeAway === "away");
            const home = g.teams.find((t) => t.homeAway === "home");
            return (
              <span key={g.id} style={{ marginRight: "3rem" }}>
                {away?.abbreviation} {away?.score}-{home?.score} {home?.abbreviation}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Ticker;
