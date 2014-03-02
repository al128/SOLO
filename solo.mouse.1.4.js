/* Setup mouse and touch */
function SoloMouse(element) {
  var start;
  var el = element;
  var mx, my;
  var left = 0, right = 0, middle = 0;
  var moved = false;
  var difference = 0, distance = 0;

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
		if (e.touches) e.button = 4;
		switch(e.button) {
			case 0:
			case 4:
					left = 1;
					start = xy;
					difference = 0;
					distance = 0;
					moved = false;
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
	
			if (e.touches && e.touches.length > 1) {
				right = 1;
				var fingerTwo = getMousePosition(e, 1);
				d = Math.lineDistance(fingerOne.x, fingerOne.y, fingerTwo.x, fingerTwo.y);
			} else {
				d = Math.lineDistance(start.x, start.y, xy.x, xy.y);
			}
	
			if (d !== 0) difference = distance - d;
			distance = d;
	
			if (!e.touches) {
				"io.left.move".fireEvent(e);
			} else {
				"io.touch.move".fireEvent(e);
			}
		}
  });

  el.addMultiListener("mouseup touchend", function(e) {
		getMousePosition(e);
		e.preventDefault();
		if (e.touches) e.button = 4;
		switch(e.button) {
			case 0:
			case 4:
					left = -1;
					start = null;
					difference = 0;
					distance = 0;
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
			y: my
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