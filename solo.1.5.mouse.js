/* Setup mouse and touch */
function SoloMouse(element) {
  if (typeof(jQuery) !== "undefined") {
    if (jQuery(element).data("solomouse")) {
      return jQuery(element).data("solomouse");
    } else {
      jQuery(element).data("solomouse", {getMouse:getMouse});
    }
  }

  var start;
  var el = element;
  var mx, my;
  var left = 0, right = 0, middle = 0;
  var moved = false;
  var difference = 0, distance = 0;
  var angle = 0;
  var lastangle = false;
  var rotation = 0;
  var touches = 0;
  var velocity = 0;
  var speed = 0;
  var heldtime = 0;
  var lastheldtime = 0;
  var threshold = 1;
  var direction = "";

  function getMousePosition(e, finger) {
		var rect = e.target.getBoundingClientRect();
		if (!finger) finger = 0;
		if (e.touches) e = e.touches[finger];
		mx = e.clientX - rect.left;
		my = e.clientY - rect.top;
		return {"x":mx,"y":my};
  }

  el.addMultiListener("mousedown touchstart", function(e) {
		var xy = getMousePosition(e);
		e.preventDefault();
		if (e.touches) {
			e.button = 4;
			angle = 0; rotation = 0;
			lastangle = false;
			touches = e.touches.length;
		}
		switch(e.button) {
			case 0:
			case 4:
					left = 1;
					start = xy;
					difference = 0;
					distance = 0;
					moved = false;
          velocity = 0, speed = 0;
          heldtime = 0, lastheldtime = 0;
          direction = "";
					if (e.button === 0) {
						"io.left.down".fireEvent(e);
					} else {
						"io.touch.down".fireEvent(e);
					}
				break;
			case 1:
					middle = 1;
					"io.middle.down".fireEvent(e);
				break;
			case 2:
					right = 1;
					"io.right.down".fireEvent(e);
				break;
		}
  });

  el.addMultiListener("mousemove touchmove", function(e) {
		var xy = getMousePosition(e);
		if (start) {
			moved = true;

      if (lastheldtime > 0)
        heldtime += new Date().getTime() - lastheldtime;

			if (e.touches) touches = e.touches.length;
			if (e.touches && e.touches.length > 1) {
				right = 1;
				var fingerTwo = getMousePosition(e, 1);
				d = Math.lineDistance(xy.x, xy.y, fingerTwo.x, fingerTwo.y);
				angle = Math.calcAngle(xy.x, xy.y, fingerTwo.x, fingerTwo.y);
				if (lastangle !== false) {
					if (angle > lastangle) rotation = 1;
					if (angle < lastangle) rotation = -1;
					if (angle === lastangle) rotation = 0;
				}
				lastangle = angle;
			} else {
				d = Math.lineDistance(start.x, start.y, xy.x, xy.y);
			}

			if (d !== 0) difference = distance - d;
			distance = d;

      if (distance > 0 && heldtime > 0)
        speed = Math.abs(distance) / heldtime;
      if (distance > 0 && lastheldtime > 0)
        velocity = Math.abs(difference) / (new Date().getTime() - lastheldtime);
      if (distance > 0) {
        var a = Math.calcAngle(start.x, start.y, xy.x, xy.y);
        if (a >= -135 && a < -45) {
          direction = "up";
        } else if (a >= -45 && a < 45) {
          direction = "right";
        } else if (a >= 45 && a < 135) {
          direction = "down"
        } else {
          direction = "left";
        }
      }

      if (velocity > threshold && direction != "") {
        "io.swipe".fireEvent(e);
        ("io.swipe." + direction).fireEvent(e);
      }

			if (!e.touches) {
				"io.left.move".fireEvent(e);
			} else {
				"io.touch.move".fireEvent(e);
			}

      lastheldtime = new Date().getTime();
		}
  });

  el.addMultiListener("mouseup touchend", function(e) {
		e.preventDefault();
		if (e.touches) {
			if (e.touches.length >= 1) {
				if (e.touches.length === 1) {
					angle = 0; rotation = 0;
					lastangle = false;
					right = -1;
				}
				touches = e.touches.length;
				return; //Haven't finished with touches
			}
			e.button = 4;
		}
		switch(e.button) {
			case 0:
			case 4:
					left = -1;
					start = null;
					difference = 0;
					distance = 0;
					touches = 0;
          velocity = 0, speed = 0;
          heldtime = 0;
          direction = "";
					if (e.button === 0) {
						"io.left.up".fireEvent(e);
					} else {
						"io.touch.up".fireEvent(e);
						right = -1;
					}
				break;
			case 1:
					middle= -1;
					"io.middle.up".fireEvent(e);
				break;
			case 2:
					right = -1;
					"io.right.up".fireEvent(e);
				break;
		}
  });

  function getMouse() {
		return {
			left: left,
			right: right,
			middle: middle,
			distance: parseFloat(distance),
			difference: parseFloat(difference),
			start: start,
			x: mx,
			y: my,
			angle: angle,
			rotation: rotation,
			touches: touches,
      speed: speed,
      velocity: velocity,
      direction: direction
		}
  }

  function update() {
		if (left === -1) left = 0;
		if (middle === -1) middle = 0;
		if (right === -1) right = 0;
  }

  window.requestAnimationFrame(update);

  return {
		getMouse : getMouse
  };
}