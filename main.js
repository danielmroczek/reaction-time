var RT = RT || {};

RT.MainController = function (options) {
  var options = $.extend({
    rounds: 5
  }, options);

  var startTime = 0;
  var round = 1;
  var timeoutHandler;
  var beginDate;
  var resultsArray = [];
  var deepLinking = new RT.DeepLinking();
  var historyController;
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
    historyController = this.historyController = new RT.ScoreHistoryController();
    var state = deepLinking.getState();
    if (state) {
      console.log('Deep link state found:', state);
      showSavedScore(state);
    } else {
      console.log('No deep link state found.');
      // Remove this line since we're using the button now
      // addDocumentHandler(startGame);
    }
  };

  // Expose historyController publicly
  this.showHistory = showHistory;
  this.startGame = startGame;

  function showSavedScore(score) {
    if (!score) {
      console.error('No score data to show.');
      return;
    }
    $('#savedScore').show();
    generateScoreTable(score);
    
    if (score.date) {
      // Set the date in a formatted way
      var date = new Date(score.date); // 'score.date' should be a valid timestamp
      var options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      var formattedDate = date.toLocaleDateString('pl-PL', options);
      $('#savedScoreDate').text(formattedDate);
      console.log('Displaying saved score date:', formattedDate);
    } else {
      $('#savedScoreDate').text('Nieznana data'); // Fallback text
      console.warn('Score date is missing:', score);
    }
    
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
    var score = computeScore();
    historyController.saveScore(score);
    deepLinking.saveState(score);
    generateScoreTable(score);
    $('#end').fadeIn('fast'); // Changed from show() to fadeIn() for consistency
    console.log('Results displayed. Average:', score.avg);

    if (score.date) {
      // Set date in end section
      var date = new Date(score.date);
      var options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      var formattedDate = date.toLocaleDateString('pl-PL', options);
      $('#endDate').text(formattedDate);
      console.log('Displaying end score date:', formattedDate);
    }
    else {
      $('#endDate').text('Nieznana data');
      console.warn('End score date is missing:', score);
    }

    $('.button.repeat').one('click', backToIntro);
  };

  function computeScore() {
    var sum = 0;
    resultsArray.forEach(function (result) {
      sum += result.time;
    });

    var avg = Math.round((sum / resultsArray.length) * 1000) / 1000;
    var score = {
      date: beginDate,
      results: resultsArray,
      avg: avg
    };
    console.log('Computed score:', score);
    return score;
  }

  function generateScoreTable(score) {
    $('.resultsTable').empty();
    score.results.forEach(function (result) {
      var el = $('<li/>');
      if (result.type === 'success') {
        el.text(result.time + 's.');
      } else {
        el.text("Falstart");
      }
      $('.resultsTable').append(el);
    });

    $('.avgTime').text(score.avg);
    console.log('Generated score table with average:', score.avg);
  }

  function backToIntro() {
    removeDocumentHandler();
    $('#intro').fadeIn('fast', function () {
      $('#end').hide();
      // Reset copy feedback state when going back
      $('.copy-feedback').removeClass('visible');
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
    console.log('Ball shown at position:', left, top, 'with colors:', colours);
  };

  function hideObject() {
    $('div.ball').fadeOut('fast', $('div.ball').hide);
    console.log('Ball hidden.');
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
    console.log('Reaction recorded:', reaction, 's.');
    $('#reactionTime').text(reaction);
    $('#result').fadeIn('fast');
    addDocumentHandler(startNextRound);
  };

  function restartRoundAnimation() {
    $('#roundName').css('animation-name', 'none');
    setTimeout(function () {
      $('#roundName').css('animation-name', '');
    }, 4);
    console.log('Round animation restarted.');
  };

  function showHistory() {
    var history = this.historyController.getHistory();
    $('#historyContent').empty();
    
    if (!history || history.length === 0) {
      var messageHtml = '<div class="no-history"><i class="fa fa-info-circle"></i> Brak dostępnej historii.</div>';
      $('#historyContent').append(messageHtml);
      console.log('No history available to display.');
    } else {
      history.forEach(function (score) {
        var historyLine = $('<div class="historyLine"/>');
        var date = new Date(parseInt(score.date, 10)).toLocaleDateString('pl-PL', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        historyLine.append('<span>' + date + '</span>');
        
        var ol = $('<ol/>');
        score.results.forEach(function (result) {
          ol.append('<li>' + (result.type === 'success' ? result.time + 's' : 'Falstart') + '</li>');
        });
        historyLine.append(ol);
        
        historyLine.append('<span class="avg">' + score.avg + '</span>');

        // Generate deep-linked URL
        var encodedScore = deepLinking.encodeScore(score);
        var shareUrl = window.location.origin + window.location.pathname + '#!' + btoa(encodedScore);
        console.log('Generated share URL:', shareUrl);

        // Create 'Copy URL' button
        var copyButton = $('<a href="#" class="button copyLink"><i class="fa fa-link"></i> Kopiuj URL</a>');
        copyButton.data('shareUrl', shareUrl);
        historyLine.append(copyButton);
        
        $('#historyContent').append(historyLine);
        console.log('Added history entry to display.');
      });
    }
    
    $('#history').show();
    console.log('History section displayed.');
  }

  // Helper functions

  function addDocumentHandler(handler) {
    currentHandler = handler;
    $(document).one('mousedown.gameHandler keydown.gameHandler', function (e) {
      // Ignore clicks from buttons
      if ($(e.target).closest('.button').length === 0) {
        handler(e);
      }
    });
    console.log('Added document handler for:', handler.name);
  };

  function removeDocumentHandler() {
    $(document).off('mousedown.gameHandler keydown.gameHandler');
    console.log('Removed document handlers.');
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
      chosen = random(i, colours.length - 1); // Ensure index is within bounds
      colours[i] = colours.splice(chosen, 1, colours[i])[0];
      result.push(colours[i]);
      i += 1;
    } while (i < howMany);
    console.log('Random colors selected:', result);
    return result;
  }
}

$(function () {
  RT.controller = new RT.MainController();
  RT.controller.init();
  $('.button.history').on('click', function (e) {
    e.stopPropagation(); // Stop event from bubbling up
    RT.controller.showHistory();
    console.log('History button clicked.');
  });
  $('.button.start').on('click', function (e) {
    e.stopPropagation();
    RT.controller.startGame();
    console.log('Start button clicked.');
  });
  $('.button.share-link').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href).then(function () {
      // Show feedback
      $('.copy-feedback').addClass('visible');
      console.log('Current URL copied to clipboard.');
      setTimeout(function () {
        $('.copy-feedback').removeClass('visible');
        console.log('Copy feedback hidden.');
      }, 2000);
    }).catch(function () {
      alert('Nie udało się skopiować URL.');
      console.error('Failed to copy URL to clipboard.');
    });
  });

  // Update the clear history click handler
  $('.button.clearHistory').on('click', function () {
    RT.controller.historyController.clearHistory();
    RT.controller.showHistory(); // This will now handle empty history state
    console.log('Clear history button clicked.');
  });

  // Add handler for 'backToStart' button
  $('.button.backToStart').on('click', function () {
    $('#history').hide();
    $('#intro').show();
    console.log('Back to start button clicked.');
  });
  
  // Add event handler for 'Copy URL' buttons
  $(document).on('click', '.button.copyLink', function (e) {
    e.preventDefault();
    var shareUrl = $(this).data('shareUrl');
    console.log('Copy URL button clicked. URL:', shareUrl);

    navigator.clipboard.writeText(shareUrl).then(function () {
      // Provide feedback to the user
      var feedback = $('<span class="copy-feedback visible">URL skopiowany!</span>');
      $(this).after(feedback);
      console.log('Share URL copied to clipboard.');
      setTimeout(function () {
        feedback.fadeOut(500, function () {
          $(this).remove();
          console.log('Copy feedback removed.');
        });
      }, 2000);
    }.bind(this)).catch(function () {
      alert('Nie udało się skopiować URL.');
      console.error('Failed to copy share URL to clipboard.');
    });
  });
});
