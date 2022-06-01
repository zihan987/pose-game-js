
var Map = function(){

	var map = Config.map, ctx, frontWidth = map.stateWidth, windowLeft, stage, spirits = [];

	var spirit;

	var init = function(){

		spirits = Array.prototype.slice.call( arguments, 0 );

		canvas = document.body.appendChild( document.createElement( 'canvas' ) );
		
		canvas.style.position = "relative";

		canvas.style.zIndex = 10001;

		canvas.style.top = 350
		
		Map.width = canvas.width = 900 || map.windowWidth;
		Map.height = canvas.height = 490 || map.height;
		Map.left = canvas.left = 0 || map.left;
		Map.top = canvas.top = 500 || map.windowTop;
		ctx = canvas.getContext( '2d' );

		Timer.push( frames );
		
		setTimeout( function(){
			var audio = Interfaces.Audio();

			audio.loop();
	
			audio.play( 'sound/china.mp3' );
		}, 100 )
		
	
		
		ctx.stage = stage;
		
		return ctx;
	}


	var clear = function(){
		ctx.clearRect( 0, 0, canvas.width, canvas.height );
	}

	var frames = function(){
		clear();
	}


	var getMaxX = function(){
		return canvas.width;	
	}

	return {
		init: init,
		getMaxX: getMaxX
	}



}()



	var Stage = function( s ){
			
		var spirits = s;
	
		let bg = document.createElement( 'div' );
	
		document.body.appendChild( bg );
			
		let ft1 = document.createElement( 'img' );
			
		let ft = document.createElement( 'img' );
	
		bg.appendChild( ft1 );
	
		bg.appendChild( ft );

		bg.style.position = 'absolute';
		bg.style.left = '0px';
		bg.style.top = '395px';
		bg.style.width = '910px';
		bg.style.height = '490px';
		bg.style.overflow = 'hidden';
		bg.style.border = '20px ridge #EEE';

		ft1.style.position = 'absolute';
		ft1.style.left = 0;
		ft1.style.top = 600;
		ft1.width = 1400;
		ft1.height = 400;
		ft1.src = Util.imgObj[ Config.map.bgBehind ].obj.src;
			
		ft.style.position = 'relative';
		ft.style.left = 0;
		ft.style.top = '0px';
		ft.style.width = '1400px';
		ft.style.height = '490px';
		ft.src = Util.imgObj[ Config.map.bgFront ].obj.src;
	
		var f_left = 250;
	
		bg.scrollLeft = f_left;
				
		var f_scrollLeft = f_left;


		return function(){

			var self = this, old_scrollLeft = bg.scrollLeft, scrolling = false, dis;		

			var start = function(){
				old_scrollLeft = bg.scrollLeft;
			}

			var stop = function(){
				scrolling = false;
			}

			var scroll = function( dir ){
				dis = dir === 'left' ? -3 : 3;
				old_scrollLeft = bg.scrollLeft;
				bg.scrollLeft += dis;
				if ( old_scrollLeft !== bg.scrollLeft ){
					scrolling = dis;
				}else{
					stop();
				}
			}

			var pushEnemy = function(){
				if ( old_scrollLeft === bg.scrollLeft || !scrolling ){
					return;
				}	
				self.enemy.left = self.enemy.left - dis;	
			}

			var pushEnemy2 = function(){
				//self.enemy.left = self.enemy.left + ( old_scrollLeft - bg.scrollLeft );
			}


			var isScrolling = function(){
				return scrolling
			}
			
			return {
				start: start,
				stop: stop,
				scroll: scroll,
				pushEnemy: pushEnemy,
				pushEnemy2: pushEnemy2,
				isScrolling: isScrolling
			}
					
		}

		
	}




































