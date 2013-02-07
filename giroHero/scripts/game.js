var GIRAGIRA = {};

GIRAGIRA.colores = ['#13EEE6', '#EB524C', '#C6CB28', '#2D1A3A'];

GIRAGIRA.game = (function () {
	var ctx;
	var circulo;

	var lastTick;
	var rotate;

	var height;
	var width;
	var finFun;

	var bolitas;
	var vidas;

	var nextMin;

	var time;
	var puntos;
	var stop = false;

	function init(_w, _h, _f) {
		height = _h || height;
		width  = _w || width;
		finFun = _f || finFun;

		if($('#giro-giro').length === 0) {
			var centro = {x: width/2, y: height/2};

			function gira(e) {
				e.preventDefault();
				var touch;

				if(e.originalEvent.touches || e.originalEvent.changedTouches)
					touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				else
					touch = e;

				var elm = $(this).offset();

				var x = touch.pageX - elm.left;
				var y = touch.pageY - elm.top;
				if(x < $(this).width() && x > 0){
					if(y < $(this).height() && y > 0){
						var off = x/$(this).width()-.5;

						GIRAGIRA.game.setRotate(off*10);
					}
				}
			}

			$('<div id="slide"></div>').appendTo('#page');
			$('#slide').bind('touchmove', gira);
			$('#slide').bind('mousemove', gira);


			$('#page').append('<canvas id="giro-giro">');

			var $canvas = $('#giro-giro');
			$canvas.attr('width', width);
			$canvas.attr('height', height);
			var canvas = $canvas[0];
			ctx = canvas.getContext('2d');

			
			circulo = GIRAGIRA.circulo();
			circulo.init(centro);
		}

		lastTick = new Date();
		time = new Date();
		puntos = 0;

		ctx.fillStyle = GIRAGIRA.colores[3];
		ctx.fillRect(0, 0, width, height);

		stop = false;
		bolitas = [];
		vidas = 5;
		nextMin = 0;
		lastTick = 0;
		rotate = 0;

		gameLoop();
	}

	function onFinish(obj){
		for(b in bolitas)
			if(bolitas[b] === obj) {
				var baseAlpha = 2*Math.PI/3;

				bolitas.splice(b, 1);

				var c = obj.getColor();
				var a = obj.getAlpha() - circulo.getRotation();

				if(a<0)
					a += 2*Math.PI;
				else if(a>2*Math.PI)
					a -= 2*Math.PI;


				if(a < baseAlpha) {
					if(c === GIRAGIRA.colores[0])
						vidas += 2;
				} else if(a < baseAlpha*2) {
					if(c === GIRAGIRA.colores[1])
						vidas += 2;
				} else {
					if(c === GIRAGIRA.colores[2])
						vidas += 2;
				}
				vidas--;
				break;
			}

		if(vidas < 1) {
			stop = true;
			alert("¡Has conseguido "+parseInt(puntos/10)+" puntos!");
			finFun();
			//init();
		}
	}

	function gameLoop() {
		var lapse = ( (new Date()) - time )/1000;

		//ctx.clearRect(0, 0, width, height);

		ctx.fillStyle = GIRAGIRA.colores[3];
		ctx.fillRect(0, 0, width, 60);
		ctx.fillRect(0, height-120, width, 120);

		ctx.fillStyle = "rgba(45, 40, 58, .08)";
		ctx.fillRect(0, 0, width, height);

		var tick = new Date();
		var dif = (tick - lastTick) / 1000 ;
		lastTick = tick;

		var dificultad = Math.sqrt(lapse);

		for(b in bolitas) {
			try {
				bolitas[b].avanza(.02*dificultad*dif);
				bolitas[b].draw(ctx);
			}catch(err) { }
		}

		circulo.rotate(rotate * dif * 1.5);
		circulo.draw(ctx);

		if(bolitas.length <= nextMin) {
			var a = width/2; a *= a;
			var b = height/2; b *= b;

			var radio = Math.sqrt(a+b);
			var centro = {x: width/2, y: height/2};

			for(var i = parseInt(Math.random()*4); i>0; i--) {
				var bolita = GIRAGIRA.bolita();
				var _x = Math.random()*2*radio-radio;
				var _y = Math.sqrt(Math.abs(radio*radio-_x*_x));
				_y = Math.random()>.5?_y:-_y;

				_x += centro.x;
				_y += centro.y;

				bolita.init({x: _x, y: _y}, centro, onFinish);
				bolitas.push(bolita);
			}

			nextMin = parseInt(Math.random()*3)+1;
		}


		ctx.font = 'bold 16pt Helvetica';
		ctx.fillStyle = '#EB524C';
		ctx.fillText('Puntos: '+parseInt(puntos/10), 20, 40);
		ctx.fillText('Vidas restantes: '+vidas, width-220, 40);

		puntos++;

		stop || requestAnimFrame(gameLoop);
	}

	function setRotate(r) {
		rotate = r;
	}

	return {
		init: init,
		setRotate: setRotate
	};
})();


