var TRAPABOLA = {};

TRAPABOLA.blockSize = 25;

TRAPABOLA.game = (function () {
	var ctx;

	var bolitas;
	var tablero;
	var muros;
	var level;
	var vidas;
	var puntos, puntosTmp;
	var onStop;

	var height;
	var width;

	var stop = false;

	var lastTick;

	function init(_w, _h, _f) {
		height = _h || height;
		width  = _w || width;
		onStop = _f||onStop;

		if($('#trapa-bola').length === 0) {
			$('#page').append('<canvas id="trapa-bola">');

			var $canvas = $('#trapa-bola');
			$canvas.attr('width', width);
			$canvas.attr('height', height);
			var canvas = $canvas[0];
			ctx = canvas.getContext('2d');

			$('#trapa-bola').mousedown(function(e) {
				var parentOffset = $(this).parent().offset();

				var x = e.pageX - e.target.offsetLeft - parentOffset.left;
				var y = e.pageY - e.target.offsetTop  - parentOffset.top;

				$('#trapa-bola').one('mouseup', function(e) {
					return function(x0, y0){
						var parentOffset = $('#trapa-bola').parent().offset();

						var x1 = e.pageX - e.target.offsetLeft - parentOffset.left;
						var y1 = e.pageY - e.target.offsetTop  - parentOffset.top;

						if(tablero.getBlock(x0,y0) === false && muros.length === 0) {
							var direccion = Math.abs(x0-x1)>Math.abs(y0-y1)?'h':'v';

							var m = TRAPABOLA.muro();
							m.init(x0, y0, direccion==='h'?0:1);
							muros.push(m);
							m = TRAPABOLA.muro();
							m.init(x0, y0, direccion==='h'?2:3);
							muros.push(m);
						}
					}(x, y);
				});
			});

			$('#trapa-bola').bind('touchstart touchmove touchend', 
				function() {
					var x0, y0;

					return function(e) {
						e.preventDefault();
						var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
						var elm = $(this).offset();


						var x = touch.pageX - elm.left;
						var y = touch.pageY - elm.top;

						if(x < $(this).width() && x > 0){
							if(y < $(this).height() && y > 0){
								if(e.type == 'touchstart') {
									x0 = x;
									y0 = y;
								} else if(e.type == 'touchend') {
									if(tablero.getBlock(x,y) === false && muros.length === 0) {
										var direccion = Math.abs(x0-x)>Math.abs(y0-y)?'h':'v';

										var m = TRAPABOLA.muro();
										m.init(x0, y0, direccion==='h'?0:1);
										muros.push(m);
										m = TRAPABOLA.muro();
										m.init(x0, y0, direccion==='h'?2:3);
										muros.push(m);
									}
								}
							}
						}
					}
			}());
		}
		lastTick = new Date();

		level = 1;
		vidas = 5;
		puntos = puntosTmp = 0;
		bolitas = [];
		tablero = TRAPABOLA.tablero();
		nextLevel();

		gameLoop();
	}

	function nextLevel() {
		var total = bolitas.length+1;
		if(total > level+1) {
			total = 1;
			level++;
		}

		tablero.init(Math.floor(width/TRAPABOLA.blockSize), Math.floor(height/TRAPABOLA.blockSize));

		bolitas = [];
		muros = [];

		for(; total > 0; total--) {
			var bolita = TRAPABOLA.bolita();
			do {
				var x = Math.random()*(width-TRAPABOLA.blockSize*2)+TRAPABOLA.blockSize;
				var y = Math.random()*(height-TRAPABOLA.blockSize*2)+TRAPABOLA.blockSize;
			} while(tablero.getBlock(x,y) !== false);
			bolita.init(x, y, Math.random()*Math.PI*2);
			bolitas.push(bolita);
		}

		//CLEAR STAGE
		ctx.beginPath();
		ctx.rect(0, 0, width, height);
		ctx.fillStyle = '#fffffff';
		ctx.closePath();
		ctx.fill();

		//DRAW STAGE
		tablero.draw(ctx);
	}

	function gameLoop() {
		var tick = new Date();
		var lapse = ( tick - lastTick ) / 1000;
		lastTick = tick;

		if(puntosTmp === puntos) {
			//CHECK STATUS
			var radio = TRAPABOLA.blockSize/2;
			for(var i in bolitas) {
				//BALLS & LIMITS
				var p = bolitas[i].getPunto();

				var derecha   = tablero.getBlock(p.x+radio,p.y);
				var izquierda = tablero.getBlock(p.x-radio,p.y);
				var arriba    = tablero.getBlock(p.x,p.y-radio);
				var abajo     = tablero.getBlock(p.x,p.y+radio);

				var dOriginal = bolitas[i].getDirection();
				var d = dOriginal;

				var dSimple = [Math.sin(dOriginal)>0, Math.cos(dOriginal)>0];

				if((derecha === true && dSimple[1]) || (izquierda === true && !dSimple[1]))
					d = Math.PI-d;

				if((arriba === true && !dSimple[0]) || (abajo === true && dSimple[0]))
					d = -d;

				if(d !== dOriginal)
					bolitas[i].setDirection(d);

				//BALLS & WALLS
				for(var j in muros)
					if(muros[j].colisiona(p)) {
						vidas--;
						delete muros[j];
						if(vidas < 1) {
							alert("¡Has conseguido "+Math.floor(puntos)+" puntos!");
							onStop();
						}
					}
			}

			var solido = false;
			for(var i in muros) {
				if(muros[i].termina(tablero)) {
					var extremos = muros[i].getExtremos();
					tablero.setMuro(extremos[0], extremos[1]);
					solido = true;
					delete muros[i];
				}
			}

			var deleted = false;
			for(var i=0; i<muros.length; i++) {
				if(muros[i] === undefined) {
					muros.splice(i,1);
					i--;
					deleted = true;
				}
			}

			if(solido) {
				tablero.clear(bolitas);
				if(tablero.getCompletado() > .7)
					puntosTmp = puntos+(tablero.getCompletado()-.7)*100+vidas*5;
			}

			//DRAW STAGE
			tablero.draw(ctx, deleted||solido?null:bolitas);

			//DRAW BALLS
			for(var i in bolitas)
				bolitas[i].draw(ctx, lapse*50*level);

			//DRAW MUROS
			for(var i in muros)
				muros[i].draw(ctx, lapse*200);

			//DRAW TEXTS
			ctx.beginPath();
			ctx.rect(40, height-43, 225, 34);
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.closePath();
			ctx.fill();

			ctx.beginPath();
			ctx.rect(width-150, height-43, 105, 34);
			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.closePath();
			ctx.fill();

			ctx.font = 'bold 16pt Helvetica';
			ctx.fillStyle = '#FFF';
			ctx.fillText('Completado: '+((tablero.getCompletado()/.7)*100).toFixed(1)+'%', 50, height-20);
			ctx.fillText('Vidas: '+vidas, width-140, height-20);
		} else {
			if(puntos<puntosTmp) {
				puntos += lapse*5;
			} else {
				puntos = puntosTmp;
				nextLevel();
			}
		}

		var w = 100;
		var tmp = puntos;
		do {
			w += 14;
			tmp /= 10;
		} while(tmp>1);

		ctx.beginPath();
		ctx.rect(width/2-w/2, 10, w, 34);
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.closePath();
		ctx.fill();
		ctx.font = 'bold 16pt Helvetica';
		ctx.fillStyle = '#FFF';
		ctx.fillText('Puntos: '+Math.floor(puntos), width/2-w/2+10, 35);

		stop || requestAnimFrame(gameLoop);
	}

	return {
		init: init,
		nextLevel: nextLevel
	};
})();


