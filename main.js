var RT = RT || {};

RT.MainController = function (options) {

  var startTime = 0;

  this.init = function init() {
    // add Event listeners
    $('#btnStart').on('click', function (e) {
      start();
    });
    $('#btnDebug').on('click', function (e) {
      var timeout = Math.floor(Math.random() * 10000);
      setTimeout(showObject, timeout);
    });

  };

  function start() {

  }

  this.random = function random(min, max) {
    if (max < min) {
      var tmp = min;
      min = max;
      max = tmp;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function showObject() {
    $(document).on({
      mousedown: onReaction,
      keydown: onReaction
    });
    $('div.ball').show();
    startTime = Date.now();
  }

  function hideObject() {
    var stopTime = Date.now();
    var reaction = (stopTime - startTime) / 1000;
    console.log('Reaction: ' + reaction + 's.');
    $(document).off({
      mousedown: onReaction,
      keydown: onReaction
    });

    $('div.ball').hide('fast');
  }

  function onReaction(e) {
    e.preventDefault();
    hideObject();
    console.log(e);
  }
}

$(function () {
  RT.controller = new RT.MainController();
  RT.controller.init();
});
