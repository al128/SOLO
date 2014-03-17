/* Filter bank */

var SoloFilterBank = function() {

  /* http://www.html5rocks.com/en/tutorials/canvas/imagefilters/ */

  var filters = {};
  var tmpCanvas = document.createElement('canvas');
  var tmpCtx = tmpCanvas.getContext('2d');

  function createImageData(w, h, data) {
    var newdata = tmpCtx.createImageData(w, h);
    if (data) newdata.data.set(data);
    return newdata;
  };

  function createImage(w, h, data) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");
    var d = createImageData(w, h, data);
    ctx.putImageData(d, 0, 0);
    var img = document.createElement("img");
    img.src = c.toDataURL("image/png");
    return img;
  }

  function getFilters() {
    return filters;
  }

  function convolute(pixels, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side/2);

    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;

    var w = sw;
    var h = sh;
    var output = createImageData(w, h);
    var dst = output.data;

    var alphaFac = opaque ? 1 : 0;

    for (var y=0; y<h; y++) {
      for (var x=0; x<w; x++) {
        var sy = y;
        var sx = x;
        var dstOff = (y*w+x)*4;
        var r=0, g=0, b=0, a=0;
        for (var cy=0; cy<side; cy++) {
          for (var cx=0; cx<side; cx++) {
            var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
            var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
            var srcOff = (scy*sw+scx)*4;
            var wt = weights[cy*side+cx];
            r += src[srcOff] * wt;
            g += src[srcOff+1] * wt;
            b += src[srcOff+2] * wt;
            a += src[srcOff+3] * wt;
          }
        }
        dst[dstOff] = r;
        dst[dstOff+1] = g;
        dst[dstOff+2] = b;
        dst[dstOff+3] = a + alphaFac*(255-a);
      }
    }
    return output;
  };

  /* Filters */

  filters.composite = function(pixels, img, context) {
    if (img && context) {
      context.drawImage(img, 0, 0, context.canvas.width, context.canvas.height);
      pixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    }
    return pixels;
  }

  filters.blend = function(pixels, val, context) {
    if (val && context) {
      context.putImageData(pixels, 0, 0);
      context.applyBlend(val);
      pixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    }
    return pixels;
  }

  filters.kernels = function(pixels, weights) {
    return convolute(pixels, weights);
  }

  filters.sharpen = function(pixels) {
    return convolute(pixels,
    [0, -1,  0,
     -1,  5, -1,
    0, -1,  0]);
  }

  filters.blur = function(pixels) {
    return convolute(pixels,
    [1/9, 1/9, 1/9,
    1/9, 1/9, 1/9,
    1/9, 1/9, 1/9]);
  };

  filters.gaussian = function(pixels) {
    return convolute(pixels,
    [1/16, 1/8, 1/16,
    1/8, 1/4, 1/8,
    1/16, 1/8, 1/16]);
  };

  filters.laplacian = function(pixels) {
    return convolute(pixels, [0,0,-1,0,0,
    0,-1,-2,-1,0,
    -1,-2,16,-2,-1,
    0,-1,-2,-1,0,
    0,0,-1,0,0]);
  }

  filters.invert = function(pixels) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i+=4) {
      d[i] = 255 - d[i];
      d[i +1] = 255 - d[i+1];
      d[i+2] = 255 - d[i+2];
    }
    return pixels;
  };

  filters.grayscale = function(pixels) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i+=4) {
      var r = d[i];
      var g = d[i+1];
      var b = d[i+2];
      // CIE luminance for the RGB
      var v = 0.2126*r + 0.7152*g + 0.0722*b;
      d[i] = d[i+1] = d[i+2] = v
    }
    return pixels;
  };

  filters.brightness = function(pixels, adjustment) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      d[i] += adjustment;
      d[i+1] += adjustment;
      d[i+2] += adjustment;
    }
    return pixels;
  };

  filters.saturation = function(pixels, val) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];

      var luminace = (r * 0.299) + (g * 0.587) + (b * 0.114);
      var alpha = -val;

      r = ((1 - alpha) * r) + (alpha * luminace);
      g = ((1 - alpha) * g) + (alpha * luminace);
      b = ((1 - alpha) * b) + (alpha * luminace);

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    return pixels;
  };

  filters.contrast = function(pixels, v) {
    var d = pixels.data;

    v = (100 + v) / 100;
    v *= v;

    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];

      r /= 255;
      g /= 255;
      b /= 255;

      r = (((r - 0.5) * v) + 0.5) * 255;
      g = (((g - 0.5) * v) + 0.5) * 255;
      b = (((b - 0.5) * v) + 0.5) * 255;

      if (r > 255) {
        r = 255;
      } else if (r < 0) {
        r = 0;
      }

      if (g > 255) {
        g = 255;
      } else if (g < 0) {
        g = 0;
      }

      if (b > 255) {
        b = 255;
      } else if (b < 0) {
        b = 0;
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }

    return pixels;
  };

  filters.autolevel = function(pixels) {
    var d = pixels.data;
    var histogram = {};

    for (var i = 0; i < 256; i++) {
      histogram[i] = 0;
    }

    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      var brightest = (r * 0.299) + (g * 0.587) + (b * 0.114);
      brightest = Math.round(brightest);
      if (brightest > 255) { brightest = 255; }
      histogram[brightest]++;
    }

    var white = 255;
    var counter = 0;
    while ((counter < 200) && (white > 0)) {
      counter += histogram[white];
      white--;
    }
    var brightest = 1 + ((255 - white) / 256.0);

    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      var alpha = -0.2;
      r = ((1 - alpha) * r) + (alpha * brightest);
      g = ((1 - alpha) * g) + (alpha * brightest);
      b = ((1 - alpha) * b) + (alpha * brightest);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }

    return pixels;
  };

  filters.threshold = function(pixels, threshold) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i+=4) {
      var r = d[i];
      var g = d[i+1];
      var b = d[i+2];
      var v = (0.2126*r + 0.7152*g + 0.0722*b >= threshold) ? 255 : 0;
      d[i] = d[i+1] = d[i+2] = v
    }
    return pixels;
  };

  return {
    createImageData: createImageData,
    createImage: createImage,
    getFilters: getFilters
  }
}
var _solofilterbank = new SoloFilterBank();

