(function(){
	"use strict";
	//load our assets
	var assetsPath = "assets/sounds/";
	var manifest = [
		{id:"ambient-swell", src:"ambience-swell.mp3"},
		{id:"deep-space", src:"deep-space.mp3"},
		{id:"shipLaser", src:"laser.mp3"},
		{id:"shipThrust", src:"ship-thrust.mp3"},
		{id:"shipHit", src:"ship-hit.mp3"},
		{id:"shipExplode", src:"ship-explode.mp3"},						
		{id:"enemy-hit-bullet", src:"enemy-hit.mp3"},
		{id:"enemy-hit-bump", src:"boom-hit.mp3"},
		{id:"enemy-explode", src:"enemy-explode.mp3"},
		{id:"powerup", src:"powerup.mp3"},
	];
	var preload;
	//loading message
	var screenMessage = new createjs.Text("Loading","32px Arial","#c0c0c0");
	//vars to hold our background sounds
	window.deepSpace={};
	window.ambientSwell={};
	
	Director.subscribe('mapReady',function(){
		//begin loading
		preload = new createjs.LoadQueue();
		preload.installPlugin(createjs.Sound);
		preload.addEventListener("complete", doneLoading);
		preload.addEventListener("progress", updateLoading);
		preload.loadManifest(manifest, true, assetsPath);
		//add loading text
		map.stage.addChild(screenMessage);	
		//set the positioning
		var bounds = screenMessage.getBounds();
		screenMessage.x = map.stage.width/2-bounds.width/2-20;
		screenMessage.y = map.stage.height/2-bounds.height/2
	});
	
	
	function updateLoading(event) {
		var progress = event.target.progress*100|0;
		screenMessage.text = "Loading " + progress + "%";
		map.stage.update();
	}
	
	
	function doneLoading() {
		//remove loading text
		map.stage.removeChild(screenMessage);
		//let everyone know all assets have been loaded
		Director.publish('assetsLoaded');
		// start the background music
		deepSpace = createjs.Sound.play("deep-space", {interrupt:createjs.Sound.INTERRUPT_NONE, loop:-1});
		ambientSwell = createjs.Sound.play("ambient-swell", {interrupt:createjs.Sound.INTERRUPT_NONE, loop:-1});		
	}
}());