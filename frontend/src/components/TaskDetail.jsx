import React, { useState, useEffect } from 'react';
import { fetchWithConfig, endpoints } from '../utils/api';

const TaskDetail = ({ task, onComplete, onBack, onProcrastinate }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleStart = async () => {
    if (!isActive) {
      setIsActive(true);
      setStartTime(new Date());
      try {
        await fetchWithConfig(endpoints.startTask, { 
          method: 'POST', 
          body: JSON.stringify({ task_id: task.id }) 
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsActive(false);
    }
  };

  const handleComplete = async () => {
    onComplete(task.id);
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hrs, mins, secs].map(v => v < 10 ? '0' + v : v).join(':');
  };

  return (
    <div className="fade-enter fade-enter-active">
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p className="mono" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{task.category}</p>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>{task.title}</h1>
        
        <div 
          className="mono" 
          style={{ 
            fontSize: '5rem', 
            margin: '3rem 0', 
            color: isActive ? 'var(--terracotta)' : 'var(--ink)' 
          }}
        >
          {formatTime(seconds)}
        </div>

        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          {!isActive && seconds === 0 ? (
            <button 
              onClick={toggleStart}
              style={{ padding: '1.5rem 3rem', fontSize: '1.2rem' }}
            >
              Start Session
            </button>
          ) : (
            <>
              {isActive && (
                <button 
                  onClick={toggleStart}
                  style={{ backgroundColor: 'var(--cream-dark)', color: 'var(--ink)' }}
                >
                  Pause
                </button>
              )}
              {!isActive && seconds > 0 && (
                <button onClick={toggleStart}>Resume</button>
              )}
              <button 
                onClick={handleComplete}
                style={{ backgroundColor: 'var(--sage)' }}
              >
                Complete Task
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: '4rem' }}>
          <button 
            onClick={onBack}
            className="mono"
            style={{ backgroundColor: 'transparent', color: 'var(--ink-light)', border: '1px solid var(--ink)', padding: '0.5rem 1rem' }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
