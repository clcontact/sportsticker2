import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Display from "./Display.jsx";
import Control from "./Control.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 10 }}>
        <Link to="/display">Display</Link> |{" "}
        <Link to="/control">Control Panel</Link>
      </nav>
      <Routes>
        <Route path="/display" element={<Display />} />
        <Route path="/control" element={<Control />} />
      </Routes>
    </BrowserRouter>
  );
}
