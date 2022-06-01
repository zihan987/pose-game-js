// let video;
let poseNet;
let poses = [];

// // 事件函数
// var Event = function ()
// {
//     // 事件列表
//     var obj = {}
//
//     // 添加事件（键值,事件函数, 类型）
//     var listen = function (key, eventfn, type)
//     {
//         // 如果没有这个键值
//         obj[key] || (obj[key] = Interfaces.Queue())
//         if (type === 1) {
//
//             //清除事件
//             obj[key].clean()
//         }
//
//         // 添加事件
//         obj[key].add(eventfn)
//     }
//
//     // 移除监听
//     var removeListen = function (key)
//     {
//         obj[key] && obj[key].clean()
//     }
//
//     // 触发事件
//     var fireEvent = function (key)
//     {
//         obj[key] && obj[key].fireEach.apply(this, Array.prototype.slice.call(arguments, 1))
//     }
//
//     return {
//         listen: listen,
//         removeListen: removeListen,
//         fireEvent: fireEvent
//     }
//
//
// }

// 动作函数-以函数形式封装的

// 碰撞检测对象
var Block = Class.create( function( top, left, width, height ){
        this.top = top;
        this.left = left;
        this.border = false;
    },

    {
        init: function(){

        },

        // 判断是否碰撞
        changeBg: function( bg, framesNum, combo, position ){

            var _oWidth = this.width;

            this.width =  Util.imgObj[ bg ].width / framesNum;

            this._oWidth = ( this.width - _oWidth ) * Config.map.spiritZoom;

            if ( this.direction === -1 ){
                this.left = this.left - this._oWidth;
            }

            if ( ( this.currState === 'somesault_up' ) &&  this.border === 'right' ){
                this.left = this.left - 60;
            }

            if ( !combo ){

                var _oHeight = this.height;

                this.height = Util.imgObj[ bg ].height ;

                this._oHeight = ( this.height - _oHeight ) * Config.map.spiritZoom;
                this.top = ( this.top - this._oHeight );
            }else{

            }

            this.position = position || 0;

        },

        crossBorder: function( left ){
            if ( !Map || !Map.getMaxX() ) return left;
            var maxX =  Map.getMaxX();
            var right = this.state === 'jump_back' ? 130 : 85;
            if ( left < 15 ){
                this.border = 'left';
                return 15;
            }else if ( left + this.width > maxX - right ){
                this.border = 'right';
                return maxX - this.width - right;
            }
            this.border = false;
            return left;
        }

    })


