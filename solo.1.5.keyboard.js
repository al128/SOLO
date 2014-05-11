/* Setup keyboard */
function SoloKeyboard() {
  if (System.os.toLowerCase() == "android" || System.os.toLowerCase() == "ios") {
    return {getKeys: function(){ return {
      "left": 0,"right": 0,"down": 0,"up": 0,"space": 0,"action1": 0,"action2": 0
    }}};
  }

  if (typeof(jQuery) !== "undefined") {
    if (jQuery(document).data("solokeyboard")) {
      return jQuery(document).data("solokeyboard");
    } else {
      jQuery(document).data("solokeyboard", {getKeys : getKeyboard});
    }
  }

  var left = 0;
  var right = 0;
  var down = 0;
  var up = 0;
  var space = 0;
  var action1 = 0;
  var action2 = 0;

  $(document).on("keydown", function(e) {
		getKey(e, true);
  });
  $(document).on("keyup", function(e) {
		getKey(e, false);
  });

  function getKey(e, _down) {
		var val = 1;
    var ev = "io.key.down";
    if (!_down) {
      val = -1;
      ev = "io.key.up";
    }
    ev.fireEvent(e);

		var key = String.fromCharCode(e.keyCode).toUpperCase().trim();
		switch (key) {
			case "W": up = val; ev += "up"; break;
			case "D": right = val; ev += "right"; break;
			case "A": left = val; ev += "left"; break;
			case "S": down = val; ev += "down"; break;
			case "E": action1 = val; ev += "action1"; break;
			case "Q": action2 = val; ev += "action2"; break;
			default:
			if (e.keyCode === 37) { left = val; e.preventDefault(); }
			if (e.keyCode === 39) { right = val; e.preventDefault(); }
			if (e.keyCode === 38) { up = val; e.preventDefault(); }
      if (e.keyCode === 40) { down = val; e.preventDefault(); }
			if (e.keyCode === 32) { space = val; e.preventDefault(); }
			if (e.keyCode === 17) { action1 = val; }
			if (e.keyCode === 18) { action2 = val; }
			break;
		}

    ev.fireEvent(e);
		return key;
  }

  function getKeyboard() {
    return {
      "left": left,
      "right": right,
      "down": down,
      "up": up,
      "space": space,
      "action1": action1,
      "action2": action2
    }
  }

  function update() {
  	if (left === -1) left = 0;
  	if (right === -1) right = 0;
  	if (down === -1) down = 0;
  	if (up === -1) up = 0;
  	if (space === -1) space = 0;
  	if (action1 === -1) action1 = 0;
  	if (action2 === -1) action2 = 0;
    requestAnimationFrame(update);
  }
  update();


  return {
		getKeys : getKeyboard
  };
}