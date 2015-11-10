var RT = RT || {};

RT.MainController = function (options) {
  var options = $.extend({
    rounds: 5
  }, options);

  var startTime = 0;
  var round = 1;
  var currentHandler;
  var timeoutHandler;
  var beginDate;
  var resultsArray = [];
  var historyController;
  var deepLinking = new RT.DeepLinking();
  var colours = [
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFEB3B',
    '#FFC107',
    '#FF9800',
    '#FF5722',
    '#795548',
    '#9E9E9E',
    '#607D8B'
  ];

  this.init = function init() {
    if (options.rounds < 1) {
      options.rounds = 1;
    }
    $('#rounds').text(options.rounds);
    historyController = new RT.ScoreHistoryController();
    var state = deepLinking.getState();
    if (state) {
      showSavedScore(state);
    } else {
     addDocumentHandler(startGame);
    }
  };

  function showSavedScore(score) {
    $('#savedScore').show();
    generateScoreTable(score);
    $('.button.play').one('click', onStartGameClick);
  };

  function onStartGameClick() {
    $('#savedScore').hide();
    addDocumentHandler(startGame);
  }

  function startGame() {
    round = 1;
    resultsArray = [];
    beginDate = Date.now();
    $('#end').hide();
    $('#intro').fadeOut('fast');
    startRound(round);
  };

  function startRound(round) {
    removeDocumentHandler();
    restartRoundAnimation();
    $('#roundNumber').text(round);
    timeoutHandler = setTimeout(showObject, getTimeout());
    addDocumentHandler(falstart);
  };

  function startNextRound() {
    $('#result, #falstart').fadeOut('fast');
    round += 1;
    if (round > options.rounds) {
      results();
    } else {
      startRound(round);
    }
  };

  function results() {
    removeDocumentHandler();
    //$('#resultsTable').text(JSON.stringify(resultsArray));

    var score = computeScore();
    historyController.saveScore(score);
    deepLinking.saveState(score);
    generateScoreTable(score);
    $('#end').show();
    $('.button.repeat').one('click', backToIntro);
  };

  function computeScore() {
    var sum = 0;
    resultsArray.forEach(function(result) {
      sum += result.time;
    });

    var avg = Math.round((sum / resultsArray.length) * 1000) / 1000;
    var score = {
      date: beginDate,
      results: resultsArray,
      avg: avg
    };
    return score;
  }

  function generateScoreTable(score) {
    $('.resultsTable').empty();
    score.results.forEach(function(result) {
      var el = $('<li/>');
      if (result.type === 'success') {
        el.text(result.time + 's.');
      } else {
        el.text("Falstart");
      }
      $('.resultsTable').append(el);
    });

    $('.avgTime').text(score.avg);

  }

  function backToIntro() {
    removeDocumentHandler();
    $('#intro').fadeIn('fast', function() {
      $('#end').hide();
    });
    addDocumentHandler(startGame);
  };

  function falstart() {
    removeDocumentHandler();
    clearTimeout(timeoutHandler);
    var result = {
      type: 'false-start',
      time: 1
    }
    resultsArray.push(result);
    $('#falstart').fadeIn('fast');
    addDocumentHandler(startNextRound);
  };

  function showObject() {
    removeDocumentHandler();
    addDocumentHandler(onReaction);
    var maxLeft = $(window).width() - $('div.ball').outerWidth();
    var maxTop = $(window).height() - $('div.ball').outerHeight();
    var left = random(0, maxLeft);
    var top = random(0, maxTop);
    var colours = getRandomColours(2);
    $('div.ball').css('left', left);
    $('div.ball').css('top', top);
    $('div.ball').css('background', colours[0]);
    $('div.ball').css('color', colours[1]);
    $('div.ball').show();
    startTime = Date.now();
  };

  function hideObject() {
    $('div.ball').fadeOut('fast', $('div.ball').hide);
  };

  function onReaction() {
    var stopTime = Date.now();
    var reaction = (stopTime - startTime) / 1000;
    removeDocumentHandler();
    hideObject();
    var result = {
      type: 'success',
      time: reaction
    }
    resultsArray.push(result);
    console.log('Reaction: ' + reaction + 's.');
    $('#reactionTime').text(reaction);
    $('#result').fadeIn('fast');
    addDocumentHandler(startNextRound);
  };

  function restartRoundAnimation() {
    $('#roundName').css('animation-name', 'none');
    setTimeout(function() {
      $('#roundName').css('animation-name', '');
    }, 4);
  };

  // Helper functions

  function addDocumentHandler(handler) {
    currentHandler = handler;
    $(document).one({
      mousedown: currentHandler,
      keydown: currentHandler
    });
  };

  function removeDocumentHandler() {
    $(document).off({
      mousedown: currentHandler,
      keydown: currentHandler
    });
  };

  function getTimeout() {
    return Math.floor(Math.random() * 6500) + 1500;
  };

  function random(min, max) {
    if (max < min) {
      var tmp = min;
      min = max;
      max = tmp;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  function getRandomColours(howMany) {
    var i = 0;
    var chosen;
    var result = [];
    do {
      chosen = random(i, colours.length);
      colours[i] = colours.splice(chosen, 1, colours[i])[0];
      result.push(colours[i]);
      i += 1;
    } while (i < howMany);
    return result;
  }
}

$(function () {
  RT.controller = new RT.MainController();
  RT.controller.init();
});