// 基础事件对象
var Spirit = Block.subClass( function( config ){

        // spirit 对象的属性
        this.config = config;           // 配置
        this.name = config.name;        // 名称
        this.states = config.states;    // 状态
        this.f_top = 0;                 // 初始高度
        this.f_left = 0;                // 初始左边距
        this.top = 0;                   // 高度
        this.left = 0;                  // 左边距
        this.width = 0;                 // 宽度
        this.height = 0;                // 高度
        this.bottom = 0;                // 底部
        this.direction = 1;             // 方向
        this.state = null;              // 当前状态
        this.currState = null;          // 当前最近状态
        this.enemy = null;              // 敌人
        this.animate = null;	        //移动
        this.animateDirection = [ 0, 0 ];   //移动方向
        this.frames = null;		    //动画帧
        this.shadow = null;	        //阴影
        this.queue = null;		    //动画队列
        this.keyManage = null;      //键盘管理
        this.collision = null;      //碰撞检测
        this.attack = null;         //攻击
        this.waveBoxing = null;     //波动拳
        this.status = null;         //人物状态机, 保存人物所有即时状态
        this.bloodBar = null;       //血条
        this.statusManage = null;   //状态管理
        this.stageManage = null;    //关卡管理-控制人物移动
    },

         // 基础事件对象的方法
    {
        init: function( f_left, f_top, direction ){
            this.f_left = f_left;    // 初始左边距
            this.f_top = f_top;      // 初始高度
            this.f_height = Util.imgObj[ this.states[ this.states.default ].bg ].height;    // 初始高度
            this.direction = direction;   // 方向
            this.frames = this.implement( 'SpiritFrames' );   // 动画帧
            this.shadow = this.implement( 'Shadow');          // 阴影
            this.animate = this.implement( 'Animate' );       // 移动
            this.queue = this.implement( 'Queue' );           // 动画队列
            this.lock = this.implement( 'Lock' );             // 锁定
            this.movelock = this.implement( 'Lock' );         // 移动锁定
            this.keyManage = this.implement( 'KeyManage', this.config.keyMap );   // 键盘管理
            this.collision = this.implement( 'Collision' );   //类型, 可推动, 可销毁
            this.attack = Fighter.getInstance( this ).init(); // 攻击
            this.waveBoxing = WaveBoxing.getInstance( this ).init();    // 波动拳
            this.statusManage = this.implement( 'StatusManage' );       // 状态管理
            this.stageManage = this.implement( 'Stage' );               // 关卡管理
            this.event();                                     // 事件

            // 最近状态初始化
            var currState = this.states[ this.states.default ];

            // 背景变换初始化
            this.changeBg( currState.bg, currState.framesNum );

            // 游戏状态初始化
            this.play( this.states.default );

            // 移动设置初始化
            this.animate.moveto( f_left, f_top );

            return this;
        },

        // 设置敌人
        setEnemy: function( enemy ){
            this.enemy = enemy;
        },

        // 游戏进行
        play: function( state, force ){

            // 如果处在下蹲状态且是等待状态，或者强制等待状态，则返回站立状态
            if ( this.statusManage.isCrouch() && ( state === 'wait' || state === 'force_wait' ) ){  //蹲下的状态站起来.
                return this.play( 'stand_up', true );
            }

            // 空中状态不能站起来
            if ( this.jump_combo( state ) && state !== 'force_wait' ) return;  //空中组合技

            //
            if ( this.defense( state ) ) return;  //是否在防御状态

            // 锁定状态不能移动 锁定等级
            var lock_level = Config.play[ state ].lock || 0;

            // 旧的锁定等级
            var old_lock_leval = this.lock.getLevel() || 0;

            // 如果锁定等级比旧的锁定等级高，则设置锁定等级
            if ( !force ){

                if ( state === this.state || ( this.lock.locked() && old_lock_leval >= lock_level ) ) {
                    return;
                }

            }


            this.lock.lock( lock_level );    //级别, 解锁延迟.

            this.queue.clean();              //清除动画队列

            var composes = Config.play[ state ].compose;  //组合states

            for ( var i = 0, c; c = composes[i++]; ){
                var s = Util.copy( this.states[ c ] );
                s.currState = c;
                this.queue.add( s );
            }

            // 获取此时的状态
            this.state = state;

            // 如果此时的状态是 light_wave_boxing 或者 heavy_wave_boxing 则设置波动拳
            if ( state === 'light_wave_boxing' || state === 'heavy_wave_boxing' ){
                if ( this.waveBoxing.firing ){
                    this.queue.clean();
                    this.lock.lock(0);
                    return this.play( state === 'light_wave_boxing' ? 'light_boxing' : 'heavy_boxing' );
                }
                this.waveBoxing.start( this.direction, state === 'light_wave_boxing' ? this.states[ 'light_wave' ] : this.states[ 'heavy_wave' ] );
            }

            this.fireFrames();

            this.animate.event.fireEvent( 'playStart' );

        },


        jump_combo: function( state ){   //跳跃的组合技能

            if ( !this.state || !this.statusManage.isJump() ) return false;

            if ( state === 'jump_fall_down' || state === 'jump_dead' || state === 'after_dead2' || state === 'heavy_attacked_fall_down' || state === 'crouch_kick_attacked_fall' ){
                this.frames.combo_attack.stop();
                return false;
            }

            var combo = this.states.combo && this.states.combo[ this.state + '_' + state ];

            if ( !combo ) return true;

            var flag = this.frames.combo_attack.start( combo.bg, combo.framesNum, combo.repeat, combo.afterFrame );

            this.statusManage.set_attack_type( combo.attack_type );

            var attack_config = combo.attack_config;

            this.statusManage.set_attack_power( combo.attack_power );


            if ( flag ){   //是否组合拳已经结束

                this.attack.stickStart( attack_config, combo.effect_position, combo.sound );

                var self = this;

                this.frames.combo_attack.done( function(){
                    self.statusManage.set_attack_type( 0 );
                    self.attack.stop();
                })
            }

            return true;

        },

        defense: function( state ){

            if ( state === 'back' ){
                if ( this.enemy.waveBoxing.firing || ( this.enemy.statusManage.get().attack_type === 'attack' && this.statusManage.get().enemy_distance_type !== 'furthest' ) ){
                    if ( this.statusManage.get().attack_type === 'wait' ){
                        this.play( 'stand_up_defense' );   //防御状态
                        this.statusManage.set_attack_type( 1 );
                    }
                    return true;
                }
            }

            else if ( state === 'stand_crouch_defense' ){
                if ( !this.enemy.waveBoxing.firing && ( this.enemy.statusManage.get().attack_type !== 'attack' || this.statusManage.get().enemy_distance_type === 'furthest' ) ){
                    this.play( 'crouch' );   //防御状态
                    this.statusManage.set_attack_type( 0 );
                    return true;
                }

            }

        },


        fireFrames: function(){

            var state = this.queue.dequeue();

            if ( !state ){   //队列里没有动作的时候

                var old_dir = this.direction;

                var new_direction = this.left > ( this.enemy && this.enemy.left ) ? -1 : 1;

                if ( new_direction !== old_dir ){
                    if ( this.border ){
                        this.left = this.left + new_direction * 18;
                    }else{
                        this.left = this.left + new_direction * 105;
                    }
                }

                this.direction = this.left > ( this.enemy && this.enemy.left ) ? -1 : 1;  //调整方向

                this.animate.mirror( this.direction );  //方向镜像
                this.keyManage.mirror( this.direction );   //键盘镜像
                if ( this.statusManage.isCrouch()  ){  //蹲下的状态站起来.
                    return this.play( 'stand_up', true );
                }else{
                    this.queue.add( this.states[ this.states.default ] );
                }
                this.lock.lock( 0 );
                this.state = this.states.default;
                this.frames.combo_attack.stop();

                if ( this.attack.animate_type === 'stick' ){
                    this.attack.stop();
                }

                return this.fireFrames();
            }

            if ( state !== this.state ){
                this.changeBg( state.bg, state.framesNum, null, state.position );
            }


            if ( state.easing[ 1 ] === null ){
                var top = this.f_top - this.top + ( this.f_height - this.height ) * Config.map.spiritZoom;
            }


            this.currState = state.currState;

            this.frames.start( state.bg, state.framesNum, state.easing[2], state.repeat, state.position, this.direction );

            this.animate.start( state.easing[0] * this.direction, top || state.easing[1], state.easing[2] * Config.fps * state.framesNum, state.easing[3] );

            var _left = state.easing[0] * this.direction, _top = top || state.easing[1];

            this.animateDirection = [ _left === 0 ? 0 : _left / Math.abs( _left ), _top === 0 ? 0 : _top / Math.abs( _top )  ];

            this.statusManage.set_attack_type( state.attack_type || 0 );

            this.statusManage.set_attack_power( state.attack_power || [] );

            if ( state.attack_type > 0 || this.statusManage.isJump() ){
                //this.frames.checkZindex();  //调整层级
            }

            if ( state.attack_type === 2 ){
                var attack_config = state.attack_config, effect_position = state.effect_position;
                attack_config && this.attack.start( attack_config[0], attack_config[1], [ attack_config[ 2 ] * this.direction, attack_config[ 3 ], attack_config[ 4 ], attack_config[ 5 ], attack_config[ 6 ], attack_config[ 7 ], attack_config[ 8 ] ], effect_position, state.sound );
            }

            if ( state.specialSound ){
                this.attack.audio.play( state.specialSound );
            }

            if ( this.currState !== 'wait' ){
                this.enemy.animate.event.fireEvent( 'stopPush' );
            }

            this.animate.event.fireEvent( 'framesStart' );


        },

        /************************************** 自定义事件 *****************************************/

        event: function( type ){

            var self = this;

            this.frames.event.listen( 'framesDone', function(){


                if ( self.currState === 'crouch_kick_attacked_fall' || self.currState === 'after_heavy_attacked_fall_down' || self.currState === 'dead' ){
                    self.attack.audio.play( 'sound/fall.mp3' );
                }

                if ( self.currState === 'somesault_up' ){
                    self.statusManage.setInvincible( 100 );  //爬起来的时候短暂无敌.
                }
                self.fireFrames();
            })

            this.frames.event.listen( 'framesStart', function(){

                self.animate.unlock();

                if ( self.state === 'wait' ){
                    self.animate.correct();	  //修正位置
                }

            })

            this.frames.event.listen( 'frameStart', function(){

                if ( self.state === 'wait' || self.state === 'crouch' ){
                    self.direction = self.left > ( self.enemy && self.enemy.left ) ? -1 : 1;  //调整方向
                }

                self.collision.check();      //检测碰撞
                self.animate.move();   //每帧开始前调整位置.
                self.shadow.moveto( Map.height - 73, self.statusManage.isJump() && self.direction === -1 ? self.left + ( self.width - 62 ) * Config.map.spiritZoom : self.left, self.statusManage.isJump() ? 62 : self.width, self.direction );  //移动阴影
                self.statusManage.check_enemy_distance( self.enemy );


            })


            this.animate.event.listen( 'stopPush', function(){
                self.states.forward.easing[ 0 ] = 150;
            });


            this.animate.event.listen( 'frameStart', function(){

                var d = 0;

                self.enemy.animate.event.removeListen( 'frameDone' );

                if ( ( self.border === 'left' && self.animateDirection[ 0 ] === -1 ) || ( self.border === 'right' && self.animateDirection[ 0 ] === 1 ) ){

                    self.enemy.stageManage.start();

                    if ( self.statusManage.get().enemy_distance_type === 'furthest' ) return;

                    self.stageManage.scroll( self.border );

                    self.enemy.animate.event.listen( 'frameDone', function(){

                        if ( self.enemy.animateDirection[ 0 ] === 0 && self.enemy.animateDirection[ 1 ] === 0 ){
                            self.stageManage.pushEnemy();
                        }else{
                            if ( self.stageManage.isScrolling() ){
                                self.enemy.animate.stagePush( self.stageManage.isScrolling() );
                            }else{
                                self.enemy.animate.stopStagePush();
                            }
                        }
                    }, 1 )

                }else{
                    self.stageManage.stop();
                }

            });



            this.collision.event.listen( 'affirm', function( obj, dir ){

                if ( obj === self.enemy ){

                    if ( self.state === 'forward' && ( obj.state === 'wait' || obj.state === 'crouch' ) ){
                        obj.animate.push( 3 );
                        self.states.forward.easing[ 0 ] = 90;
                        if ( obj.border ){
                            self.animate.lock( obj.border );
                        }
                    }

                    if ( self.currState === 'jump_forward_down' || self.currState === 'jumpDown' ){
                        var distance = self.statusManage.get().enemy_distance;
                        obj.animate.push( ( 234 - distance ) / 40 );
                    }

                    if ( self.state === 'forward' &&  obj.state === 'forward'  ){
                        self.animate.lock( dir );
                    }

                }

            })


            this.keyManage.match( function( state ){

                if ( self.statusManage.isCrouch() && self.states[ 'crouch_' + state ] ){
                    return 	self.play( 'crouch_' + state );
                }

                if ( !self.statusManage.isJump() && self.states[ 'near_' + state ] && self.statusManage.get().enemy_distance <= self.states[ 'near_' + state ].near  ){
                    return self.play( 'near_' + state );
                }

                return self.play( state );
            });


            this.keyManage.unmatch( function( state ){

                if ( self.state === 'stand_up' && state === 'wait' ){
                    return;
                }

                if ( self.state === 'back' || self.state === 'forward' || self.state === 'stand_up_defense' || self.state === 'stand_crouch_defense' || self.state === 'crouch' ){
                    self.play( self.states.default );
                }

            });

        }


    }

)