/* Create custom filter using predefined bank */

function SoloFilter(settings) {
  var runnings = [];

  function init(s) {
    runnings = s.trim().toLowerCase().split(' ');
    for (var i = 0; i < runnings.length; i++) {
      var obj = {
        id: "",
        value: ""
      };
      if (runnings[i].indexOf(":") > -1) {
        var running = runnings[i].split(":");
        obj.id = running.shift().trim();

        var value = running;
        if (typeof(value) === "object")
          value = value.join(":");
        value = value.trim();

        switch (obj.id) {
          case 'composite':
              obj.value = value.createImage();
            break;
          case 'blend':
              obj.value = value;
            break;
          default:
              obj.value = parseFloat(value);
            break;
        }
      } else {
        obj.id = runnings[i].trim();
      }
      runnings[i] = obj;
    }
  }
  init(settings);

  function getPixels(img) {
    var c,ctx;
    if (img.getContext) {
      c = img;
      try { ctx = c.getContext('2d'); } catch(e) {}
    }
    if (!ctx) {
      c = getCanvas(img.width, img.height);
      ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
    }
    return ctx.getImageData(0, 0, c.width, c.height);
  }

  function getCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function runFilter(img, context) {
    var idata = filterImage(img, runnings, context);
    idata = _solofilterbank.createImage(idata.width, idata.height, idata.data);
    return idata;
  }

  function filterImage(image, runnings, context) {
    var pixels = getPixels(image);
    for (filter in runnings) {
      try {
        pixels = _solofilterbank.getFilters()[runnings[filter].id](pixels, runnings[filter].value, context);
      } catch (e) {
        ("Filter fail: " + filter).log(e);
      }
    }
    return pixels;
  };

  return {
    apply: runFilter
  }
}