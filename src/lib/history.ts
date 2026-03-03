import { HistoryEntry } from './types';

const HISTORY_KEY = 'loan_planner_history';

export function getHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveHistory(entry: HistoryEntry) {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > 50) {
    history.pop();
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function deleteHistoryItem(id: string) {
  const history = getHistory();
  const newHistory = history.filter(item => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
}
