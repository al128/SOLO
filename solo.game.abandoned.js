/*
	Baseline game object
*/
_$.createGameObject = function(x, y, w, h, dx, dy, img) {
	return new GameObj(x, y, w, h, dx, dy, img, false);
}
_$.createPlayer = function(x, y, w, h, dx, dy, img) {
	var obj = new GameObj(x, y, w, h, dx, dy, img, true);
	obj.prototype.draw = function(x,y) {
		if (this.active) {	
			if (x == null) x = this.x;
			if (y == null) y = this.y;
			if (this.right) {
				var animation = this.animations["walk_right"];
				animation.play();			
				_$.getGameLayer().drawImage(animation.img, animation.current.x, animation.current.y, animation.slide_width, animation.slide_height, x, y, this.width, this.height);			
			} else if (this.left) {
				var animation = this.animations["walk_left"];
				animation.play();			
				_$.getGameLayer().drawImage(animation.img, animation.current.x, animation.current.y, animation.slide_width, animation.slide_height, x, y, this.width, this.height);			
			} else if (this.direction == "left") {
				_$.getGameLayer().drawImage(this.animations["stand_left"], x, y, this.width, this.height);
			} else {
				_$.getGameLayer().drawImage(this.img, x, y, this.width, this.height);
			}
		}
	}
	return obj;
}
function GameObj(x, y, w, h, dx, dy, img, player) {	
	this.x = x;
	this.y = y;
	this.width = w;
	this.height = h;
	this.z = 0;
	this.dx = dx;
	this.dy = dy;
	this.jumpheight = 80;
	this.left = false;
	this.right = false;
	this.physics = true;
	this.collider = true;
	this.jumping = false;
	this.falling = false;
	this.player = player;	
	this.img = null;
	this.destroy = false;
	this.hp = 100;
	this.mp = 100;
	this.offense = 1;	
	this.defence = 1;
	this.gravity = 0.5;
	this.direction = "right";
	this.animations = [];
	
	if (img != null) {
		if (typeof(img) == "string") {
			this.img =_$.createImage(img);	
		} else {			
			this.img = img;
		}
	}
	
	if (player != false) {
		this.ai = false;		
	} else {
		this.ai = true;		
	}
	this.active = false;
	
	this.startJump = function() {
		if (!this.jumping && !this.falling) {
			this.origy = this.y;
			this.velocityy = this.dy;
			this.jumping = true;			
		}
	};

	this.handleJumping = function() {	
		if (this.jumping) {
			this.velocityy -= this.gravity;
			this.y -= this.velocityy;
			if (this.y < (this.origy - this.jumpheight) || this.velocityy <= 0) {
				this.stopJump();
			}
		}
		this.doFall();
	};
	
	this.stopJump = function() {		
		this.falling = true;
		this.jumping = false;
	};
	
	this.doFall = function(fall) {
		if (this.jumping || !this.falling) {
			return;
		}
		if (fall == null) {
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
		
		if (this.y >= this.origy) {
			this.falling = false;
		}
		
		if (this.y > this.origy) {
			/*this.destroy = true;*/
		}
	};
	
	this.handleMoving = function() {
		//if (this.jumping || this.falling) return;
		this.moveRight();
		this.moveLeft();
	};
	
	this.moveLeft = function() {	
		if (this.left) {
			this.doMove(-this.dx);
			this.direction = "left";
			/*this.steps += this.dx;*/
		}
	};

	this.moveRight = function() {
		if (this.right) {
			this.doMove(this.dx);	
			this.direction = "right";
			/*this.steps += this.dx;*/
		}
	};
	
	this.doMove = function(distance) {
		this.x += distance;		
		//if (this.x < -this.w) {
		if (this.x <= 0) {
			this.x = 0;
		}
		if (this.bounds) {
			if (this.x + this.width >= this.bounds.width) { 
				this.x = this.bounds.width - this.width;
			}
		} else {
			if (this.x + this.width >= _$.getGameScreen().width) { 
				this.x = _$.getGameScreen().width - this.width;
			}
		}
	};
	
	this.getCenter = function() {
		return Math.round(this.width * 0.5);
	};
}
GameObj.prototype.init = function() {
	this.active = true;	
}
GameObj.prototype.draw = function(x,y) {
	if (this.active) {		
		if (x == null) x = this.x;
		if (y == null) y = this.y;
		_$.getGameLayer().drawImage(this.img, x, y, this.width, this.height);			
	}
}
GameObj.prototype.update = function() {		
	if (this.active) {
		if (this.ai) {
			this.x += this.dx;
			this.y += this.dy;
		} else {			
			if (_$.io.active == true) {				
				if (_$.io.keys.left == 1) {					
					this.left = true;
				} else if (_$.io.keys.left == -1) {
					this.left = false;
				}
				if (_$.io.keys.right == 1) {					
					this.right = true;
				} else if (_$.io.keys.right == -1) {
					this.right = false;
				} 
				if (_$.io.keys.space == 1 || _$.io.keys.up == 1) {
					this.startJump();
				} else if (_$.io.keys.up == -1 || _$.io.keys.space == -1) {					
					this.stopJump();					
				}				
			}	
			this.handleMoving();			
			this.handleJumping();			
		}
	}
}
/*
	SOLO - LEVEL
	allows you to create various level components such as
	visual layers, logic layers, and parallax background layers
	
	Level utilises SOLO.PHYSICS which itself uses Box2D
	
	It can also create levels from various json structures to set
	up basic levels with a player start point, item start points,
	enemy start points, and the end goal
	
	A level also requires at least one camera which is setup here
	
	For more advanced levels please see the examples
*/

_$.createCamera = function(follow, bounds, active) {
	/*
		A camera is generally returned to a level
		A level can have multiple cameras, but will only
		call the draw function of an active camera
	*/
	var camera = {};		
	camera.reset = function(follow, bounds) {
		this.active = false;
		this.x = 0;
		this.origin = {"x":0, "y":0};
		this.translate = {"x":0, "y":0};
		this.y = 0;
		this.translatey = 0;
		this.width = Math.round(_$.getGameScreen().width / 2);
		this.center = Math.round(this.width / 2);
		this.height = _$.getGameScreen().height;
		this.follow = follow;
		this.dx = this.follow.dx;
		this.lastx = this.follow.x;
		if (bounds) 
			this.gameworld = {"width":bounds.width, "height":bounds.height};		
	};
	camera.reset(follow, bounds);
	if (active) camera.active = true;
	camera.update = function() {
		/*
			Update the camera position based on it's follow object
			This is called by the level last
		*/
		if (this.follow) {			
			if (this.follow.x != this.lastx){
				if (this.follow.x > this.lastx) {					
					this.x += this.canMoveLeft();
					if (this.gameworld) {
						if (this.x + this.width > this.gameworld.width)
							this.x = this.gameworld.width - this.width;
					}					
				} else {					
					this.x -= this.canMoveRight();
					if (this.x < 0) this.x = 0;					
				}
				this.lastx = this.follow.x;
			}
		}
	};
	camera.getOrigin = function() {
		/*Get screen pos of camera*/
		return this.x - this.x;
	};
	camera.canMoveLeft = function() {			
		var x = this.screenPos(this.follow.x).x + this.follow.getCenter();
		
		if (x >= this.center)
			return this.dx;
		if (x >= Math.round(this.center - (this.width * 0.15)))			
			return Math.round(this.dx / Math.min((this.center - x) / 10, 2.5));
		
		return 0;
	};
	camera.canMoveRight = function() {
		var x = this.screenPos(this.follow.x).x + this.follow.getCenter();
		
		if (x <= this.center)
			return this.dx;
		if (x <= Math.round(this.center + (this.width * 0.15)))			
			return Math.round(this.dx / Math.min(Math.abs(this.center - x) / 10, 2.5));
		
		return 0;
	}
	camera.draw = function(gamelayer, logiclayer, p_layers) {
		/*
			Setup context
		*/
		_$.getContext().translate(this.translate.x, this.translate.y);
		
		/*
			Draw background parallax layers
		*/		
		if (p_layers) {
			if (typeof(p_layers.length) != "undefined") {
				for (var i = 0; i < p_layers.length; i++) {
					if (p_layers[i].z >= 0)
						p_layers[i].draw({"x":this.x,"y":this.y,"origin":this.origin}, {"width":this.width,"height":this.height,"origin":this.getOrigin()});
				}				
			} else {
				if (p_layers.z >= 0)
					p_layers.draw({"x":this.x,"y":this.y,"origin":this.origin}, {"width":this.width,"height":this.height,"origin":this.getOrigin()});
			}
		}
		
		/*
			Draw game layer
		*/
		for (var i = 0; i < gamelayer.tiles.length; i++) {
			for (var j = 0; j < gamelayer.tiles[i].length; j++) {
				if (gamelayer.tiles[i][j] != null) {
					var tile = gamelayer.tiles[i][j];
					var xy = this.screenPos(tile.x, tile.y);					
					if (xy.x > /* this.screenPos(this.x).x */ -tile.width && xy.x - tile.width <= /* this.screenPos(this.x).x + */ this.width)
						tile.draw(xy.x, xy.y, this.x, this.width);						
				}
			}
		}
		if (gamelayer.player)
			gamelayer.player.draw(this.screenPos(gamelayer.player.x).x, gamelayer.player.y);
		
		/*
			Draw logic layer
		*/
		
		logiclayer.draw();
		
		/*
			Draw foreground parallax layers
		*/
		
		if (p_layers) {
			if (typeof(p_layers.length) != "undefined") {
				for (var i = 0; i < p_layers.length; i++) {
					if (p_layers[i].z < 0)
						p_layers[i].draw({"x":this.x,"y":this.y,"origin":this.origin}, {"width":this.width,"height":this.height,"origin":this.getOrigin()});
				}				
			} else {
				if (p_layers.z < 0)
					p_layers.draw({"x":this.x,"y":this.y,"origin":this.origin}, {"width":this.width,"height":this.height,"origin":this.getOrigin()});
			}
		}
		
		/*
			Reset context
		*/
		_$.getContext().translate(-this.translate.x, -this.translate.y);
		
	};
	camera.reassign = function(new_follow) {
		//Reassign which game object the camera is following
		this.obj = new_follow;
	};
	camera.worldPos = function(x, y) {
		//Convert x & y pos to game world	
		return {"x":x,"y":y};
	};
	camera.screenPos = function(x,y) {
		//Convert x & y pos to screen position
		return {"x":x - this.x,"y":y/* - this.y*/};
	};
	camera.visible = function(obj) {
		//Is object visible by camera
		return true;
	};
	return camera;
};

_$.createLevel = function(setup, player) {	
	var level = {};		
	// A level must have one game layer
	level.game = _$.createGameLayer(setup, player);	
	// A level must have one logic layer
	level.logic = _$.createLogicLayer();	
	// A level can have many parallax layers
	level.parallax = [];
	if (setup.parallax) {
		for (var i = 0; i < setup.parallax.length; i++) {
			var p = setup.parallax[i];			
			level.parallax.push(_$.createParallaxLayer(p.z, p.imgs, p.metrics, p.recycle, p.update));
		}
	}	
	// A level must have at least one camera	
	if (setup.cameras) {
	
	} else {
		level.camera = _$.createCamera(player, level.game.bounds, true);
	}	
	// Update layers and cameras
	level.update = function() {
		this.game.update();
		this.logic.update();
		if (this.parallax) {
			if (typeof(this.parallax.length) != "undefined") {
				for (var i = 0; i < this.parallax.length; i++) {
					this.parallax[i].update();
				}
			} else {
				this.parallax.update();
			}
		}
		if (this.camera.length != undefined) {
			for (var i = 0; i < this.camera.length; i++) {
				if (this.camera[i].active) this.camera[i].update();
			}
		} else {
			if (this.camera.active) {
				this.camera.update();
			}
		}
	}
	//Draw
	level.draw = function() {
		if (this.camera.length != undefined) {
			for (var i = 0; i < this.camera.length; i++) {
				if (this.camera[i].active) this.camera[i].draw(this.game);
			}
		} else {
			if (this.camera.active) {
				this.camera.draw(this.game, this.logic, this.parallax);
			}
		}
	}
	return level;
};

_$.setupTiles = function(w, h, imgs) {
	var tile = { "width":w, "height":h };
	tile.images = _$.createImageArray(imgs);		
	tile.tileImage = function() {
		return this.images[_$.random(this.images.length)];
	};
	return tile;
};

_$.createTile = function(x, y, w, h, img, update) {
	var tile = {"x":x, "y":y};
	tile.id = x + "_" + y;
	tile.width = w;
	tile.height = h;
	tile.img = img;
	tile.draw = function(x, y, cam_x, cam_width) {
		if (x == null) { x = this.x; }
		if (y == null) { y = this.y; }
		if (!cam_x && !cam_width) {
			_$.getGameLayer().drawImage(this.img, x, y, this.width, this.height);
		} else {			
			if (x < 0) {					
				x = Math.abs(x);
				_$.getGameLayer().drawImage(this.img, x, 0, this.width - x, this.height, 0, y, this.width - x, this.height);
			} else if (this.x + this.width > cam_x + cam_width) {				
				if ((cam_x + cam_width - this.x) > 0)					
					_$.getGameLayer().drawImage(this.img, 0, 0, cam_x + cam_width - this.x, this.height, x, y, cam_x + cam_width - this.x, this.height);
			} else {
				_$.getGameLayer().drawImage(this.img, x, y, this.width, this.height);
			}
		}
	}
	if (update) tile.update = function() { update(); };
	return tile;
};

_$.createPlatform = function() {

};

_$.createGameLayer = function(setup, player) {
	/*
		Game layer handles holds the player and visual tiles					
	*/
	var gamelayer = {};
	gamelayer.tile = _$.setupTiles(setup.tiles.width, setup.tiles.height, setup.tiles.imgs);
	gamelayer.player = player;
	gamelayer.tiles = [];
	var tile = 0;
	for (var i = 0; i < setup.height; i++) {
		var row = [];
		for (var j = 0; j < setup.width; j++) {
			if (setup.level.length == setup.width * setup.height) {
				row.push(setup.level[tile](j * gamelayer.tile.width, i * gamelayer.tile.height,
							gamelayer.tile.width, gamelayer.tile.height, gamelayer.tile.tileImage()));
			} else {
				row.push(_$.createTile(j * gamelayer.tile.width, i * gamelayer.tile.height, 
							gamelayer.tile.width, gamelayer.tile.height, gamelayer.tile.tileImage()));
			}
			tile++;
		}
		gamelayer.tiles.push(row);
	}
	gamelayer.bounds = {"width":gamelayer.tile.width * setup.width, "height":gamelayer.tile.height * setup.height};
	if (gamelayer.player) gamelayer.player.bounds = gamelayer.bounds;
	gamelayer.update = function() {
		if (this.player) 
			this.player.update();
	}
	return gamelayer;
};

_$.createLogicLayer = function() {
	/*
		Logic layer handles what the player can interact with
	*/
	var logiclayer = {};					
	logiclayer.update = function() {}
	logiclayer.draw = function() {}
	return logiclayer;
};

_$.createParallaxLayer = function(z, imgs, metrics, recycle, update) {
	/*
		Unlike logic and game layer, a level can draw multiple parallax layers
		parallax layers are defined by their z index
		Negative z indexes are drawn in front of the player
		Positive z indexes are draw behind the player
	*/
	var p_layer = {};
	p_layer.z = z;
	p_layer.x = metrics.x;
	p_layer.y = metrics.y;
	p_layer.width = metrics.width;
	p_layer.height = metrics.height;
	p_layer.dx = metrics.dx;
	p_layer.images = _$.createImageArray(imgs);
	p_layer.min_heights = [];
	p_layer.min_widths = [];
	p_layer.orig_length = p_layer.images.length;	
	p_layer.recycle = recycle;
	p_layer.update = function() {
		update();
	};	
	p_layer.draw = function(cam_offset, cam_bounds) {					
		for (var i = 0; i < this.images.length; i++) {			
			var x = (this.width * i) + this.x + ((cam_offset.origin.x - cam_offset.x) * this.dx);			
			if (x >= -this.width && x <= cam_bounds.width) {							
				var ax = Math.abs(x);
				if (typeof(this.min_heights[i]) == "undefined" && this.images[i].height > 0)
					this.min_heights[i] = Math.min(this.images[i].height, this.height);
				if (typeof(this.min_widths[i]) == "undefined"  && this.images[i].width > 0)
					this.min_widths[i] = Math.min(this.images[i].width, this.width);	
				if (x <= 0) {		
					var width = Math.min(this.min_widths[i] - ax, cam_bounds.width);					
					_$.getGameLayer().drawImage(this.images[i], ax, 0, width, this.min_heights[i], cam_bounds.origin, this.y, width, this.min_heights[i]);
				} else {										
					var width = cam_bounds.width - ax;
					_$.getGameLayer().drawImage(this.images[i], 0, 0, width, this.min_heights[i], x, this.y, width, this.min_heights[i]);
				}
					
				if (this.recycle && i == this.images.length - 1 && x + this.width <= cam_bounds.width) {				
					var place = i - (this.orig_length - 1);
					if (typeof(this.images[place]) == "undefined") place = this.orig_length - 1;
					this.images.push(this.images[place]);
				}
			}
		}
	};
	return p_layer;
};