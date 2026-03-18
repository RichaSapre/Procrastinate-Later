import React, { useState, useEffect } from 'react';
import './styles/globals.css';
import DailySetup from './components/DailySetup';
import Dashboard from './components/Dashboard';
import StreakDashboard from './components/StreakDashboard';
import WeeklyReport from './components/WeeklyReport';
import { fetchWithConfig, endpoints } from './utils/api';

function App() {
  const [activeScreen, setActiveScreen] = useState('daily-setup');
  const [anchor, setAnchor] = useState(null);
  const [nightOwl, setNightOwl] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("App initializing: fetching anchor today...");
        const anchorData = await fetchWithConfig(endpoints.getAnchor);
        console.log("Anchor response:", anchorData);
        if (anchorData && anchorData.id) {
          setAnchor(anchorData);
          setActiveScreen('dashboard');
        } else {
          setActiveScreen('daily-setup');
        }
      } catch (err) {
        console.log("App init failed, showing setup screen as fallback.", err);
        setActiveScreen('daily-setup');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    document.body.className = nightOwl ? 'night-owl' : '';
  }, [nightOwl]);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p className="mono animate-pulse">Initializing your notebook...</p>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'daily-setup':
        return <DailySetup onAnchorSet={(a) => { setAnchor(a); setActiveScreen('dashboard'); }} />;
      case 'dashboard':
        return <Dashboard 
                  anchor={anchor} 
                  nightOwl={nightOwl} 
                  setNightOwl={setNightOwl} 
                  onGoToReport={() => setActiveScreen('report')} 
                  onGoToStreaks={() => setActiveScreen('streaks')}
                />;
      case 'streaks':
        return <StreakDashboard onBack={() => setActiveScreen('dashboard')} />;
      case 'report':
        return <WeeklyReport onBack={() => setActiveScreen('dashboard')} />;
      default:
        return <DailySetup onAnchorSet={(a) => { setAnchor(a); setActiveScreen('dashboard'); }} />;
    }
  };

  return (
    <div className="container">
      <header style={{ 
        marginBottom: '4rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '1rem'
      }}>
        <h2 
          className="hero-heading"
          style={{ 
            fontSize: '1.2rem', 
            textTransform: 'lowercase', 
            cursor: 'pointer',
            opacity: 0.8,
            marginBottom: 0
          }} 
          onClick={() => anchor ? setActiveScreen('dashboard') : setActiveScreen('daily-setup')}
        >
          Procrastinate Later
        </h2>
        <nav className="nav-links">
          <span 
            className={`nav-link ${activeScreen === 'dashboard' ? 'active' : ''}`} 
            onClick={() => anchor && setActiveScreen('dashboard')}
            style={{ cursor: anchor ? 'pointer' : 'not-allowed' }}
          >
            Dashboard
          </span>
          <span 
            className={`nav-link ${activeScreen === 'daily-setup' ? 'active' : ''}`} 
            onClick={() => setActiveScreen('daily-setup')}
          >
            Daily Setup
          </span>
          <span className={`nav-link ${activeScreen === 'streaks' ? 'active' : ''}`} onClick={() => setActiveScreen('streaks')}>Streaks</span>
          <span className={`nav-link ${activeScreen === 'report' ? 'active' : ''}`} onClick={() => setActiveScreen('report')}>Report</span>
        </nav>
      </header>
      
      <main className="setup-page">
        {renderScreen()}
      </main>

      <footer className="mono" style={{ marginTop: '4rem', fontSize: '0.7rem', opacity: 0.6, borderTop: '1px solid var(--ink)', paddingTop: '1rem' }}>
        <p>Procrastinate Later · Built by Richa Nitin Sapre</p>
      </footer>
    </div>
  );
}

export default App;
