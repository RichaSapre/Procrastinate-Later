const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchWithConfig(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error('API Request failed');
  }
  return response.json();
}

export const endpoints = {
  tasks: '/tasks',
  todayTasks: '/tasks/today',
  startTask: '/tasks/start',
  completeTask: '/tasks/complete',
  procrastinationLog: '/procrastination-log',
  weeklyReport: '/report/weekly',
  setAnchor: '/anchor',
  getAnchor: '/anchor/today',
  categoryStats: '/stats/categories',
  streaks: '/streaks',
  clearData: '/clear-data',
};
