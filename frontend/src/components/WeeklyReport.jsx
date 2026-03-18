import React, { useState, useEffect } from 'react';
import { fetchWithConfig, endpoints } from '../utils/api';

const WeeklyReport = ({ onBack }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await fetchWithConfig(endpoints.weeklyReport);
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <div className="mono">Analyzing your progress...</div>;

  return (
    <div className="fade-enter fade-enter-active">
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Weekly Status Report</h1>
      <p className="mono" style={{ marginBottom: '3rem', opacity: 0.6 }}>{report?.week_title}</p>
      
      <div style={{ border: '2px solid var(--ink)', padding: '2rem', marginBottom: '4rem', fontStyle: 'italic', fontSize: '1.5rem', lineHeight: '1.4' }}>
        <p>
          "{report?.summary || "No data available for this week yet. Start working to see your honest review."}"
        </p>
      </div>

      <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.2rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--ink)' }}>
            <th style={{ padding: '1rem' }}>Metric</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {report?.metrics?.map((row) => (
            <tr key={row.label} style={{ borderBottom: '1px solid var(--ink-light)' }}>
              <td style={{ padding: '1rem' }}>{row.label}</td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '4rem', display: 'flex', gap: '2rem' }}>
        <button onClick={() => alert('Exporting result as text...')}>Export as text</button>
        <button 
          onClick={onBack}
          style={{ backgroundColor: 'transparent', color: 'var(--ink)' , border: '1px solid var(--ink)' }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default WeeklyReport;
