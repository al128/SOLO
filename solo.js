if (!window.requestAnimationFrame) { window.requestAnimationFrame = (function() { return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
  function(callback, element ) { window.setTimeout( callback, 1000 / 60 ); }; })(); }

(function(_scope, _multi, _getScreen) {
  _scope = function(query) {
    return document.querySelector(query);
  };

  var _$ = _scope;

  _$.forEach = function(arr, forEach) {
    if (arr.length > 0 && forEach) {
      for (var i = 0; i < arr.length; i++) {
        forEach(arr[i], i, arr);
      }
    }
  }

  _multi = function(query, forEach) {
    var elArr = query || [];
    if (typeof(query) == "string") elArr = document.querySelectorAll(query);
    _$.forEach(elArr, forEach);
    return elArr;
  }

  _$.find = _multi;

  _$.on = function(el, eventArray, callback) {
    for (var i = 0; i < eventArray.length; i++) {
      el.addEventListener(eventArray[i], callback);
    }
  }

  _$.log = function(message, e) {
    if (this.lastLog == message) return;
    console.log(message, e);
    this.lastLog = message;
  }

  _$.getScreen = function(query) {
    var canvas = _$(query);
    var context = canvas.getContext("2d");
    return {
      canvas: canvas,
      context: context
    }
  }
  _getScreen = _$.getScreen;

  _$.cache = {};
  _$.cache.img = {};

  _$.createImage = function(src, onload) {
    if (typeof(src) == "object") {
      // -- Expecting src = [ { id: '', url: '' }, .. ]
      var numImagesToLoad = src.length;

      function _$imageLoaded() {
        numImagesToLoad--;
        if (numImagesToLoad == 0) {
          if (onload) onload();
        }
      }

      src.forEach(function(imgData) {
        _$.cache.img[imgData.id] = _$.createImage(imgData.url, _$imageLoaded);
      });
      return;
    }

    var img = document.createElement("img");
    img.onload = function() {
      if (onload) onload(img);
    }
    img.src = src;
    return img;
  }

  _$.getElTop = function(el) {
    return el.getBoundingClientRect().top + _$.scrollY;
  }

  _$.isElVisible = function(el) {
    var top = _$.getElTop(el);
    var height = el.offsetHeight;
    var bottom = top + height;
    return _$.scrollY + _$.screenHeight >= top && _$.scrollY < bottom;
  }

  // Time
  _$.prevTime = Date.now();
  _$.fps = 24;
  _$.dt = 1000 / _$.fps;

  //
  _$.updates = []; // Holds all the updates to run @fps
  _$.draws = []; // Holds all the draw updates to run once per tick
  _$.accumulator = 0;

  // Screen
  _$.scrollY = 0;
  _$.niceY = 0;
  _$.scrolled = false;
  _$.resize = false; // Has a resize happened ?
  _$.screenWidth = 0; // Screen width
  _$.screenHeight = 0; // Screen height
  _$.midpoint = Math.round(window.innerHeight /  2);

  _$.start = function() {
    if (_$._started) return;
    _$._started = true;
    _$.update();
  }

  _$.addUpdate = function(updateFunc, drawFunc) {
    if (updateFunc) _$.updates.push(updateFunc);
    if (drawFunc) _$.draws.push(drawFunc);
    _$.update(true);
  }

  _$._runUpdates = function() {
    _$.updates.forEach(function(func, index) {
      func(_$.dt);
    });
  }

  _$._runDraw = function() {
    _$.draws.forEach(function(func, index) {
      func(_$.dt);
    });
  }

  _$.getCurrentScrollPosition = function() {
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  }

  _$.update = function(force) {
    requestAnimationFrame(function() {
      // Time
      var now = Date.now();
      _$.time = now;
      _$.passed = now - _$.prevTime;

      // Resize
      _$.resize = window.innerHeight !== _$.screenHeight || window.innerWidth !== _$.screenWidth;
      _$.screenWidth = window.innerWidth;
      _$.screenHeight = window.innerHeight;

      // Scroll
      var scroll = _$.getCurrentScrollPosition();
      _$.scrolled = scroll !== _$.scrollY;
      _$.scrollY = scroll;

      _$.niceY = _$.scrollY / (document.body.offsetHeight - _$.screenHeight);

      // Run updates
      var updated = false;

      if (!force) {
        _$.accumulator += _$.passed;
        while (_$.accumulator >= _$.dt) {
          _$._runUpdates();
          updated = true;
          _$.accumulator -= _$.dt;
        }
      } else {
        _$.scrolled = true;
        _$._runUpdates();
        updated = true;
      }

      if (updated) {
        _$._runDraw();
      }

      // Prep next tick
      _$.prevTime = now;
      _$.update();
    });
  }
})( window.$ ? window._ || window.$,
    window.$ ? window.__ || window.$$,
    window._$ );
// -- Need to change the global variable name? Tweak the above line