import { BrowserRouter, Routes, Route } from "react-router-dom";
import DisplayPage from "./pages/DisplayPage";
import ControlPage from "./pages/ControlPage";
import TickerDisplay from "./pages/TickerDisplay";
import TickerDisplayN from "./pages/TickerDisplayN";
import TailwindTest from "./TailwindTest";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/ticker" element={<TickerDisplay />} />
        <Route path="/tracker" element={<TickerDisplayN />} />
        <Route path="/tail" element={<TailwindTest />} />
      </Routes>
    </BrowserRouter>
  );
}
