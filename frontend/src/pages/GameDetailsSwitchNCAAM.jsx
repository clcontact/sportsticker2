import React, { useState, useEffect } from 'react';

const GameDetailsSwitchNCAAM = () => {
  const path = window.location.pathname;
  const pathSegments = path.split('/').filter(s => s.length > 0);   
 

  const gameId = pathSegments[1];

  const [currentView, setCurrentView] = useState(0); // 0=away leaders, 1=home leaders, 2=stats
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard/${gameId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch game data');
      }

      const data = await res.json();
      setGameData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  useEffect(() => {
    const viewInterval = setInterval(() => {
      setCurrentView(prev => (prev + 1) % 3);
    }, 7000);
    return () => clearInterval(viewInterval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-4xl">Loading game data...</div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">Error Loading Game</div>
          <div className="text-gray-400 text-2xl">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  const competition = gameData.competitions?.[0];
  const awayTeam = competition?.competitors?.find(t => t.homeAway === 'away');
  const homeTeam = competition?.competitors?.find(t => t.homeAway === 'home');
  const status = competition?.status;

  const getContrastColor = (hexColor) => {
    if (!hexColor) return '#ffffff';

    const hex = hexColor.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const minLuminance = 0.5;

    if (luminance < minLuminance) {
      const factor = (minLuminance - luminance) / luminance;
      r = Math.min(255, Math.floor(r + r * factor));
      g = Math.min(255, Math.floor(g + g * factor));
      b = Math.min(255, Math.floor(b + b * factor));
    }

    const toHex = (val) => val.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col">

      {/* SCOREBOARD */}
      <div className="flex justify-between items-center w-full mb-8">
        {[awayTeam, homeTeam].map((team) => {
          if (!team) return null;
          return (
            <div
              key={team.id}
              className="flex-1 flex flex-col items-center bg-gray-800 rounded-3xl p-8 mx-4 shadow-2xl"
            >
              <img
                src={team.team.logo}
                alt={team.team.abbreviation}
                className="w-36 h-36 object-contain mb-4"
              />
              <p
                className="font-bold mb-2"
                style={{
                  color: getContrastColor(team.team.color),
                  fontSize: '2.5rem',
                }}
              >
                {team.team.abbreviation}
              </p>
              <div className="relative flex items-end justify-center">
                <p
                  className="font-extrabold"
                  style={{
                    color: getContrastColor(team.team.color),
                    fontSize: '6rem',
                  }}
                >
                  {team.score}
                </p>
              </div>
              <p className="text-gray-400 text-4xl mt-2">
                {team.records?.[0]?.summary || ''}
              </p>
            </div>
          );
        })}
      </div>

      {/* GAME INFO */}
      <div className="bg-gray-700 rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-yellow-400 font-bold mb-4 text-3xl">Game Information</h3>
        <div className="flex justify-between items-start text-gray-300">
          <div>
            <p className="text-3xl">
              <span className="font-bold text-white">Time:</span> {status?.displayClock || "-"}
            </p>
            <p className="mt-1 text-3xl">
              <span className="font-bold text-white">Period:</span> {status?.type?.shortDetail || "-"}
            </p>
          </div>
          <div className="text-right text-2xl">
            <p><span className="font-bold text-white">Location:</span> {competition?.venue?.fullName || "-"}</p>
            <p><span className="font-bold text-white">Broadcast:</span> {competition?.broadcasts?.[0]?.names?.join(', ') || "-"}</p>
          </div>
        </div>
      </div>

      {/* ROTATING VIEWS */}
      <div className="flex-1">
        {currentView === 0 && (
          <TeamLeadersView 
            targetTeam={awayTeam}
            awayTeam={awayTeam}
            homeTeam={homeTeam}
          />
        )}
        {currentView === 1 && (
          <TeamLeadersView 
            targetTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeam={homeTeam}
          />
        )}
        {currentView === 2 && (
          <StatsView awayTeam={awayTeam} homeTeam={homeTeam} />
        )}
      </div>
    </div>
  );
};

// ========================= TEAM LEADERS VIEW ========================= //

const TeamLeadersView = ({ targetTeam, awayTeam, homeTeam }) => {
  const getTeamLogo = (teamId) => {
    if (awayTeam?.id === teamId) return awayTeam.team.logo;
    if (homeTeam?.id === teamId) return homeTeam.team.logo;
    return '';
  };

  const teamLeaders = targetTeam?.leaders || [];
  
  if (!teamLeaders || teamLeaders.length === 0) {
    return (
      <div className="text-center text-3xl text-gray-400 pt-4">
        No leader data available for {targetTeam?.team?.abbreviation}
      </div>
    );
  }

  // Show first 3 leaders
  const displayLeaders = teamLeaders.slice(0, 3);

  return (
    <div className="flex flex-col gap-8 pt-4">
      {displayLeaders.map((leaderCategory, i) => {
        const topLeader = leaderCategory.leaders?.[0];
        if (!topLeader || !topLeader.athlete) return null;

        const headshotUrl = topLeader.athlete.headshot?.href || topLeader.athlete.headshot || null;

        return (
          <div
            key={i}
            className="bg-gray-800 rounded-3xl p-8 flex items-center shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300"
          >
            <div className="relative flex-shrink-0 mr-8">
              <img
                src={headshotUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23374151" width="150" height="150"/%3E%3Ctext fill="%239CA3AF" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'}
                alt={topLeader.athlete.displayName}
                className="w-40 h-40 object-cover rounded-full border-4 border-yellow-400 shadow-lg"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23374151" width="150" height="150"/%3E%3Ctext fill="%239CA3AF" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="absolute bottom-0 right-0 w-14 h-14 rounded-full bg-gray-900 border-4 border-gray-700 flex items-center justify-center">
                <img 
                  src={targetTeam?.team?.logo || getTeamLogo(targetTeam?.id)} 
                  alt="" 
                  className="w-10 h-10 object-contain" 
                />
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="font-semibold text-yellow-400 mb-2 uppercase tracking-wide text-3xl">
                {leaderCategory.displayName || leaderCategory.name || 'Leader'}
              </h3>
              <p className="font-bold text-white text-4xl mb-2">
                {topLeader.athlete.displayName}
              </p>
              <p className="text-gray-400 text-2xl mb-2">
                {topLeader.athlete.jersey ? `#${topLeader.athlete.jersey}` : ''} 
                {topLeader.athlete.position?.abbreviation ? ` • ${topLeader.athlete.position.abbreviation}` : ''}
              </p>
              <p className="text-gray-300 text-xl mb-2 italic">
                {targetTeam?.team?.displayName || ''}
              </p>
              <p className="text-yellow-400 font-extrabold text-5xl mt-2 animate-pulse">
                {topLeader.displayValue || 'N/A'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ========================= STATS VIEW ========================= //

const StatsView = ({ awayTeam, homeTeam }) => {
  const awayStats = awayTeam?.statistics || [];
  const homeStats = homeTeam?.statistics || [];

  if (awayStats.length === 0 && homeStats.length === 0) {
    return <div className="text-center text-2xl text-gray-400">No stats available</div>;
  }

  const toTitleCase = (str) => {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatValue = (stats, name) => {
    const stat = stats.find(s => s.name === name);
    return stat?.displayValue || stat?.value || '-';
  };

  // Get all unique stat names (excluding averages)
  const allStatNames = [...new Set([
    ...awayStats.map(s => s.name),
    ...homeStats.map(s => s.name)
  ])].filter(name => !/^avg/i.test(name));

  return (
    <div className="pt-4">
      <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="grid grid-cols-3 gap-6 mb-6 pb-4 border-b-2 border-gray-700">
          <div className="text-center">
            <img src={awayTeam?.team?.logo} alt="" className="w-20 h-20 mx-auto mb-2" />
            <p className="text-2xl font-bold">{awayTeam?.team?.abbreviation}</p>
          </div>
          <div></div>
          <div className="text-center">
            <img src={homeTeam?.team?.logo} alt="" className="w-20 h-20 mx-auto mb-2" />
            <p className="text-2xl font-bold">{homeTeam?.team?.abbreviation}</p>
          </div>
        </div>

        {allStatNames.map((statName, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-6 py-4 border-b border-gray-700 items-center hover:bg-gray-700/50 transition-colors"
          >
            <div className="text-right text-3xl font-bold text-yellow-400">
              {getStatValue(awayStats, statName)}
            </div>
            <div className="text-center text-3xl text-gray-300 font-semibold">
              {toTitleCase(awayStats.find(s => s.name === statName)?.displayName || statName)}
            </div>
            <div className="text-left text-3xl font-bold text-yellow-400">
              {getStatValue(homeStats, statName)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameDetailsSwitchNCAAM;