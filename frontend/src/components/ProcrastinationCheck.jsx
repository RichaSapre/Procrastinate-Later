import React, { useState } from 'react';
import { fetchWithConfig, endpoints } from '../utils/api';

const reasons = [
  { id: 'too_long', label: 'It Feels Like It Will Take Forever' },
  { id: 'dont_know_where', label: 'I Do Not Know Where to Begin' },
  { id: 'distracted', label: 'I Got Distracted' },
  { id: 'doing_easier', label: 'I Am Doing Something Easier' }
];

const ProcrastinationCheck = ({ task_id, onClose, onStart }) => {
  const [loading, setLoading] = useState(false);
  const [microAction, setMicroAction] = useState(null);

  const handleReasonClick = async (reason) => {
    setLoading(true);
    try {
      const res = await fetchWithConfig(endpoints.procrastinationLog, {
        method: 'POST',
        body: JSON.stringify({ task_id, reason })
      });
      setMicroAction(res.micro_action);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`modal-bottom active`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        textAlign: 'center',
        padding: '4rem 2rem'
      }}
    >
      <h2 style={{ fontSize: '3rem', marginBottom: '3rem', color: 'var(--cream)' }}>
        Why Have You Not Started Yet?
      </h2>

      {!microAction && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', width: '100%', maxWidth: '800px' }}>
          {reasons.map((r) => (
            <button 
              key={r.id} 
              onClick={() => handleReasonClick(r.id)}
              style={{ 
                border: '1px solid var(--cream)', 
                backgroundColor: 'transparent', 
                color: 'var(--cream)', 
                padding: '1.5rem',
                fontSize: '1.2rem'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mono" style={{ fontSize: '1.5rem', color: 'var(--amber)' }}>
          Procrastinate Later is thinking...
        </div>
      )}

      {microAction && (
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <div style={{ border: '2px solid var(--terracotta)', padding: '2rem', marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '1.4rem', color: 'var(--cream)' }}>{microAction}</p>
          </div>
          <button 
            onClick={onStart}
            style={{ 
              backgroundColor: 'var(--terracotta)', 
              color: 'var(--paper)', 
              padding: '1rem 2.5rem', 
              fontSize: '1.2rem' 
            }}
          >
            Got It. Starting Now.
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcrastinationCheck;
