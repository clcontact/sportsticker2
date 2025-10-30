import React, { useEffect, useState } from "react";

export default function Control() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch("/api/control")
      .then((res) => res.json())
      .then(setSettings);
  }, []);

  function updateSetting(key, value) {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    fetch("/api/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Control Panel</h2>
      <label>
        Current Mode:
        <select
          value={settings.mode || ""}
          onChange={(e) => updateSetting("mode", e.target.value)}
        >
          <option value="ticker">Ticker</option>
          <option value="stats">Stats</option>
        </select>
      </label>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  );
}