Spirit.interface( 'Animate', Interfaces.Animate );

Spirit.interface( 'SpiritFrames', Interfaces.SpiritFrames );

Spirit.interface( 'Shadow', Interfaces.Shadow );

Spirit.interface( 'Queue', Interfaces.Queue );

Spirit.interface( 'Lock', Interfaces.Lock );

Spirit.interface( 'KeyManage', Interfaces.KeyManage );

Spirit.interface( 'Collision', Interfaces.Collision );

Spirit.interface( 'StatusManage', Interfaces.StatusManage );

Spirit.interface( 'Ai', Ai );




var Fighter = Class.create( function( master ){
        this.width = 50;
        this.height = 50;
        this.left = 0;
        this.top = 0;
        this.master = master;
        this.timer = null;
        this.animate = null;
        this.attackEffect = null;
        this.effect_position = null;
        this.sound = null;
        this.easing = null;
    },

    {
        init: function(){
            var self = this;
            this.animate = this.implement( 'Animate' );
            this.collision = this.implement( 'Collision' );
            this.attackEffect = this.implement( 'AttackEffect' );
            this.audio = this.implement( 'Audio' );

            this.animate.event.listen( 'framesDone', function(){
                self.stop();
            })


            this.master.enemy.bloodBar.event.listen( 'empty', function(){
                setTimeout( function(){
                    Game.reload();
                }, 300 );
                self.master.keyManage.stop();
                if ( self.master.enemy.statusManage.isJump() ){
                    return self.master.enemy.play( 'jump_dead' );
                }
                self.master.enemy.play( 'dead' );
            })


            var framefn = function(){
                if ( self.animate_type === 'stick' ){
                    if ( self.master.direction === 1 ){
                        self.left = self.master.left + self.easing[0];
                    }else{
                        self.left = self.master.left + self.master.width - self.easing[0] + self.width;
                    }
                    self.top = self.master.top + self.easing[1];
                }else{
                    self.animate.move();
                }

                self.collision.check();

            }

            this.timer = Timer.add( framefn );

            this.collision.event.listen( 'affirm',  function( obj, dir ){

                if ( obj === this.master.enemy ){

                    if ( this.master.statusManage.isStand() && this.master.enemy.statusManage.isCrouch() && this.master.state.indexOf( 'near' ) < 0 ){
                        return this.stop();
                    }

                    var enemy_attack_type = this.master.enemy.statusManage.get().attack_type;

                    var enemy_invincible = this.master.enemy.statusManage.get().invincible;

                    if ( enemy_attack_type === 'fall_down' || enemy_invincible ){
                        return this.stop();
                    }

                    if ( enemy_attack_type === 'defense' ){
                        return this.enemyDefense();
                    }

                    var attack_power = this.master.statusManage.get().attack_power;

                    var enemy_attack_power = this.master.enemy.statusManage.get().attack_power;


                    if ( attack_power < enemy_attack_power ){
                        this.master.enemy.attack.stop();
                        this.master.enemy.attack.enemyBeat();
                        return this.stop();
                    }

                    if ( attack_power > 0 && attack_power === enemy_attack_power ){
                        this.master.enemy.attack.enemyBeat();
                    }


                    this.enemyBeat();


                }

            })


            return this;

        },


        enemyDefense: function(){

            if ( this.master.statusManage.isCrouch() && this.master.enemy.statusManage.isStand() ){
                return this.enemyBeat();
            }

            this.attackEffect.start( 'defense', this.master.direction === 1 ? this.master.enemy.left + this.effect_position[ 0 ] : this.master.enemy.left + this.master.enemy.width + this.effect_position[ 0 ] , this.master.enemy.top + this.effect_position[ 1 ] );

            var attack_light = this.master.statusManage.get().attack_light;

            var spirit = this.master.enemy.border && !this.master.statusManage.isJump() ? this.master : this.master.enemy;

            spirit.animate.start( ( attack_light ? -20 : -70 ) * spirit.direction, 0, 200, 'linear' );

            var defenseBlood = this.master.states[ this.master.state ].defenseBlood;

            if ( defenseBlood ){
                this.master.enemy.bloodBar.reduce( defenseBlood || 5 );
            }

            this.master.enemy.attack.playAudio( 'sound/defense.mp3' );

        },

        enemyBeat: function(){

            if ( this.master.state === 'jump_whirl_kick' || this.master.state === 'jump_light_whirl_kick' ){
                if ( this.master.enemy.statusManage.isCrouch() ){
                    return;
                }
            }

            this.attackEffect.start( this.easing[ 4 ], this.master.direction === 1 ? this.master.enemy.left + this.effect_position[ 0 ] : this.master.enemy.left + this.master.enemy.width + this.effect_position[ 0 ] , this.master.enemy.top + this.effect_position[ 1 ] );

            var attack_light = this.master.statusManage.get().attack_light;

            if ( !this.master.statusManage.isCrouch() && this.master.enemy.statusManage.isJump() && this.master.state !== 'jump_whirl_kick' && this.master.state !== 'jump_light_whirl_kick' && this.master.state !== 'jump_heavy_impact_boxing' && this.master.state !== 'jump_light_impact_boxing' ){
                this.master.enemy.play( 'jump_fall_down' );
            }

            else{
                this.master.enemy.play( this.easing[ 5 ], true );
            }


            if ( this.master.enemy.border && !this.master.statusManage.isJump() ){
                this.master.animate.start( ( attack_light ? -70 : -150 ) * this.master.direction, 0, 300, 'linear' );
            }

            this.master.enemy.bloodBar.reduce( this.easing[ 6 ] || 50 );

            this.master.enemy.waveBoxing.ready_firing = false;

            this.playAudio( null, 1 );

            //this.master.enemy.attack.stop();

            this.stop();

        },

        start: function( left, top, easing, effect_position, sound ){
            if ( this.master.direction === 1 ){
                this.left = this.master.left + left;
            }else{
                this.left = this.master.left + this.master.width * 2 - left - this.width * 2;
            }
            this.top = this.master.top + top;
            this.effect_position = effect_position;
            this.animate.start( easing[0], easing[1], easing[2], easing[3] );
            this.easing = easing;
            this.sound = sound;
            this.timer.start();
        },

        stickStart: function( easing, effect_position, sound ){
            var self = this;
            this.easing = easing;
            this.effect_position = effect_position;
            this.sound = sound;
            this.width = this.height = easing[ 2 ];
            this.animate_type = 'stick';
            this.timer.start();
            this.playAudio( this.sound[ 0 ] )
        },

        stop: function(){
            this.animate_type = 'normal';
            this.timer.stop();
            this.master.statusManage.set_attack_power( [ 0, false ] );  //攻击之后取消无敌状态
            this.playAudio( null, 0 );
        },

        playAudio: function( src, type ){

            if ( src ){
                return this.audio.play( src );
            }

            if ( !this.sound ) return;

            if ( type === 1 ){
                return this.master.enemy.attack.audio.play( this.sound[ 1 ] );
            }else if ( type === 0 ){
                if ( this.master.statusManage.isJump() ) return;
                var enemy_attack_type = this.master.enemy.statusManage.get().attack_type;
                if ( enemy_attack_type !== 'beat' &&  enemy_attack_type !== 'fall_down' && this.master.statusManage.get().attack_type === 'attack' ){
                    return this.audio.play( this.sound[ 0 ] );
                }
            }


        },

        crossBorder: function( left ){
            var maxX =  Map.getMaxX();
            if ( left < 15 || left > maxX - this.width - 20 ){
                this.stop();
            }
            return left;
        }


    }


)




