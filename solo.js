// -- Polyfills

(function() {
  if (!window.requestAnimationFrame) { window.requestAnimationFrame = (function() { return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback, element ) { window.setTimeout( callback, 1000 / 60 ); }; })(); }

  if (!Date.now) { Date.now = function now(){ return new Date().getTime(); } }
})();

// -- Solo

(function(_scope, _solo, options) {

  var $ = function(query) {
    // Pass in an array to look for multiple elements
    // Pass in a string to get the first element

    if (typeof(query) == "object") {
      var elArr = document.querySelectorAll(query);
      $._extendMultiNode(elArr);
      return elArr;
    } else if (typeof(query) == "string") {
      var el = document.querySelector(query);
      $._extendSingleNode(el);
      return el;
    }
  }

  _scope[_solo] = $;

  options = options || {};

  // -- Plugs

  $._ = {};

  $._.forEach = function(eachFunc) {
    if (this.length > 0 && typeof(eachFunc) == "function") {
      for (var i = 0; i < arr.length; i++) {
        eachFunc(arr[i], i, arr);
      }
    }

    return this;
  }

  $._.toScreen = function() {
    var canvas = this;
    if (canvas && canvas.getContext) {
      var context = canvas.getContext("2d");
      return {
        canvas: canvas,
        context: context
      }
    } else {
      $.log("No canvas found", canvas);
    }
  }

  $._.getTop = function() {
    return this.getBoundingClientRect().top + $.scrollY;
  }

  $._.isVisible = function() {
    var top = this.getTop();
    var height = this.offsetHeight;
    var bottom = top + height;
    return $.scrollY + $.screenHeight >= top && $.scrollY < bottom;
  }

  $._.on = function(_events, callback) {
    var events = _events.split(" ");

    for (var i = 0; i < events.length; i++) {
      el.addEventListener(events[i], callback);
    }

    return this;
  }

  $._.off = function(_events, callback) {
    var events = _events.split(" ");

    for (var i = 0; i < events.length; i++) {
      el.removeEventListener(events[i], callback);
    }

    return this;
  }

  $._extendSingleNode = function(el) {
    if (el) {
      if (el.nodeName && el.nodeName.toLowerCase() === "canvas") {
        if (!el.hasOwnProperty("toScreen")) {
          el.toScreen = $._.toScreen;
        }
      }

      if (!el.hasOwnProperty("getTop")) {
        el.getTop = $._.getTop;
      }

      if (!el.hasOwnProperty("isVisible")) {
        el.isVisible = $._.isVisible;
      }

      if (!elArr.hasOwnProperty("on")) {
        elArr.on = $.__.on;
      }

      if (!elArr.hasOwnProperty("off")) {
        elArr.off = $.__.off;
      }
    }
  }

  $._extendMultiNode = function(elArr) {
    if (elArr) {
      if (!elArr.hasOwnProperty("forEach")) {
        elArr.forEach = $.__.forEach;
      }

      if (!elArr.hasOwnProperty("on")) {
        elArr.on = $.__.on;
      }

      if (!elArr.hasOwnProperty("off")) {
        elArr.off = $.__.off;
      }

      elArr.forEach(function(node) {
        $._extendSingleNode(node);
      });
    }
  }

  // -- Cache

  $.cache = { id: 0, images: {}, log: [] };

  // -- Debugging

  $.newID = function() {
    var newID = _solo + "_" + $.cache.id;
    $.cache.id++;
    return newID;
  }

  $.log = function(message, e) {
    $.cache.log.push({
      message: message,
      e: e,
      datetime: $.time
    });

    if (typeof(message) == "string") {
      // if ($.cache.log.indexOf(message) > -1) {
      //   return;
      // }
    }

    if (e) {
      console.log($.time, message, e);
    } else {
      console.log($.time, message);
    }
  }

  // -- Communications

  $.rest = function(method, url, success, error) {
    success = typeof success == "function" ? success : function(){};
    error = typeof error == "function" ? error : function(){};

    var request = new XMLHttpRequest();
    request.open(method || 'GET', url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        var data = JSON.parse(request.responseText);
        success(data, request);
      } else {
        error(request);
      }
    }

    request.onerror = function() {
      error(request);
    }

    request.send();
  }

  // -- Window

  $.scrollY = 0;
  $.screenWidth = 0;
  $.screenHeight = 0;

  $._scrolled = false;
  $._resized = false;

  $._updateScrollY = function() {
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  }

  // -- Updating

  $.time = Date.now();
  $.fps = !isNaN(options.fps) ? fps : 60;

  $._updates = [];
  $._accumulator = 0;
  $._interval = 0;

  $._prevTime = Date.now();
  $._passed = 0;

  $.addUpdate = function(updateData) {
    if (!updateData) {
      return;
    }

    var updateID = $.newID();
    var updateObject = {};

    updateObject.id = updateID;
    updateObject.interval = updateData.interval || 0;
    updateObject.remaining = updateData.numTimes || -1;
    updateObject.time = 0;
    updateObject.events = {
      resized: true,
      scrolled: true
    };

    updateObject.update = function() {
      if ($._scrolled) {
        this.events.scrolled = true;
      }

      if ($._resized) {
        this.events.resized = true;
      }

      var metRequirements = true;
      if (updateData.requirements) {
        if (updateData.requirements.scrolled && !this.events.scrolled) {
          metRequirements = false;
        }

        if (updateData.requirements.resized && !this.events.resized) {
          metRequirements = false;
        }
      }

      if (this.remaining !== 0 &&
      $.time >= this.time + this.interval &&
      metRequirements) {
        if (updateData.update) {
          var output = updateData.update();
          if (typeof(output) === "boolean") {
            this.dirty = output;
          }
        } else {
          this.dirty = true;
        }

        this.events.scrolled = false;
        this.events.resized = false;
      }

      if (this.dirty) {
        this.time = $.time;
      }

      if (this.remaining > 0) {
        this.remaining--;
      }
    }

    updateObject.draw = function() {
      if (this.dirty && updateData.draw) {
        updateData.draw();
      }
      this.dirty = false;
    }

    if (updateObject.hasOwnProperty("priority")) {
      if (updateObject.priority === -1) {
        $._updates.unshift(updateObject);
      } else {
        $._updates.push(updateObject);
      }
    } else {
      $._updates.push(updateObject);
    }

    return updateID;
  }

  $.update = function() {
    requestAnimationFrame(function() {
      $._theUpdate();
      $.update();
    });
  }

  $._theUpdate = function() {

    // Time

    var now = Date.now();
    $.time = now;
    $.passed = now - $._prevTime;

    // Dimensions

    $._resized = window.innerHeight !== $.screenHeight || window.innerWidth !== $.screenWidth;
    $.screenWidth = window.innerWidth;
    $.screenHeight = window.innerHeight;

    // Scroll

    var scrollY = $._updateScrollY();
    $.scrolled = scrollY !== $.scrollY;
    $.scrollY = scrollY;

    // Updates

    $._interval = ((1 / $.fps) * 1000);
    $._accumulator += $.passed;

    while ($._accumulator >= $._interval) {
      $._updates.forEach(function(updateObject) {
        updateObject.update();
      });

      $._accumulator -= $._interval;
    }

    $._updates.forEach(function(updateObject) {
      updateObject.draw();
    });

    // Clean up

    $._prevTime = now;
  }

  $.update();

})( window, (!window.hasOwnProperty('$') ? '$' : '_$'), {} );