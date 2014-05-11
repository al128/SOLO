/* Requires solo.base and solo.keyboard */

function SoloCharacterControl(context, options) {

  /* Init */

  var x = 0, y = 0;
  var lastx, lasty;
  var width = 48, height = 48;
  var origx, origy;
  var dx = 4, dy = 4;
  var velocityy;
  var steps = 0;
  var jumping = false, falling = false;
  var collider = true;
  var destroy = false;
  var hp = 100, mp = 100, ap = 10;
  var direction = "right", previousdirection = "right", desireddirection = "";
  var animations = {};
  var controllable = true;
  var active = false;
  var bounds;
  var gscreen;
  var gravity = 0.5, jumpheight = 10;
  var keyboard, mouse;
  var type = "sidescroller";
  var pacman = false; //Assigning pacman variable keeps player moving until told to stop
  var canchange = true;
  var o_options;
  var updated = false;

  function setupBounds(gscreen) {
    bounds = {
      x: 0,
      y: 0,
      width: gscreen.canvas.width,
      height: gscreen.canvas.height
    };
  }

  function addAnimation(options) {
    animations[options.key] = new SoloAnimation(options);
  }

  function init(context, options) {
    if (!context) return;
    o_options = options;
    gscreen = context;
    setupBounds(gscreen);

    canchange = true;
    direction = "right";
    previousdirection = "right";
    desireddirection = "";

    if (options.x) x = options.x;
    if (options.y) y = options.y;
    if (options.width) width = options.width;
    if (options.height) height = options.height;
    if (options.dx) dx = options.dx;
    if (options.dy) dy = options.dy;
    if (options.controllable) controllable = options.controllable;
    if (options.type) type = options.type;
    if (options.direction) direction = options.direction;
    if (options.pacman) pacman = options.pacman;

    keyboard = new SoloKeyboard();
    if (SoloMouse) {
      mouse = new SoloMouse(context.canvas);
      registerMouse();
    }

    origx = x;
    origy = y;

    destroy = false;
    active = true;
  }
  init(context, options);

  function registerMouse() {
    var directions = ["left", "right", "up", "down"];
    for (var i = 0 ; i < directions.length; i++) {
      (function(d) {
        ("io.swipe." + d).registerEvent(function(){
          if (canchange) {
            direction = d;
          } else {
            desireddirection = d;
          }
        });
      })(directions[i]);
    }
  }

  function reset(_level) {
    if (_level) level = _level;
    init(gscreen, o_options);
  }

  /* Updating */

  function handleMoving() {
    if (!moveLeft())
      if (!moveDown())
        if (!moveUp())
          if (!moveRight())
            direction = "";
  };

  function moveLeft() {
    if (direction !== "left") return;
    doHMove(-dx);
    return true;
  };

  function moveRight() {
    if (direction !== "right") return;
    doHMove(dx);
    return true;
  };

  function moveUp() {
    if (direction !== "up") return;
    doVMove(-dy);
    return true;
  }

  function moveDown() {
    if (direction !== "down") return;
    doVMove(dy);
    return true;
  }

  function doHMove(distance) {
    x += distance;
    steps++;

    if (x <= bounds.x) x = bounds.x;
    if (x + width >= bounds.width)
      x = bounds.width - width;
  };

  function doVMove(distance) {
    y += distance;
    steps++;

    if (y <= bounds.y) y = bounds.y;
    if (y + height >= bounds.height)
      y = bounds.height - height;
  };

  function startJump() {
    if (jumping || falling) return;
    origy = y;
    velocityy = dy;
    jumping = true;
  };

  function handleJump() {
    if (jumping) {
      velocityy -= gravity;
      y -= velocityy;
      if (y < (origy - jumpheight) || velocityy <= 0)
        stopJump();
    }
    doFall();
  };

  function stopJump() {
    falling = true;
    jumping = false;
  };

  function doFall(fall) {
    return;
    if (jumping || !falling) return;

    if (!fall) {
      this.velocityy += this.gravity;
      if (this.velocityy <= this.dy) {
        fall = this.velocityy;
      } else {
        fall = 0;
      }
    }

    if (fall > 0) {
      this.falling = true;
      this.y += fall;
      if (this.y > this.origy) {
        this.y = this.origy;
      }
    } else if (fall == 0) {
      this.y = this.origy;
      this.falling = false;
    }

    if (this.y >= this.origy)
      this.falling = false;
    if (this.y > this.origy)
      destroy = true;
  };

  function update(colliders) {
    updated = true;

    if (direction != "") previousdirection = direction;

    lastx = x;
    lasty = y;

    if (active && !controllable) {
      x += dx;
      y += dy;
      return;
    }

    keys = keyboard.getKeys();
    cursor = mouse.getMouse();

    if (keys.left === 1)
      desireddirection = "left";
    if ((keys.left === 1 || cursor.direction == "left") && (canchange || direction == "right"))
      direction = "left";
    if (keys.left === -1 && !pacman)
      if (direction == "left") direction = "";

    if (keys.right === 1)
      desireddirection = "right";
    if ((keys.right === 1 || cursor.direction == "right") && (canchange || direction == "left"))
      direction = "right";
    if (keys.right === -1 && !pacman)
      if (direction == "right") direction = "";

    if (type != "topdown") {
      if (keys.space === 1 || keys.up === 1)
        startJump();
      if (keys.up === -1 || keys.space === -1)
        stopJump();
    } else {
      if (keys.up === 1)
        desireddirection = "up";
      if ((keys.up === 1 || cursor.direction == "up") && (canchange || direction == "down"))
        direction = "up";
      if (keys.up === -1 && !pacman)
        if (direction == "up") direction = "";

      if (keys.down === 1)
        desireddirection = "down";
      if ((keys.down === 1 || cursor.direction == "down") && (canchange || direction == "up"))
        direction = "down";
      if (keys.down === -1 && !pacman)
        if (direction == "down") direction = "";
    }

    if (!active) return;

    handleMoving();
    if (colliders)
      for (var i = 0; i < colliders.length; i++) {
        if (colliders[i].collider)
          switch (direction) {
            case 'right':
              if (x + width > colliders[i].x && x + width < colliders[i].x + colliders[i].width)
                if (y >= colliders[i].y && y < colliders[i].y + colliders[i].height)
                  undo();
              break;
            case 'left':
              if (x >= colliders[i].x && x < colliders[i].x + colliders[i].width)
                if (y >= colliders[i].y && y < colliders[i].y + colliders[i].height)
                  undo();
              break;
            case 'up':
              if (x >= colliders[i].x && x < colliders[i].x + colliders[i].width)
                if (y >= colliders[i].y && y < colliders[i].y + colliders[i].height)
                  undo();
              break;
            case 'down':
              if (x >= colliders[i].x && x < colliders[i].x + colliders[i].width)
                if (y + height > colliders[i].y && y + height < colliders[i].y + colliders[i].height)
                  undo();
              break;
          }
      }

    if (type != "topdown")
      handleJump();

    return getBoundingBox();
  }

  function updatePosition(_x, _y, _dx, _dy) {
    if (!isNaN(_x)) x = _x;
    if (!isNaN(_y)) y = _y;
    if (!isNaN(_dx)) dx = _dx;
    if (!isNaN(_dy)) dy = _dy;
  }

  function undo() {
    if (!lastx || !lasty) return;
    x = lastx;
    y = lasty;
    direction = "";
  }

  function cantChange() {
    canchange = false;
  }

  function canChange() {
    canchange = true;
    if (pacman && desireddirection != "" && desireddirection != previousdirection)
      direction = desireddirection;
  }

  function moveStop() {
    direction = "";
  }

  /* Drawing */

  function draw() {
    var currimg;

    if (destroy && animations["dead_" + direction]) {
      currimg = animations["dead_" + direction].play();
    } else if (updated && direction == "" && previousdirection != "" && animations["walk_" + previousdirection]) {
      currimg = animations["walk_" + previousdirection].getStatic();
    } else if (updated && animations["walk_" + direction]) {
      currimg = animations["walk_" + direction].play();
      animations["dead_" + direction].play(); //Sync
    } else if (animations["idle"]) {
      currimg = animations["idle"].play();
    }

    if (currimg) {
      if (pacman) {
        gscreen.drawImage(currimg, x - (width * 0.25), y - (height * 0.25), width * 1.75 , height * 1.75);
      } else {
        gscreen.drawImage(currimg, x, y, width, height);
      }
    }
  }

  function getBoundingBox() {
    return {
      "x": x,
      "y": y,
      "width": width,
      "height": height,
      "dx": dx,
      "dy": dy,
      "direction": direction
    }
  }

  function getDirection() {
    return direction;
  }

  function kill() {
    destroy = true;
  }

  function isDead() {
    return destroy;
  }

  return {
    update: update,
    draw: draw,
    addAnimation: addAnimation,
    getBoundingBox: getBoundingBox,
    undo: undo,
    stopMoving: moveStop,
    getDirection: getDirection,
    cantChange: cantChange,
    canChange: canChange,
    kill: kill,
    isDead: isDead,
    updatePosition: updatePosition,
    reset: reset
  }
}

