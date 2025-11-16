import { BrowserRouter, Routes, Route } from "react-router-dom";
import DisplayPage from "./pages/DisplayPage";
import ControlPage from "./pages/ControlPage";
import TickerDisplay from "./pages/TickerDisplay";
import TickerDisplayN from "./pages/TickerDisplayN";
import LeagueTicker from './pages/LeagueTicker';
import ParameterizedTicker from "./pages/ParameterizedTicker";
import GameDetailsPage from "./pages/GameDetailsPage";
import GameDetailsPage2 from "./pages/GameDetailsPage2";
import GameDetailsPageEPL from "./pages/GameDetailsPageEPL";
import GameDetailsSwitch from "./pages/GameDetailsSwitch";
import GameDetailsSwitchNBA from "./pages/GameDetailsSwitchNBA";
import GameDetailsSwitchNHL from "./pages/GameDetailsSwitchNHL";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/ticker" element={<TickerDisplay />} />
        <Route path="/tracker" element={<TickerDisplayN />} />
        {/* 1. Route for NFL showing 3 games */}
                <Route 
                    path="/LeagueTracker/nfl/3" 
                    element={<LeagueTicker league="nfl" gameCount={3} leagueDisplayName="NFL" />} 
                />
                <Route 
                    path="/LeagueTracker/epl/3" 
                    element={<LeagueTicker league="epl" gameCount={3} leagueDisplayName="Premier League" />} 
                />          
        {/* ⭐️ SINGLE FLEXIBLE ROUTE DEFINITION ⭐️ */}
                {/* This handles paths like /LeagueTracker/nfl/3 and /LeagueTracker/epl/1 */}
                <Route 
                    path="/LeagueTracker/:league/:count" 
                    element={<ParameterizedTicker />} 
                />  
                <Route 
                    path="/GameDetailsPage/:league/:team/" 
                    element={<GameDetailsPage />} 
                />                                      
                <Route path="/GameDetailsPage2/:league/:team/"  element={<GameDetailsPage2 />} />    
                <Route path="/GameDetailsPageEPL/:league/:team/"  element={<GameDetailsPageEPL />} />
                {/*<Route path="/GameDetailsPageNBA/:league/:team/"  element={<GameDetailsPageNBA />} />
                <Route path="/GameDetailsPageNHL/:league/:team/"  element={<GameDetailsPageNHL />} />
                <Route path="/GameDetailsPageMLB/:league/:team/"  element={<GameDetailsPageMLB />} />   
                */}   
              <Route path="/GameDetailsSwitch/:league/:team/"  element={<GameDetailsSwitch />} />   
              <Route path="/GameDetailsSwitchNBA/:league/:team/"  element={<GameDetailsSwitchNBA />} />  
              <Route path="/GameDetailsSwitchNHL/:league/:team/"  element={<GameDetailsSwitchNHL />} />        
      </Routes>
    </BrowserRouter>
    
  );
}
