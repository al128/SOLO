/* Polyfill */
(function () {
  'use strict';

  var AudioContext = window.AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  var AudioContextPrototype = AudioContext.prototype;

  Object.defineProperties(AudioContextPrototype, {
    createGain: {
      value: AudioContextPrototype.createGain || AudioContextPrototype.createGainNode
    },
    createDelay: {
      value: AudioContextPrototype.createDelay|| AudioContextPrototype.createDelayNode
    },
    createScriptProcessor: {
      value: AudioContextPrototype.createScriptProcessor || AudioContextPrototype.createJavaScriptNode
    }
  });

  var audioContext = new AudioContext(),
  oscillatorPrototype = audioContext.createOscillator().constructor.prototype,
  bufferSourcePrototype = audioContext.createBufferSource().constructor.prototype,
  gainGainConstructorPrototype = audioContext.createGain().gain.constructor.prototype;

  Object.defineProperties(oscillatorPrototype, {
    setPeriodicWave: {
      value: oscillatorPrototype.setPeriodicWave || oscillatorPrototype.setWaveTable
    },
    start: {
      value: oscillatorPrototype.start || oscillatorPrototype.noteOn
    },
    stop: {
      value: oscillatorPrototype.stop || oscillatorPrototype.noteOff
    }
  });

  Object.defineProperties(bufferSourcePrototype, {
    start: {
      value: bufferSourcePrototype.start || function start() {
        return arguments.length > 1 ? bufferSourcePrototype.noteGrainOn.apply(this, arguments) : bufferSourcePrototype.noteOn.apply(this, arguments);
      }
    },
    stop: {
      value: bufferSourcePrototype.stop || bufferSourcePrototype.noteOff
    }
  });

  Object.defineProperties(gainGainConstructorPrototype, {
    setTargetAtTime: {
      value: gainGainConstructorPrototype.setTargetAtTime || gainGainConstructorPrototype.setTargetValueAtTime
    }
  });
})();

/* Create simple sound from string path */
String.prototype.createSound = function(callback) {
  var audio = new Audio(this);
  if (callback) audio.addEventListener('canplaythrough', callback, false);
  return audio;
};

/* BufferLoader class */
function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

/* Sound class */
function SoloAudio(urls) {
  //http://www.html5rocks.com/en/tutorials/webaudio/intro/

  if (!AudioContext || System.os.toLowerCase() == "android") {
    setTimeout(function() {
      "solo.audio.loaded".fireEvent();
    }, 2000);
    return {
      "play": function(){},
      mute: function(){},
      "target": function(){},
      clear: function(){}
    }
  }

  var bufferLoader;
  var bufferList = [];
  var ac = new AudioContext();
  var nodes = {};
  var sources = {};
  var players = {};
  var ismute = false;

  function init(urls) {
    if (!urls) return;
    bufferLoader = new BufferLoader(
      ac,
      urls, //Array of strings
      finishedLoading
    );
    bufferLoader.load();
  }
  init(urls);

  function finishedLoading(list) {
    bufferList = list;
    for (var i = 0; i < bufferList.length; i++) {
      createSource(i, 0, true);
    }
    "solo.audio.loaded".fireEvent();
  }

  function mute() {
    for (n in nodes) {
      if (!ismute) {
        nodes[n].gain.value = 0;
      } else {
        nodes[n].gain.value = nodes[n].gain.lastvalue;
      }
    }
    ismute = !ismute;
  }

  function target(index, val) {
    if (typeof(nodes[index]) != "undefined")
      nodes[index].gain.targetvalue = val;
  }

  function clear() {
    for (n in sources) {
      sources[n].noteOff(0)
    }
    nodes = null;
    sources = null;
    players = null;
    ac = null;
  }

  function play(index, volume, loop) {
    if (sources[index]) {
      sources[index].loop = loop || false;
      if (isNaN(volume))
        volume = 1;
      if (ismute) {
        nodes[index].gain.value = 0;
      } else {
        nodes[index].gain.value = volume;
      }
      nodes[index].gain.lastvalue = volume;
      nodes[index].gain.targetvalue = volume;
      nodes[index].gain.customtimer = volume;
      nodes[index].gain.customupdate = function() {
        var that = this;
        clearTimeout(that.customtimer);
        that.value = Math.round(that.value * 10) / 10;
        that.lastvalue = that.value;
        if (that.targetvalue > that.lastvalue) {
          that.lastvalue += 0.1;
        } else if (that.targetvalue < that.lastvalue) {
          that.lastvalue -= 0.1;
        }
        that.lastvalue = Math.min(that.lastvalue, 1);
        that.lastvalue = Math.max(that.lastvalue, 0);
        if (!ismute) {
          that.value = that.lastvalue;
        }
        that.customtimer = setTimeout(function(){
          that.customupdate();
        }, 50);
      }
      nodes[index].gain.customupdate();
      if (sources[index].hasstarted == false) {
        sources[index].start(0);
        sources[index].hasstarted = true;
      }
    }
  }

  function createSource(index, volume, loop) {
    if (!ac.createGain)
      ac.createGain = ac.createGainNode;

    if (!nodes[index])
      nodes[index] = ac.createGain();

    var gainNode = nodes[index];
    var source = ac.createBufferSource();
    source.buffer = bufferList[index];

    source.hasstarted = false;

    // Connect source to a gain node
    source.connect(gainNode);

    // Connect gain node to destination
    gainNode.connect(ac.destination);

    sources[index] = source;
  }

  return {
    play: play,
    mute: mute,
    target: target,
    clear: clear
  }
}