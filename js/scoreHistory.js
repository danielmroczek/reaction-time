export class ScoreHistoryController {
  constructor(options = {}) {
    this.options = {
      storageKey: 'scoreHistory',
      ...options
    };
  }

  saveScore(score) {
    const history = this.getHistory() || [];
    history.push(score);
    this.setHistory(history);
  }

  getHistory() {
    return this.getObj(this.options.storageKey);
  }

  setHistory(history) {
    this.setObj(this.options.storageKey, history);
  }

  setObj(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
  }

  getObj(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error parsing history from localStorage:', e);
      return null;
    }
  }

  clearHistory() {
    localStorage.removeItem(this.options.storageKey);
    console.log('History cleared.');
  }
}
