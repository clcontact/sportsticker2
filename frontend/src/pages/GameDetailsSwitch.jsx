import React, { useState, useEffect } from 'react';
import { FaFootballBall } from 'react-icons/fa';

const GameDetailsSwitch = () => {
  // Parse URL params (league and gameId)
  const urlParams = new URLSearchParams(window.location.search);
  const league = urlParams.get('league') || 'nfl';
  const gameId = urlParams.get('gameId') || '401772631';

  const [currentView, setCurrentView] = useState(0); // 0=away leaders, 1=home leaders, 2=stats
  const [summaryData, setSummaryData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch both data sources
  const fetchData = async () => {
    try {
      const [summaryRes, statsRes] = await Promise.all([
        fetch(`https://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard/${gameId}`),
        fetch(`https://site.api.espn.com/apis/site/v2/sports/football/${league}/summary?event=${gameId}`)
      ]);

      if (!summaryRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch game data');
      }

      const summary = await summaryRes.json();
      const stats = await statsRes.json();

      setSummaryData(summary);
      setStatsData(stats);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Initial fetch & refresh every 5 sec
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [league, gameId]);

  // Auto-rotate views every 5 sec: away -> home -> stats -> away...
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

  if (error || !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">Error Loading Game</div>
          <div className="text-gray-400 text-2xl">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  const competition = summaryData.competitions?.[0];
  const awayTeam = competition?.competitors?.find(t => t.homeAway === 'away');
  const homeTeam = competition?.competitors?.find(t => t.homeAway === 'home');
  const situation = competition?.situation;
  const status = competition?.status;

  const getContrastColor = (hexColor, alternateHex = null) => {
    if (!hexColor) return '#fff';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance < 0.5) {
      return alternateHex ? `#${alternateHex}` : '#ffffff';
    }
    return `#${hexColor}`;
  };

  const renderTimeoutDots = (count) => (
    <div className="flex space-x-2 mt-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full shadow-md" />
      ))}
    </div>
  );

  const possessionTeamId = situation?.possession;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col">

      {/* SCOREBOARD */}
      <div className="flex justify-between items-center w-full mb-8">
        {[awayTeam, homeTeam].map((team) => {
          if (!team) return null;
          const hasPossession = team.id === possessionTeamId;
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
                  color: getContrastColor(team.team.color, team.team.alternateColor),
                  fontSize: '2.5rem',
                }}
              >
                {team.team.abbreviation}
              </p>
              <div className="relative flex items-end justify-center">
                <p
                  className="font-extrabold"
                  style={{
                    color: getContrastColor(team.team.color, team.team.alternateColor),
                    fontSize: '6rem',
                  }}
                >
                  {team.score}
                </p>
                {hasPossession && (
                  <FaFootballBall
                    className="absolute bottom-2 -right-12 text-yellow-400 drop-shadow-md"
                    size={48}
                  />
                )}
              </div>
              <p className="text-gray-400 text-xl mt-2">
                {team.records?.[0]?.summary || ''}
              </p>
              {renderTimeoutDots(
                team.homeAway === 'away'
                  ? situation?.awayTimeouts || 0
                  : situation?.homeTimeouts || 0
              )}
            </div>
          );
        })}
      </div>

      {/* CURRENT DRIVE */}
      {situation && (
        <div className="bg-gray-700 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-yellow-400 font-bold mb-4 text-3xl">Current Drive</h3>
          <div className="flex justify-between items-start text-gray-300 mb-4">
            <div>
              <p className="text-3xl">
                <span className="font-bold text-white">Down:</span> {situation.down || "-"} &nbsp;
                <span className="font-bold text-white">Distance:</span> {situation.distance || "-"} &nbsp;
                <span className="font-bold text-white">Yard Line:</span> {situation.yardLine || "-"}
              </p>
<p className="mt-1 text-3xl"><span className="font-bold text-white">Time:</span> {status?.displayClock || "-"}</p>

            </div>
            <div className="text-right text-2xl">
              <p><span className="font-bold text-white">Location:</span> {competition?.venue?.fullName || "-"}</p>

              <p><span className="font-bold text-white">Broadcast:</span> {competition?.broadcast || "-"}</p>
            </div>
          </div>
          {situation.lastPlay?.text && (
            <div className="mt-2 bg-gray-800 rounded-xl p-4 text-gray-300">
              <p className="text-3xl">
                <span className="font-bold text-white">Last Play:</span>{" "}
                {situation.lastPlay.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ROTATING VIEWS */}
      <div className="flex-1">
        {currentView === 0 && (
          <TeamLeadersView 
            statsData={statsData} 
            competition={competition}
            targetTeam={awayTeam}
            awayTeam={awayTeam}
            homeTeam={homeTeam}
          />
        )}
        {currentView === 1 && (
          <TeamLeadersView 
            statsData={statsData} 
            competition={competition}
            targetTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeam={homeTeam}
          />
        )}
        {currentView === 2 && (
          <StatsView statsData={statsData} awayTeam={awayTeam} homeTeam={homeTeam} />
        )}
      </div>
    </div>
  );
};

// ========================= TEAM LEADERS VIEW ========================= //

const TeamLeadersView = ({ statsData, competition, targetTeam, awayTeam, homeTeam }) => {
  const leadersData = statsData?.leaders || competition?.leaders || [];

  const getTeamLogo = (teamId) => {
    if (awayTeam?.id === teamId) return awayTeam.team.logo;
    if (homeTeam?.id === teamId) return homeTeam.team.logo;
    return '';
  };

  // Find leaders for the specific team
  const teamLeadersData = leadersData.find(td => td.team?.id === targetTeam?.id);
  
  if (!teamLeadersData) {
    return (
      <div className="text-center text-3xl text-gray-400 pt-4">
        No leader data available for {targetTeam?.team?.abbreviation}
      </div>
    );
  }

  const teamLeaders = teamLeadersData.leaders || [];
  const topCategories = ['passingYards', 'rushingYards', 'receivingYards'];
  const displayLeaders = teamLeaders.filter(cat => 
    topCategories.includes(cat.name) && cat.leaders && cat.leaders.length > 0
  );

  return (
    <div className="flex flex-col gap-8 pt-4">
      {displayLeaders.length === 0 && (
        <div className="text-center text-3xl text-gray-400">
          No leader data available yet
        </div>
      )}

      {displayLeaders.map((leaderCategory, i) => {
        const topLeader = leaderCategory.leaders[0];
        if (!topLeader || !topLeader.athlete) return null;

        const headshotUrl = topLeader.athlete.headshot?.href || null;

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
                  src={teamLeadersData.team?.logo || getTeamLogo(targetTeam?.id)} 
                  alt="" 
                  className="w-10 h-10 object-contain" 
                />
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="font-semibold text-yellow-400 mb-2 uppercase tracking-wide text-3xl">
                {leaderCategory.displayName}
              </h3>
              <p className="font-bold text-white text-4xl mb-2">
                {topLeader.athlete.displayName}
              </p>
              <p className="text-gray-400 text-2xl mb-2">
                {topLeader.athlete.jersey ? `#${topLeader.athlete.jersey}` : ''} 
                {topLeader.athlete.position?.abbreviation ? ` â€¢ ${topLeader.athlete.position.abbreviation}` : ''}
              </p>
              <p className="text-gray-300 text-xl mb-2 italic">
                {teamLeadersData.team?.displayName || targetTeam?.team?.displayName || ''}
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

const StatsView = ({ statsData, awayTeam, homeTeam }) => {
  const boxscore = statsData?.boxscore;
  const awayStats = boxscore?.teams?.[0];
  const homeStats = boxscore?.teams?.[1];

  if (!awayStats || !homeStats) {
    return <div className="text-center text-2xl text-gray-400">No stats available</div>;
  }

  const statCategories = [
    { key: 'totalYards', label: 'Total Yards' },
    { key: 'netPassingYards', label: 'Passing Yards' },
    { key: 'rushingYards', label: 'Rushing Yards' },
    { key: 'firstDowns', label: '1st Downs' },
    { key: 'thirdDownEff', label: '3rd Down Conversions' },
    { key: 'fourthDownEff', label: '4th Down Conversions' },
    { key: 'totalPenaltiesYards', label: 'Penalties' },
    { key: 'turnovers', label: 'Turnovers' },
    { key: 'possessionTime', label: 'Time of Possession' },
  ];

  const getStatValue = (stats, key) => {
    const stat = stats.statistics?.find(s => s.name === key);
    return stat?.displayValue || '-';
  };

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
            <p className="text-4xl font-bold">{homeTeam?.team?.abbreviation}</p>
          </div>
        </div>

        {statCategories.map((cat, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-6 py-4 border-b border-gray-700 items-center hover:bg-gray-700/50 transition-colors"
          >
            <div className="text-right text-3xl font-bold text-yellow-400">
              {getStatValue(awayStats, cat.key)}
            </div>
            <div className="text-center text-3xl text-gray-300 font-semibold">{cat.label}</div>
            <div className="text-left text-3xl font-bold text-yellow-400">
              {getStatValue(homeStats, cat.key)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameDetailsSwitch;