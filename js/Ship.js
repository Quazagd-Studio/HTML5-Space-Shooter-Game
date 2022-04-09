/*REVEALING PROTOTYPE PATTERN*/
"use strict";	
function Ship() {
    this.initialize();
}

Ship.prototype = (function(){
    
    var p = new createjs.Container();
	
	//internal flag for triggering debug function inside render loop
	//setting to true only works if the Director has set debugging to true also
	var debugging = false;
	var debugRender;
	var shipCoords;//for displaying text
    
    // public CONSTANTS:
    Ship.MAX_THRUST = 2;
    Ship.MAX_VELOCITY = 8;
    Ship.FRICTION = 0.97;
    Ship.ROT_SPEED = 8;
    Ship.ACCELERATION = 0.5;
	Ship.FIRE_COOLDOWN = Director.FPS/4; ///wait between shots
	Ship.SHIELD_TIMER = Director.FPS/2;//how long shield is active when hit
	Ship.SHIELD_ALPHA_MAX = 0.3;//maximum alpha value for shield
	Ship.SHIELD_POWER = 200;
	Ship.HEALTH = 50;
	Ship.SHIELD_REGENERATION = 0.75/Director.FPS; //divide by fps to get seconds
	Ship.EXHAUST_TIMER = Director.FPS/5; //for fading out sound
    
    // public properties:
    p.shipBody;
	p.shipShield;
    p.rotation;
    
    p.thrust;//acceleration
    
    p.vX;//x velocity
    p.vY;//y velocity
    
    p.width;
    p.height;
	
	p.color="#C0C0C0";
	
	p.weaponType = "singleCannon";
	p.fireCooldown = 0;
	p.bulletSpeed = 20;
	p.damage = 10;
	p.type="ship";
	p.shieldTimer=0;
	p.shieldsUp = false;
	p.shieldPower = Ship.SHIELD_POWER;//ship shield
	p.health = Ship.HEALTH;//ship life
	p.shieldsPoweringDown = false;
	p.score = 0;
	p.engineSound;
	p.engineSoundPlaying = false;
	p.exhaustTimer = Ship.EXHAUST_TIMER;
	
	//partial settings for player bullets..rest are set later based on current coords, velocity etc.
	p.bulletSettings = {
		type:"shipBullet",
		shape:"rectangle",
		color:'#32cd32',//green
		width:2*Director.scaleFactor||2,
		height:30*Director.scaleFactor||30,
		life:2,
		hasFriction:false,
		hasCollision:true,
	}
	

    // constructor:
    p.Container_initialize = p.initialize;	//unique to avoid overiding base class
    
    p.initialize = function () {
        this.Container_initialize();
        
        this.shipBody = new createjs.Shape();
		this.shipShield = new createjs.Shape();
        
        this.addChild(this.shipBody);
		this.addChild(this.shipShield);
        
        this.create();
        this.thrust = 0;
        this.rotation = 0;
        this.vX = 0;
        this.vY = 0;
		
		this.token = Util.Token.create();
		
		//for scaling 		
		Ship.MAX_THRUST = Ship.MAX_THRUST*Director.scaleFactor||Ship.MAX_THRUST;
		Ship.MAX_VELOCITY = Ship.MAX_VELOCITY*Director.scaleFactor||Ship.MAX_VELOCITY;
			
		//SUBSCRIPTIONS
		this.subscribe();
    }
    
    // public methods:
    p.create = function () {
		
		//based on ship vector dimensions
        this.width = 20*Director.scaleFactor||20;
        this.height = 32*Director.scaleFactor||32;
		
		//to speed up calculations made later
		this.halfWidth = this.width/2;
		this.halfHeight = this.width/2;  
		
		//create shield first so that ship is on top
		this.shipShield.alpha = 0;
		var g = this.shipShield.graphics;
		g.clear();
		g.beginFill('#0C8DCA');
		var shieldRadius = this.width > this.height ? shieldRadius = this.width*0.8 : shieldRadius = this.height*0.8;
		//draw it
		g.drawCircle(0,0,shieldRadius);
		//cache it so we can blur it
		//blur it
		var blurFilter = new createjs.BlurFilter(4, 4, 4);//x,y,quality
		this.shipShield.filters = [blurFilter];
		var bounds = blurFilter.getBounds();
		this.shipShield.cache(-shieldRadius+bounds.x, -shieldRadius+bounds.y, (shieldRadius*2)+bounds.width, (shieldRadius*2)+bounds.height);
		
		//draw ship body
        var g = this.shipBody.graphics;
        g.clear();
		g.beginStroke('#666');
        g.beginFill(this.color);
  
        g.moveTo(0, 20*Director.scaleFactor||20);	//nose
        g.lineTo(10*Director.scaleFactor||10, -12*Director.scaleFactor||-12);	//rfin
        g.lineTo(0, -4*Director.scaleFactor||-4);	//notch
        g.lineTo(-10*Director.scaleFactor||-10, -12*Director.scaleFactor||-12);	//lfin
        g.closePath(); // nose
    }

    
    p.render = function () {
		//check for collisions
		for(var i=0;i<enemies.length;i++){
			if(Collision.boundingRect(this,enemies[i],map.stage.container.view)){								
				//register a hit on the ship
				this.hit(enemies[i]);
			}
		} 
		
        //move by velocity
        this.x += this.vX;
        this.y += this.vY;
		
		
		//keep the ship within the bounds of the map
		if(Collision.keepInBounds(this,map)){
			//we had to course correct
			//damage ship for hitting wall if it's going fast enough
			if(Math.abs(this.vX) > 3||Math.abs(this.vY) > 3){
				this.hit({damage:0.1});
				//create some visual damage
				Particle.explode({
					target:this,
					attacker:this,
					numDebrisFactor:0.1				
				});
			}
		}
        
        //decelerate over time
        this.vX *= Ship.FRICTION;
        this.vY *= Ship.FRICTION;	
		
		//increase shield slowly over time
		if(this.shieldPower < Ship.SHIELD_POWER){
			this.shieldPower += Ship.SHIELD_REGENERATION;	
		}
		
		//decrement cooldown
		this.fireCooldown--;
		
		//decrement shield timer 
		this.shieldTimer--;
		
		//fade shields in
		if(this.shieldsUp){
			if(this.shieldTimer >=0){
				//if the alpha is less than the max, then bring it up
				if(this.shipShield.alpha <= Ship.SHIELD_ALPHA_MAX&&!this.shieldsPoweringDown){
					//increment it up
					this.shipShield.alpha+=(Ship.SHIELD_ALPHA_MAX/Ship.SHIELD_TIMER)*2;
				}else{
					//decrement it
					this.shieldsPoweringDown = true;
					this.shipShield.alpha-=(Ship.SHIELD_ALPHA_MAX/Ship.SHIELD_TIMER)*2;
					
				}
			}else{
				//reset shield alpha
				this.shipShield.alpha = 0;
				this.shieldsUp = false;
				this.shieldsPoweringDown = false;	
			}
		}
        
		/*
		//test to see if we are moving
		if(this.vX!=0||!Util.Number.inRange(this.oldX,this.x-(1-Ship.FRICTION),this.x+(1-Ship.FRICTION))){
			//calculate the ships destination coords
			//calcDestinationX.call(this);
		}
		if(this.vY!=0||!Util.Number.inRange(this.oldY,this.y-(1-Ship.FRICTION),this.y+(1-Ship.FRICTION))){
			//calculate the ships destination coords
			//calcDestinationY.call(this);
        }
		
		
		//set old x&y coords to current
        this.oldX = this.x;
        this.oldY = this.y
		
		*/
		
		if(debugging){
			debugRender();
		}
    }
    p.accelerate = function () {
        //increase push ammount for acceleration
        this.thrust += Ship.ACCELERATION;
        if (this.thrust > Ship.MAX_THRUST) {
            this.thrust = Ship.MAX_THRUST;
        }
		var velocity = Physics.getVelocity(this.rotation,this.thrust)
        //accelerate
        this.vX += velocity.x;//Math.sin(this.rotation * (Math.PI / -180)) * this.thrust;
        this.vY += velocity.y//Math.cos(this.rotation * (Math.PI / -180)) * this.thrust;
		
        //cap max speeds
        this.vX = Math.min(Ship.MAX_VELOCITY, Math.max(-Ship.MAX_VELOCITY, this.vX));
        this.vY = Math.min(Ship.MAX_VELOCITY, Math.max(-Ship.MAX_VELOCITY, this.vY));
		
		//random dir for exhaust 
		var vX = (Math.sin(Util.Number.randomRange(this.rotation-40,this.rotation+40) * (Math.PI / -180)))*-Util.Number.randomRange(this.thrust,Ship.MAX_VELOCITY);
		var vY = (Math.cos(Util.Number.randomRange(this.rotation-40,this.rotation+40) * (Math.PI / -180)))*-Util.Number.randomRange(this.thrust,Ship.MAX_VELOCITY);
		//create particles as ship exhaust
		var exhaust = new Particle({
			color:'#454545',
			x:this.x,
			y:this.y,
			radius:3*Director.scaleFactor||3,
			vX:vX,
			vY:vY,
			quality:4,
			life:0.5
		});
		//add the particles
		map.stage.container.addChild(exhaust);
		Director.publish('shipAccelerating');
    }

    p.rotate = function(dir){
        if(dir==="left"){
         	this.rotation-=Ship.ROT_SPEED;   
        }
        if(dir==="right"){
         	this.rotation+=Ship.ROT_SPEED;
        }
    }
	
	p.fire = function(){
		//wait to create bullet until we are off cooldown
		if(this.fireCooldown>0)return false;
		
		switch(this.weaponType){
			case "singleCannon":
				var velocity = Physics.getVelocity(this.rotation,this.bulletSpeed);
				var bulletSettings = Util.Array.merge({},this.bulletSettings,{
					x:this.x,
					y:this.y,
					vX:this.vX+velocity.x,
					vY:this.vY+velocity.y,
					rotation:this.rotation,
					damage:this.damage
				});
				
				//create particles for bullets
				var bullet = new Particle(bulletSettings);
				//add it
				map.stage.container.addChild(bullet);
				break;
			case "dualCannon":
				var velocity = Physics.getVelocity(this.rotation-5,this.bulletSpeed);
				var bulletSettings = Util.Array.merge({},this.bulletSettings,{
					x:this.x,
					y:this.y,
					vX:this.vX+velocity.x,
					vY:this.vY+velocity.y,
					rotation:this.rotation-5,
					damage:this.damage
				});
				//create particles for bullets
				var bullet = new Particle(bulletSettings);
				//add it
				map.stage.container.addChild(bullet);
				
				
				//second bullet
				var velocity = Physics.getVelocity(this.rotation+5,this.bulletSpeed);
				bulletSettings.vX = this.vX+velocity.x,
				bulletSettings.vY = this.vY+velocity.y,
				bulletSettings.rotation = this.rotation+5;
				//create particles for bullets
				var bullet = new Particle(bulletSettings);
				//add it
				map.stage.container.addChild(bullet);
				break;
			case "tripleCannon":
				var velocity = Physics.getVelocity(this.rotation-10,this.bulletSpeed);
				var bulletSettings = Util.Array.merge({},this.bulletSettings,{
					x:this.x,
					y:this.y,
					vX:this.vX+velocity.x,
					vY:this.vY+velocity.y,
					rotation:this.rotation-10,
					damage:this.damage
				});
				//create particles for bullets
				var bullet = new Particle(bulletSettings);
				//add it
				map.stage.container.addChild(bullet);
				
				//second bullet
				var velocity = Physics.getVelocity(this.rotation,this.bulletSpeed);
				bulletSettings.vX = this.vX+velocity.x,
				bulletSettings.vY = this.vY+velocity.y,
				bulletSettings.rotation = this.rotation;
				//create particles for bullets
				var bullet = new Particle(bulletSettings);
				map.stage.container.addChild(bullet);
				
				//third bullet
				var velocity = Physics.getVelocity(this.rotation+10,this.bulletSpeed);
				bulletSettings.vX = this.vX+velocity.x,
				bulletSettings.vY = this.vY+velocity.y,
				bulletSettings.rotation = this.rotation+10;
				//create particles for bullets
				var bullet = new Particle(bulletSettings);
				//add it
				map.stage.container.addChild(bullet);
				break;
		}
		
		//let anyone interested in knowing about this event
		Director.publish('shipFiring');
		//reset fire cooldown timer
		this.fireCooldown=Ship.FIRE_COOLDOWN;
	
	}
	
	//for when the ship is hit
	p.hit = function(attacker){	
		//if nothing is passed in create empty object to prevent errors
		var attacker = attacker ||{};
		
		
		switch(attacker.type){
			case "shipBullet"://can't hit ourself
					return false;
				break;
			case "enemy":
				this.vX +=attacker.vX;//attacker pushes the ship along
				this.vY +=attacker.vY;
				attacker.vX-=this.vX;
				attacker.vY-=this.vY;
			break;
			case "enemyBullet":
				attacker.destroy();//remove bullet after impact
			break;
		}
			
		
		//velocity of attacker		
		var averageVelocity = Math.floor(Math.abs(attacker.vX||this.vX)+Math.abs(attacker.vY||this.vY));	
		
		//subtract damage from shields
		this.shieldPower -=attacker.damage||averageVelocity/4;
		this.shieldPower = this.shieldPower || 0;
		//reset timer length on shield
		this.shieldTimer = Ship.SHIELD_TIMER;
		//shields down
		if(this.shieldPower >= 0){
			this.shieldsUp = true;			
		}else{
			//turn shield activation off
			this.shieldPower = 0;
			this.shieldsUp = false;
			this.shipShield.alpha=0;
			//subtract from health now
			this.health -=attacker.damage||averageVelocity/4;
			
			if(this.health <= 0){//dead meat
				this.health = 0;
				this.destroy();	
			}else{
				//create some debris from hit
				Particle.explode({
					target:this,
					attacker:attacker,
					radius:2,
					numDebrisFactor:attacker.alpha*0.5,
					explosionWidth:(Math.abs(attacker.vX)+Math.abs(attacker.vY))*(attacker.alpha*0.25),
					explosionHeight:(Math.abs(attacker.vX)+Math.abs(attacker.vY))*(attacker.alpha*0.25),
				});	
			}
		}
	}
	
	p.destroy = function(){
		//pass in some custom settings
		Particle.explode({
			target:this,
			attacker:this,
			numDebris:100,
			explosionWidth:12,
			explosionHeight:12,
			radius:4,
			debrisOptions:{life:3}
		});
		
		Director.publish('shipExploding');
		
		//clean up
		map.stage.container.removeChild(this);
		Director.unsubscribeAll(this.token);	
		setTimeout(function(){ //let the explosion play
			Director.publish('shipDead');
		},3500);
	}
	
	
	p.addToScore = function(object){
		this.score+=object.points;	
	}
	
	p.addPowerUp = function(powerup){
		switch(powerup.type){
			case "weapon":
				this.weaponType = powerup.subType;
				break;
		}
	}
	
	
		//SUBSCRIPTIONS
	p.subscriptions = [
		function(){
			Director.subscribe('keyLeft',function(){this.rotate('left')},this,this.token);
		},
		function(){
				Director.subscribe('keyRight',function(){this.rotate('right')},this,this.token);
		},
		function(){
				Director.subscribe('keyUp',function(){this.accelerate()},this,this.token);
		},
		function(){
				Director.subscribe('keyCtrl',function(){this.fire()},this,this.token);
		},
		function(){
				Director.subscribe('render',function(){this.render()},this,this.token);
		},
		function(){
				Director.subscribe('debugging',function(){debugging = true;debug();});
		},
		function(){
			Director.subscribe('shipHit',function(attacker){this.hit(attacker)},this,this.token);	
		},
		function(){
			Director.subscribe('enemyDead',function(enemy){this.addToScore(enemy)},this,this.token);	
		},
		function(){
			Director.subscribe('gotPowerUp',function(powerup){this.addPowerUp(powerup)},this,this.token);	
		}
	];
	
	p.subscribe = function(){
		if(this.subscribed) return false;
		this.subscribed = true;
		//loop through all subscriptions and call them all
		for(var sub in this.subscriptions){
			this.subscriptions[sub].call(this);
		}			
	}
	

    //************************PRIVATE FUNCTIONS************************//
	
	

    function calcDestinationX(){//calculates estimated future destination
    	//player is still moving...calculate destination coords
        //going left
        if(this.vX < 0 &&!Util.Number.inRange(this.oldX,this.x-(1-Ship.FRICTION),this.x+(1-Ship.FRICTION))){
            this.dX = this.x - (this.thrust/Ship.ACCELERATION);
            //log("this x: "+this.x+" dest x: "+this.dX);  
        }
        //going right
        if(this.vX > 0 &&!Util.Number.inRange(this.oldX,this.x-(1-Ship.FRICTION),this.x+(1-Ship.FRICTION))){
            this.dX = this.x + (this.thrust/Ship.ACCELERATION);
            //log("this x: "+this.x+" dest x: "+this.dX);  
        }
	}
	function calcDestinationY(){
        //going up
        if(this.vY < 0 &&!Util.Number.inRange(this.oldY,this.y-(1-Ship.FRICTION),this.y+(1-Ship.FRICTION))){
            this.dY = this.y - (this.thrust/Ship.ACCELERATION);
            //log("this y: "+this.y+" dest y: "+this.dY);  
        }
        //going down
        if(this.vY < 0 &&!Util.Number.inRange(this.oldY,this.y-(1-Ship.FRICTION),this.y+(1-Ship.FRICTION))){
            this.dY = this.y + (this.thrust/Ship.ACCELERATION);
            //log("this y: "+this.y+" dest y: "+this.dY);  
        }
    }
	
	function debug(){
		
		 //ship collision box
		ship.collisionBox = new createjs.Shape();
        ship.collisionBox.graphics.beginStroke("#f00");
        ship.collisionBox.graphics.drawRect(0,0,ship.width,ship.height);
		ship.collisionBox.regX = ship.halfWidth;
		ship.collisionBox.regY = ship.halfHeight;
		//ship xy coords
		shipCoords = new createjs.Text("x: "+ship.x+" y: "+ship.y, "12px Arial", "#ff7700");
		shipCoords.x = ship.x;
		shipCoords.y = ship.y;
		map.stage.container.addChild(shipCoords);
        map.stage.container.addChild(ship.collisionBox);
	}
		
			
	debugRender = function(){
		//move the collision box with the ship
		ship.collisionBox.x =ship.x;
		ship.collisionBox.y =ship.y
		
		//the collision should we reflect what this does, but it doesn't 
		//uncommenting this line will make the collision look correct but will not reflect the actual collision detectiond data
		//ship.collisionBox.rotation=ship.rotation;
		
		//update x/y coords for ship	
		shipCoords.x = ship.x;
		shipCoords.y = ship.y;
		shipCoords.text = "x: "+ship.x.toFixed(1)+" y: "+ship.y.toFixed(1);
	}
		

	
	
	//wait for map to be ready
	Director.subscribe('restartGame',function(){
		window.ship = new Ship();
		ship.x = map.stage.width/2;
		ship.y = map.stage.height/2;
		map.stage.container.addChild(ship);
		
		//tell everyone that we are ready
		Director.publish('shipReady');
	});
	

    //return our prototype
    return p;
})();