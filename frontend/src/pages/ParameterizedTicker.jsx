// src/pages/ParameterizedTicker.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import LeagueTicker from './LeagueTicker'; 

// Define a map to translate route keys to display names
const LEAGUE_NAMES = {
    nfl: 'NFL',
    mlb: 'MLB',
    epl: 'Premier League',
    // Add any other supported league routes here
};

export default function ParameterizedTicker() {
    // Read the parameters from the URL: /ticker/:league/:count
    const { league, count } = useParams();

    // Convert the 'count' string parameter to an integer
    const gameCount = parseInt(count, 10);
    
    // Determine the user-friendly display name
    const leagueKey = league.toLowerCase();
    const leagueDisplayName = LEAGUE_NAMES[leagueKey] || leagueKey.toUpperCase();

    // Pass the parameters as props to LeagueTicker
    return (
        <LeagueTicker 
            league={leagueKey} 
            gameCount={gameCount} 
            leagueDisplayName={leagueDisplayName} 
        />
    );
}