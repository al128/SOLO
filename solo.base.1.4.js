/*
  SOLO web app utils MIT License
  github.com/al128/SOLO | therook.co.uk | belowthestorm.co.uk
  Object extensions require Underscore.js http://underscorejs.org
*/

/* Update request frame */
if (!window.requestAnimationFrame) { window.requestAnimationFrame = (function() { return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
  function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) { window.setTimeout( callback, 1000 / 60 ); }; })(); }

/* Object's extended with Underscore instead of .prototype so we don't upset anyone */
if (typeof(_) === "object") {
  _.mixin({
    /* Cleanup an array of objects with .destroy active */
    cleanupArray : function(array) {
      if (!_.isArray(array)) return;
      var deleting = [];
      for (var i = 0; i < this.length; i++) {
        if (array[i].destroy === true)
          deleting.push(i - deleting.length);
      }
      for (var i = 0; i < deleting.length; i++) {
        array.splice(deleting[i], 1);
      }
    },

    /* Shuffle array */
    shuffleArray : function(array) {
      if (!_.isArray(array)) return;
      var i = array.length, j, tempi, tempj;
      if (i === 0) return array;
      while (--i) {
        j = Math.floor(Math.random() * ( i + 1 ));
        tempi = array[i];
        tempj = array[j];
        array[i] = tempj;
        array[j] = tempi;
      }
      return array;
    }
  });
}

/* Get elements */
String.prototype.get = function() {
  return document.querySelectorAll(this);
}

/* Create image from string path */
String.prototype.createImage = function(callback) {
  var img = document.createElement("img");
  img.crossOrigin = "Anonymous";
  img.src = this;
  if (callback) img.onload = function() { callback(this); };
  return img;
};

/* Create sound from string path */
String.prototype.createSound = function(callback) {
  var audio = new Audio(this);
  if (callback) audio.addEventListener('canplaythrough', callback, false);
  return audio;
};

/* Go to url, default is new tab/window */
String.prototype.goTo = function(tab) {
  if (tab === false) {
    window.location = this;
  } else {
    window.open(this, '_blank');
  }
};

/* Will fire event if specified key is pressed */
String.prototype.monitor = function() {
  var that = this;
  document.addEventListener("keydown", function(e) {
    ("io.keydown." + that).fireEvent();
  });
  document.addEventListener("keyup", function(e) {
    ("io.keyup." + that).fireEvent();
  });
};

/* Fire event */
String.prototype.fireEvent = function(e) {
  if (window.CustomEvent) {
    var event = new CustomEvent(this, {detail: arguments});
  } else {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent(this, true, true, {detail: arguments});
  }
  "body".get()[0].dispatchEvent(event);
};

/* Register event */
String.prototype.registerEvent = function(callback) {
  var a = arguments;
  "body".get()[0].addMultiListener(this, function(e, a) {
    callback(e, a);
  });
};

/* Retrive a value from page url */
String.prototype.queryString = function() {
  var key = this.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&");
  var match = window.location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
  return match && decodeURIComponent(match[1].replace(/\+/g, " "));
};

/* Windows or mac */
String.prototype.isPlatform = function() {
  switch (this.toLowerCase()) {
    case 'blending':
      var ctx = document.createElement('canvas').getContext('2d');
      ctx.globalCompositeOperation = 'color';
      if (ctx.globalCompositeOperation == 'color' && !"safari".isBrowser())
        return true;
      return false;
    case 'blends':
      /* TODO: Only return available, and do indexof(this) */
      return ["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light",
        "soft-light","difference","exclusion","hue","saturation","color","luminosity"];
    case 'touch':
      return 'ontouchstart' in window || 'onmsgesturechange' in window;
    case 'windows':
      if (navigator.platform.indexOf("win") > -1) return true; return false;
    case 'osx':
    case 'mac':
      if (navigator.platform.indexOf("mac") > -1) return true; return false;
  }
};

/* Browser detection */
String.prototype.isBrowser = function() {
  switch (this.toLowerCase()) {
    case 'opera':
      return !!window.opera || navigator.userAgent.indexOf('Opera') >= 0;
    case 'ie':
      return /*@cc_on!@*/false;
    case 'ie9':
      return navigator.appName === 'Microsoft Internet Explorer';
    case 'firefox':
      return typeof InstallTrigger !== 'undefined';
    case 'safari':
      return Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    case 'chrome':
      return !!window.chrome;
  }
};

/* Log by key */
String.prototype.lastmessage = "";
String.prototype.log = function(e) {
  if (this === String.prototype.lastmessage) return;
  console.log(new Date());
  console.log("Log: " + this);
  if (e) {
    if (typeof(e) == "string") console.warn(e);
    if (typeof(e.message) == "string") console.warn(e.message);
    if (typeof(e.stack) !== "undefined") console.error(e.stack);
  }
  String.prototype.lastmessage = this;
};

/* Calculate an angle between two points */
Math.calcAngle = function(endx, endy) {
  var destx = endx; var desty = -endy;
  var deltaX = destx - 370; var deltaY = desty - (150 * -1);
  var angle = deltaY / deltaX;
  return desty - (angle * destx);
};

/* Distance between two points */
Math.lineDistance = function(x1, y1, x2, y2) {
  var xs = x2 - x1; xs = xs * xs;
  var ys = y2 - y1; ys = ys * ys;
  return Math.sqrt(xs + ys);
};

