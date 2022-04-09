//powerups
function Powerup(options){
	//default particle options
	var defaults = {
		x:0,
		y:0,
		life:-1,//doesn't fade away
		width:0,
		height:0,
		type:"random",
		subType:"random",
		particleSettings:ship.bulletSettings//object containing custom particle settings for powerup
	}
	//merge settings with defaults
	Util.Array.merge(this,defaults,options)
	
	//add unique token for sub/unsub
	this.token = Util.Token.create();
	
    this.initialize();	
}

Powerup.prototype = (function(){
	"use strict";
	
	var p = new createjs.Container();
	p.Container_initialize = p.initialize;	//unique to avoid overiding base class
	

	p.initialize = function(){
		this.Container_initialize();
		//the actual powerup graphic
		this.item = new createjs.Container();
		//set timer for fading in/out
		this.alphaTimer = this.ALPHA_TIMER = Director.FPS*2;
		this.alpha = 1.0;
		
		
		
		//SUBSCRIPTIONS
		Director.subscribe('render',function(){this.render()},this,this.token);
		
		//if a specific type was not passed in
		if(this.type==="random"){
			//choose a random type
			var rand = Util.Number.randomRange(1,10);
			switch(rand){
				case 1:
				case 2:
				case 3:
					this.type = "weapon";
					this.subType = "tripleCannon";
					this.info = "Triple Cannon";
					break;
				default:
					this.type = "weapon";
					this.subType = "dualCannon";
					this.info = "Dual Cannon"
			}
		}
		this.create();
	}
	
	p.create = function(){
		
		switch(this.type){
			//weapon upgrades.....
			case "weapon":
				switch (this.subType){
					case "dualCannon":	
						//first bullet
						var particleSettings = Util.Array.merge({},this.particleSettings,{
							x:-this.particleSettings.width*2.6,
							y:-this.particleSettings.height*0.3,
							vX:0,
							vY:0,
							life:this.life,
							type:"powerup",
							damage:0
						});	
						//create particle based on settings given
						this.item.addChild(new Particle(particleSettings));
						
						//second bullet
						particleSettings.x = this.particleSettings.width*2,
						particleSettings.y = -this.particleSettings.height*0.3,
						//create particle based on settings given
						this.item.addChild(new Particle(particleSettings));
						
						//set width and height and radius of container
						this.width = particleSettings.width*1.2;
						this.height = particleSettings.height*1.2;
						//make radius bigger of two sides, then multiply by 1.2 to give some padding
						this.radius = this.width > this.height? this.width*0.6 : this.height*0.6;
						break;
						
					case "tripleCannon":	
						//first bullet
						var particleSettings = Util.Array.merge({},this.particleSettings,{
							x:-this.particleSettings.width*5.6,
							y:-this.particleSettings.height*0.3,
							vX:0,
							vY:0,
							life:this.life,
							type:"powerup",
							damage:0
						});	
						//create particle based on settings given
						this.item.addChild(new Particle(particleSettings));
						
						//second bullet
						particleSettings.x = -this.particleSettings.width*0.3;
						particleSettings.y = -this.particleSettings.height*0.3,
						//create particle based on settings given
						this.item.addChild(new Particle(particleSettings));
						
						//third bullet
						particleSettings.x = this.particleSettings.width*5,
						particleSettings.y = -this.particleSettings.height*0.3,
						//create particle based on settings given
						this.item.addChild(new Particle(particleSettings));
						
						//set width and height and radius of container
						this.width = particleSettings.width*1.3;
						this.height = particleSettings.height*1.3;
						//make radius bigger of two sides, then multiply by 1.2 to give some padding
						this.radius = this.width > this.height? this.width*0.6 : this.height*0.6;
						break;
				}
			break;	
		}
		
		//create glow around object
		this.glow = new Particle({
			vX:0,
			vY:0,
			life:this.life,
			color: "#0C8DCA",
			radius:this.radius,
			quality:2,//number of blur iterations, more = fuzzier & more expensive
			hasCollision:false,
			damage:0,
			alpha:0.3
		});
		
		this.addChild(this.glow);
		this.addChild(this.item);
		
	}
	
	p.render = function(){
		//rotate item...
		this.rotation+=1;
		//countdown...
		this.alphaTimer--;
		if(this.alphaTimer<=0){
			this.alpha+=1/this.ALPHA_TIMER;
			if(this.alpha >= 1.0){
				this.alphaTimer=this.ALPHA_TIMER;
			}
		}else{
			if(this.alpha>0.25){
				this.alpha-=1/(this.ALPHA_TIMER*1.25);	
			}
		}
		
		//powerup was collected!
		if(Collision.boundingRect(this,ship)){
			//remove it from the map
			map.stage.container.removeChild(this);
			Director.unsubscribeAll(this.token);
			//let everyone know the player got a powerup
			Director.publish('gotPowerUp',this);
		}
		
	}
	
	Director.subscribe('restartGame',function(){
		//create a powerup based on a percentage chance
		Director.subscribe('enemyDead',function(enemy){
			var rand = Util.Number.randomRange(1,20);
			switch(rand){//10% chance
				case 1:
				case 2:
					map.stage.container.addChild(new Powerup({
							x:enemy.x,
							y:enemy.y
						})
					);
					break;	
			}
		},null,this.token);
		
	});
	return p;//return our prototype instance
}());