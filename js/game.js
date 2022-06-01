﻿
var div1, div2, div3, loading, mode = 1, ready = false;

var Game = function(){

	var init = function( hash ){
		
		if ( hash ){
			mode = hash;
			return gameStart();
		}
		loading = document.createElement( 'img' );
		
		loading.src = 'images/g/loading.jpg';



		var wrap = document.body.appendChild( document.createElement( "div" ) )

		document.body.appendChild( loading );
		
		div = document.body.appendChild( document.createElement( 'div' ) );
		
		div.style.position = 'absolute';
		
		div.style.top = '800px';
		
		div.style.left = '400px';

		div.style.fontSize = '45px'

		div.style.color = '#fff';
	
		div.style.width = '500px';
		
		div.style.height = '100px'

		div.innerHTML = 'loading...';

		div2 = document.body.appendChild( document.createElement( 'div' ) );
				
		div2.style.position = 'absolute';
		
		div2.style.top = '800px';
		
		div2.style.left = '800px';

		div2.style.fontSize = '35px'
		
		div2.style.color = '#fff';
		
		div2.style.width = '500px';
		
		div2.style.height = '500px';
		
	


		document.body.style.position = 'relative'
		document.body.style.left = ( document.body.offsetWidth  - 900 ) / 2 + 'px'
		document.body.style.top = '20px'
		document.body.style.overflow = 'hidden';
		document.body.style.backgroundColor = '#A0AAB2';


		
		Util.loadImg( function(){	
			
			Util.loadAudio( function(){
			
				gameStart();


				var div = document.createElement( 'div' );
				div.style.width = '720px';
				div.style.height = '32px';
				div.style.top = '550px';
				div.style.left = '96px';
				div.style.position = 'absolute';
				div.style.zIndex = 9999;
				div.innerHTML = ''
				document.body.appendChild( div );

	
			})
		
		});


	}

	return {
		init: init
	}


}();


// 游戏开始
var gameStart = function(){

	    // 游戏界面加载
	
		document.body.removeChild( div );
	
		document.body.removeChild( div2 );
	
		document.body.removeChild( loading );


		// 时间管理器
		Timer.start();


		// 游戏人物加载
		window.player1 = Spirit.getInstance( Config.Spirit.RYU1 );
	
		window.player2 = Spirit.getInstance( Config.Spirit.RYU2 );
	
		player1.setEnemy( player2 );
	
		player2.setEnemy( player1 );

		player1.bloodBar = Blood.leftBar();
	
		player2.bloodBar = Blood.rightBar();


		// 游戏地图初始化
		window.map = Map.init();


		window.Stage = Stage();

		Spirit.interface( 'Stage', Stage );


		// 游戏人物初始位置
		player1.init( 280, 240, 1 );   //left, top, direction
	
		player2.init( 480, 240, -1 );  //left, top, direction


		// 血条初始化
		Blood.init();


		player2.keyManage.stop();

		player2.ai = player2.implement( 'Ai' );

		player2.ai.start();

		player2.enemy.bloodBar.event.listen( 'empty', function(){
			player2.ai.stop();
		})

		var pause = false, lock = false;
	
		document.onkeydown = function( ev ){
			var ev = ev || window.event;
			var keycode = ev.keyCode;
			if ( keycode === 113 ){
				( pause = !pause ) ? Timer.stop() : Timer.start();
			}
			if ( keycode === 50 || keycode === 49 ){
				if ( lock ) return;
				lock = true;
				mode = keycode - 48;
				player2.ai.stop();
				Game.reload();
				setTimeout( function(){
					lock = false;
				}, 1000 )
			}
		}	
	
	
}