/* Has box collision occured */
Math.collides = function(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

/* Return x,y points on a three point curve */
Math.getCurvePoints = function(x1, y1, x2, y2, x3, y3, dir) {
  var a = ((y2-y1)*(x1-x3) + (y3-y1)*(x2-x1))/((x1-x3)*(x2*x2-x1*x1) + (x2-x1)*(x3*x3-x1*x1));
  var b = ((y2 - y1) - a*(x2*x2 - x1*x1)) / (x2-x1);
  var c = y1 - a*x1*x1 - b*x1;
  var points = [];
  if (x3 > x1) {
    for (var i = x1; i <= Math.abs(x3); i++) {
      points.push({"x":i, "y": (a * (i * i) + (b * i) + c)});
    }
  } else {
    for (var i = x1; i >= x3; i--) {
      points.push({"x":i, "y": (a * (i * i) + (b * i) + c)});
    }
  }
  return points;
};

/* File handler */
Element.prototype.getFile = function(options) {
  var reader = new FileReader();
  var file = this.files[0];
  reader.file = file;

  if (options.onload) {
    reader.onload = function(event) {
      if (options.onloadend)
        options.onloadend(this.file.name);
      if (options.type === "img")
        event.target.result.createImage(options.onload);
    };
  }

  reader.readAsDataURL(file);
  return reader;
}

/* Event listeners */
Element.prototype.addMultiListener = function(s, fn) {
  var evts = s.split(' ');
  for (var i = 0, iLen = evts.length; i < iLen; i++) {
    this.addEventListener(evts[i], fn, false);
  }
}

/* Canvas extensions */
if (typeof(CanvasRenderingContext2D) !== "undefined") {

  /* Clear canvas */
  CanvasRenderingContext2D.prototype.clear = function() {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  /* Write text with line wrap */
  CanvasRenderingContext2D.prototype.drawText = function(options) {
    if (!options.text) return false;

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
      text = String(text);
      var words = text.split(' ');
      var line = '';

      for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = maxWidth;
        var testWidth = maxWidth;
        if (context.measureText) {
          metrics = context.measureText(testLine);
          testWidth = metrics.width;
        }
        if (testWidth > maxWidth && n > 0) {
          context.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, y);
    }

    if (options.base) this.textBaseline = options.baseline;
    if (options.alignment) this.textAlign = options.alignment;
    if (options.color) this.fillStyle = options.color;
    if (!options.font) options.font = "18px Arial";
    this.font = options.font;

    if (options.maxWidth && options.lineHeight) {
      wrapText(this, options.text, options.x, options.y, options.maxWidth, options.lineHeight);
    } else {
      this.fillText(options.text, options.x, options.y);
    }
  };

  /* Draw line */
  CanvasRenderingContext2D.prototype.drawLine = function(options) {
    if (!options) return;
    this.beginPath();
    this.moveTo(options.x1, options.y1);
    this.lineTo(options.x2, options.y2);
    if (options.strokewidth) this.lineWidth = options.strokewidth;
    if (options.color) this.strokeStyle = options.color;
    this.stroke();
  };

  /* Draw circle */
  CanvasRenderingContext2D.prototype.drawCircle = function(options) {
    this.beginPath();
    this.arc(options.x, options.y, options.radius, 0, 2 * Math.PI, false);

    if (!options.color) options.color = "#000000";
    this.fillStyle = options.color;
    this.fill();

    if (!options.linewidth && !options.linecolor) return;
    if (!options.linewidth) options.linewidth = 0;
    if (!options.linecolor) options.linecolor = "#000000";
    this.lineWidth = options.linewidth;
    this.strokeStyle = options.linecolor;
    this.stroke();
  };

  /* Clear a circle */
  CanvasRenderingContext2D.prototype.clearCircle = function(options) {
    this.save();
    this.beginPath();
    this.arc(options.x, options.y, options.radius, 0, 2 * Math.PI, true);
    this.clip();
    this.clearRect(options.x - options.radius, options.y - options.radius, options.radius * 2, options.radius * 2);
    this.restore();
  };

  /* Draw rectangle */
  CanvasRenderingContext2D.prototype.drawRect = function(options) {
    this.fillStyle = options.color;
    this.fillRect(options.x,options.y,options.width,options.height);
  };

  /* Draw an image with rotation options */
  CanvasRenderingContext2D.prototype.draw = function(options) {
    this.save();
    this.translate(options.x + (options.width / 2), options.y + (options.height / 2));
    this.rotate(options.rotation * (Math.PI/180));

    var image = options.image;
    if (options.effect) {
      var canvas = document.createElement("canvas");
      canvas.width = options.width; canvas.height = options.height;
      var context = canvas.getContext("2d");
      context.drawImage(options.image, 0, 0, options.width, options.height);

      var imgData;
      switch (options.effect) {
        case "grayscale" :
          imgData = context.toGrayScale();
          break;
      }
      if (imgData) {
        context.putImageData(imgData, 0, 0);
        image = context.createImage();
      }
    }

    this.drawImage(image, -(options.width/2), -(options.height/2), options.width, options.height);
    this.restore();
  };

  /* Blends */
  CanvasRenderingContext2D.prototype.applyBlend = function(blend) {
    if (!blend) blend = 'source-over';
    this.globalCompositeOperation = blend;
  };

  CanvasRenderingContext2D.prototype.clearBlend = function() {
    this.globalCompositeOperation = 'source-over';
  };
}  