GIRAGIRA.circulo = function () {
	var p;

	var radio = 100;
	var rotation = 0;

	function draw(ctx) {
		ctx.save();

		var alpha = 2*Math.PI/3;

		ctx.beginPath();
		ctx.arc(p.x, p.y, radio, 0, 2*Math.PI, false);
		ctx.fillStyle = '#ffffff';
		ctx.fill();

		ctx.lineWidth = 5;
		ctx.strokeStyle = 'rgba(255,255,255,.2)';
		ctx.stroke();
		ctx.lineWidth = 3;
		ctx.strokeStyle = 'rgba(255,255,255,.2)';
		ctx.stroke();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(255,255,255,.2)';
		ctx.stroke();


		ctx.beginPath();
		ctx.arc(p.x, p.y, radio, 0+rotation, alpha+rotation, false);
		ctx.fillStyle = GIRAGIRA.colores[0];
		ctx.fill();

		ctx.beginPath();
		ctx.arc(p.x, p.y, radio, alpha+rotation, 2*alpha+rotation, false);
		ctx.fillStyle = GIRAGIRA.colores[1];
		ctx.fill();

		ctx.beginPath();
		ctx.arc(p.x, p.y, radio, 2*alpha+rotation, 3*alpha+rotation, false);
		ctx.fillStyle = GIRAGIRA.colores[2];
		ctx.fill();

		ctx.restore();
	}

	function rotate(r) {
		rotation += r;
		if(rotation > 2*Math.PI)
			rotation -= 2*Math.PI;
		else if(rotation<0)
			rotation += 2*Math.PI;
	}

	function init(_p) {
		p = _p;
	}

	function getRotation() {
		return rotation;
	}

	return {
		init: init,
		rotate: rotate,
		draw: draw,
		getRotation: getRotation
	};
};


GIRAGIRA.bolita = function () {
	var difX;
	var difY;

	var p;
	var p1;

	var onFisnish;

	var radio = 6;
	var velocidad;
	var color;

	function draw(ctx) {
		ctx.save();

		ctx.beginPath();
		ctx.arc(p.x, p.y, radio, 0, 2*Math.PI, false);
		ctx.fillStyle = color;
		ctx.fill();

		ctx.restore();
	}

	function avanza(vel) {
		p.x -= difX * vel * velocidad;
		p.y -= difY * vel * velocidad;

		var a = Math.abs(p.x - p1.x);
		var b = Math.abs(p.y - p1.y);

		var d = Math.sqrt(a*a+b*b);
		if(d < 100 || d > 5000)
			onFisnish(this);
	}

	function init(_p, _p1, _e) {
		p  = { x: _p.x,  y:_p.y  };
		p1 = { x: _p1.x, y:_p1.y };

		difX = p.x - p1.x;
		difY = p.y - p1.y;

		onFisnish = _e;

		velocidad = Math.random()*.5+.5;

		color = GIRAGIRA.colores[Math.floor(Math.random()*3)];
	}

	function getColor() {
		return color;
	}

	function getAlpha() {
		return Math.atan2(-difY, -difX)+Math.PI;
	}

	return {
		init: init,
		avanza: avanza,
		draw: draw,
		getColor: getColor,
		getAlpha: getAlpha
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