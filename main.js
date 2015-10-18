var RT = RT || {};

RT.MainController = function (options) {
  var options = $.extend({
    rounds: 5,
    roundAnimationClass: 'slideOutUp'
  }, options);

  var startTime = 0;
  var round = 1;
  var currentHandler;
  var timeoutHandler;
  var beginDate;
  var resultsArray = [];

  this.init = function init() {
    if (options.rounds < 1) {
      options.rounds = 1;
    }
    $('#rounds').text(options.rounds);
    addDocumentHandler(startGame);
  };

  function startGame() {
    round = 1;
    resultsArray = [];
    beginDate = new Date();
    $('#end').hide();
    $('#intro').fadeOut('slow', $('#intro').hide);
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
    $('#resultsTable').empty();
    var sum = 0;
    resultsArray.forEach(function(result) {
      var el = $('<li/>');
      if (result.type === 'success') {
        el.text(result.time + 's.');
      } else {
        el.text("Falstart");
      }
      $('#resultsTable').append(el);
      sum += result.time;
    });
    var avg = Math.round((sum / resultsArray.length) * 1000) / 1000;
    $('#avgTime').text(avg);
    $('#end').show();
    addDocumentHandler(backToIntro);
  };

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
    var maxLeft = $(window).width() - $('div.ball').width();
    var maxTop = $(window).height() - $('div.ball').height();
    var left = random(0, maxLeft);
    var top = random(0, maxTop);
    $('div.ball').css('left', left);
    $('div.ball').css('top', top);
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
    $('#roundName').removeClass(options.roundAnimationClass);
    $('#roundName').width($('#roundName').width());
    $('#roundName').addClass(options.roundAnimationClass);
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
    return Math.floor(Math.random() * 10000) + 500;
  };

  function random(min, max) {
    if (max < min) {
      var tmp = min;
      min = max;
      max = tmp;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
}

$(function () {
  RT.controller = new RT.MainController();
  RT.controller.init();
});
