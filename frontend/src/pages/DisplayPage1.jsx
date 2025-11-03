import React, { useEffect, useState, useRef } from "react";
import Ticker from "./Ticker";

const DisplayTracker = ({
  gamesPerPage = 4,
  pageInterval = 5000, // milliseconds per page
  slideDuration = 1000, // milliseconds for slide animation
}) => {
  const [games, setGames] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef(null);

  // Fetch latest games
  const fetchGames = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/games/nfl");
      const data = await res.json();
      setGames(data);
      setPageIndex(0); // reset paging
    } catch (err) {
      console.error("Error fetching games:", err);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Handle page changes
  useEffect(() => {
    if (games.length === 0) return;

    const interval = setInterval(() => {
      const totalPages = Math.ceil(games.length / gamesPerPage);

      setTransitioning(true);

      setTimeout(() => {
        setTransitioning(false);
        if (pageIndex + 1 >= totalPages) {
          fetchGames(); // refresh scores at the end
        } else {
          setPageIndex(pageIndex + 1);
        }
      }, slideDuration);
    }, pageInterval);

    return () => clearInterval(interval);
  }, [games, pageIndex, gamesPerPage, pageInterval, slideDuration]);

  // Current page slice
  const currentGames = games.slice(
    pageIndex * gamesPerPage,
    pageIndex * gamesPerPage + gamesPerPage
  );

  return (
    <div
      style={{
        backgroundColor: "black",
        color: "white",
        width: "100%",
        height: "calc(100vh - 2.5rem)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
        overflow: "hidden",
        position: "relative",
        padding: "1rem",
      }}
    >
      <div
        ref={containerRef}
        style={{
          display: "flex",
          transform: transitioning ? "translateX(-100%)" : "translateX(0)",
          transition: transitioning ? `transform ${slideDuration}ms ease-in-out` : "none",
          width: "200%", // allow space to slide
        }}
      >
        <div style={{ width: "50%" }}>
          {currentGames.length === 0 ? (
            <div style={{ textAlign: "center" }}>Waiting for scores...</div>
          ) : (
            currentGames.map((g) => (
              <table
                key={g.id}
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  marginBottom: "1rem",
                  backgroundColor: "#111",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        border: "1px solid #555",
                        padding: "0.5rem",
                        textAlign: "center",
                      }}
                    >
                      {g.away}
                    </td>
                    <td
                      style={{
                        border: "1px solid #555",
                        padding: "0.5rem",
                        textAlign: "center",
                      }}
                    >
                      {g.awayScore}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid #555",
                        padding: "0.5rem",
                        textAlign: "center",
                      }}
                    >
                      {g.home}
                    </td>
                    <td
                      style={{
                        border: "1px solid #555",
                        padding: "0.5rem",
                        textAlign: "center",
                      }}
                    >
                      {g.homeScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))
          )}
        </div>
        {/* Empty next page placeholder for smooth sliding */}
        <div style={{ width: "50%" }} />
      </div>
      <Ticker />
    </div>
  );
};

export default DisplayTracker;
