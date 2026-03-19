import React, { useState, useEffect } from 'react';
import { fetchWithConfig, endpoints } from '../utils/api';

const DEFAULT_CATEGORIES = [];

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

function DailySetup({ onAnchorSet }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const stats = await fetchWithConfig(endpoints.categoryStats);
        
        // Load custom categories from localStorage
        const customCats = JSON.parse(localStorage.getItem('custom_categories') || '[]');
        
        let merged = [...DEFAULT_CATEGORIES];
        
        // Add categories from backend if they have data
        if (stats && stats.length > 0) {
          stats.forEach(s => {
            if (!merged.find(m => m.id === s.id)) {
              merged.push(s);
            } else {
              // Update lastDone if we have it from stats
              const idx = merged.findIndex(m => m.id === s.id);
              merged[idx] = { ...merged[idx], lastDone: s.lastDone };
            }
          });
        }
        
        // Add custom ones that aren't already there
        customCats.forEach(c => {
          if (!merged.find(m => m.id === c)) {
            merged.push({ id: c, name: c, lastDone: 'Never' });
          }
        });

        setCategories(merged);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCats();
  }, []);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const catName = newCategory.trim();
    if (!categories.find(c => c.id.toLowerCase() === catName.toLowerCase())) {
        const newCat = { id: catName, name: catName, lastDone: 'Never' };
        const updated = [...categories, newCat];
        setCategories(updated);
        
        // Save to localStorage
        const custom = JSON.parse(localStorage.getItem('custom_categories') || '[]');
        localStorage.setItem('custom_categories', JSON.stringify([...custom, catName]));
    }
    setNewCategory('');
    setIsAddingCategory(false);
  };

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
        <h1 className="hero-heading">What Is the One Thing That Matters Today?</h1>
        <p className="instruction text-secondary">
          Pick one area, then name one concrete task you'll complete today.
        </p>
      </header>

      <section>
        <span className="label">Areas You're Tracking</span>
        <div className="category-grid">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`category-card ${selectedCategory === cat.id ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div>
                <h3 className="card-title">{capitalize(cat.name)}</h3>
                <p className="card-meta">Last done: {cat.lastDone}</p>
              </div>
              {selectedCategory === cat.id && (
                <div style={{ alignSelf: 'flex-end', fontSize: '1.2rem' }}>✓</div>
              )}
            </div>
          ))}
          
          {isAddingCategory ? (
            <div className="category-card" style={{ borderStyle: 'dashed', borderColor: 'var(--ink)' }}>
              <input 
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Area name..."
                className="anchor-input"
                style={{ fontSize: '1rem', padding: '0.2rem 0', marginBottom: '0.5rem' }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button 
                className="btn-primary" 
                style={{ padding: '0.4rem', fontSize: '0.7rem' }}
                onClick={handleAddCategory}
              >
                Add Area
              </button>
            </div>
          ) : (
            <div 
              className="category-card" 
              style={{ borderStyle: 'dashed', borderColor: 'var(--ink)', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.6, cursor: 'pointer' }}
              onClick={() => setIsAddingCategory(true)}
            >
              <h3 className="card-title">+ New Area</h3>
            </div>
          )}
        </div>
      </section>

      {selectedCategory && (
        <section className="anchor-input-group fade-enter fade-enter-active">
          <span className="label">
            You Chose: <span style={{ color: 'var(--terracotta)' }}>{capitalize(selectedCategory)}</span>. Now name today's task.
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
            {loading ? 'Securing Your One Thing...' : "Save Today's One Thing"}
          </button>
        </section>
      )}
    </div>
  );
}

export default DailySetup;
