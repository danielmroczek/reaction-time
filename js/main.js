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
    if (!e.target.closest('.button') && this.currentHandler) {
      this.currentHandler(e);
    }
  }

  async init() {
    if (this.options.rounds < 1) {
      this.options.rounds = 1;
    }
    
    document.getElementById('rounds').textContent = this.options.rounds;
    this.historyController = new ScoreHistoryController();
    
    const state = this.deepLinking.getState();
    if (state) {
      console.log('Deep link state found:', state);
      this.showSavedScore(state);
    } else {
      console.log('No deep link state found.');
    }
  }

  // DOM helper methods
  fadeOut(element, duration = 200) {
    element.style.opacity = '0';
    setTimeout(() => {
      element.style.display = 'none';
      element.style.opacity = '1';
    }, duration);
  }

  fadeIn(element, display = 'block', duration = 200) {
    element.style.opacity = '0';
    element.style.display = display;
    setTimeout(() => element.style.opacity = '1', 10);
  }

  // Show history
  showHistory = () => {
    const history = this.historyController.getHistory();
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = '';

    if (!history || history.length === 0) {
      const template = document.getElementById('no-history-template');
      const clone = template.content.cloneNode(true);
      historyContent.appendChild(clone);
      console.log('No history available to display.');
    } else {
      history.forEach((score) => {
        const template = document.getElementById('history-entry-template');
        const clone = template.content.cloneNode(true);
        const historyLine = clone.querySelector('.historyLine');

        const date = new Date(parseInt(score.date, 10));
        const dateStr = date.toLocaleDateString('pl-PL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-');
        
        const timeStr = date.toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        historyLine.querySelector('.date-line').textContent = dateStr;
        historyLine.querySelector('.time-line').textContent = timeStr;

        const ol = document.createElement('ol');
        score.results.forEach((result) => {
          const li = document.createElement('li');
          li.textContent = result.type === 'success' ? 
            `${result.time.toFixed(3)}s` : 'Falstart';
          ol.appendChild(li);
        });

        historyLine.querySelector('.avg').textContent = `${score.avg.toFixed(3)} s.`;

        const encodedScore = this.deepLinking.encodeScore(score);
        const shareUrl = window.location.origin + window.location.pathname + '#!' + btoa(encodedScore);
        historyLine.querySelector('.copyLink').dataset.shareUrl = shareUrl;
        historyContent.appendChild(historyLine);
      });
    }

    const historySection = document.getElementById('history');
    historySection.style.display = 'flex';
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      document.querySelector('.copy-feedback').classList.add('visible');
      setTimeout(() => {
        document.querySelector('.copy-feedback').classList.remove('visible');
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
    document.getElementById('savedScore').style.display = 'block';
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
      document.getElementById('savedScoreDate').textContent = formattedDate;
      console.log('Displaying saved score date:', formattedDate);
    } else {
      document.getElementById('savedScoreDate').textContent = 'Nieznana data'; // Fallback text
      console.warn('Score date is missing:', score);
    }

    document.querySelector('.button.play').addEventListener('click', this.onStartGameClick, { once: true });
  };

  onStartGameClick = () => {
    document.getElementById('savedScore').style.display = 'none';
    this.addDocumentHandler(this.startGame);
  }

  startGame = () => {
    this.round = 1;
    this.resultsArray = [];
    this.beginDate = Date.now();
    document.getElementById('end').style.display = 'none';
    this.fadeOut(document.getElementById('intro'), 200);
    this.startRound(this.round);
  };

  startRound = (round) => {
    this.removeDocumentHandler();
    this.restartRoundAnimation();
    document.getElementById('roundNumber').textContent = round;
    this.timeoutHandler = setTimeout(this.showObject, this.getTimeout());
    this.addDocumentHandler(this.falstart);
  };

  startNextRound = () => {
    this.fadeOut(document.getElementById('result'), 200);
    this.fadeOut(document.getElementById('falstart'), 200);
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
    this.fadeIn(document.getElementById('end'), 'block', 200); // Changed from show() to fadeIn() for consistency
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
      document.getElementById('endDate').textContent = formattedDate;
      console.log('Displaying end score date:', formattedDate);
    }
    else {
      document.getElementById('endDate').textContent = 'Nieznana data';
      console.warn('End score date is missing:', score);
    }

    document.querySelector('.button.repeat').addEventListener('click', this.backToIntro, { once: true });
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
    const resultsTable = document.querySelector('.resultsTable');
    resultsTable.innerHTML = '';
    const template = document.getElementById('result-item-template');

    score.results.forEach((result) => {
      const clone = template.content.cloneNode(true);
      const li = clone.querySelector('li');

      if (result.type === 'success') {
        li.textContent = result.time + 's.';
      } else {
        li.textContent = "Falstart";
      }

      resultsTable.appendChild(clone);
    });

    document.querySelector('.avgTime').textContent = score.avg;
    console.log('Generated score table with average:', score.avg);
  }

  backToIntro = () => {
    this.removeDocumentHandler();
    this.fadeIn(document.getElementById('intro'), 'block', 200, () => {
      document.getElementById('end').style.display = 'none';
      // Reset copy feedback state when going back
      document.querySelector('.copy-feedback').classList.remove('visible');
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
    this.fadeIn(document.getElementById('falstart'), 'block', 200);
    this.addDocumentHandler(this.startNextRound);
  };

  showObject = () => {
    this.removeDocumentHandler();
    this.addDocumentHandler(this.onReaction);
    const ball = document.querySelector('div.ball');
    const maxLeft = window.innerWidth - ball.offsetWidth;
    const maxTop = window.innerHeight - ball.offsetHeight;
    const left = this.random(0, maxLeft);
    const top = this.random(0, maxTop);
    const colours = this.getRandomColours(2);
    ball.style.left = `${left}px`;
    ball.style.top = `${top}px`;
    ball.style.background = colours[0];
    ball.style.color = colours[1];
    ball.style.display = 'block';
    this.startTime = Date.now();
    console.log('Ball shown at position:', left, top, 'with colors:', colours);
  };

  hideObject = () => {
    const ball = document.querySelector('div.ball');
    this.fadeOut(ball, 200);
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
    document.getElementById('reactionTime').textContent = reaction;
    this.fadeIn(document.getElementById('result'), 'block', 200);
    this.addDocumentHandler(this.startNextRound);
  };

  restartRoundAnimation = () => {
    const roundName = document.getElementById('roundName');
    roundName.style.animationName = 'none';
    setTimeout(() => {
      roundName.style.animationName = '';
    }, 4);
    console.log('Round animation restarted.');
  };

  // Helper functions

  addDocumentHandler = (handler) => {
    this.currentHandler = handler;
    document.addEventListener('mousedown', this.documentHandler, { once: true });
    document.addEventListener('keydown', this.documentHandler, { once: true });
    console.log('Added document handler for:', handler.name);
  };

  removeDocumentHandler = () => {
    this.currentHandler = null;
    document.removeEventListener('mousedown', this.documentHandler);
    document.removeEventListener('keydown', this.documentHandler);
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
document.addEventListener('DOMContentLoaded', () => {
  console.log("Hello!");
  const controller = new MainController();
  controller.init();

  // Event handlers
  document.querySelectorAll('.button.history').forEach(button => {
    button.addEventListener('click', e => {
      e.stopPropagation();
      controller.showHistory();
    });
  });

  document.querySelector('.button.start').addEventListener('click', e => {
    e.stopPropagation();
    controller.startGame();
  });

  document.querySelector('.button.share-link').addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await controller.copyToClipboard(window.location.href);
  });

  document.querySelector('.button.clearHistory').addEventListener('click', () => {
    controller.historyController.clearHistory();
    controller.showHistory();
    console.log('Clear history button clicked.');
  });

  document.querySelector('.button.backToStart').addEventListener('click', () => {
    document.getElementById('history').style.display = 'none';
    document.getElementById('intro').style.display = 'block';
    console.log('Back to start button clicked.');
  });

  // Event delegation for dynamic copy buttons
  document.addEventListener('click', async e => {
    if (e.target.closest('.button.copyLink')) {
      e.preventDefault();
      const shareUrl = e.target.closest('.button.copyLink').dataset.shareUrl;
      console.log('Copy URL button clicked. URL:', shareUrl);
      await controller.copyToClipboard(shareUrl);
    }
  });
});


