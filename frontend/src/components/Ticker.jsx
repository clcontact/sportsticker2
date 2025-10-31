import React, { useEffect, useRef } from "react";

export default function Ticker({ games }) {
  const tickerRef = useRef();

  useEffect(() => {
    const el = tickerRef.current;
    let scrollPos = 0;

    function step() {
      if (el) {
        scrollPos += 1; // scroll speed
        if (scrollPos > el.scrollWidth / 2) scrollPos = 0;
        el.scrollLeft = scrollPos;
      }
      requestAnimationFrame(step);
    }
    step();
  }, [games]);

  // Duplicate items for smooth infinite scroll
  const displayGames = [...games, ...games];

  return (
    <div
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        backgroundColor: "#111",
        color: "#fff",
        fontSize: "1.5rem",
        padding: "1rem 0",
      }}
      ref={tickerRef}
    >
      {displayGames.map((g, i) => (
        <span key={i} style={{ marginRight: "4rem" }}>
          {g.away} {g.awayScore} @ {g.home} {g.homeScore} (Q{g.quarter})
        </span>
      ))}
    </div>
  );
}
