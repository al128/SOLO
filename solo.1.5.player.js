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
    if (animations["idle"])
      currimg = animations["idle"].play();
    if (updated && animations["walk_" + direction]) {
      currimg = animations["walk_" + direction].play();
      animations["dead_" + direction].play(); //Sync
    }
    if (updated && direction == "" && previousdirection != "" && animations["walk_" + previousdirection])
      currimg = animations["walk_" + previousdirection].getStatic();
    if (destroy && animations["dead_" + direction])
      currimg = animations["dead_" + direction].play();
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
  var active = false; //Running on update
  var start; //Start time in ms
  var current = 0; //Current slide index
  var interval = 500; //Time between slides in ms
  var repeat = true; //Recycle animation
  var slides = 0; //Number of slides
  var width = 0, height = 0; //Width/height of each slide in pixels
  var image; //Contains our sprites
  var originx = 0;
  var originy = 0;
  var offsetx = 0, offsety;
  var pingpong = false;
  var direction = "right";
  var static_index = 0;
  var vertical = false;

  var context;
  var canvas;

  function init(s) {
    start = getCurrentTime();

    if (s.image) image = s.image;
    if (s.width) width = parseInt(s.width);
    if (s.height) height = parseInt(s.height);
    if (s.slides) slides = parseInt(s.slides);
    if (s.interval) interval = parseInt(s.interval);
    if (s.repeat) repeat = s.repeat;
    if (s.originx) originx = s.originx;
    if (s.originy) originy = s.originy;
    if (s.pingpong) pingpong = true;
    if (s.vertical) {
      vertical = true;
    }
    if (s.static) static_index = s.static;
    if (s.offsetx) offsetx = s.offsetx;
    if (s.offsety) offsety = s.offsety;

    if (width === 0) width = Math.floor(image.naturalWidth / s.slides);
    if (height === 0) height = width;

    resume();
  }
  init(animation_settings);

  function static() {
    return createCurrentImage(static_index);
  }

  function play() {
    if (!active) return current_image;
    return update();
  };

  function update() {
    if (getCurrentTime() - start > interval)
      return next();
    if (canvas)
      return canvas;
    return createCurrentImage();
  };

  function next() {
    start = getCurrentTime();

    if (direction == "right")
      current++;
    if (direction == "left")
      current--;

    if (current < 0) {
      current ++;
      direction = "right";
    }

    if (current >= slides) {
      if (pingpong) {
        current -= 2;
        direction = "left";
      } else if (repeat) {
        current = 0;
      }
    }

    return createCurrentImage();
  };

  function getCurrentTime() {
    return new Date().getTime();
  }

  function pause() {
    active = false;
  };

  function resume() {
    active = true;
  };

  function createCurrentImage(i) {
    if (!i) i = current;
    if (!canvas) canvas = document.createElement("canvas");
    if (!context) context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    if (vertical) {
      context.drawImage(image, -offsetx -(originx), -offsety - originy - (height * i), image.naturalWidth, image.naturalHeight);
    } else {
      context.drawImage(image, -offsetx - originx - (width * i), -offsety -(originy), image.naturalWidth, image.naturalHeight);
    }
    return canvas;
  }

  return {
    play : play,
    next: next,
    pause: pause,
    resume: resume,
    getStatic: static
  }
};