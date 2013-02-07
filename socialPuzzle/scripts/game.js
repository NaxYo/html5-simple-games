var MESA_LORCO = {};

MESA_LORCO.directory = 'images/sprites/';
MESA_LORCO.sprites   = [ '2.png', '3.png', '6.png', '8.png', '12.png', '16.png', '18.png', '20.png' ];

MESA_LORCO.game = (function () {
	var ctx;
	var spriteSize;
	var objects;

	var time, lastTick, tTime;
	var maxX, maxY;

	var height;
	var width;

	var stop, onStop;

	var puntos;

	function newObject() {
		var obj = MESA_LORCO.objeto();
		var sprite = Math.random()*MESA_LORCO.sprites.length;
		sprite = Math.floor(sprite);
		sprite = MESA_LORCO.directory + MESA_LORCO.sprites[sprite];

		obj.init(sprite);

		return obj;
	}

	function deleteObject(tipo, p) {
		if( p.x >= 0 && p.x < maxX &&
			p.y >= 0 && p.y < maxY &&
			objects[p.x][p.y] &&
			objects[p.x][p.y].getTipo() === tipo) {

			objects[p.x][p.y] = null;

			var t = 1;
			t += deleteObject(tipo, { x: p.x+1, y: p.y   });
			t += deleteObject(tipo, { x: p.x-1, y: p.y   });
			t += deleteObject(tipo, { x: p.x,   y: p.y+1 });
			t += deleteObject(tipo, { x: p.x,   y: p.y-1 });

			return t;
		} else
			return 0;
	}

	function init(mX,mY,oS) {
		if($('#mesa-lorco').length === 0) {
			var $canvas = $('<canvas id="mesa-lorco">');
			$('#page').append($canvas);

			var canvas = $canvas[0];
			ctx = canvas.getContext('2d');

			onStop = oS;
			maxX = mX;
			maxY = mY;
			spriteSize = { width: 0, height: 0 };
		}

		lastTick = time = new Date();
		tTime = 60;
		puntos = 0;

		objects = [];
		for(var x = 0; x < maxX; x++) {
			objects.push([]);

			for(var y = 0; y < maxY; y++)
				objects[x].push(newObject());
		}

		stop = false;
		gameLoop();
	}

	function gameLoop() {
		var tick = new Date();
		var lapse = ( tick - time ) / 1000;
		var dif   = ( tick - lastTick) / 1000 ;
		lastTick = tick;

		tTime -= lapse/1000;
		if(tTime < 0) {
			tTime = 0;
			stop = true;
		}

		ctx.fillStyle = '#555';
		ctx.fillRect(0, 0, width, height);

		for(var x in objects)
			for(var y in objects[x]) {
				try {
					objects[x][y].draw(
						ctx,
						{
							x: x*spriteSize.width,
							y: y*spriteSize.height
						}
					);
				} catch(err) { }
			}

		ctx.font = 'bold 16pt Helvetica';
		ctx.fillStyle = '#FFF';
		ctx.fillText('Puntos: '+puntos, 50, height-40);
		ctx.fillText(parseInt(tTime), width-95, height-40);

		if(stop) {
			alert("¡Has conseguido "+puntos+" puntos!");
			onStop();
		}

		stop || requestAnimFrame(gameLoop);
	}

	function click(p) {
		p.x = Math.floor(p.x/spriteSize.width);
		p.y = Math.floor(p.y/spriteSize.height);

		if( p.x >= 0 && p.x < maxX && p.y >= 0 && p.y < maxY) {
			var vecino = false;
			var tipo = objects[p.x][p.y].getTipo();
			var pVecinos = [
				{ x: p.x+1, y: p.y   },
				{ x: p.x-1, y: p.y   },
				{ x: p.x,   y: p.y+1 },
				{ x: p.x,   y: p.y-1 }
			];

			for(var i in pVecinos) {
				var v;
				try {
					v = objects[pVecinos[i].x][pVecinos[i].y].getTipo() === tipo;
				} catch(err) {
					v = false;
				}

				vecino |= v;
			}

			if(vecino) {
				var total = deleteObject(tipo, p) - 1;
				total *= total;

				puntos += total;
				tTime += 5;
			}
		}

		for(var x = 0; x < maxX; x++)
			for(var y = 0; y < maxY; y++)
				if(!objects[x][y]) {
					for(var i = y; i>0; i--)
						objects[x][i] = objects[x][i-1];

					objects[x][0] = newObject();
					y--;
				}
	}

	function setSize(s) {
		s.width += 2;
		s.height += 2;

		spriteSize.width = spriteSize.width>s.width?spriteSize.width:s.width;
		spriteSize.height = spriteSize.height>s.height?spriteSize.height:s.height;

		height = maxY*spriteSize.height+100;
		width  =  maxX*spriteSize.width;

		var canvas = $('#mesa-lorco');
		canvas.attr('width', width);
		canvas.attr('height', height);
	}

	return {
		init: init,
		click: click,
		setSize: setSize
	};
})();


MESA_LORCO.objeto = function () {
	var sprite;
	var y;

	function draw(ctx, p) {
		y = y+5>p.y?p.y:y+5;

		ctx.save();
		ctx.drawImage(sprite, p.x, y);
		ctx.restore();
	}

	function init(_s) {
		y = 0;

		sprite = new Image();
		sprite.src = _s;

		sprite.onload = function() {
			MESA_LORCO.game.setSize(this);
		}
	}

	function getTipo() {
		return sprite.src;
	}

	return {
		init: init,
		getTipo: getTipo,
		draw: draw
	};
};

window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame   || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		function( callback ){
		window.setTimeout(callback, 1000 / 60);
	};
})();