TRAPABOLA.bolita = function () {
	var punto;
	var direction;

	function draw(ctx, vel) {
		if(vel > TRAPABOLA.blockSize) vel = TRAPABOLA.blockSize;
		punto.x += Math.cos(direction)*vel;
		punto.y += Math.sin(direction)*vel;

		ctx.save();

		ctx.beginPath();
		ctx.arc(punto.x, punto.y, TRAPABOLA.blockSize*.4, 0, 2*Math.PI, false);
		ctx.fillStyle = 'rgb(200,0,0)';
		ctx.closePath();
		ctx.fill();

		ctx.restore();
	}

	function init(_x, _y, _d) {
		punto = {x: _x, y: _y};
		setDirection(_d);
	}

	function getPunto(){
		return punto;
	}

	function getDirection(_d) {
		return direction;
	}

	function setDirection(_d) {
		direction = _d>0?_d:-_d;
		direction = direction % (Math.PI*2);
		if(_d<0) direction = Math.PI*2+_d;
	}

	return {
		init: init,
		draw: draw,
		getPunto: getPunto,
		getDirection: getDirection,
		setDirection: setDirection
	};
};



TRAPABOLA.muro = function () {
	var punto;
	var tamanho;
	var direction;

	var colores = ['rgb(16,243,107)',
	               'rgb(239,243,14)',
	               'rgb(243,16,78)',
	               'rgb(64,196,217)'];

	function draw(ctx, vel) {
		tamanho += vel;

		var extremos = getExtremos();
		var t = TRAPABOLA.blockSize/8;

		var p1, p2;
		switch(direction) {
			case 0:
				p1 = {x: punto.x, y: punto.y};
				p2 = {x: TRAPABOLA.blockSize+tamanho, y: TRAPABOLA.blockSize};
				break;

			case 1:
				p1 = {x: punto.x, y: punto.y};
				p2 = {x: TRAPABOLA.blockSize, y: TRAPABOLA.blockSize+tamanho};
				break;

			case 2:
				p1 = {x: punto.x+TRAPABOLA.blockSize, y: punto.y};
				p2 = {x: -tamanho-TRAPABOLA.blockSize, y: TRAPABOLA.blockSize};
				break;

			case 3:
				p1 = {x: punto.x, y: punto.y+TRAPABOLA.blockSize};
				p2 = {x: TRAPABOLA.blockSize, y: -tamanho-TRAPABOLA.blockSize};
				break;
		}

		ctx.save();
		ctx.beginPath();
		ctx.rect(p1.x, p1.y, p2.x, p2.y);
		ctx.fillStyle = colores[direction];
		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.rect(extremos[0].x-t, extremos[0].y-t, t*2, t*2);
		ctx.fillStyle = '#ffffff';
		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.rect(extremos[1].x-t, extremos[1].y-t, t*2, t*2);
		ctx.fillStyle = '#ffffff';
		ctx.closePath();
		ctx.fill();

		ctx.restore();
	}

	function init(_x, _y, _d) {
		direction = _d;

		switch(direction) {
			case 0: _x += TRAPABOLA.blockSize/2; break;
			case 1: _y += TRAPABOLA.blockSize/2; break;
			case 2: _x -= TRAPABOLA.blockSize/2; break;
			case 3: _y -= TRAPABOLA.blockSize/2; break;
		}

		punto = {
			x: Math.floor(_x/TRAPABOLA.blockSize)*TRAPABOLA.blockSize,
			y: Math.floor(_y/TRAPABOLA.blockSize)*TRAPABOLA.blockSize
		};

		tamanho = 0;
	}

	function getExtremos() {
		var p1, p2;
		switch(direction) {
			case 0:
				p1 = {x: punto.x+TRAPABOLA.blockSize/2, y: punto.y+TRAPABOLA.blockSize/2};
				p2 = {x: punto.x+TRAPABOLA.blockSize/2+tamanho, y: punto.y+TRAPABOLA.blockSize/2};
				break;

			case 1:
				p1 = {x: punto.x+TRAPABOLA.blockSize/2, y: punto.y+TRAPABOLA.blockSize/2};
				p2 = {x: punto.x+TRAPABOLA.blockSize/2, y: punto.y+TRAPABOLA.blockSize/2+tamanho};
				break;

			case 2:
				p1 = {x: punto.x+TRAPABOLA.blockSize/2, y: punto.y+TRAPABOLA.blockSize/2};
				p2 = {x: punto.x-tamanho+TRAPABOLA.blockSize/2, y: punto.y+TRAPABOLA.blockSize/2};
				break;

			case 3:
				p1 = {x: punto.x+TRAPABOLA.blockSize/2, y: punto.y+TRAPABOLA.blockSize/2};
				p2 = {x: punto.x+TRAPABOLA.blockSize/2, y: punto.y-tamanho+TRAPABOLA.blockSize/2};
				break;
		}

		return [p1, p2];
	}

	function colisiona(_p) {
		var xb = Math.floor(_p.x/TRAPABOLA.blockSize);
		var yb = Math.floor(_p.y/TRAPABOLA.blockSize);

		var extremos = getExtremos();
		var p1 = extremos[0];
		var p2 = extremos[1];

		p1.x = Math.floor(p1.x/TRAPABOLA.blockSize);
		p1.y = Math.floor(p1.y/TRAPABOLA.blockSize);
		p2.x = Math.floor(p2.x/TRAPABOLA.blockSize);
		p2.y = Math.floor(p2.y/TRAPABOLA.blockSize);

		if((xb >= p1.x &&  xb <= p2.x) || (xb <= p1.x &&  xb >= p2.x))
			if((yb >= p1.y &&  yb <= p2.y) || (yb <= p1.y &&  yb >= p2.y))
				return true;

		return false;
	}

	function termina(tablero) {
		var extremos = getExtremos();
		var p1 = extremos[0];
		var p2 = extremos[1];
		
		var baseX = p1.x>p2.x?p2.x:p1.x;
		var baseY = p1.y>p2.y?p2.y:p1.y;
		var limX = p1.x<p2.x?p2.x:p1.x;
		var limY = p1.y<p2.y?p2.y:p1.y;

		for(var x=baseX; x<=limX; x+=TRAPABOLA.blockSize)
			for(var y=baseY; y<=limY; y+=TRAPABOLA.blockSize)
				if(tablero.getBlock(x,y) === true)
					return true;

		return false;
	}

	return {
		init: init,
		draw: draw,
		colisiona: colisiona,
		termina: termina,
		getExtremos: getExtremos
	};
};