Fighter.interface( 'Animate', Interfaces.Animate );

Fighter.interface( 'Collision', Interfaces.Collision );

Fighter.interface( 'AttackEffect', Interfaces.AttackEffect );

Fighter.interface( 'Audio', Interfaces.Audio );




var WaveBoxing = Fighter.subClass( function( master ){

        this.width = 56;
        this.height = 32;
        this.direction = 1;
        this.master = master;
        this.easing = null;
        this.firing = false;
        this.ready_firing = false;
        this.timer = null;

    }, {
        init: function(){
            var self = this;
            this.frames = this.implement( 'SpiritFrames' );
            this.animate = this.implement( 'Animate' );
            this.collision = this.implement( 'Collision', 48, 32 );
            this.attackEffect = this.implement( 'AttackEffect', this );

            this.frames.event.listen( 'frameStart', function(){

                self.animate.move();

                self.firing && self.collision.check();

            })


            this.collision.event.listen( 'affirm',  function( obj, dir ){

                if ( obj === self.master.enemy.waveBoxing && self.firing && self.master.enemy.waveBoxing.firing ){
                    self.stop();
                    self.master.enemy.waveBoxing.stop();
                    self.master.enemy.waveBoxing.attackEffect.start( self.easing[ 4 ], self.master.enemy.waveBoxing.direction === 1 ? self.left - self.width : self.left + self.width , self.top );
                    return self.attackEffect.start( self.easing[ 4 ], self.left, self.top );
                }

                if ( obj === self.master.enemy ){

                    if ( Math.abs( this.top - this.master.enemy.top ) > 130 ) return;  //跳跃的时候降低碰撞条件

                    var enemy_invincible = this.master.enemy.statusManage.get().invincible;

                    if ( enemy_invincible ){
                        return;
                    }

                    var enemy_attack_type = this.master.enemy.statusManage.get().attack_type;

                    if ( enemy_attack_type === 'defense' ){
                        setTimeout(function(){
                            self.stop();
                        }, 0)
                        return self.enemyDefense();
                    }

                    setTimeout(function(){
                        self.stop();
                    }, 0)

                    this.enemyBeat();

                }



            })

            this.frames.event.listen( 'framesDone', function(){
                self.frames.loop();
                self.animate.loop();
            })

            return this;
        },

        enemyDefense: function(){

            this.master.enemy.attack.audio.play( 'sound/defense.mp3' );

            this.master.enemy.waveBoxing.ready_firing = false;

            this.attackEffect.start( this.easing[ 4 ], this.left, this.top );

            var attack_light = this.master.statusManage.get().attack_light;

            if ( this.master.enemy.statusManage.isStand() ){
                this.master.enemy.play( 'force_stand_up_defense' );
            }else{
                this.master.enemy.play( 'force_stand_crouch_defense' );
            }

            this.master.enemy.animate.start( ( attack_light ? -50 : -100 ) * this.master.enemy.direction, 0, 300, 'linear' );

            var distance = this.master.statusManage.get().enemy_distance_type;

            if ( this.master.enemy.border && ( distance === 'near' || distance === 'middle' ) ){
                this.master.animate.start( ( attack_light ? -50 : -100 ) * this.master.direction, 0, 300, 'linear' );
            }

            this.master.enemy.bloodBar.reduce( this.easing[ 7 ] || 0 );

        },

        enemyBeat: function(){

            this.master.enemy.waveBoxing.ready_firing = false;

            this.attackEffect.start( this.easing[ 4 ], this.left, this.top );

            var attack_light = this.master.statusManage.get().attack_light;

            if ( this.master.enemy.statusManage.isJump() ){
                this.master.enemy.play( 'heavy_attacked_fall_down', true );
            }

            else{
                this.master.enemy.play( this.easing[ 5 ], true );
            }

            var distance = this.master.statusManage.get().enemy_distance_type;

            if ( this.master.enemy.border && ( distance === 'near' || distance === 'middle' ) ){
                this.master.animate.start( ( attack_light ? -70 : -120 ) * this.master.direction, 0, 300, 'linear' );
            }

            this.master.enemy.bloodBar.reduce( this.easing[ 6 ] || 50 );

            this.master.enemy.attack.audio.play( 'sound/hit_heavy_boxing.mp3' );

        },

        start: function( dir, state ){
            var self = this;
            this.ready_firing = true;
            this.timer = setTimeout( function(){
                if ( self.ready_firing === false ) {
                    return clearTimeout( self.timer );
                }

                self.easing = state.attack_config;
                self.firing = true;
                self.direction = dir;
                self.top = self.master.top + 40;

                if ( self.direction === -1 ){
                    self.left = self.master.left + self.width - 90;
                }else{
                    self.left = self.master.left + self.master.width + 50;
                }

                self.frames.start( state.bg, state.framesNum, state.easing[2], state.repeat, state.position, self.direction );

                self.animate.start( state.easing[0] * self.direction, 0, state.easing[2] * Config.fps * state.framesNum, state.easing[3] );

            }, 150 )

        },

        stop: function(){
            this.firing = false;
            this.frames.stop();
        },

        crossBorder: function( left ){
            var maxX =  Map.getMaxX();
            if ( left < 15 || left > maxX - this.width ){
                this.stop();
            }
            return left;
        }

    }

)



