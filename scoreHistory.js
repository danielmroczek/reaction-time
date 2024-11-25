var RT = RT || {};

RT.ScoreHistoryController = function (options) {
  var options = $.extend({
    storageKey: 'scoreHistory'
  }, options);

  // Public methods
  this.saveScore =  saveScore;
  this.getHistory = getHistory;
  this.clearHistory = clearHistory;

  function saveScore(score) {
    var history = getHistory() || [];
    history.push(score);
    setHistory(history);
  };

  function getHistory() {
    return getObj(options.storageKey);
  }

  function setHistory(history) {
    setObj(options.storageKey, history);
  }

  function setObj(key, obj) {
    return localStorage.setItem(key, JSON.stringify(obj));
  }

  function getObj(key) {
    var item = localStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item);
      } catch (e) {
        console.error('Error parsing history from localStorage:', e);
        return null;
      }
    }
    return null;
  }

  function clearHistory() {
    localStorage.removeItem(options.storageKey);
    console.log('History cleared.');
  }
}
