
function Map(options) {
	//defaults
	var defaults = {	
		canvasWidth:960,
		canvasHeight:480,
		mapBoundsWidth:3840,
		mapBoundsHeight:1920,
		miniMapRatio:0.2,
		makeMiniMap:true
	}
	//merge settings with defaults
	Util.Array.merge(this,defaults,options)

	this.init();
}
Map.prototype = (function(){
	
		"use strict";
		var p ={};//our return object
		
		p.init = function(){
			//background canvas
			var backgroundCanvas = document.createElement('canvas');
			backgroundCanvas.width = this.canvasWidth;
			backgroundCanvas.height = this.canvasHeight;
			backgroundCanvas.id = "bgCanvas";
			document.body.appendChild(backgroundCanvas);
			this.stage = new createjs.Stage(backgroundCanvas);
			
			this.stage.width = this.canvasWidth;
			this.stage.height = this.canvasHeight;

			Director.subscribe('render',function(){this.render()},this);
		}
		
		//create a miniMap of this
		p.createMiniMap = function(){
			//create our canvas
			var miniMap = document.createElement('canvas');
			this.miniMapPadding = 30;
			miniMap.width = (this.stage.canvas.width*this.miniMapRatio)+this.miniMapPadding;
			miniMap.height = (this.stage.canvas.height*this.miniMapRatio)+this.miniMapPadding;
			miniMap.id = "miniMap";
			document.body.appendChild(miniMap);
			miniMap.style.left = this.stage.canvas.offsetLeft+10+"px";
			miniMap.style.top = (this.stage.canvas.offsetTop+this.stage.canvas.offsetHeight) - miniMap.height-10+"px";
			//create it
			this.miniMap = new createjs.Stage('miniMap');
			this.miniMap.mapBoundsWidth = this.mapBoundsWidth;
			this.miniMap.mapBoundsHeight = this.mapBoundsHeight;
			this.miniMap.width = this.miniMap.canvas.width-this.miniMapPadding;//usable area, 
			this.miniMap.height = this.miniMap.canvas.height-this.miniMapPadding;
			
			//flag for determining whether objects have been added to mini-map or not
			this.miniMap.isPopulated = false;
			
			//calculate ratios for objects on mini-map
			this.miniMap.ratioY = this.miniMap.ratioX = this.miniMapRatio/(this.mapBoundsWidth/this.stage.width);
				
		}
		
		//update the miniMap view
		p.updateMiniMap = function(){
			
			
			
			//only the first time through
			if(!this.miniMap.isPopulated){
				this.miniMap.isPopulated = true;
				//clear it
				this.miniMap.removeAllChildren();
				var objects = this.stage.container.children;
				for(var i=0;i<objects.length;i++){
					if(objects[i].type==="star")continue;			
					//add each object to mini-map
					var indicator = new createjs.Shape(); 
					var g = indicator.graphics;
					
					if(objects[i].type=="ship"){
						g.beginFill(objects[i].color);
						g.moveTo(0,4);	//nose
						g.lineTo(2,-2.4);	//rfin
						g.lineTo(0,-0.8);	//notch
						g.lineTo(-2,-2.4);	//lfin
						g.closePath(); // nose
					}else{
						g.beginFill("#f00");
						g.drawCircle(0,0,2);
					}
					indicator.x = (objects[i].x*this.miniMap.ratioX)+(this.miniMap.width*0.375)+this.miniMapPadding/2;
					indicator.y = (objects[i].y*this.miniMap.ratioY)+(this.miniMap.height*0.375)+this.miniMapPadding/2;
					//connect object with its indicator
					indicator.token = objects[i].token;
					
					//add it to map
					this.miniMap.addChild(indicator);
				}
			}
			
			var items = this.miniMap.children;
			var entities  = map.stage.container.children;
			//update position of objects
			for(var i=0;i<items.length;i++){
				//get index to the object our indicator represents
				var idx = Util.Array.indexOfObject(entities,'token',items[i].token);
				//item was killed, remove it from the minimap and continue
				if(idx==-1){items.splice(i,1);continue}
				
				//set position equal to its pointer
				items[i].x = (entities[idx].x*this.miniMap.ratioX)+(this.miniMap.width*0.375)+this.miniMapPadding/2;
				items[i].y = (entities[idx].y*this.miniMap.ratioY)+(this.miniMap.height*0.375)+this.miniMapPadding/2;
				items[i].rotation = entities[idx].rotation;
			}
			//update stage object
			this.miniMap.update();
		}
		
		
		p.render = function(){
			this.updateMiniMap();	
		}
	
	return p;
}());

//wait for the game to start loading
Director.subscribe('loadAssets',function(){
	var cWidth = 960;
	var cHeight = 480;
	var win_w = window.innerWidth;
	var win_h = window.innerHeight;
	
	if(win_w<cWidth||win_h<cHeight){
			cWidth = win_w-2;//2 pixels for border
			cHeight = win_w/2;
				
			//cWidth = 480;
			//cHeight = 240;
			//scale everything by half
			Director.scaleFactor = cWidth/960;
	}
	
	//assign our map instance to a global for access
	window.map = new Map({canvasWidth:cWidth,canvasHeight:cHeight});
	
	//center the game vertically
	if(cHeight < win_h){
		map.stage.canvas.style.top = (win_h/2)-(cHeight/2)+"px";
	}
	//map is ready, let's notify everyone
	Director.publish('mapReady');
});

Director.subscribe('restartGame',function(){
	//all objects
	if(map.stage.container){
		map.stage.container.removeAllChildren();
	}
	//all static elements
	map.stage.removeAllChildren();

	//create the container that all objects will go inside that way we can scroll it without scrolling the actual stage
	map.stage.container = new createjs.Container();
	map.stage.addChild(map.stage.container);
	map.stage.container.view={x:0,y:0,width:map.stage.width,height:map.stage.height};
	
	//create it if it doesnt exist, otherwise reset it
	if(!map.miniMap){
		map.createMiniMap();
	}else{
		map.miniMap.isPopulated = false;
		Director.subscribe('render',function(){map.render()},map);
	}
	
	//draw the stars
	for(var i=0;i<500;i++){
		//distribute them evenly across map
		var x = Util.Number.randomRange(-(map.mapBoundsWidth-map.stage.width)/2,((map.mapBoundsWidth-map.stage.width)/2)+map.stage.width)
		var y = Util.Number.randomRange(-(map.mapBoundsHeight-map.stage.height)/2,((map.mapBoundsHeight-map.stage.height)/2)+map.stage.height)
		
		var quality = Util.Number.randomRange(2,5);
		var radius = Util.Number.randomRange(1,3);
		
		var star = new Particle({
				x:x,
				y:y,
				vX:0,
				vY:0,
				life:-1,
				color: "#fff",
				radius:radius,
				quality:quality,
				update:false,
				type:"star"
		});
		
		map.stage.container.addChild(star)
	}

	//bind camera to map
	map.camera = new Camera(map.stage.container);
});