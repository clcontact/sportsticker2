import React, { useState, useEffect } from 'react';
import { FaHockeyPuck } from 'react-icons/fa';

const GameDetailsNHL = () => {
  const path = window.location.pathname;
  const pathSegments = path.split('/').filter(s => s.length > 0);   
 
  const league = pathSegments[1] || 'nhl';
  const gameId = pathSegments[2];

  const [currentView, setCurrentView] = useState(0);
  const [summaryData, setSummaryData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [summaryRes, statsRes] = await Promise.all([
        fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/${league}/scoreboard/${gameId}`),
        fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/${league}/summary?event=${gameId}`)
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [league, gameId]);

  useEffect(() => {
    const viewInterval = setInterval(() => {
      setCurrentView(prev => (prev + 1) % 5); // 5 views total
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
          const goalie = team.probables?.[0];
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
                {team.team.displayName}
              </p>
              <div className="relative flex items-center justify-center">
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
              <p className="text-gray-400 text-3xl mt-2">
                {team.records?.[0]?.summary || ''}
              </p>
              {goalie && (
                <div className="mt-4 text-center">
                  <p className="text-yellow-400 text-xl font-semibold">Starting Goalie</p>
                  <p className="text-white text-2xl">{goalie.athlete?.displayName}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PERIOD BY PERIOD SCORE */}
      <div className="bg-gray-700 rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-yellow-400 font-bold mb-4 text-3xl">Score by Period</h3>
        <div className="grid grid-cols-5 gap-4 text-center">
          <div className="text-2xl font-bold text-gray-400">Team</div>
          {[1, 2, 3].map(period => (
            <div key={period} className="text-2xl font-bold text-yellow-400">{period}</div>
          ))}
          <div className="text-2xl font-bold text-yellow-400">Total</div>
          
          <div className="text-2xl font-bold" style={{ color: getContrastColor(awayTeam?.team.color) }}>
            {awayTeam?.team.abbreviation}
          </div>
          {awayTeam?.linescores?.map((ls, i) => (
            <div key={i} className="text-3xl font-bold text-white">{ls.displayValue}</div>
          ))}
          <div className="text-3xl font-bold text-white">{awayTeam?.score}</div>
          
          <div className="text-2xl font-bold" style={{ color: getContrastColor(homeTeam?.team.color) }}>
            {homeTeam?.team.abbreviation}
          </div>
          {homeTeam?.linescores?.map((ls, i) => (
            <div key={i} className="text-3xl font-bold text-white">{ls.displayValue}</div>
          ))}
          <div className="text-3xl font-bold text-white">{homeTeam?.score}</div>
        </div>
      </div>

      {/* GAME INFO & LAST PLAY */}
      <div className="bg-gray-700 rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-yellow-400 font-bold mb-2 text-3xl">Game Status</h3>
            <p className="text-3xl">
              <span className="font-bold text-white">Time:</span> {status?.displayClock || "-"}
            </p>
            <p className="mt-1 text-3xl">
              <span className="font-bold text-white">Period:</span> {status?.period || "-"} {status?.type?.shortDetail || ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl"><span className="font-bold text-white">Venue:</span> {competition?.venue?.fullName || "-"}</p>
            <p className="text-2xl"><span className="font-bold text-white">Broadcast:</span> {competition?.broadcasts?.map(b => b.media?.shortName).filter(Boolean).join(', ') || "-"}</p>
          </div>
        </div>
        
        {competition?.situation?.lastPlay?.text && (
          <div className="mt-4 bg-gray-800 rounded-xl p-4">
            <p className="text-yellow-400 font-bold text-2xl mb-2">Last Play</p>
            <p className="text-white text-2xl">{competition.situation.lastPlay.text}</p>
          </div>
        )}
      </div>

      {/* ROTATING VIEWS */}
      <div className="flex-1">
        {currentView === 0 && (
          <TopScorersView statsData={statsData} team={awayTeam} />
        )}
        {currentView === 1 && (
          <TopScorersView statsData={statsData} team={homeTeam} />
        )}
        {currentView === 2 && (
          <TeamStatsView statsData={statsData} awayTeam={awayTeam} homeTeam={homeTeam} />
        )}
        {currentView === 3 && (
          <GoalieStatsView statsData={statsData} awayTeam={awayTeam} homeTeam={homeTeam} />
        )}
        {currentView === 4 && (
          <PowerPlayPenaltyView statsData={statsData} awayTeam={awayTeam} homeTeam={homeTeam} />
        )}
      </div>
    </div>
  );
};

// ========================= TOP SCORERS VIEW ========================= //
const TopScorersView = ({ statsData, team }) => {
  const teamData = statsData?.boxscore?.players?.find(p => p.team?.id === team?.id);
  
  if (!teamData) {
    return (
      <div className="text-center text-3xl text-gray-400 pt-4">
        No player data available for {team?.team?.abbreviation}
      </div>
    );
  }

  const forwards = teamData.statistics?.find(s => s.name === 'forwards');
  const defenses = teamData.statistics?.find(s => s.name === 'defenses');
  
  const allPlayers = [
    ...(forwards?.athletes || []),
    ...(defenses?.athletes || [])
  ];

  // Sort by goals (index 9), then assists (index 11)
  const topScorers = allPlayers
    .filter(p => p.stats && (parseInt(p.stats[9]) > 0 || parseInt(p.stats[11]) > 0))
    .sort((a, b) => {
      const aGoals = parseInt(a.stats[9]) || 0;
      const bGoals = parseInt(b.stats[9]) || 0;
      if (bGoals !== aGoals) return bGoals - aGoals;
      const aAssists = parseInt(a.stats[11]) || 0;
      const bAssists = parseInt(b.stats[11]) || 0;
      return bAssists - aAssists;
    })
    .slice(0, 3);

  return (
    <div className="pt-4">
      <h2 className="text-4xl font-bold text-yellow-400 mb-6 text-center">
        {team?.team?.displayName} - Top Performers
      </h2>
      
      <div className="flex flex-col gap-6">
        {topScorers.length === 0 ? (
          <div className="text-center text-3xl text-gray-400">No goals scored yet</div>
        ) : (
          topScorers.map((player, idx) => {
            const goals = player.stats[9];
            const assists = player.stats[11];
            const shots = player.stats[12];
            const plusMinus = player.stats[3];
            const toi = player.stats[4];
            
            return (
              <div
                key={idx}
                className="bg-gray-800 rounded-3xl p-8 flex items-center shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300"
              >
                <div className="relative flex-shrink-0 mr-8">
                  <img
                    src={player.athlete.headshot?.href || team.team.logo}
                    alt={player.athlete.displayName}
                    className="w-40 h-40 object-cover rounded-full border-4 border-yellow-400 shadow-lg"
                    onError={(e) => { e.target.src = team.team.logo; }}
                  />
                  <div className="absolute bottom-0 right-0 w-14 h-14 rounded-full bg-gray-900 border-4 border-gray-700 flex items-center justify-center">
                    <img src={team.team.logo} alt="" className="w-10 h-10 object-contain" />
                  </div>
                </div>

                <div className="flex-1">
                  <p className="font-bold text-white text-4xl mb-2">{player.athlete.displayName}</p>
                  <p className="text-gray-400 text-2xl mb-2">
                    #{player.athlete.jersey} • {player.athlete.position?.abbreviation}
                  </p>
                  
                  <div className="grid grid-cols-5 gap-6 mt-4">
                    <div className="text-center">
                      <p className="text-yellow-400 text-xl font-semibold">Goals</p>
                      <p className="text-white text-4xl font-bold">{goals}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-400 text-xl font-semibold">Assists</p>
                      <p className="text-white text-4xl font-bold">{assists}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-400 text-xl font-semibold">Shots</p>
                      <p className="text-white text-4xl font-bold">{shots}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-400 text-xl font-semibold">+/-</p>
                      <p className="text-white text-4xl font-bold">{plusMinus}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-400 text-xl font-semibold">TOI</p>
                      <p className="text-white text-4xl font-bold">{toi}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ========================= TEAM STATS VIEW ========================= //
const TeamStatsView = ({ statsData, awayTeam, homeTeam }) => {
  const awayStats = statsData?.boxscore?.teams?.[0];
  const homeStats = statsData?.boxscore?.teams?.[1];

  if (!awayStats || !homeStats) {
    return <div className="text-center text-2xl text-gray-400">No stats available</div>;
  }

  const statCategories = [
    { key: 'shotsTotal', label: 'Shots on Goal' },
    { key: 'hits', label: 'Hits' },
    { key: 'blockedShots', label: 'Blocked Shots' },
    { key: 'takeaways', label: 'Takeaways' },
    { key: 'giveaways', label: 'Giveaways' },
    { key: 'faceoffPercent', label: 'Faceoff Win %' },
  ];

  const getStatValue = (stats, key) => {
    const stat = stats.statistics?.find(s => s.name === key);
    return stat?.displayValue || '0';
  };

  return (
    <div className="pt-4">
      <h2 className="text-4xl font-bold text-yellow-400 mb-6 text-center">Team Statistics</h2>
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

// ========================= GOALIE STATS VIEW ========================= //
const GoalieStatsView = ({ statsData, awayTeam, homeTeam }) => {
  const awayTeamData = statsData?.boxscore?.players?.find(p => p.team?.id === awayTeam?.id);
  const homeTeamData = statsData?.boxscore?.players?.find(p => p.team?.id === homeTeam?.id);

  const awayGoalie = awayTeamData?.statistics?.find(s => s.name === 'goalies')?.athletes?.[0];
  const homeGoalie = homeTeamData?.statistics?.find(s => s.name === 'goalies')?.athletes?.[0];

  if (!awayGoalie || !homeGoalie) {
    return <div className="text-center text-2xl text-gray-400">No goalie data available</div>;
  }

  const GoalieCard = ({ goalie, team }) => {
    const goalsAgainst = goalie.stats[0];
    const shotsAgainst = goalie.stats[1];
    const saves = goalie.stats[4];
    const savePct = goalie.stats[5];
    const toi = goalie.stats[9];

    return (
      <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center mb-6">
          <img
            src={goalie.athlete.headshot?.href || team.team.logo}
            alt={goalie.athlete.displayName}
            className="w-32 h-32 object-cover rounded-full border-4 border-yellow-400 mr-6"
            onError={(e) => { e.target.src = team.team.logo; }}
          />
          <div>
            <p className="text-3xl font-bold text-white">{goalie.athlete.displayName}</p>
            <p className="text-2xl text-gray-400">#{goalie.athlete.jersey} • {team.team.displayName}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-yellow-400 text-xl font-semibold">Saves</p>
            <p className="text-white text-4xl font-bold">{saves}</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 text-xl font-semibold">SA</p>
            <p className="text-white text-4xl font-bold">{shotsAgainst}</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 text-xl font-semibold">GA</p>
            <p className="text-white text-4xl font-bold">{goalsAgainst}</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 text-xl font-semibold">SV%</p>
            <p className="text-white text-4xl font-bold">{savePct}</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 text-xl font-semibold">TOI</p>
            <p className="text-white text-4xl font-bold">{toi}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-4">
      <h2 className="text-4xl font-bold text-yellow-400 mb-6 text-center">Goaltender Performance</h2>
      <div className="grid grid-cols-2 gap-6">
        <GoalieCard goalie={awayGoalie} team={awayTeam} />
        <GoalieCard goalie={homeGoalie} team={homeTeam} />
      </div>
    </div>
  );
};

// ========================= POWER PLAY & PENALTY VIEW ========================= //
const PowerPlayPenaltyView = ({ statsData, awayTeam, homeTeam }) => {
  const awayStats = statsData?.boxscore?.teams?.[0];
  const homeStats = statsData?.boxscore?.teams?.[1];

  if (!awayStats || !homeStats) {
    return <div className="text-center text-2xl text-gray-400">No penalty data available</div>;
  }

  const getStatValue = (stats, key) => {
    const stat = stats.statistics?.find(s => s.name === key);
    return stat?.displayValue || '0';
  };

  const TeamPPCard = ({ team, stats }) => {
    const ppg = getStatValue(stats, 'powerPlayGoals');
    const ppo = getStatValue(stats, 'powerPlayOpportunities');
    const ppp = getStatValue(stats, 'powerPlayPct');
    const penalties = getStatValue(stats, 'penalties');
    const pim = getStatValue(stats, 'penaltyMinutes');

    return (
      <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <img src={team?.team?.logo} alt="" className="w-24 h-24 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{team?.team?.displayName}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700 rounded-xl p-4">
            <p className="text-yellow-400 text-2xl font-semibold mb-2">Power Play</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-lg">Goals</p>
                <p className="text-white text-3xl font-bold">{ppg}</p>
              </div>
              <div>
                <p className="text-gray-400 text-lg">Opportunities</p>
                <p className="text-white text-3xl font-bold">{ppo}</p>
              </div>
              <div>
                <p className="text-gray-400 text-lg">Percentage</p>
                <p className="text-white text-3xl font-bold">{ppp}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-xl p-4">
            <p className="text-yellow-400 text-2xl font-semibold mb-2">Penalties</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-lg">Total</p>
                <p className="text-white text-3xl font-bold">{penalties}</p>
              </div>
              <div>
                <p className="text-gray-400 text-lg">Minutes</p>
                <p className="text-white text-3xl font-bold">{pim}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-4">
      <h2 className="text-4xl font-bold text-yellow-400 mb-6 text-center">Special Teams & Discipline</h2>
      <div className="grid grid-cols-2 gap-6">
        <TeamPPCard team={awayTeam} stats={awayStats} />
        <TeamPPCard team={homeTeam} stats={homeStats} />
      </div>
    </div>
  );
};

export default GameDetailsNHL;