function SoloAnimation(animation_settings) {
  this.init(animation_settings);
};
var _SoSAnim = SoloAnimation.prototype;

  _SoSAnim.active = false; //Running on update
  _SoSAnim.start; //Start time in ms
  _SoSAnim.current = 0; //Current slide index
  _SoSAnim.interval = 500; //Time between slides in ms
  _SoSAnim.repeat = true; //Recycle animation
  _SoSAnim.slides = 0; //Number of slides
  _SoSAnim.width = 0, height = 0; //Width/height of each slide in pixels
  _SoSAnim.image; //Contains our sprites
  _SoSAnim.originx = 0;
  _SoSAnim.originy = 0;
  _SoSAnim.offsetx = 0, _SoSAnim.offsety = 0;
  _SoSAnim.pingpong = false;
  _SoSAnim.direction = "right";
  _SoSAnim.static_index = 0;
  _SoSAnim.vertical = false;

  _SoSAnim.canvas;
  _SoSAnim.context;

  _SoSAnim.init = function(s) {
    this.start = this.getCurrentTime();

    if (s.image) this.image = s.image;
    if (s.width) this.width = parseInt(s.width);
    if (s.height) this.height = parseInt(s.height);
    if (s.slides) this.slides = parseInt(s.slides);
    if (s.interval) this.interval = parseInt(s.interval);
    if (s.repeat) this.repeat = s.repeat;
    if (s.originx) this.originx = s.originx;
    if (s.originy) this.originy = s.originy;
    if (s.pingpong) this.pingpong = true;
    if (s.vertical) this.vertical = true;
    if (s.static) this.static_index = s.static;
    if (s.offsetx) this.offsetx = s.offsetx;
    if (s.offsety) this.offsety = s.offsety;

    if (this.width === 0) this.width = Math.floor(this.image.naturalWidth / this.slides);
    if (this.height === 0) this.height = this.width;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext('2d');

    this.resume();
  };

  _SoSAnim.getStatic = function() {
    return this.createCurrentImage(this.static_index);
  };

  _SoSAnim.play = function() {
    if (!this.active) return this.canvas;
    return this.update();
  };

  _SoSAnim.update = function() {
    if (this.getCurrentTime() - this.start > this.interval)
      return this.next();
    if (this.canvas)
      return this.canvas;
  };

  _SoSAnim.next = function() {
    this.start = this.getCurrentTime();

    if (this.direction == "right")
      this.current++;
    if (this.direction == "left")
      this.current--;

    if (this.current < 0) {
      this.current ++;
      this.direction = "right";
    }

    if (this.current >= this.slides) {
      if (this.pingpong) {
        this.current -= 2;
        this.direction = "left";
      } else if (this.repeat) {
        this.current = 0;
      }
    }

    return this.createCurrentImage();
  };

  _SoSAnim.getCurrentTime = function() {
    return Date.now();
  };

  _SoSAnim.pause = function() {
    this.active = false;
  };

  _SoSAnim.resume = function() {
    this.active = true;
  };

  _SoSAnim.createCurrentImage = function(i) {
    if (!i) i = this.current;

    this.context.clear();

    if (this.vertical) {
      this.context.drawImage(this.image, -this.offsetx -(this.originx), -this.offsety - this.originy - (this.height * i), this.image.naturalWidth, this.image.naturalHeight);
    } else {
      this.context.drawImage(this.image, -this.offsetx - this.originx - (this.width * i), -this.offsety -(this.originy), this.image.naturalWidth, this.image.naturalHeight);
    }

    return this.canvas;
  };