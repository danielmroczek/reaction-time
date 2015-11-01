var RT = RT || {};

RT.DeepLinking = function () {
  'use strict';

  var types = {
    "s": "success",
    "f": "false-start"
  }
  var splitChr = ',';

  this.getState = function () {
    try {
      var hash = window.location.hash.substr(2);
      var csv = atob(hash);
      var result = decodeScore(csv);
      return result;
    } catch (e) {
      return null;
    }
  };

  this.saveState = function (score) {
    var scoreStr = encodeScore(score);
    var base = btoa(scoreStr);
    window.location.hash = '!' + base;
  };

  this.clearState = function () {

  };

  this.encodeScore = encodeScore;
  function encodeScore (score) {
    var data = [];
    data.push(score.date);
    data.push(score.results.length);
    score.results.forEach(function (result) {
       var type = result.type.substr(0, 1);
       data.push(type);
       data.push(result.time);
    });
    data.push(score.avg);
    var output = data.join(splitChr);
    return output;
  }

  this.decodeScore = decodeScore;
  function decodeScore (score) {
    var obj = {};
    var data = score.split(splitChr);
    obj.date = data.shift();
    var rounds = data.shift();
    obj.results = [];
    var i = 0;
    for(; i < rounds; i += 1) {
      var result = {};
      var t = data.shift();
      result.type = types[t];
      result.time = data.shift();
      obj.results.push(result);
    }
    obj.avg = data.shift();
    return obj;
  }

};