WaveBoxing.interface( 'SpiritFrames', Interfaces.SpiritFrames );








function setup()
{
    // 创建一个视频对象  并设置宽高
    const canvasvideo = createCanvas(640, 380);
    canvasvideo.parent('videoContainer');

    // 创建一个视频对象  并设置宽高
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();

    // 创建一个poseNet对象 参数为video对象
    poseNet = ml5.poseNet(video, modelReady);

    //====================================================================================
    // 当poseNet对象准备好后调用 pose为一个对象 包含了pose的关键点和关键点的关系
    poseNet.on('pose', function (results)
    {
        // 将pose对象赋值给poses
        poses = results;
        // 设置两只手之间的距离
        let distence_hand;

        // 动作识别判定
        let distance_hand;
        try {
            // 将results的第一个pose对象赋值给pose results[0]中存放的是一个对象
            let temp = results[0];
            // console.log(temp);

            // console.log(temp.pose.leftWrist.y);
            // console.log(temp.pose.rightShoulder.y);
            // 打印出左手的y坐标
            // 【手腕】
            let r_wrist = temp.pose.rightWrist.y;           // 右手手腕的y坐标
            let l_wrist = temp.pose.leftWrist.y;            // 左手手腕的y坐标

            // 【手腕的置信度】
            let r_conf = temp.pose.rightWrist.confidence;   // 右手肘的x坐标
            let l_conf = temp.pose.leftWrist.confidence;    //  左手肘的x坐标

            // 上面的那个写的就是个垃圾，就是只分出来这个y 连个都不写，WDNMD

            // 【手腕】
            let r_wrist_x = temp.pose.rightWrist.x;           // 右手手腕的x坐标
            let r_wrist_y = temp.pose.rightWrist.y;           // 右手手腕的y坐标
            let l_wrist_x = temp.pose.leftWrist.x;            // 左手手腕的x坐标
            let l_wrist_y = temp.pose.leftWrist.y;            // 左手手腕的y坐标
            // 【手腕的置信度】
            let r_wrist_conf = temp.pose.rightWrist.confidence;   // 右手肘的置信度
            let l_wrist_conf = temp.pose.leftWrist.confidence;    //  左手肘的置信度

            // 【手肘】
            let r_elbow_x = temp.pose.rightElbow.x;           // 右手手腕的x坐标
            let r_elbow_y = temp.pose.rightElbow.y;           // 右手手腕的y坐标
            let l_elbow_x = temp.pose.leftElbow.x;            // 左手手腕的x坐标
            let l_elbow_y = temp.pose.leftElbow.y;            // 左手手腕的y坐标
            // 【手肘的置信度】
            let r_elbow_conf = temp.pose.rightElbow.confidence;   // 右手肘的置信度
            let l_elbow_conf = temp.pose.leftElbow.confidence;    //  左手肘的置信度


            // 【肩膀】
            let r_shoulder_x = temp.pose.rightShoulder.x;     // 右手肩的x坐标
            let r_shoulder_y = temp.pose.rightShoulder.y;     // 右手肩的y坐标
            let l_shoulder_x = temp.pose.leftShoulder.x;      // 左手肩的x坐标
            let l_shoulder_y = temp.pose.leftShoulder.y;      // 左手肩的y坐标
            // 【肩膀的置信度】
            let r_shoulder_conf = temp.pose.rightShoulder.confidence;     // 右手肩的置信度
            let l_shoulder_conf = temp.pose.leftShoulder.confidence;      //  左手肩的置信度


            // 【臀部】
            let r_hip_x = temp.pose.rightHip.x;               // 右臀部的x坐标
            let r_hip_y = temp.pose.rightHip.y;               // 右臀部的y坐标
            let l_hip_x = temp.pose.leftHip.x;                // 左臀部的x坐标
            let l_hip_y = temp.pose.leftHip.y;                // 左臀部的y坐标
            // 【臀部的置信度】
            let r_hip_conf = temp.pose.rightHip.confidence;   // 右臀部的置信度
            let l_hip_conf = temp.pose.leftHip.confidence;    //  左臀部的置信度


            // 【膝盖】
            let r_knee_x = temp.pose.rightKnee.x;             // 右膝盖的x坐标
            let r_knee_y = temp.pose.rightKnee.y;             // 右膝盖的y坐标
            let l_knee_x = temp.pose.leftKnee.x;              // 左膝盖的x坐标
            let l_knee_y = temp.pose.leftKnee.y;              // 左膝盖的y坐标
            // 【膝盖的置信度】
            let r_knee_conf = temp.pose.rightKnee.confidence; // 右膝盖的置信度
            let l_knee_conf = temp.pose.leftKnee.confidence;  //  左膝盖的置信度


            // 【脚踝】
            let r_ankle_x = temp.pose.rightAnkle.x;           // 右脚踝的x坐标
            let r_ankle_y = temp.pose.rightAnkle.y;           // 右脚踝的y坐标
            let l_ankle_x = temp.pose.leftAnkle.x;            // 左脚踝的x坐标
            let l_ankle_y = temp.pose.leftAnkle.y;            // 左脚踝的y坐标
            // 【脚踝的置信度】
            let r_ankle_conf = temp.pose.rightAnkle.confidence;   // 右脚踝的置信度
            let l_ankle_conf = temp.pose.leftAnkle.confidence;    //  左脚踝的置信度


            //下面是所有的按键的定义

            //按下键盘 w
            const kw = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 87,
                    repeat: false
                });

            //按下键盘 d
            const kd = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 68,
                    repeat: false
                });

            //按下键盘 s
            const ks = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 83,
                    repeat: false
                });

            //按下键盘 a
            const ka = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 83,
                    repeat: false
                });

            //按下键盘 j
            const kj = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 74,
                    repeat: false
                });

            //按下键盘 k
            const kk = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 75,
                    repeat: false
                });

            //按下键盘 u
            const ku = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 85,
                    repeat: false
                });

            //按下键盘 i
            const ki = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 73,
                    repeat: false
                });


            //按下键盘 o
            const ko = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 79,
                    repeat: false
                });

            //按下键盘 c
            const kc = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 67,
                    repeat: false
                });

            //按下键盘 v
            const kv = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 86,
                    repeat: false
                });

            //按下键盘 b
            const kb = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 66,
                    repeat: false
                });


            //按下键盘 g
            const kg = new KeyboardEvent('keydown',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 71,
                    repeat: false
                });

            // 抬起键盘 j
            const kj_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 74,
                    repeat: false
                });

            // 抬起键盘 k
            const kk_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 75,
                    repeat: false
                });

            // 抬起键盘 u
            const ku_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 85,
                    repeat: false
                });

            // 抬起键盘 i
            const ki_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 73,
                    repeat: false
                });

            // 抬起键盘 o
            const ko_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 79,
                    repeat: false
                });

            // 抬起键盘 w
            const kw_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 87,
                    repeat: false
                });

            // 抬起键盘 s
            const ks_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 83,
                    repeat: false
                });

            // 抬起键盘 d
            const kd_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 68,
                    repeat: false
                });

            // 抬起键盘 a
            const ka_up = new KeyboardEvent('keyup',
                {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 65,
                    repeat: false
                });





            //获得图片的x坐标
            // let x = document.getElementById("wh");
            // 如果左手的手腕长度是大于0的
            distence_hand = r_wrist - l_wrist;

            //左手手肘和左肩膀的y坐标的差值
            let distence_shoulder_elbow = l_shoulder_y - l_elbow_y;

            //左手腕和左手腕的x坐标的差值
            let distence_wrist = r_wrist_x - l_wrist_x;

            // distence_wrist 的绝对值
            let distence_wrist_abs = Math.abs(distence_wrist);

            //  右膝盖和又髋的y坐标的差值的绝对值
            let distence_knee_ankle = Math.abs(r_knee_y - r_ankle_y);

            // 右膝盖和左膝盖的y坐标的差值的绝对值
            let distence_knee_knee = Math.abs(r_knee_y - l_knee_y);

            // 右膝盖和左膝盖的y坐标的差值
            let distence_knee = r_knee_y - l_knee_y;

            // 左手腕子和左膝盖的y坐标的差值的绝对值
            let distence_elbow_knee = Math.abs(l_wrist_y - l_knee_y);

            // 右手腕子和右膝盖的y坐标的差值的绝对值
            let distence_elbow_ankle = Math.abs(r_wrist_y - r_knee_y);


            //  【右手轻拳 j 】 当右手超过头顶 但是左手在左肩膀下面的时候，实现跳跃
            if ((r_wrist <120))
            {
                console.log("right");  // 右手举起
                document.body.dispatchEvent(kj);
                document.body.dispatchEvent(kj_up);
                console.log("轻拳");   // 右手举起
            }

            // 【右腿轻腿 u 】
            if (distence_elbow_ankle < 70)
            {
                document.dispatchEvent(ku);
                document.dispatchEvent(ku_up);
                console.log("前空翻");  // 左手举起
            }

        //    【左腿重腿 i 】 如果两只手的间距小于50
            else if (distence_elbow_knee < 100)
            {
                document.dispatchEvent(ki);
                document.dispatchEvent(ki_up);
                console.log("重踢腿");
            }

        //    【双手合十重拳 k 】如果两只手的间距小于50 重拳
            else if((distence_wrist_abs < 80))
            {

                document.dispatchEvent(kk);
                document.dispatchEvent(kk_up);
                console.log("踢腿");  // 右手举起
            }

        } catch (e) // 如果没有找到
        {
            console.log(e); // 打印错误
        }
    }
    );
    // =====================================================================================
    function modelReady()
    {
        select('#status').html('model Loaded')
    }
}


function drawKeypoints()
{
    for (let i = 0; i < poses.length; i++)
    {
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++)
        {
            let keypoint = pose.keypoints[j];
            if (keypoint.score > 0.7)
            {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            }
        }
    }
}

function drawSkeleton()
{
    for (let i = 0; i < poses.length; i++)
    {
        let skeleton = poses[i].skeleton;
        for (let j = 0; j < skeleton.length; j++)
        {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(0, 255, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}

function draw()
{
    image(video, 0, 0, width, height);

    drawKeypoints();
    drawSkeleton();
}

