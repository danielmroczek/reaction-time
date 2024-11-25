var RT = RT || {};

RT.DeepLinking = function () {
  'use strict';

  var types = {
    "s": "success",
    "f": "false-start"
  };
  var splitChr = ',';

  this.getState = function () {
    try {
      var hash = window.location.hash.substr(2);
      if (!hash) {
        console.warn('No hash found in URL.');
        return null;
      }

      var csv = atob(hash);
      console.log('Decoded CSV from hash:', csv);
      var result = decodeScore(csv);

      return result;
    } catch (e) {
      console.error('Error decoding deep link:', e);
      return null;
    }
  };

  this.saveState = function (score) {
    var scoreStr = encodeScore(score);
    var base = btoa(scoreStr);
    window.location.hash = '!' + base;
    console.log('Saved state with hash:', window.location.hash);
  };

  this.clearState = function () {
    window.location.hash = '';
    console.log('Cleared deep link state.');
  };

  this.encodeScore = encodeScore;
  function encodeScore(score) {
    // Ensure score.date is present
    if (!score.date) {
      console.warn('Score object missing date. Assigning current date.');
      score.date = Date.now();
    }

    var data = [];
    data.push(score.date.toString()); // Push date as string
    data.push(score.results.length.toString());
    score.results.forEach(function (result) {
      var type = result.type.substr(0, 1).toLowerCase();
      if (!types[type]) {
        console.warn('Unknown result type:', result.type);
        type = 's'; // default to success
      }
      data.push(type);
      data.push(result.time.toString());
    });
    data.push(score.avg.toString());
    var output = data.join(splitChr);
    console.log('Encoded Score:', output); // Debugging statement
    return output;
  }

  this.decodeScore = decodeScore;
  function decodeScore(score) {
    try {
      var obj = {};
      var data = score.split(splitChr);
      if (data.length < 3) { // Ensure minimum data
        throw new Error('Insufficient data to decode score.');
      }
      obj.date = parseInt(data.shift(), 10);
      if (isNaN(obj.date)) {
        throw new Error('Invalid date format.');
      }
      var rounds = parseInt(data.shift(), 10);
      if (isNaN(rounds) || rounds < 1) {
        throw new Error('Invalid number of rounds.');
      }
      obj.results = [];
      for (var i = 0; i < rounds; i += 1) {
        var result = {};
        var t = data.shift();
        result.type = types[t] || 'unknown';
        var time = parseFloat(data.shift());
        if (isNaN(time)) {
          console.warn('Invalid time format for result. Setting to 0.');
          time = 0;
        }
        result.time = time;
        obj.results.push(result);
      }
      obj.avg = parseFloat(data.shift());
      if (isNaN(obj.avg)) {
        console.warn('Invalid average format. Setting to 0.');
        obj.avg = 0;
      }
      console.log('Decoded Score Object:', obj); // Debugging statement
      return obj;
    } catch (e) {
      console.error('Error decoding score:', e);
      return null;
    }
  }

};
