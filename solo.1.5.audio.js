/* Polyfill */
(function () {
  'use strict';

  var
  AudioContext = window.AudioContext = window.AudioContext || window.webkitAudioContext,
  AudioContextPrototype = AudioContext.prototype;

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

  var
  audioContext = new AudioContext(),
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
  var bufferLoader;
  var bufferList = [];
  var ac = new AudioContext();
  var nodes = {};
  var sources = {};
  var players = {};

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
  }

  function play(index, volume, loop) {
    if (!bufferList[index]) {
      clearTimeout(players[index]);
      players[index] = setTimeout(function(){
        play(index, volume, loop);
      }, 50);
      return;
    }
    if (sources[index]) {
      sources[index].loop = loop || false;
      if (isNaN(volume))
        volume = 1;
      nodes[index].gain.value = volume;
      if (sources[index].playbackState == 0)
        sources[index].start(0);
      return;
    }
    createSource(index, volume, loop);
    play(index, volume, loop);
  }

  function createSource(index, volume, loop) {
    if (!ac.createGain)
      ac.createGain = ac.createGainNode;

    if (!nodes[index])
      nodes[index] = ac.createGain();

    var gainNode = nodes[index];
    var source = ac.createBufferSource();
    source.buffer = bufferList[index];

    // Connect source to a gain node
    source.connect(gainNode);

    // Connect gain node to destination
    gainNode.connect(ac.destination);

    sources[index] = source;
  }

  return {
    play: play
  }
}