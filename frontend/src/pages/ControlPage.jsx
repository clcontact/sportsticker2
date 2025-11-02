import React, { useEffect, useState } from "react";

export default function ControlPage() {
  const [settings, setSettings] = useState({
    mode: "ticker",
    team: "BUF",
    refreshInterval: 60,
  });

  // Fetch current settings on load
  useEffect(() => {
    fetch("http://localhost:3000/api/control")
      .then((res) => res.json())
      .then((data) => setSettings(data));
  }, []);

  const updateSettings = async () => {
    await fetch("http://localhost:3000/api/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
  };

  return (
    <div
      style={{
        backgroundColor: "#f4f4f4",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>🎛️ Sports Ticker Control Panel</h2>

      <label>Mode:</label>
      <select
        value={settings.mode}
        onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
      >
        <option value="ticker">Ticker</option>
        <option value="focus">Focus</option>
      </select>

      <br />
      <br />

      <label>Team:</label>
      <input
        type="text"
        value={settings.team}
        onChange={(e) => setSettings({ ...settings, team: e.target.value })}
      />

      <br />
      <br />

      <label>Refresh Interval (seconds):</label>
      <input
        type="number"
        value={settings.refreshInterval}
        onChange={(e) =>
          setSettings({
            ...settings,
            refreshInterval: parseInt(e.target.value),
          })
        }
      />

      <br />
      <br />
      <button onClick={updateSettings}>Save Changes</button>
    </div>
  );
}
