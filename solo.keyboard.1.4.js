/* Setup keyboard */
function SoloKeyboard(el) {
  var left = 0;
  var right = 0;
  var down = 0;
  var up = 0;
  var space = 0;
  var action1 = 0;
  var action2 = 0;

  document.addMultiListener("keydown", function(e) {
		getKey(e, true);
  });
  document.addMultiListener("keyup", function(e) {
		getKey(e, false);
  });

  function getKey(e, down) {
		var val = 1; if (!down) val = -1;
		var key = String.fromCharCode(e.keyCode).toUpperCase().trim();
		switch (key) {
			case "W": up = val; break;
			case "D": right = val; break;
			case "A": left = val; break;
			case "S": down = val; break;
			case "E": action1 = val; break;
			case "Q": action2 = val; break;
			default:
			if (e.keyCode === 37) { left = val; e.preventDefault(); }
			if (e.keyCode === 39) { right = val; e.preventDefault(); }
			if (e.keyCode === 38) { up = val; e.preventDefault(); }
			if (e.keyCode === 32) { space = val; e.preventDefault(); }
			if (e.keyCode === 17) { action1 = val; }
			if (e.keyCode === 18) { action2 = val; }
			break;
		}
		return key;
  }

  function getKeyboard() {

  }

  function update() {
		if (left === -1) left = 0;
		if (right === -1) right = 0;
		if (down === -1) down = 0;
		if (up === -1) up = 0;
		if (space === -1) space = 0;
		if (action1 === -1) action1 = 0;
		if (action2 === -1) action2 = 0;
  }
  window.requestAnimationFrame(update);

  return {
		getKeyboard : getKeyboard
  };
}