import React, { useState, useEffect } from 'react';
import { fetchWithConfig, endpoints } from '../utils/api';
import TaskDetail from './TaskDetail';
import ProcrastinationCheck from './ProcrastinationCheck';

const Dashboard = ({ anchor, nightOwl, setNightOwl, onGoToReport, onGoToStreaks }) => {
  const [tasks, setTasks] = useState([]);
  const [catStats, setCatStats] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Dashboard fetching data...");
        const [tasksData, statsData] = await Promise.all([
          fetchWithConfig(endpoints.todayTasks),
          fetchWithConfig(endpoints.categoryStats)
        ]);
        setTasks(tasksData || []);
        setCatStats(statsData || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

  const startTask = (task) => {
    setActiveTask(task);
  };

  const completeTask = async (task_id) => {
    try {
      await fetchWithConfig(endpoints.completeTask, { 
        method: 'POST', 
        body: JSON.stringify({ task_id }) 
      });
      setTasks((prev) => prev.map((t) => t.id === task_id ? { ...t, status: 'completed' } : t));
      setActiveTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (activeTask) {
    return <TaskDetail 
              task={activeTask} 
              onComplete={completeTask} 
              onBack={() => setActiveTask(null)} 
              onProcrastinate={() => setShowCheck(true)}
            />;
  }

  return (
    <div className="fade-enter fade-enter-active">
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 250px', gap: '4rem' }}>
        <div>
          {/* ANCHOR SECTION */}
          <section className="anchor-section" style={{ marginBottom: '5rem', borderBottom: '1px solid var(--ink)', paddingBottom: '3rem' }}>
            <p className="mono label" style={{ marginBottom: '1.5rem' }}>Today's Anchor</p>
            <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', marginBottom: '2.5rem', lineHeight: '1', fontWeight: 900 }}>
              {anchor?.title || "No anchor set"}
            </h1>
            <button 
              className="btn-primary"
              onClick={() => startTask(anchor)}
              style={{ fontSize: '1.2rem', padding: '1.25rem 3rem', width: 'auto' }}
              disabled={!anchor}
            >
              Start Anchor
            </button>
          </section>

          {/* OTHER TASKS LIST */}
          <section style={{ marginBottom: '5rem' }}>
            <h3 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Other Tasks</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {tasks.filter(t => !t.is_anchor).map((task) => (
                <div key={task.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: '0.65rem', border: '1px solid var(--ink)', padding: '0.2rem 0.5rem', textTransform: 'uppercase', flexShrink: 0 }}>{task.category}</span>
                    <span className={`strike-through ${task.status === 'completed' ? 'completed' : ''}`} style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                    <span className="mono" style={{ fontSize: '0.8rem' }}>{task.estimated_minutes}m</span>
                    {task.status !== 'completed' && (
                      <button 
                        className="mono" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', border: '1px solid var(--ink)', backgroundColor: 'transparent', color: 'var(--ink)' }} 
                        onClick={() => startTask(task)}
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tasks.filter(t => !t.is_anchor).length === 0 && (
                <p className="text-secondary mono" style={{ fontStyle: 'italic' }}>No other tasks added yet.</p>
              )}
            </div>
          </section>

          {/* QUICK ADD FORM */}
          <section className="card" style={{ backgroundColor: 'var(--paper)', border: '2px solid var(--ink)' }}>
            <p className="mono label" style={{ marginBottom: '1rem', opacity: 0.7 }}>Add to Your List</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                id="quick-task-input"
                type="text" 
                placeholder="Name your next task..."
                className="anchor-input"
                style={{ fontSize: '1.2rem', padding: '0.5rem 0', flex: 1, borderBottom: '1.5px solid var(--shadow)' }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const title = e.target.value.trim();
                    e.target.value = '';
                    try {
                      const now = new Date();
                      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                      const newTask = await fetchWithConfig(endpoints.tasks, {
                        method: 'POST',
                        body: JSON.stringify({
                          title,
                          category: 'Other',
                          estimated_minutes: 30,
                          scheduled_time: hhmm
                        })
                      });
                      setTasks(prev => [...prev, newTask]);
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
              />
            </div>
            <p className="text-secondary mono" style={{ marginTop: '0.75rem', fontSize: '0.7rem' }}>Press Enter to save to "Other Tasks".</p>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="asymmetric-sidebar">
          <div className="card" style={{ marginBottom: '2rem', border: '1.5px solid var(--ink)' }}>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Avoided Most</h4>
            <div className="mono" style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {catStats.filter(s => s.lastDone !== 'Today' && s.lastDone !== 'Yesterday').slice(0, 3).map(stat => (
                <div key={stat.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{stat.id}</span>
                  <span className="text-secondary">{stat.lastDone}</span>
                </div>
              ))}
              {catStats.filter(s => s.lastDone !== 'Today' && s.lastDone !== 'Yesterday').length === 0 && (
                <p style={{ opacity: 0.5, fontStyle: 'italic' }}>You've tackled everything recently.</p>
              )}
            </div>
          </div>

          <div 
            onClick={() => setNightOwl(!nightOwl)}
            className="card night-owl-btn" 
            style={{ cursor: 'pointer', textAlign: 'center', backgroundColor: nightOwl ? 'var(--amber)' : '#f4efe6', border: '1.5px solid var(--ink)' }}
          >
            <p className="mono" style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
              {nightOwl ? 'Daylight Mode' : 'Night Owl Mode'}
            </p>
          </div>
        </aside>
      </div>

      {showCheck && (
        <ProcrastinationCheck 
          task_id={anchor?.id} 
          onClose={() => setShowCheck(false)} 
          onStart={() => { setShowCheck(false); startTask(anchor); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