TRAPABOLA.tablero = function () {
	var matriz;
	var totalCuadros;
	var completado;

	function draw(ctx, bolitas) {
		ctx.save();

		if(bolitas) {
			for(var i in bolitas) {
				var p = bolitas[i].getPunto();
				p = {x: Math.floor(p.x/TRAPABOLA.blockSize), y: Math.floor(p.y/TRAPABOLA.blockSize)};

				var puntos = [
					{x: p.x, y: p.y},
					{x: p.x+1, y: p.y},
					{x: p.x-1, y: p.y},
					{x: p.x, y: p.y+1},
					{x: p.x, y: p.y-1},
					{x: p.x+1, y: p.y+1},
					{x: p.x-1, y: p.y-1},
					{x: p.x+1, y: p.y-1},
					{x: p.x-1, y: p.y+1},
				];

				for(var j in puntos) {
					if(matriz[puntos[j].x] && matriz[puntos[j].x][puntos[j].y] !== null)
						pintaUna(ctx, puntos[j].x, puntos[j].y)
				}
			}
		} else {
			for(var x in matriz)
				for(var y in matriz[x])
					pintaUna(ctx, x, y);
		}

		ctx.restore();
	}

	function pintaUna(ctx, x, y) {
		var color;

		if(matriz[x][y] === true)
			color = '#eeeeee';
		else if(matriz[x][y] === false)
			color = '#333333';

		ctx.beginPath();
		ctx.rect(x*TRAPABOLA.blockSize, y*TRAPABOLA.blockSize, TRAPABOLA.blockSize, TRAPABOLA.blockSize);
		ctx.fillStyle = color;
		ctx.closePath();
		ctx.fill();
	}

	function init(_x, _y) {
		totalCuadros = _x*_y;
		completado = 0;
		matriz = [];
		for(var x=0; x<_x; x++) {
			matriz.push([]);
			for(var y=0; y<_y; y++)
				matriz[x].push(y==0||x==0||y==_y-1||x==_x-1);
		}
	}

	function getBlock(_x, _y) {
		if(matriz[Math.floor(_x/TRAPABOLA.blockSize)])
			return matriz[Math.floor(_x/TRAPABOLA.blockSize)][Math.floor(_y/TRAPABOLA.blockSize)];
	}

	function setMuro(_p1, _p2) {
		_p1.x = Math.floor(_p1.x/TRAPABOLA.blockSize);
		_p1.y = Math.floor(_p1.y/TRAPABOLA.blockSize);
		_p2.x = Math.floor(_p2.x/TRAPABOLA.blockSize);
		_p2.y = Math.floor(_p2.y/TRAPABOLA.blockSize);

		if(_p1.x===_p2.x) {
			var maxY = _p1.y>_p2.y?_p1.y:_p2.y;
			for(var y = _p1.y<_p2.y?_p1.y:_p2.y; y<=maxY; y++)
				if(matriz[_p1.x] && matriz[_p1.x][y] === false)
					matriz[_p1.x][y] = true;
		} else {
			var maxX = _p1.x>_p2.x?_p1.x:_p2.x;
			for(var x = _p1.x<_p2.x?_p1.x:_p2.x; x<=maxX; x++)
				if(matriz[x] && matriz[x][_p1.y] === false)
					matriz[x][_p1.y] = true;			
		}
	}

	function clear(bolitas) {
		var matrizBackup = [];
		var visitar = [];

		for(var x in matriz) {
			matrizBackup.push([]);
			for(var y in matriz[x])
				matrizBackup[x].push(matriz[x][y] === true);
		}

		for(var i in bolitas) {
			var p = bolitas[i].getPunto();
			
			p = {x: Math.floor(p.x/TRAPABOLA.blockSize), y: Math.floor(p.y/TRAPABOLA.blockSize)};

			if(matrizBackup[p.x])
				if(matrizBackup[p.x][p.y] === false) {
					visitar.push(p);
					matrizBackup[p.x][p.y] = true;
				}
		}
		
		while(visitar.length > 0) {
			p = visitar.shift();

			var puntos = [
				{x: p.x+1, y: p.y},
				{x: p.x-1, y: p.y},
				{x: p.x,   y: p.y+1},
				{x: p.x,   y: p.y-1},
			];

			for(var i in puntos)
				if(matrizBackup[puntos[i].x])
					if(matrizBackup[puntos[i].x][puntos[i].y] === false) {
						matrizBackup[puntos[i].x][puntos[i].y] = true;
						visitar.push(puntos[i]);
					}

		}


		for(var x in matrizBackup)
			for(var y in matrizBackup[x])
				if(matrizBackup[x][y] === false)
					matriz[x][y] = true;

		var muro = 0;
		for(var x in matriz)
			for(var y in matriz[x])
				if(matriz[x][y] === true)
					muro++;

		completado = muro/totalCuadros;
	}
 
 	function getCompletado() {
 		return completado;
 	}

	return {
		init: init,
		draw: draw,
		getBlock: getBlock,
		getCompletado: getCompletado,
		clear: clear,
		setMuro: setMuro
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
