import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export default function DisplayPage() {
  const [settings, setSettings] = useState({ mode: "ticker", team: "", refreshInterval: 60 });

  useEffect(() => {
    socket.on("settingsUpdated", (data) => {
      console.log("Received update:", data);
      setSettings(data);
    });

    return () => socket.off("settingsUpdated");
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#111",
        color: "white",
        fontFamily: "Arial, sans-serif",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1>🏈 Sports Ticker Display</h1>
      <h2>Mode: {settings.mode}</h2>
      <h3>Team: {settings.team}</h3>
      <p>Refresh every {settings.refreshInterval}s</p>
    </div>
  );
}
