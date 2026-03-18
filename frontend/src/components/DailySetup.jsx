import React, { useState, useEffect } from 'react';
import { fetchWithConfig, endpoints } from '../utils/api';

const DEFAULT_CATEGORIES = [
  { id: 'DSA', name: 'dsa', lastDone: 'Never' },
  { id: 'Applications', name: 'applications', lastDone: 'Never' },
  { id: 'Fitness', name: 'fitness', lastDone: 'Never' },
  { id: 'LinkedIn', name: 'linkedin', lastDone: 'Never' },
  { id: 'College', name: 'college', lastDone: 'Never' },
  { id: 'Other', name: 'other', lastDone: 'Never' }
];

function DailySetup({ onAnchorSet }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const stats = await fetchWithConfig(endpoints.categoryStats);
        if (stats && stats.length > 0) {
          setCategories(stats);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
        // Error on background fetch shouldn't break the component since we have defaults
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !selectedCategory) return;
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const task = await fetchWithConfig(endpoints.tasks, {
        method: 'POST',
        body: JSON.stringify({
          title,
          category: selectedCategory,
          estimated_minutes: 60,
          scheduled_time: hhmm
        })
      });

      if (!task || !task.id) {
        throw new Error('Task creation failed.');
      }

      await fetchWithConfig(endpoints.setAnchor, {
        method: 'POST',
        body: JSON.stringify({ task_id: task.id })
      });
      
      onAnchorSet(task);
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page fade-enter fade-enter-active">
      <header style={{ marginBottom: '3rem' }}>
        <h1 className="hero-heading">What is the one thing that matters today?</h1>
        <p className="instruction text-secondary">
          Pick one area, then name one concrete task you’ll complete today.
        </p>
      </header>

      <section>
        <span className="label">Areas you're tracking</span>
        <div className="category-grid">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`category-card ${selectedCategory === cat.id ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div>
                <h3 className="card-title">{cat.name}</h3>
                <p className="card-meta">Last done: {cat.lastDone}</p>
              </div>
              {selectedCategory === cat.id && (
                <div style={{ alignSelf: 'flex-end', fontSize: '1.2rem' }}>✓</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {selectedCategory && (
        <section className="anchor-input-group fade-enter fade-enter-active">
          <span className="label">
            You chose: <span style={{ color: 'var(--terracotta)' }}>{selectedCategory.toLowerCase()}</span>. Now name today's task.
          </span>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. solve 3 medium problems"
            className="anchor-input"
            autoFocus
          />
          
          <p className="text-secondary mono" style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.8rem' }}>
            Focus on action, not outcome.
          </p>

          {error && <p style={{ color: 'var(--terracotta)', marginTop: '1rem' }}>{error}</p>}

          <button 
            className="btn-primary"
            onClick={handleSubmit} 
            disabled={loading || !title.trim()}
          >
            {loading ? 'Securing your one thing...' : 'Save today’s one thing'}
          </button>
        </section>
      )}
    </div>
  );
}

export default DailySetup;