// 血条功能设置
var Blood = function(){
	
	var div;
	
	var init = function(){

		div = document.createElement( 'div' );
		div.style.width = '720px';
		div.style.height = '32px';
		div.style.top = '450px';
		div.style.left = '96px';
		div.style.position = 'absolute';
		div.style.zIndex = 9998;

		document.body.appendChild( div );

		var img = document.createElement( 'img' );
		img.style.width = '720px';
		img.style.height = '32px';
		img.style.top = '0px';
		img.src = 'images/g/bar.gif';
		div.appendChild( img );

	}

	// 重新加载
	var reload = function(){
		
		var d = document.body;

		while( d.firstChild != null && d.firstChild.tagName !== 'CANVAS'  ){
			d.removeChild( d.firstChild );
		}

		init();
	}
	
	// 宽度
	var animateWidth = function( timeAll, _f_width, width ){

		var f_time = +new Date;

		var easing = Config.easing[ 'linear' ], timeoutfn;

		var move = function(){
			var t = ( ( +new Date ) - f_time ) / timeAll;
			var w = easing( t, _f_width, width, 1 );
			if ( t > 1 ){
				w = _f_width + width;
				timeoutfn && timeoutfn();
			}
			return w;
		}

		timeout = function( fn ){
			w = _f_width + width;
			timeoutfn = fn;
		}
		
		var fireTimeout = function(){
			w = _f_width + width;
			timeoutfn && timeoutfn();
		}

		return {
			move: move,
			timeout: timeout,
			fireTimeout: fireTimeout
		}
	}

	// 左边血条
	var leftBar = function(){

		var div = document.createElement( 'div' );

		div.style.top = '455px';
		div.style.left = '96px';
		div.style.width = '322px';
		div.style.height = '21px';
		div.style.background = 'yellow';
		div.style.position = 'absolute';
		div.style.zIndex = 9999;
		div.style.border = '1px #fff solid';

		document.body.appendChild( div );

		var _blood = 1500, _f_left = 96, _f__blood = 1500, _f_width = 322, currWidth = _f_width, timer, animate, emptyfn;
		
		var event = Event();
		
		var framefn = function(){

			var w = animate.move();

			div.style.width = w + 'px';
			div.style.left = Math.min( _f_left + _f_width - w , _f_left + _f_width )+ 'px';

		}
		
		var firing = false;
		
		timer = Timer.add( framefn );

		var reduce = function( count ){
	
			_blood -= count;

			var _w = -count / _f__blood * _f_width;

			var timeAll = Math.min( 500, Math.abs( count * 1.5 ) );

			animate = animateWidth( timeAll, currWidth, _w );

			if ( _blood < 0 ){
				event.fireEvent( 'empty' );
			}

			animate.timeout( function(){
				currWidth += _w;
				firing = false;
				timer.stop();
			});

			if ( firing ){
				animate.fireTimeout();	
			}

			timer.start();
			
			firing = true;

		}

		var reload = function(){
			reduce( _blood - _f__blood );
		}
		
		
		return {
			reduce: reduce,
			event: event,
			reload: reload
		}
		
	}

	// 右边血条
	var rightBar = function(){
		var div = document.createElement( 'div' );
		div.style.top = '455px';
		div.style.left = '493px';
		div.style.width = '320px';
		div.style.height = '21px';
		div.style.background = 'yellow';
		div.style.position = 'absolute';
		div.style.zIndex = 9999;
		div.style.border = '1px #fff solid';
		document.body.appendChild( div );

		var _blood = 1500, _f_left = 493, _f__blood = 1500, _f_width = 320, currWidth = _f_width, timer, animate, emptyfn, queue = Interfaces.Queue();

		var event = Event();
		
		var framefn = function(){

			var w = animate.move();

			div.style.width = w + 'px';

		}
		
		var firing = false;
		
		timer = Timer.add( framefn );

		var reduce = function( count ){
			
			_blood -= count;

			var _w = -count / _f__blood * _f_width;

			var timeAll = Math.min( 500, Math.abs( count * 1.5 ) );

			animate = animateWidth( timeAll, currWidth, _w );

			if ( _blood < 0 ){
				event.fireEvent( 'empty' );
			}

			animate.timeout( function(){
				currWidth += _w;
				firing = false;
				timer.stop();
			});

			if ( firing ){
				animate.fireTimeout();	
			}

			timer.start();
			
			firing = true;

		}
		
		var empty	= function( fn ){
			emptyfn = fn;
		}

		var reload = function(){
			reduce( _blood - _f__blood );
		}
		
		return {
			reduce: reduce,
			event: event,
			reload: reload
		}

	}
	
	
	return {
		init: init,
		leftBar: leftBar,
		rightBar: rightBar,
		reload: reload
	}
	
}()


// 游戏界面初始化
window.onload = function(){
	Game.init();
}

// 游戏初始化 = 任务状态重新加载
Game.reload = function(){
	player1.keyManage.stop();
	player2.keyManage.stop();
	player1.bloodBar.reload();
	player2.bloodBar.reload();
	setTimeout( function(){
		player1.play( 'force_wait', 'force' );
		setTimeout( function(){
		 player1.animate.moveto( 280, 240 );
		 player1.keyManage.start();
		 player1.direction = 1;
		}, 30 )

		player2.play( 'force_wait', 'force' );
		setTimeout( function(){
		 player2.animate.moveto( 480, 240 );
		 player2.keyManage.start();
		 player2.direction = -1;
		 if ( mode === 1 ){
		 	player2.ai.start();
		 }
		}, 30 )
		
	}, 1000 )


}