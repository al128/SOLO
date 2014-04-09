function SoloRoot() {}
  var r = SoloRoot.prototype;
  r.x = 0, r.y = 0,
  r.startx = 0, r.starty = 0,
  r.lastx = 0, r.lasty = 0,
  r.dx = 8, r.dy = 8,
  r.direction = "", r.lastdirection = "",
  r.width = 0, r.height = 0,
  r.canvas, r.context,
  r.active = false, r.destroy = false,
  r.animations = [];
  r.addAnimation = function() {

  }
  r.create = function() {}
  r.cleanup = function() {}
  r.reset = function() {}
  r.update = function() {}
  r.draw = function() {}