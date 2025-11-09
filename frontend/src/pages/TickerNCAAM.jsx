import React, { useEffect, useRef, useState } from "react";

// Utility: get brightness of a hex color
const getBrightness = (hex) => {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// Lighten a color by a percentage
const lightenColor = (hex, percent) => {
  hex = hex.replace("#", "");
  const r = Math.min(255, Math.floor(parseInt(hex.substring(0, 2), 16) + 255 * percent));
  const g = Math.min(255, Math.floor(parseInt(hex.substring(2, 4), 16) + 255 * percent));
  const b = Math.min(255, Math.floor(parseInt(hex.substring(4, 6), 16) + 255 * percent));
  return `rgb(${r},${g},${b})`;
};

// Pick the lighter of primary or alternate color and adjust if too dark
const getReadableColor = (primary, alternate) => {
  let selected = getBrightness(primary) > getBrightness(alternate) ? primary : alternate;
  if (getBrightness(selected) < 60) {
    selected = lightenColor(selected, 0.5); // brighten dark colors for readability
  }
  return selected;
};

const Ticker = ({ apiUrl = "http://localhost:3000/api/games/ncaam", fontSize = "2rem" }) => {
  const [games, setGames] = useState([]);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  const SCROLL_SPEED = 2; // pixels per frame

  const fetchGamesSnapshot = async () => {
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error("Error fetching games:", err);
    }
  };

  useEffect(() => {
    fetchGamesSnapshot();
  }, [apiUrl]);

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
        fetchGamesSnapshot();
      }
    };

    animationFrame = requestAnimationFrame(scrollStep);

    return () => cancelAnimationFrame(animationFrame);
  }, [games]);

const renderGame = (g) => {
  const away = g.teams.find((t) => t.homeAway === "away");
  const home = g.teams.find((t) => t.homeAway === "home");

  const awayScore = parseInt(away.score, 10);
  const homeScore = parseInt(home.score, 10);

  const awayWinning = awayScore > homeScore;
  const homeWinning = homeScore > awayScore;

  const awayColor = getReadableColor(away.color, away.alternateColor);
  const homeColor = getReadableColor(home.color, home.alternateColor);

  const textStyle = (isWinner, color) => ({
    color,
    fontWeight: isWinner ? "bold" : "normal",
    textShadow: isWinner ? "0 0 3px #fff" : "none",
    display: "inline-flex",   // <- make it inline to stay horizontal
    alignItems: "center",
  });

  const logoStyle = {
    width: "1.5rem",
    height: "1.5rem",
    objectFit: "contain",
    marginRight: "0.3rem",
  };

  return (
    <span key={g.id} style={{ marginRight: "3rem", display: "inline-flex", alignItems: "center" }}>
      <span style={textStyle(awayWinning, awayColor)}>
        <img src={away.logo} alt={away.abbreviation} style={logoStyle} />
        {away.abbreviation} {awayScore}
      </span>
      <span style={{ margin: "0 0.5rem" }}>-</span>
      <span style={textStyle(homeWinning, homeColor)}>
        <img src={home.logo} alt={home.abbreviation} style={logoStyle} />
        {homeScore} {home.abbreviation}
      </span>
    </span>
  );
};



  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        backgroundColor: "black",
        overflow: "hidden",
        whiteSpace: "nowrap",
        height: "5rem",
        display: "flex",
        alignItems: "center",
        borderTop: "1px solid #555",
        position: "fixed",
        bottom: 0,
        left: 0,
        paddingLeft: "1rem",
        fontSize,
      }}
    >
      <div ref={scrollRef} style={{ display: "inline-block" }}>
        {games.length === 0 ? <span style={{ color: "#fff" }}>Waiting for games...</span> : games.map(renderGame)}
      </div>
    </div>
  );
};

export default Ticker;
