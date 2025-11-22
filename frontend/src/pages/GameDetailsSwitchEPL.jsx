import React, { useState, useEffect } from 'react';
import { FaFutbol } from 'react-icons/fa';

const GameDetailsSwitchEPL = () => {
  const path = window.location.pathname;
  const pathSegments = path.split('/').filter(s => s.length > 0);
  
  const league = 'eng.1';
  const gameId = pathSegments[1];

  const [currentView, setCurrentView] = useState(0);
  const [summaryData, setSummaryData] = useState(null);
  const [leagueSummary, setLeagueSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [summaryRes, leagueRes] = await Promise.all([
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${gameId}`),
        fetch(`https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer&league=${league}`)
      ]);

      if (!summaryRes.ok || !leagueRes.ok) {
        throw new Error('Failed to fetch game data');
      }

      const summary = await summaryRes.json();
      const leagueData = await leagueRes.json();

      setSummaryData(summary);
      setLeagueSummary(leagueData);
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
  }, [league, gameId]);

  useEffect(() => {
    // Rotate through 4 views: away team, home team, stats, scorers
    const viewInterval = setInterval(() => {
      setCurrentView(prev => (prev + 1) % 4);
    }, 7000);
    return () => clearInterval(viewInterval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-4xl">Loading match data...</div>
        </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">Error Loading Match</div>
          <div className="text-gray-400 text-2xl">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  // EPL uses different structure - competitors are directly in header
  const header = summaryData.header;
  const competition = header?.competitions?.[0];
  
  // Get competitors from competition
  let awayTeam = competition?.competitors?.find(t => t.homeAway === 'away');
  let homeTeam = competition?.competitors?.find(t => t.homeAway === 'home');
  
  const status = competition?.status;
  const boxscore = summaryData.boxscore;
  
  // If not found in competition, check boxscore teams
  if (!awayTeam || !homeTeam) {
    const teams = boxscore?.teams || [];
    awayTeam = teams.find(t => t.homeAway === 'away');
    homeTeam = teams.find(t => t.homeAway === 'home');
  }

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

  // Helper function to safely get display value from object or primitive
  const getDisplayValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    // Handle arrays - get the first item's displayValue
    if (Array.isArray(value) && value.length > 0) {
      if (value[0].displayValue) return value[0].displayValue;
      if (value[0].summary) return value[0].summary;
    }
    if (typeof value === 'object' && value.displayValue) return value.displayValue;
    if (typeof value === 'object' && value.summary) return value.summary;
    return String(value);
  };

  // Helper to get team logo
  const getTeamLogo = (team) => {
    if (!team) return '';
    // Try different possible logo locations
    if (team.team?.logo) return team.team.logo;
    if (team.team?.logos?.[0]?.href) return team.team.logos[0].href;
    if (team.logo) return team.logo;
    return '';
  };

  // Helper to get team color
  const getTeamColor = (team) => {
    if (!team) return 'ffffff';
    if (team.team?.color) return team.team.color;
    if (team.color) return team.color;
    return 'ffffff';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col">
      {/* SCOREBOARD */}
      <div className="flex justify-between items-center w-full mb-8">
        {[awayTeam, homeTeam].map((team) => {
          if (!team) return null;
          const recordDisplay = getDisplayValue(team.record);
          const pointsValue = team.recordStats?.points?.value;
          const teamLogo = getTeamLogo(team);
          const teamColor = getTeamColor(team);
          const teamAbbr = team.team?.abbreviation || team.abbreviation || 'N/A';
          const teamScore = team.score || '0';
          
          return (
            <div
              key={team.id}
              className="flex-1 flex flex-col items-center bg-gray-800 rounded-3xl p-8 mx-4 shadow-2xl"
            >
              {teamLogo && (
                <img
                  src={teamLogo}
                  alt={teamAbbr}
                  className="w-36 h-36 object-contain mb-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <p
                className="font-bold mb-2"
                style={{
                  color: getContrastColor(teamColor),
                  fontSize: '2.5rem',
                }}
              >
                {teamAbbr}
              </p>
              <div className="relative flex items-end justify-center">
                <p
                  className="font-extrabold"
                  style={{
                    color: getContrastColor(teamColor),
                    fontSize: '6rem',
                  }}
                >
                  {teamScore}
                </p>
              </div>
              {recordDisplay && (
                <p className="text-gray-400 text-3xl mt-2">
                  {recordDisplay}
                </p>
              )}
              {pointsValue !== undefined && (
                <p className="text-yellow-400 text-2xl mt-1">
                  {pointsValue} pts
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* MATCH INFO */}
      <div className="bg-gray-700 rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-yellow-400 font-bold mb-4 text-3xl">Match Information</h3>
        <div className="flex justify-between items-start text-gray-300">
          <div>
            <p className="text-3xl">
              <span className="font-bold text-white">Status:</span> {status?.type?.shortDetail || "-"}
            </p>
            <p className="mt-1 text-3xl">
              <span className="font-bold text-white">Time:</span> {status?.displayClock || "-"}
            </p>
          </div>
          <div className="text-right text-2xl">
            <p><span className="font-bold text-white">Venue:</span> {summaryData.gameInfo?.venue?.fullName || "-"}</p>
            <p><span className="font-bold text-white">Officials:</span> {summaryData.gameInfo?.officials?.[0]?.displayName || "-"}</p>
          </div>
        </div>
        {competition?.situation?.lastPlay?.text && (
          <div className="mt-4 bg-gray-800 rounded-xl p-4 text-gray-300">
            <p className="text-3xl">
              <span className="font-bold text-white">Last Play:</span>{" "}
              {competition.situation.lastPlay.text}
            </p>
          </div>
        )}
      </div>

      {/* ROTATING VIEWS */}
      <div className="flex-1">
        {currentView === 0 && (
          <TeamFormView 
            team={awayTeam}
            formData={boxscore?.form?.find(f => f.team.id === awayTeam?.id)}
            getDisplayValue={getDisplayValue}
            getTeamLogo={getTeamLogo}
          />
        )}
        {currentView === 1 && (
          <TeamFormView 
            team={homeTeam}
            formData={boxscore?.form?.find(f => f.team.id === homeTeam?.id)}
            getDisplayValue={getDisplayValue}
            getTeamLogo={getTeamLogo}
          />
        )}
        {currentView === 2 && (
          <StatsView boxscore={boxscore} awayTeam={awayTeam} homeTeam={homeTeam} getTeamLogo={getTeamLogo} />
        )}
        {currentView === 3 && (
          <ScorersView 
            leagueSummary={leagueSummary} 
            gameId={gameId}
            awayTeam={awayTeam} 
            homeTeam={homeTeam} 
            getTeamLogo={getTeamLogo} 
          />
        )}
      </div>
    </div>
  );
};

// ========================= TEAM FORM VIEW ========================= //

const TeamFormView = ({ team, formData, getDisplayValue, getTeamLogo }) => {
  if (!team || !formData) {
    return (
      <div className="text-center text-3xl text-gray-400 pt-4">
        No form data available
      </div>
    );
  }

  const recentEvents = formData.events || [];
  const displayEvents = recentEvents.slice(0, 5);

  const getResultColor = (result) => {
    if (result === 'W') return 'bg-green-500';
    if (result === 'L') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const recordDisplay = getDisplayValue(team.record);
  const pointsValue = team.recordStats?.points?.value;
  const teamLogo = getTeamLogo(team);
  const teamName = team.team?.displayName || team.displayName || 'Unknown Team';
  
  return (
    <div className="pt-4">
      <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          {teamLogo && (
            <img 
              src={teamLogo} 
              alt="" 
              className="w-32 h-32 mx-auto mb-4"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <h2 className="text-5xl font-bold mb-2">{teamName}</h2>
          {recordDisplay && (
            <p className="text-3xl text-gray-400">{recordDisplay}</p>
          )}
          {pointsValue !== undefined && (
            <p className="text-4xl text-yellow-400 mt-2 font-bold">
              {pointsValue} Points
            </p>
          )}
        </div>

        <h3 className="text-yellow-400 font-bold mb-6 text-3xl">Recent Form</h3>
        
        {displayEvents.map((event, i) => (
          <div
            key={i}
            className="bg-gray-700 rounded-2xl p-6 mb-4 hover:bg-gray-600 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className={`${getResultColor(event.gameResult)} text-white font-bold text-2xl px-6 py-3 rounded-lg min-w-24 text-center`}>
                  {event.gameResult}
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {event.atVs} {event.opponent?.displayName}
                  </p>
                  <p className="text-xl text-gray-400">
                    {event.leagueAbbreviation}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-yellow-400">{event.score}</p>
                <p className="text-lg text-gray-400">
                  {new Date(event.gameDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {team.recordStats && (
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-xl mb-2">Home Record</p>
              <p className="text-3xl font-bold text-white">
                {team.recordStats.homeWins?.value || 0}-{team.recordStats.homeTies?.value || 0}-{team.recordStats.homeLosses?.value || 0}
              </p>
            </div>
            <div className="bg-gray-700 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-xl mb-2">Away Record</p>
              <p className="text-3xl font-bold text-white">
                {team.recordStats.awayWins?.value || 0}-{team.recordStats.awayTies?.value || 0}-{team.recordStats.awayLosses?.value || 0}
              </p>
            </div>
            <div className="bg-gray-700 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-xl mb-2">Goals For</p>
              <p className="text-3xl font-bold text-green-400">
                {team.recordStats.pointsFor?.value || 0}
              </p>
            </div>
            <div className="bg-gray-700 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-xl mb-2">Goals Against</p>
              <p className="text-3xl font-bold text-red-400">
                {team.recordStats.pointsAgainst?.value || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================= STATS VIEW ========================= //

const StatsView = ({ boxscore, awayTeam, homeTeam, getTeamLogo }) => {
  const awayStats = boxscore?.teams?.[0];
  const homeStats = boxscore?.teams?.[1];

  if (!awayStats || !homeStats) {
    return <div className="text-center text-2xl text-gray-400">No stats available</div>;
  }

  const statCategories = [
    { key: 'possessionPct', label: 'Possession %' },
    { key: 'totalShots', label: 'Shots' },
    { key: 'shotsOnTarget', label: 'Shots On Target' },
    { key: 'shotPct', label: 'Shot Accuracy %' },
    { key: 'accuratePasses', label: 'Accurate Passes' },
    { key: 'totalPasses', label: 'Total Passes' },
    { key: 'passPct', label: 'Pass Accuracy %' },
    { key: 'wonCorners', label: 'Corners' },
    { key: 'saves', label: 'Saves' },
    { key: 'foulsCommitted', label: 'Fouls' },
    { key: 'yellowCards', label: 'Yellow Cards' },
    { key: 'redCards', label: 'Red Cards' },
    { key: 'offsides', label: 'Offsides' },
  ];

  const getStatValue = (stats, key) => {
    const stat = stats.statistics?.find(s => s.name === key);
    return stat?.displayValue || '-';
  };

  const awayLogo = getTeamLogo(awayTeam);
  const homeLogo = getTeamLogo(homeTeam);
  const awayAbbr = awayTeam?.team?.abbreviation || awayTeam?.abbreviation || 'AWAY';
  const homeAbbr = homeTeam?.team?.abbreviation || homeTeam?.abbreviation || 'HOME';

  return (
    <div className="pt-4">
      <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
{/*         <div className="grid grid-cols-3 gap-6 mb-6 pb-4 border-b-2 border-gray-700">
          <div className="text-center">
            {awayLogo && (
              <img 
                src={awayLogo} 
                alt="" 
                className="w-20 h-20 mx-auto mb-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <p className="text-2xl font-bold">{awayAbbr}</p>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-yellow-400">Match Statistics</h2>
          </div>
          <div className="text-center">
            {homeLogo && (
              <img 
                src={homeLogo} 
                alt="" 
                className="w-20 h-20 mx-auto mb-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <p className="text-2xl font-bold">{homeAbbr}</p>
          </div>
        </div> */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-yellow-400">Match Statistics</h2>
          </div>
        {statCategories.map((cat, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-6 py-4 border-b border-gray-700 items-center hover:bg-gray-700/50 transition-colors"
          >
            <div className="text-right text-4xl font-bold text-yellow-400">
              {getStatValue(awayStats, cat.key)}
            </div>
            <div className="text-center text-4xl text-gray-300 font-semibold">{cat.label}</div>
            <div className="text-left text-4xl font-bold text-yellow-400">
              {getStatValue(homeStats, cat.key)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================= SCORERS VIEW ========================= //

const ScorersView = ({ leagueSummary, gameId, awayTeam, homeTeam, getTeamLogo }) => {
  // Find the specific game in the league summary
  const findGameData = () => {
    if (!leagueSummary?.sports?.[0]?.leagues?.[0]?.events) return null;
    
    const events = leagueSummary.sports[0].leagues[0].events;
    return events.find(event => event.id === gameId);
  };

  const gameData = findGameData();
  
  if (!gameData) {
    return (
      <div className="text-center text-3xl text-gray-400 pt-4">
        No scoring information available yet
      </div>
    );
  }

  const competitors = gameData.competitors || [];
  const awayCompetitor = competitors.find(c => c.homeAway === 'away');
  const homeCompetitor = competitors.find(c => c.homeAway === 'home');

  const awayScorers = awayCompetitor?.scoringSummary || [];
  const homeScorers = homeCompetitor?.scoringSummary || [];
  const awayKeepers = awayCompetitor?.goalieSummary || [];
  const homeKeepers = homeCompetitor?.goalieSummary || [];

  const hasScorers = awayScorers.length > 0 || homeScorers.length > 0;
  const hasKeepers = awayKeepers.length > 0 || homeKeepers.length > 0;

  if (!hasScorers && !hasKeepers) {
    return (
      <div className="text-center text-3xl text-gray-400 pt-4">
        No scoring information available yet
      </div>
    );
  }

  const awayLogo = getTeamLogo(awayTeam);
  const homeLogo = getTeamLogo(homeTeam);
  const awayAbbr = awayTeam?.team?.abbreviation || awayTeam?.abbreviation || 'AWAY';
  const homeAbbr = homeTeam?.team?.abbreviation || homeTeam?.abbreviation || 'HOME';

  return (
    <div className="pt-4">
      <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Match Summary</h2>

        {/* Goal Scorers */}
        {hasScorers && (
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-white mb-6">Goal Scorers</h3>
            <div className="grid grid-cols-2 gap-8">
              {/* Away Team Scorers */}
              <div>
                <div className="flex items-center mb-4">
                  {awayLogo && (
                    <img 
                      src={awayLogo} 
                      alt="" 
                      className="w-12 h-12 mr-3"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <p className="text-2xl font-bold">{awayAbbr}</p>
                </div>
                {awayScorers.length > 0 ? (
                  awayScorers.map((scorer, i) => (
                    <div key={i} className="bg-gray-700 rounded-xl p-4 mb-3">
                      <p className="text-2xl font-semibold text-white">
                        {scorer.athlete?.displayName || 'Unknown'}
                      </p>
                      <p className="text-xl text-gray-400">
                        {scorer.displayValue}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xl text-gray-500 italic">No goals</p>
                )}
              </div>

              {/* Home Team Scorers */}
              <div>
                <div className="flex items-center mb-4">
                  {homeLogo && (
                    <img 
                      src={homeLogo} 
                      alt="" 
                      className="w-12 h-12 mr-3"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <p className="text-2xl font-bold">{homeAbbr}</p>
                </div>
                {homeScorers.length > 0 ? (
                  homeScorers.map((scorer, i) => (
                    <div key={i} className="bg-gray-700 rounded-xl p-4 mb-3">
                      <p className="text-2xl font-semibold text-white">
                        {scorer.athlete?.displayName || 'Unknown'}
                      </p>
                      <p className="text-xl text-gray-400">
                        {scorer.displayValue}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xl text-gray-500 italic">No goals</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Goalkeeper Stats */}
        {hasKeepers && (
          <div>
            <h3 className="text-3xl font-bold text-white mb-6">Goalkeepers</h3>
            <div className="grid grid-cols-2 gap-8">
              {/* Away Team Keeper */}
              <div>
                {awayKeepers.map((keeper, i) => (
                  <div key={i} className="bg-gray-700 rounded-xl p-6">
                    <p className="text-2xl font-semibold text-white mb-2">
                      {keeper.athlete?.displayName}
                    </p>
                    <p className="text-xl text-gray-400">
                      #{keeper.athlete?.jersey}
                    </p>
                    <p className="text-3xl text-yellow-400 mt-3 font-bold">
                      {keeper.displayValue}
                    </p>
                  </div>
                ))}
              </div>

              {/* Home Team Keeper */}
              <div>
                {homeKeepers.map((keeper, i) => (
                  <div key={i} className="bg-gray-700 rounded-xl p-6">
                    <p className="text-2xl font-semibold text-white mb-2">
                      {keeper.athlete?.displayName}
                    </p>
                    <p className="text-xl text-gray-400">
                      #{keeper.athlete?.jersey}
                    </p>
                    <p className="text-3xl text-yellow-400 mt-3 font-bold">
                      {keeper.displayValue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetailsSwitchEPL;