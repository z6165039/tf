"use strict";
(function() {
	var towerButtons = [];

	var canvas = document.querySelector('#game');
	var nextwave = document.querySelector('#nextwave');
	var towerPanel = document.querySelector('#towers');
	var moneyInfo = document.querySelector('#money-info');
	var healthInfo = document.querySelector('#health-info');
	var towerInfo = document.querySelector('#tower-info');
	var timeInfo = document.querySelector('#time-info');
	var soundInfo = document.querySelector('#sound-info');
	var startWaveButton = document.querySelector('#startWave');
	var buyMedipackButton = document.querySelector('#buyMedipack');
	var buyTowerbuildButton = document.querySelector('#buyTowerbuild');

	var towerType = undefined;
	var getMousePosition = function(evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	};
	var updateNextWave = function() {
		nextwave.innerHTML = '';
		var names = logic.waves.nextOpponents();

		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			var unit = types.units[name];
			var img = images[unit.sprite];
			var div = document.createElement('div');
			var icon = document.createElement('canvas');
			var width = img.width / unit.frames;
			icon.width = 32;
			icon.height = 32;
			var targetHeight = img.height > 32 ? 32 : img.height;
			var targetWidth = width * targetHeight / img.height;
			var ctx = icon.getContext('2d');
			ctx.drawImage(img, 0, 0, width, img.height, 16 - targetWidth * 0.5, 16 - targetHeight * 0.5, targetWidth, targetHeight);
			div.appendChild(icon);
			var info = document.createElement('div');
			info.innerHTML = [
				'<div class=title>', unit.nickName, '</div>',
				'<div class=description>', unit.description, '</div>',
				'<div class=rating>', ~~unit.rating, '</div>',
				'<div class=speed>', unit.speed, '</div>',
				'<div class=damage>', unit.hitpoints, '</div><div style="clear:both"></div>',
			].join('');
			info.classList.add('info');
			div.appendChild(info);
			nextwave.appendChild(div);
		}
	};
	var addHandlers = function() {
		logic.addEventListener(events.waveFinished, function() {
			timeInfo.textContent = 'All units are out!';
		});
		logic.addEventListener(events.waveDefeated, function() {
			timeInfo.textContent = 'Game saved';
			startWaveButton.disabled = false;
			localStorage.towerDefense = JSON.stringify(logic.saveState());
			updateNextWave();
		});
		logic.addEventListener(events.playerDefeated, function() {
			timeInfo.textContent = 'Game over ...';
			alert('You lost! Press refresh for a restart.');
		});
		logic.addEventListener(events.waveCreated, function(wave) {
			timeInfo.textContent = wave.units.length + ' units remaining';
			startWaveButton.querySelector('span').textContent = (wave.index + 1);
			startWaveButton.disabled = true;
			delete localStorage.towerDefense;
		});
		logic.addEventListener(events.unitSpawned, function(remaining) {
			timeInfo.textContent = remaining + ' units remaining';
		});
		logic.addEventListener(events.moneyChanged, function(player) {
			moneyInfo.textContent = player.money;
			buyMedipackButton.disabled = player.money < logic.mediPackCost;
			buyTowerbuildButton.disabled = player.money < logic.towerBuildCost;

			for (var i = 0; i < towerButtons.length; ++i)
				towerButtons[i].element.disabled = towerButtons[i].tower.cost > player.money;
		});
		logic.addEventListener(events.healthChanged, function(player) {
			healthInfo.textContent = player.hitpoints;
		});
		logic.addEventListener(events.towerBuildCostChanged, function(cost) {
			buyTowerbuildButton.querySelector('span').textContent = cost;
		});
		logic.addEventListener(events.mediPackCostChanged, function(cost) {
			buyMedipackButton.querySelector('span').textContent = cost;
		});
		logic.addEventListener(events.towerNumberChanged, function(info) {
			towerInfo.textContent = info.current + ' / ' + info.maximum;
		});
		startWaveButton.addEventListener(events.click, function() {
			logic.beginWave();
		});
		buyMedipackButton.addEventListener(events.click, function() {
			logic.buyMediPack();
		});
		buyTowerbuildButton.addEventListener(events.click, function() {
			logic.buyTowerBuildRight();
		});
		soundInfo.addEventListener(events.click, function() {
			var on = 'on';
			var off = 'off'
			var status = this.classList.contains('on');
			this.classList.remove(status ? on : off);
			this.classList.add(status ? off : on);
			Sound.setVolume(status ? 0 : 1);
		});
		canvas.addEventListener(events.click, function(evt) {
			var mousePos = getMousePosition(evt);
			var pos = logic.transformCoordinates(mousePos.x, mousePos.y);
			evt.preventDefault();

			if (towerType) logic.buildTower(pos, towerType);
			else logic.destroyTower(pos);
		});
		canvas.addEventListener(events.contextmenu, function(evt) {
			var mousePos = getMousePosition(evt);
			var pos = logic.transformCoordinates(mousePos.x, mousePos.y);
			evt.preventDefault();
			logic.destroyTower(pos);
		});
		canvas.addEventListener(events.mouseover, function(evt) {
			view.showGrid = true;
		});
		canvas.addEventListener(events.mouseout, function(evt) {
			view.showGrid = false;
		});
	};
	var addTower = function(tower) {
		var img = images[tower.sprite];
		var div = document.createElement('button');
		div.innerHTML = [
			'<div class=preview><div style="background: url(', img.src, ') no-repeat; width: ', ~~(img.naturalWidth / tower.frames), 'px; height: ', img.naturalHeight, 'px" class="preview-image"></div></div>',
			'<div class=title>', tower.nickName, '</div><div class=info>',
			'<div class=description>', tower.description, '</div>',
			'<div class=rating>', ~~tower.rating, '</div>',
			'<div class=speed>', tower.speed, '</div>',
			'<div class=damage>', tower.shotType.damage, '</div>',
			'<div class=range>', tower.range, '</div>',
			'<div class=cost>', tower.cost, '</div></div>',
		].join('');
		towerButtons.push({
			tower: tower,
			element: div,
		});
		div.addEventListener(events.click, function() {
			towerType = tower;

			for (var i = towerButtons.length; i--; )
				towerButtons[i].element.classList.remove('selected-tower');

			this.classList.add('selected-tower');
		});
		towerPanel.appendChild(div);
	};
	var addTowers = function() {
		for (var key in types.towers)
			addTower(types.towers[key]);
	};
	var startMusic = function() {
		var music = sounds['burn_them_down'];

		if (music) {
			var sound = new Sound(music, true);
			sound.setVolume(0.3);
			sound.play();
		} else
			soundInfo.classList.add('hidden');
	};
	var completed = function(e) {
		addTowers();
		addHandlers();
		view.background = images.background;
		view.showGrid = false;
		buyMedipackButton.querySelector('span').textContent = logic.mediPackCost;
		buyTowerbuildButton.querySelector('span').textContent = logic.towerBuildCost;
		document.querySelector('#frame').classList.remove('hidden');
		document.querySelector('#wait').classList.add('hidden');
		startMusic();
		logic.start();

		if (localStorage.towerDefense !== undefined) {
			var result = confirm('Previous game found. Load previous game?');

			if (result) {
				var state = JSON.parse(localStorage.towerDefense);
				logic.loadState(state);
				startWaveButton.querySelector('span').textContent = logic.waves.index + 1;
			}
		}

		updateNextWave();
	};
	var progress = function(e) {
		document.querySelector('#wait-message').textContent = 'Loading (' + e.name + ', ' + ~~(e.progress * 100) + '% of ' + e.total + ')';
	};

	var view = new CanvasView(canvas);
	var logic = new GameLogic(view, 30, 15);
	var loader = new Loader(completed, progress);
	loader.set('Images', ImageLoader, images, resources.images);
	loader.set('Sounds', SoundLoader, sounds, resources.sounds);
	loader.start();
})();