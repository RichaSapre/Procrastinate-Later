import React, { useState, useEffect } from 'react';
import { fetchWithConfig, endpoints } from '../utils/api';

const StreakDashboard = ({ onBack }) => {
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        const data = await fetchWithConfig(endpoints.streaks);
        setStreaks(data);
      } catch (err) {
        console.error("Failed to load streaks", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStreaks();
  }, []);

  if (loading) return <div className="mono">Loading your history...</div>;

  return (
    <div className="fade-enter fade-enter-active">
      <h1 style={{ fontSize: '3rem', marginBottom: '3rem' }}>The Honest Streaks</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '4rem' }}>
        {streaks.map((cat) => (
          <div key={cat.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.8rem' }}>{cat.name}</h2>
              <div className="mono" style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                Last completed: {cat.lastCompleted} · Missed this month: {cat.avoided}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '0.5rem', maxWidth: '600px' }}>
              {cat.days.map((day) => (
                <div 
                  key={day.id} 
                  title={day.date}
                  style={{ 
                    aspectRatio: '1/1', 
                    border: '1px solid var(--ink)', 
                    position: 'relative',
                    backgroundColor: day.status === 'completed' ? 'var(--sage)' : (day.status === 'missed' ? 'var(--terracotta)' : 'transparent'),
                    opacity: day.status === 'none' ? 0.2 : 1
                  }}
                >
                  {day.hasLog && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        bottom: '4px', 
                        right: '4px', 
                        width: '4px', 
                        height: '4px', 
                        backgroundColor: 'var(--ink)' 
                      }} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <button onClick={onBack}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default StreakDashboard;
