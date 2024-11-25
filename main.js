import { ScoreHistoryController } from './scoreHistory.js';
import { DeepLinking } from './deepLinking.js';

class MainController {
  constructor(options = {}) {
    this.options = {
      rounds: 5,
      ...options
    };
    
    this.startTime = 0;
    this.round = 1;
    this.timeoutHandler = null;
    this.beginDate = null;
    this.resultsArray = [];
    this.deepLinking = new DeepLinking();
    this.historyController = null;
    this.currentHandler = null;

    // Bind methods
    this.init = this.init.bind(this);
    this.startGame = this.startGame.bind(this);
    this.showHistory = this.showHistory.bind(this);
    
    // Colors array
    this.colours = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'
    ];
  }

  // Document handler
  documentHandler = (e) => {
    if (!$(e.target).closest('.button').length && this.currentHandler) {
      this.currentHandler(e);
    }
  }

  async init() {
    if (this.options.rounds < 1) {
      this.options.rounds = 1;
    }
    
    $('#rounds').text(this.options.rounds);
    this.historyController = new ScoreHistoryController();
    
    const state = this.deepLinking.getState();
    if (state) {
      console.log('Deep link state found:', state);
      this.showSavedScore(state);
    } else {
      console.log('No deep link state found.');
    }
  }

  // Expose historyController publicly
  showHistory = () => {
    const history = this.historyController.getHistory();
    $('#historyContent').empty();

    if (!history || history.length === 0) {
      const template = document.getElementById('no-history-template');
      const clone = template.content.cloneNode(true);
      $('#historyContent').append(clone);
      console.log('No history available to display.');
    } else {
      history.forEach((score) => {
        const template = document.getElementById('history-entry-template');
        const clone = template.content.cloneNode(true);
        const historyLine = $(clone);

        const date = new Date(parseInt(score.date, 10)).toLocaleDateString('pl-PL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        historyLine.find('span').first().text(date);

        const ol = historyLine.find('ol');
        score.results.forEach((result) => {
          const li = $('<li>' + (result.type === 'success' ? result.time + 's' : 'Falstart') + '</li>');
          ol.append(li);
        });

        historyLine.find('.avg').text(score.avg);

        // Generate deep-linked URL
        const encodedScore = this.deepLinking.encodeScore(score);
        const shareUrl = window.location.origin + window.location.pathname + '#!' + btoa(encodedScore);
        console.log('Generated share URL:', shareUrl);

        // Set shareUrl data attribute
        historyLine.find('.copyLink').data('shareUrl', shareUrl);
        $('#historyContent').append(historyLine);
        console.log('Added history entry to display.');
      });
    }

    $('#history').show();
    console.log('History section displayed.');
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      $('.copy-feedback').addClass('visible');
      setTimeout(() => {
        $('.copy-feedback').removeClass('visible');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Nie udało się skopiować URL.');
    }
  }

  showSavedScore = (score) => {
    if (!score) {
      console.error('No score data to show.');
      return;
    }
    $('#savedScore').show();
    this.generateScoreTable(score);

    if (score.date) {
      // Set the date in a formatted way
      const date = new Date(score.date); // 'score.date' should be a valid timestamp
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      const formattedDate = date.toLocaleDateString('pl-PL', options);
      $('#savedScoreDate').text(formattedDate);
      console.log('Displaying saved score date:', formattedDate);
    } else {
      $('#savedScoreDate').text('Nieznana data'); // Fallback text
      console.warn('Score date is missing:', score);
    }

    $('.button.play').one('click', this.onStartGameClick);
  };

  onStartGameClick = () => {
    $('#savedScore').hide();
    this.addDocumentHandler(this.startGame);
  }

  startGame = () => {
    this.round = 1;
    this.resultsArray = [];
    this.beginDate = Date.now();
    $('#end').hide();
    $('#intro').fadeOut('fast');
    this.startRound(this.round);
  };

  startRound = (round) => {
    this.removeDocumentHandler();
    this.restartRoundAnimation();
    $('#roundNumber').text(round);
    this.timeoutHandler = setTimeout(this.showObject, this.getTimeout());
    this.addDocumentHandler(this.falstart);
  };

  startNextRound = () => {
    $('#result, #falstart').fadeOut('fast');
    this.round += 1;
    if (this.round > this.options.rounds) {
      this.results();
    } else {
      this.startRound(this.round);
    }
  };

  results = () => {
    this.removeDocumentHandler();
    const score = this.computeScore();
    this.historyController.saveScore(score);
    this.deepLinking.saveState(score);
    this.generateScoreTable(score);
    $('#end').fadeIn('fast'); // Changed from show() to fadeIn() for consistency
    console.log('Results displayed. Average:', score.avg);

    if (score.date) {
      // Set date in end section
      const date = new Date(score.date);
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      const formattedDate = date.toLocaleDateString('pl-PL', options);
      $('#endDate').text(formattedDate);
      console.log('Displaying end score date:', formattedDate);
    }
    else {
      $('#endDate').text('Nieznana data');
      console.warn('End score date is missing:', score);
    }

    $('.button.repeat').one('click', this.backToIntro);
  };

  computeScore = () => {
    let sum = 0;
    this.resultsArray.forEach((result) => {
      sum += result.time;
    });

    const avg = Math.round((sum / this.resultsArray.length) * 1000) / 1000;
    const score = {
      date: this.beginDate,
      results: this.resultsArray,
      avg: avg
    };
    console.log('Computed score:', score);
    return score;
  }

  generateScoreTable = (score) => {
    $('.resultsTable').empty();
    const template = document.getElementById('result-item-template');

    score.results.forEach((result) => {
      const clone = template.content.cloneNode(true);
      const li = clone.querySelector('li');

      if (result.type === 'success') {
        li.textContent = result.time + 's.';
      } else {
        li.textContent = "Falstart";
      }

      $('.resultsTable').append(clone);
    });

    $('.avgTime').text(score.avg);
    console.log('Generated score table with average:', score.avg);
  }

  backToIntro = () => {
    this.removeDocumentHandler();
    $('#intro').fadeIn('fast', () => {
      $('#end').hide();
      // Reset copy feedback state when going back
      $('.copy-feedback').removeClass('visible');
    });
    this.addDocumentHandler(this.startGame);
  };

  falstart = () => {
    this.removeDocumentHandler();
    clearTimeout(this.timeoutHandler);
    const result = {
      type: 'false-start',
      time: 1
    }
    this.resultsArray.push(result);
    $('#falstart').fadeIn('fast');
    this.addDocumentHandler(this.startNextRound);
  };

  showObject = () => {
    this.removeDocumentHandler();
    this.addDocumentHandler(this.onReaction);
    const maxLeft = $(window).width() - $('div.ball').outerWidth();
    const maxTop = $(window).height() - $('div.ball').outerHeight();
    const left = this.random(0, maxLeft);
    const top = this.random(0, maxTop);
    const colours = this.getRandomColours(2);
    $('div.ball').css('left', left);
    $('div.ball').css('top', top);
    $('div.ball').css('background', colours[0]);
    $('div.ball').css('color', colours[1]);
    $('div.ball').show();
    this.startTime = Date.now();
    console.log('Ball shown at position:', left, top, 'with colors:', colours);
  };

  hideObject = () => {
    $('div.ball').fadeOut('fast', $('div.ball').hide);
    console.log('Ball hidden.');
  };

  onReaction = () => {
    const stopTime = Date.now();
    const reaction = (stopTime - this.startTime) / 1000;
    this.removeDocumentHandler();
    this.hideObject();
    const result = {
      type: 'success',
      time: reaction
    }
    this.resultsArray.push(result);
    console.log('Reaction recorded:', reaction, 's.');
    $('#reactionTime').text(reaction);
    $('#result').fadeIn('fast');
    this.addDocumentHandler(this.startNextRound);
  };

  restartRoundAnimation = () => {
    $('#roundName').css('animation-name', 'none');
    setTimeout(() => {
      $('#roundName').css('animation-name', '');
    }, 4);
    console.log('Round animation restarted.');
  };

  // Helper functions

  addDocumentHandler = (handler) => {
    this.currentHandler = handler;
    $(document).one('mousedown.gameHandler keydown.gameHandler', this.documentHandler);
    console.log('Added document handler for:', handler.name);
  };

  removeDocumentHandler = () => {
    this.currentHandler = null;
    $(document).off('mousedown.gameHandler keydown.gameHandler', this.documentHandler);
    console.log('Removed document handlers.');
  };

  getTimeout = () => {
    return Math.floor(Math.random() * 6500) + 1500;
  };

  random = (min, max) => {
    if (max < min) {
      const tmp = min;
      min = max;
      max = tmp;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  getRandomColours = (howMany) => {
    let i = 0;
    let chosen;
    const result = [];
    do {
      chosen = this.random(i, this.colours.length - 1); // Ensure index is within bounds
      [this.colours[i], this.colours[chosen]] = [this.colours[chosen], this.colours[i]];
      result.push(this.colours[i]);
      i += 1;
    } while (i < howMany);
    console.log('Random colors selected:', result);
    return result;
  }
}

// Initialize on DOM ready
$(() => {
  const controller = new MainController();
  controller.init();

  // Event handlers using arrow functions
  $('.button.history').on('click', e => {
    e.stopPropagation();
    controller.showHistory();
  });

  $('.button.start').on('click', e => {
    e.stopPropagation();
    controller.startGame();
  });

  $('.button.share-link').on('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await controller.copyToClipboard(window.location.href);
  });

  // Update the clear history click handler
  $('.button.clearHistory').on('click', () => {
    controller.historyController.clearHistory();
    controller.showHistory(); // This will now handle empty history state
    console.log('Clear history button clicked.');
  });

  // Add handler for 'backToStart' button
  $('.button.backToStart').on('click', () => {
    $('#history').hide();
    $('#intro').show();
    console.log('Back to start button clicked.');
  });

  // Add event handler for 'Copy URL' buttons
  $(document).on('click', '.button.copyLink', async function (e) {
    e.preventDefault();
    const shareUrl = $(this).data('shareUrl');
    console.log('Copy URL button clicked. URL:', shareUrl);
    await controller.copyToClipboard(shareUrl);
  });
});


