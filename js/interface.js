



// 事件函数
var Event = function ()
{
	// 事件列表
	var obj = {}

	// 添加事件（键值,事件函数, 类型）
	var listen = function (key, eventfn, type)
	{
		// 如果没有这个键值
		obj[key] || (obj[key] = Interfaces.Queue())
		if (type === 1) {

			//清除事件
			obj[key].clean()
		}

		// 添加事件
		obj[key].add(eventfn)
	}

	// 移除监听
	var removeListen = function (key)
	{
		obj[key] && obj[key].clean()
	}

	// 触发事件
	var fireEvent = function (key)
	{
		obj[key] && obj[key].fireEach.apply(this, Array.prototype.slice.call(arguments, 1))
	}

	return {
		listen: listen,
		removeListen: removeListen,
		fireEvent: fireEvent
	}


}




// 接口队列
var Interfaces = {

	//
	Lock: function () {

		// 定义 flag 变量
		var flag = false, timer, lock_delay, lock_level = 0

		// lock 函数 lock_level 参数为 0 时，锁定
		var lock = function (type, delay)
		{
			lock_level = type
			locked = type
		}

		// 解锁函数
		var unlock = function (_type) {

		}

		// 获取锁状态
		var locked = function () {
			return lock_level > 0
		}

		// 获取锁等级
		var getLevel = function () {
			return lock_level
		}

		// 获取锁等级
		return {
			lock: lock,
			locked: locked,
			unlock: unlock,
			getLevel: getLevel
		}
	},

	// 队列函数
	Queue: function () {

		// 定义队列
		var stack = []

		// 添加函数
		var add = function (obj)
		{
			//
			if (Util.isArray(obj)) {
				return stack = stack.concat(obj)
			}
			stack.push(obj)
			return stack
		}

		// unshift 函数
		var unshift = function (obj) {
			stack.unshift(obj)
		}

		// 删除函数
		var dequeue = function () {
			return stack.length && stack.shift()
		}
		// 删除函数
		var clean = function () {
			return stack.length = 0
		}
		// 队列长度置零
		var isEmpty = function () {
			return stack.length === 0
		}

		// fireEach 函数 参数为参数数组
		var fireEach = function () {
			for (var i = 0, c; c = stack[i++];) {
				c.apply(this, Array.prototype.slice.call(arguments, 0))
			}
		}

		var get = function () {
			return stack
		}

		var last = function () {
			return stack.length && stack[stack.length - 1]
		}

		return {
			add: add,
			unshift: unshift,
			dequeue: dequeue,
			clean: clean,
			isEmpty: isEmpty,
			fireEach: fireEach,
			get: get,
			last: last
		}

	},

	// 状态管理
	StatusManage: function () {

		// 定义状态
		var self = this,
			enemy_distance, 		// 敌人距离
			enemy_distance_type, 	// 敌人距离类型
			attack_type, 			// 攻击类型
			minLeft, 				// 最小距离
			maxLeft, 				// 最大距离
			attack_light, 			// 攻击灯
			attack_power, 			// 攻击力
			invincible = false, 		// 是否无敌
			custom_invincible = false	// 是否自定义无敌

		// 检测敌人距离
		var check_enemy_distance = function (enemy) {
			// 如果没有敌人 则返回0 两者距离为
			if (!enemy) return 0
			enemy_distance = Math.abs(self.left + self.width / 2 - (enemy.left + enemy.width / 2))
			//
			if (enemy_distance < 180) {
				enemy_distance_type = 'near'
			} else if (enemy_distance < 350) {
				enemy_distance_type = 'middle'
			} else if (enemy_distance < 650) {
				enemy_distance_type = 'far'
			} else {
				enemy_distance_type = 'furthest'
			}
			return enemy_distance_type
		}

		// 设置攻击类型
		var set_attack_type = function (type) {
			if (type === 2) {
				attack_light = self.state.indexOf('light') > -1
			}
			return attack_type = [
				'wait', 	// 等待
				'defense', 	// 防御
				'attack', 	// 攻击
				'beat', 	// 击倒
				'fall_down'	// 倒地
			][type || 0]
		}

		// 设置无敌模式
		var setInvincible = function (time) {
			custom_invincible = true
			setTimeout(function () {
				custom_invincible = false
			}, time)
		}

		// 设置攻击力
		var set_attack_power = function (power) {
			attack_power = power[0] || 0
			invincible = power[1] || false
		}

		// 设置攻击力
		var get = function () {
			return {
				enemy_distance_type: enemy_distance_type,
				enemy_distance: enemy_distance,
				attack_type: attack_type,
				attack_light: attack_light,
				attack_power: attack_power,
				invincible: invincible || custom_invincible
			}
		}

		// 跳跃
		var isJump = function () {
			return self.state && self.state.indexOf('jump') > -1
		}
		// 站立
		var isStand = function () {
			return self.state && self.state.indexOf('jump') < 0 && self.state.indexOf('crouch') < 0
		}
		// 蹲下
		var isCrouch = function () {
			return self.state && self.state.indexOf('crouch') > -1
		}
		// 自定义攻击
		var isCustom = function () {
			return self.state && self.state.indexOf('custom') > -1
		}


		return {
			check_enemy_distance: check_enemy_distance,	// 检测敌人距离
			set_attack_type: set_attack_type,			// 设置攻击类型
			set_attack_power: set_attack_power,			// 设置攻击力
			setInvincible: setInvincible,				// 设置无敌模式
			get: get,									// 获取状态
			isJump: isJump,								// 跳跃
			isStand: isStand,							// 站立
			isCrouch: isCrouch,							// 蹲下
			isCustom: isCustom							// 自定义攻击
		}

	},

	// 敌人管理
	Shadow: function () {

		var self = this, name = Config.spiritShadow, obj = Util.imgObj[name], imgObj = obj.obj, width = obj.width, height = obj.height, imgObj, direction = 1
		var top, left, timer

		// 初始化
		var _translate = function () {
			if (direction === 1) return
			window.map.translate(Map.width, 0)
			window.map.scale(-1, 1)
		}

		// 移动到指定位置
		var moveto = function (t, l, w, de) {
			top = t
			left = l
			w = w || width
			direction = de || 1
			_translate()


			window.map.drawImage(imgObj, 0, 0, width, height, direction === 1 ? (left + .5) | 0 : Map.width - left - w * 2, top, width * Config.map.spiritZoom * w / width, height * Config.map.spiritZoom)


			_translate()
		}

		return {
			moveto: moveto
		}

	},

	// 动画管理
	Animate: function () {

		var self = this,
			f_left = 0,
			f_top = 0,
			l_left = 0,
			l_top = 0,
			startTime,
			ime, easingfn,
			leftEasingfn,
			direction = 1,
			locked = false,
			event = Event(), arg

		// 阶段计数 阶段距离
		var stageCount = 0, stageDistance = 0

		// 帧完成队列
		var framesDoneQueue = Interfaces.Queue()

		// 帧完成事件
		var framesDone = function (fn) {
			framesDoneQueue.add(fn)
		}

		// 移动到
		var moveto = function (left, top) {
			f_left = self.left = left
			f_top = self.top = top
		}

		var now = function () {
			return +new Date
		}

		var move = function () {

			if (now() - startTime >= time) {
				event.fireEvent('framesDone')
			}

			event.fireEvent('frameStart')

			if (l_left === 0 && l_top === 0) {
				return event.fireEvent('frameDone')
			}

			var t = (now() - startTime) / time

			t = Math.min(t, 1)

			var _left = leftEasingfn(t, f_left, direction * l_left, 1)

			_left = _left - stageCount * stageDistance

			var newLeft = self.crossBorder(_left)

			if (locked === 'right' && newLeft > self.left && l_top === 0) {
				return
			}

			if (locked === 'left' && newLeft < self.left && l_top === 0) {
				return
			}

			self.left = newLeft

			self.top = easingfn(t, f_top, l_top, 1)

			event.fireEvent('frameDone')

			if (now() - startTime >= time) {
				event.fireEvent('framesDone')
			}

		}

		var lock = function (dir) {
			locked = dir
		}

		var unlock = function () {
			locked = false
		}

		var push = function (d) {
			self.left = self.crossBorder(self.left - d * direction)
		}


		var stagePush = function (dis) {
			stageCount++
			stageDistance = dis
		}

		var stopStagePush = function () {
			stageCount = 0
		}


		var start = function (left, top, t, fn) {
			arg = Array.prototype.slice.call(arguments, 0)
			f_left = self.left
			f_top = self.top
			l_left = left * direction
			l_top = top
			time = t
			startTime = +new Date
			stageCount = 0
			self.speed = Math.abs(left / (time / 17))
			leftEasingfn = easingfn = Config.easing[fn]
			if (fn === 'sineaseOut' || fn === 'sineaseIn') {
				leftEasingfn = Config.easing['linear']
			}
		}

		var getStageCount = function () {
			return stageCount
		}

		var correct = function () {
			self.top = self.f_top
		}

		var loop = function () {
			arg && start.apply(self, arg)
		}

		var mirror = function (de) {
			direction = de || direction
		}

		return {
			moveto: moveto,
			move: move,
			start: start,
			correct: correct,
			event: event,
			loop: loop,
			mirror: mirror,
			lock: lock,
			unlock: unlock,
			push: push,
			stagePush: stagePush,
			stopStagePush: stopStagePush
		}

	},

	// 地图管理
	SpiritFrames: function () {

		var imgObj, frame, img_combo_obj, self = this, currFrame = 0, _f_framesNum, _f_bg, framesNum, count = 0, timer, frameMmultiple, repeat, position, direaction = 1, event = Event(), arg

		spiritZoom = Config.map.spiritZoom

		var draw = function (cframe) {

			frame = Math.min(cframe || currFrame, framesNum - 1)

			repeat && (frame = getReallyFrame(frame, repeat))

			_translate()

			var combo = combo_attack.getcombo_attack()

			event.fireEvent('before_draw')

			if (combo) {
				window.map.drawImage(combo.imgObj, getReallyFrame(combo.currFrame, combo.repeat) * combo.width, 0, combo.width, combo.height, direaction === 1 ? self.left : Map.width - self.left - self.width * 2, self.top, combo.width * spiritZoom, combo.height * spiritZoom)
			} else {
				window.map.drawImage(imgObj, frame * self.width, 0, self.width, self.height, direaction === 1 ? self.left : Map.width - self.left - self.width * 2, self.top, self.width * spiritZoom, self.height * spiritZoom)
			}

			_translate()

		}

		var combo_attack = function () {

			var _combo_attack = {}, locked = false, donefn

			var start = function (bg, fNum, re, aFra) {
				if (locked) return false
				locked = true
				_combo_attack.imgObj = Util.imgObj[bg].obj
				_combo_attack.currFrame = 0
				_combo_attack.framesNum = fNum
				_combo_attack.repeat = re
				_combo_attack.afterFrame = aFra || 2
				_combo_attack.width = _combo_attack.imgObj.width / _combo_attack.framesNum
				_combo_attack.height = _combo_attack.imgObj.height
				if (_combo_attack.repeat) {
					_combo_attack.framesNum = 0
					for (var i = 0, c; c = _combo_attack.repeat[i++];) {
						_combo_attack.framesNum += c
					}
				}
				return true

			}

			var getcombo_attack = function () {
				if (_combo_attack.currFrame >= _combo_attack.framesNum) {

					if (frame < _f_framesNum - _combo_attack.afterFrame) frame = _f_framesNum - _combo_attack.afterFrame
					donefn && donefn()
				}
				if (isNaN(_combo_attack.currFrame) || _combo_attack.currFrame >= _combo_attack.framesNum) {
					return null
				}
				_combo_attack.currFrame++
				return _combo_attack
			}

			var stop = function () {
				_combo_attack = {}
				locked = false
			}

			var done = function (fn) {
				donefn = fn
			}

			return {
				start: start,
				getcombo_attack: getcombo_attack,
				stop: stop,
				done: done
			}

		}()

		var _translate = function () {
			if (direaction === 1) return
			window.map.translate(Map.width, 0)
			window.map.scale(-1, 1)
		}

		var repeatFrames = function () {
			if (!repeat) return
			framesNum = 0
			for (var i = 0, l = repeat.length; i < l; i++) {
				framesNum += repeat[i]
			}
		}

		var getReallyFrame = function (frame, re) {
			if (!re) return frame
			var k = 0

			for (var i = 0, l; l = re.length; i++) {
				k += re[i]
				if (k >= frame) {
					return i
				}
			}

			return frame
		}


		var checkZindex = function () {
			framefn.zIndex = +new Date
			Timer.checkZindex(framefn)
		}


		var framefn = function () {

			event.fireEvent('frameStart')

			/******************************** 改变自身帧 *********************************/
			if (count++ % frameMmultiple != 0) {  //未到达重绘的帧, 重绘保持之前的状态.
				return draw(currFrame - 1)
			};

			if (currFrame >= framesNum) {
				draw()
				timer.stop()
				return event.fireEvent('framesDone')
			} else {
				draw()
			}

			currFrame++
			event.fireEvent('frameDone')

		}

		framefn.zIndex = +new Date

		timer = Timer.add(framefn)

		var setParam = function (bg, fNum, mul, re, po, de) {
			currFrame = 0
			count = 0
			imgObj = Util.imgObj[bg].obj
			framesNum = fNum
			_f_framesNum = fNum
			_f_bg = bg
			frameMmultiple = mul || frameMmultiple
			repeat = re
			position = po || 0
			direaction = de || 1
			repeatFrames()
		}

		var start = function (bg, fNum, mul, re, po, de) {
			arg = Array.prototype.slice.call(arguments, 0)
			event.fireEvent('framesStart')
			setParam(bg, fNum, mul, re, po, de)
			timer.start()
		}

		var loop = function () {
			start.apply(self, arg)
		}

		var stop = function () {
			timer.stop()
		}

		return {
			start: start,
			loop: loop,
			event: event,
			combo_attack: combo_attack,
			stop: stop,
			checkZindex: checkZindex
		}

	},

	// 按键管理
	KeyManage: function () {

		//按键管理
		var key_fps = Config.key_fps / Config.fps | 0

		// 添加事件监听
		var addEventListener = function (element, e, fn) {
			if (element.addEventListener) {
				element.addEventListener(e, fn, false)
			} else {
				element.attachEvent('on' + e, fn)
			}
		}

		// 返回按键状态
		return function (keyMap) {

			var self = this,
				_move = keyMap.move,
				_mapping = keyMap.mapping,
				_attack = keyMap.attack,
				_map = {},
				_attack_map = {},
				_stack = [],
				_keydown,
				_keyup,
				timer,
				count = 0,
				lock = false,
				event = Event()

			var keyQueue = Interfaces.Queue()

			addEventListener(document, 'keydown', function (ev) {

				if (lock) return

				var keycode = ev.keyCode, key = _mapping[keycode]

				if (!key) return

				/*********************** 动作为攻击, 立即触发 ************************/

				var attackKey = _attack.normal[key]

				if (attackKey) {

					if (_attack_map[attackKey] === true) return

					return setTimeout(function () {

						_attack_map[attackKey] = true

						if (keyQueue.isEmpty()) {    //如果队列里没有动作(特殊技能), 加上缓存里的动作(移动键).
							var _moveOp = _move[getKeyMap()] || _move[getKeyMapFirst()]
							_moveOp && keyQueue.add(_moveOp)
						}

						keyQueue.add(attackKey)

						var keyqueue = keyQueue.get().slice(0)

						var keys = keyqueue.join(',')   //加上队列里的动作.

						keyQueue.clean()

						return _keydown && _keydown(_attack.special[keys] || attackKey)

					}, 50)
				}

				/*********************** 动作为移动, 添加到队列 ************************/
				_map[key] = true

			})

			addEventListener(document, 'keyup', function (ev) {

				if (lock) return

				var keycode = ev.keyCode, key = _mapping[keycode]
				if (!key) return
				var attackKey = _attack.normal[key]
				_attack_map[attackKey] = false
				_map[key] = false
			})

			var getKeyMap = function () {
				var key = ''
				for (var i in _map) {
					_map[i] && (key += i)
				}
				return key
			}

			var getKeyMapFirst = function () {
				for (var i in _map) {
					return _map[i] && i
				}
				return ''
			}

			var framefn = function () {   //给move用的

				if (lock) return

				var op = _move[getKeyMap()] || _move[getKeyMapFirst()]
				op ? _keydown(op) : _keyup()

				if (op) {
					var last = keyQueue.last()
					if (!last || op !== last) keyQueue.add(op)
				}

				if (++count % key_fps === 0) {
					count = 0
					keyQueue.clean()
				}
			}

			var timer = Timer.add(framefn)

			timer.start()

			var match = function (fn) {
				_keydown = fn
			}

			var unmatch = function (fn) {
				_keyup = fn
			}

			var mirror = function (direction) {
				_move = direction === 1 ? keyMap.move : keyMap.move_mirror
			}

			var start = function () {
				lock = false
			}

			var stop = function () {
				_map = {}
				keyQueue.clean()
				lock = true
			}

			return {
				event: event,
				match: match,
				unmatch: unmatch,
				mirror: mirror,
				start: start,
				stop: stop
			}

		}


	}(),

	// 动作管理
	Collision: function () {

		var stack = []

		return function (w, h) {

			var self = this, event = Event(), rea_width = w, rea_height = h

			stack.push(self)

			var check = function () {

				var width = rea_width || self.width, height = rea_height || self.height


				for (var i = 0, c; c = stack[i++];) {

					if (c === self || c.master === self || c === self.master) {
						continue
					}

					var der = (width / 2 + c.width / 2) * Config.map.spiritZoom

					var xy1 = [self.left + width * Config.map.spiritZoom / 2, self.top + height * Config.map.spiritZoom / 2]

					var xy2 = [c.left + c.width * Config.map.spiritZoom / 2, c.top + c.height * Config.map.spiritZoom / 2]

					var x = Math.abs(xy2[0] - xy1[0])

					var y = Math.abs(xy2[1] - xy1[1])

					if (Math.pow(x, 2) + Math.pow(y, 2) <= Math.pow(der, 2)) {
						event.fireEvent.call(self, 'affirm', c, self.left < c.left ? 'right' : 'left')
					}

				}

				return event.fireEvent.call(self, 'unAffirm')

				//return unqueue.fireEach.call( self );					

			}

			var getAll = function () {
				return stack
			}


			return {
				check: check,
				event: event,
				getAll: getAll
			}


		}

	}(),


	AttackEffect: function (mas) {

		var self = this, num = 0, currFrame = 0, timer, imgObj, left = 0, top = 0, width, height, frameMmultiple = 5, count, master = mas

		var _translate = function () {
			window.map.translate(Map.width, 0)
			window.map.scale(-1, 1)
		}

		var framefn = function () {
			if (count++ % frameMmultiple !== 0) {  //未到达重绘的帧, 重绘保持之前的状态.
				currFrame = currFrame - 1
			};
			if (master && master.direction === -1) {
				_translate()
				window.map.drawImage(imgObj, currFrame * width, 0, width, height, Map.width - left - master.width * 2, top, width * spiritZoom, height * spiritZoom)
				_translate()
			} else {
				window.map.drawImage(imgObj, currFrame * width, 0, width, height, left, top, width * spiritZoom, height * spiritZoom)
			}
			currFrame++
			if (currFrame >= num) {
				timer.stop()
			}
		}

		timer = Timer.add(framefn)

		var start = function (type, l, t) {
			num = { 'light': 3, 'heavy': 4, 'defense': 5, 'transverseWaveDisappear': 5 }[type] || 3
			currFrame = 0
			count = 0
			imgObj = Util.imgObj[type].obj
			left = l
			top = t
			width = imgObj.width / num
			height = { 'light': 19, 'heavy': 31, 'defense': 32, 'transverseWaveDisappear': 28 }[type] || 19
			timer.start()
		}


		return {
			start: start
		}

	},


	Audio: function () {

		var audio = new Audio()

		var play = function (src) {
			if (!src) return
			// audio.src = src
			audio.play()
		}

		var pause = function () {
			audio.pause()
		}

		var loop = function () {
			audio.loop = true
		}

		return {
			play: play,
			pause: pause,
			loop: loop
		}

	}



}


