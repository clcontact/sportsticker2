import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io();

export default function Display() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    socket.on("settingsUpdated", (data) => setSettings(data));
    return () => socket.off("settingsUpdated");
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Sports Display</h2>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  );
}
