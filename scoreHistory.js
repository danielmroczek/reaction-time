var RT = RT || {};

RT.ScoreHistoryController = function (options) {
  var options = $.extend({
    storageKey: 'scoreHistory'
  }, options);

  // Public methods
  this.saveScore =  saveScore;
  this.getHistory = getHistory;

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
    return localStorage.setItem(key, JSON.stringify(obj))
  }

  function getObj(key) {
    return JSON.parse(localStorage.getItem(key))
  }
}
