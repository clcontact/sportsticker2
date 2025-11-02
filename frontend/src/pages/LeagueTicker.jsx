import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";

// Utility: check brightness of a hex color (for text contrast)
const isColorLight = (hex) => {
    if (!hex) return false;
    const cleanHex = hex.replace("#", "");
    const expandedHex =
        cleanHex.length === 3
            ? cleanHex.split("").map((c) => c + c).join("")
            : cleanHex;

    const r = parseInt(expandedHex.substring(0, 2), 16);
    const g = parseInt(expandedHex.substring(2, 4), 16);
    const b = parseInt(expandedHex.substring(4, 6), 16);

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 170; // higher = lighter
};

export default function LeagueTicker({ league, gameCount, leagueDisplayName }) {
    const [allGames, setAllGames] = useState([]);
    const [prevScores, setPrevScores] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);

    const limit = Math.max(1, Math.min(4, gameCount || 4));

    const gamesToDisplay = useMemo(() => {
        if (allGames.length <= limit) return allGames;
        const end = currentIndex + limit;
        if (end <= allGames.length) {
            return allGames.slice(currentIndex, end);
        } else {
            const remaining = end - allGames.length;
            return allGames.slice(currentIndex).concat(allGames.slice(0, remaining));
        }
    }, [allGames, currentIndex, limit]);

    const tickerLength = allGames.length;
    const displayWindowSize = gamesToDisplay.length;

    const fetchGames = async () => {
        const API_URL = `http://localhost:3000/api/games/${league}`;
        try {
            const res = await axios.get(API_URL);
            const newScores = {};
            res.data.forEach((g) => {
                g.teams.forEach((t) => {
                    newScores[t.abbreviation] = t.score;
                });
            });
            setAllGames(res.data);
            setPrevScores(newScores);
        } catch (err) {
            console.error(`Error fetching games for ${league}:`, err);
            setAllGames([]);
        }
    };

    useEffect(() => {
        fetchGames();
        const intervalFetch = setInterval(fetchGames, 60000);
        setCurrentIndex(0);
        return () => clearInterval(intervalFetch);
    }, [league]);

    useEffect(() => {
        if (tickerLength <= displayWindowSize || tickerLength === 0) return;
        const intervalRotate = setInterval(() => {
            setCurrentIndex((prev) => (prev + limit) % tickerLength);
        }, 8000);
        return () => clearInterval(intervalRotate);
    }, [tickerLength, displayWindowSize, limit]);

    if (displayWindowSize === 0) {
        return (
            <div className="text-white text-2xl flex justify-center items-center h-screen">
                Loading {leagueDisplayName || league.toUpperCase()} games...
            </div>
        );
    }

    const firstGame = gamesToDisplay[0];
    const weekText = firstGame ? firstGame.weekText : "Current Games";

    // --- SCALE SETTINGS tuned for 1080x1920 portrait display ---
    const scaleFactor = {
        1: 1.8,
        2: 1.4,
        3: 1.1,
        4: 1.1,
    }[displayWindowSize] || 1.0;

    // --- TEAM CARD ---
    const renderTeamCard = (team, boldScore) => {
        const isPrimaryLight = isColorLight(team.color);
        const isAltLight = isColorLight(team.alternateColor);

        const logoSize = `${7.5 * scaleFactor}rem`;
        const scoreFontSize = `${4.0 * scaleFactor}rem`;
        const nameFontSize = `${1.5 * scaleFactor}rem`;
        const recordFontSize = `${1.5 * scaleFactor}rem`;

        return (
            <div className="flex w-full h-full overflow-hidden">
                {/* Logo / record side */}
                <div
                    className={`flex flex-col items-center justify-center w-1/2 ${
                        isPrimaryLight ? "text-black" : "text-white"
                    }`}
                    style={{
                        backgroundColor: `#${team.color}`,
                        padding: `${0.1 * scaleFactor}rem`,
                    }}
                >
                    <img
                        src={team.logo}
                        alt={team.abbreviation}
                        style={{
                            width: logoSize,
                            height: logoSize,
                            objectFit: "contain",
                            filter: isPrimaryLight
                                ? "drop-shadow(0 0 6px rgba(0,0,0,0.5))"
                                : "drop-shadow(0 0 3px rgba(255,255,255,0.3))",
                        }}
                    />
                    <span
                        className="font-bold mt-1"
                        style={{ fontSize: recordFontSize }}
                    >
                        {team.record || "0-0"}
                    </span>
                </div>

                {/* Score / name side */}
                <motion.div
                    className={`flex flex-col justify-center items-center w-1/2 ${
                        isAltLight ? "text-black" : "text-white"
                    }`}
                    style={{
                        backgroundColor: `#${team.alternateColor}`,
                        padding: `${0.1 * scaleFactor}rem`,
                        textShadow: isAltLight
                            ? "0 1px 2px rgba(0,0,0,0.4)"
                            : "0 1px 2px rgba(255,255,255,0.2)",
                    }}
                    animate={{
                        scale:
                            prevScores[team.abbreviation] !== team.score
                                ? [1, 1.18, 1]
                                : 1,
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <span
                        className={`${boldScore ? "font-extrabold" : "font-bold"}`}
                        style={{
                            fontSize: scoreFontSize,
                            lineHeight: 1.05,
                        }}
                    >
                        {team.score || "0"}
                    </span>
                    <span
                        className="font-medium mt-0.5 text-center"
                        style={{ fontSize: nameFontSize }}
                    >
                        {team.displayName || team.abbreviation}
                    </span>
                </motion.div>
            </div>
        );
    };

    // --- GAME CARD ---
    const renderGameCard = (game, index) => {
        const away = game.teams.find((t) => t.homeAway === "away");
        const home = game.teams.find((t) => t.homeAway === "home");
        if (!away || !home) return null;

        const awayScoreNum = parseInt(away.score || 0);
        const homeScoreNum = parseInt(home.score || 0);
        const awayIsBold = awayScoreNum > homeScoreNum;
        const homeIsBold = homeScoreNum > awayScoreNum;

        const statusText =
            game.summary ||
            `${game.period ? "P" + game.period : "Pre"}: ${game.clock || "--"}`;

        const statusFontSize = `${1.4 * scaleFactor}rem`;

        return (
            <motion.div
                key={`${currentIndex}-${game.id}`}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="w-full flex flex-col flex-1"
            >
                <div
                    className="flex flex-col h-full bg-gray-900 rounded-lg shadow-md overflow-hidden"
                    style={{
                        border: "1px solid #222",
                    }}
                >
                    <div
                        className="flex justify-center items-center bg-gray-800 text-white font-bold flex-shrink-0"
                        style={{
                            fontSize: statusFontSize,
                            padding: `${0.2 * scaleFactor}rem`,
                        }}
                    >
                        {statusText}
                    </div>
                    {renderTeamCard(away, awayIsBold)}
                    <div className="h-px bg-gray-700 w-full"></div>
                    {renderTeamCard(home, homeIsBold)}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col w-screen h-screen bg-black overflow-hidden">
            <div
                className="w-full text-center bg-gray-900 text-white font-extrabold shadow-xl flex-shrink-0"
                style={{
                    fontSize: `${2.0 * scaleFactor}rem`,
                    padding: `${0.5 * scaleFactor}rem`,
                }}
            >
                {leagueDisplayName || league.toUpperCase()} - {weekText}
            </div>

            <div
                className="flex flex-col flex-1 w-full"
                style={{
                    gap: `${0.3 * scaleFactor}rem`,
                    padding: `${0.3 * scaleFactor}rem`,
                }}
            >
                <AnimatePresence mode="wait">
                    {gamesToDisplay.map((game, index) => renderGameCard(game, index))}
                </AnimatePresence>
            </div>
        </div>
    );
}

LeagueTicker.propTypes = {
    league: PropTypes.string.isRequired,
    gameCount: PropTypes.number,
    leagueDisplayName: PropTypes.string,
};