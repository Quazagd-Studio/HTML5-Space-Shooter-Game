/*REVEALING PROTOTYPE PATTERN*/
"use strict";
function Enemy() {
	this.subscribed = false;
	//unique identifier
	this.token = Util.Token.create();
    this.initialize();
}


Enemy.prototype = (function(){
    
    var p = new createjs.Shape();
        
	//internal flag for triggering debug function inside render loop
	//setting to true only works if the Director has set debugging to true also
	var debugging = false;
	var debugRender;
    
    // public CONSTANTS:
    Enemy.FRICTION = 0.97;
	Enemy.ROT_SPEED = 6;
    
    
    p.vX;//x velocity
    p.vY;//y velocity
	p.curVX;
	p.curVY;
	
	p.color;
    
    p.width;
    p.height;
	
	p.alive = true;
	p.fireCooldown = 0;
	p.origFireCooldown = Director.FPS/2;
	p.damage = 1;
	p.weaponRange = 18;//default...18 times its dimensions
	p.type="enemy";
	p.projectileSpeed = 15;//speed of enemy's projectile
	p.maxVelocity = 5; 
	p.hitPoints = 50;//life
	p.points = 50;//how much it is worth to kill it
	
	p.token;
	
	p.movement;
	p.isMoving = false;
	p.movementTime = 0;//for storing how long a certain movement will take
	p.newRotation;
	p.wayPoints = [];
	p.wayPointReached = true;

    p.Shape_initialize = p.initialize;	//unique to avoid overiding base class
    p.initialize = function () {
		this.Shape_initialize();//initialize shape...needed to be unique instance
		//radius of circle
		this.radius = 15*Director.scaleFactor||15;
		//for rectangle bounds box
		this.width = this.height = this.radius*1.6;
		//to speed up later calculations
		this.halfWidth = this.width/2;
		this.halfHeight = this.height/2;
		
		//random hex color
		this.color = "#" + Util.Color.randomHex();
		
		//give it a random behavior
		var rand = Util.Number.randomRange(1,10);
		switch(rand){//10% chance for each case
				case 1:
					this.changeBehavior('Wanderer');
					break;
				case 2:
				case 3:
					this.changeBehavior('Tracker');
				break;
				case 4:
				case 5:
					this.changeBehavior('Kamikaze');
					break;
				case 6:
				case 7:
					this.changeBehavior('Sleeper');
					break;
				default:
					this.changeBehavior("Static Cannon");
		}
		
        //start off still
		this.vX = 0;
        this.vY = 0;
		this.info = this.points;//info for HUD to show points on death
		//BEGIN SUBSCRIPTIONS
		this.subscribe();
		
        this.create();
    }
    
    // public methods:
    p.create = function () {
        //draw enemy
        var g = this.graphics; 
        g.clear();
		//draw it
		g.beginFill(this.color);
		g.beginStroke('#222');
		switch(this.subType){
			case "Tracker":
				g.moveTo(0,20);
				g.lineTo(10,0);
				g.lineTo(0,-10);
				g.lineTo(-10,0);
				g.closePath();
				break;
				/*
			case "Wanderer":
				g.endStroke();
				g.beginFill('#666');
				g.drawRoundRectComplex(0,0,10,5,2,2,2,2);
				g.beginFill(this.color);
				g.beginStroke('#222');
				g.drawRoundRectComplex(-8,-8,8,32,4,4,2,2);
				g.drawRoundRectComplex(10,-8,8,32,4,4,2,2);
			*/	break;				
				
			default:
				g.drawCircle(0,0,this.radius);
				g.beginStroke('rgba(0,0,0,0.3)');
				g.beginFill('#666');
				g.drawRoundRectComplex(-4,0,8,25,4,4,2,2);				
		}
    }
	
	p.changeMovement = function(movement){//change the movement state
		this.movement = this.movements[movement];
	}
	
	p.move = function(){
		this.movement.execute(this);//whatever the object's movement is...do it.		
	}
	
	p.changeBehavior= function(subType){
		switch(subType){
			case "Wanderer":
				this.subType = "Wanderer";
				this.changeMovement('wander');
				this.weaponRange = 15;
				this.origFireCooldown = Director.FPS/2;
				this.hitPoints = 50;
				this.points = 75;
				this.damage = 3;
				break;
					
			case "Tracker":
				this.subType = "Tracker";
				this.changeMovement('track');
				this.weaponRange = 20;
				this.maxVelocity = 6;
				this.origFireCooldown = Director.FPS/4;
				this.hitPoints = 75;
				this.points = 200;
				this.damage = 2;
				break;
				
			case "Kamikaze":
				this.subType = "Kamikaze";
				this.changeMovement('suicide');
				this.maxVelocity = 8;
				this.weaponRange = 0;
				this.hitPoints = 40;
				this.points = 60;
				break;
			case "Sleeper":
				this.subType = "Sleeper";
				this.changeMovement('static');
				this.weaponRange = 0;
				this.HIT_POINTS = 60;
				this.hitPoints = this.HIT_POINTS;
				this.points = 100;
				break;
			case "Static Cannon":
				this.subType = "Static Cannon";
				this.changeMovement('static');
				this.weaponRange = 18;
				this.projectileSpeed = 15;
				this.hitPoints = 50;
				this.points = 50;
				this.origFireCooldown = Director.FPS/1.5;
				this.damage = 2;
				break;
			default:
				throw('Enemy Behavior Not Supported');
		}
		//change display value of how many point this enemy is worth
		this.info = this.points;
	}

    
    p.render = function () {
		//if it's off screen don't render it
		if(!Collision.inViewport(this,map.stage.container.view)){
			return false;
		}
		
		//check for collisions against other enemies
		for(var i=0;i<enemies.length;i++){
			//don't test if it's itself
			if(this == enemies[i]) continue;
			if(Collision.circleToCircle(this,enemies[i],map.stage.container.view)){	
				//register a hit		
				Director.publish('enemyHit',enemies[i],this);	
			}
		} 
		//check for collisions against player ship
		if(Collision.boundingRect(this,ship,map.stage.container.view)){		
			Director.publish('enemyHit',ship,this);						
		}
		
		//shoot the ship
		if(Collision.boundingRect(this,ship,map.stage.container.view,true,this.weaponRange)){
			//shoot
			this.fire();	
		}

		//move the enemy depending on its type
		this.move();
		
		
        //move by velocity
        this.x += this.vX;
        this.y += this.vY;
		
		
		//lower cooldown
		this.fireCooldown--;
		
		//keep the enemy within the bounds of the map
		Collision.keepInBounds(this,map);
        
        //decelerate over time
        this.vX *= Enemy.FRICTION;
        this.vY *= Enemy.FRICTION;
		
		//cap max speeds
		this.vX = Math.min(this.maxVelocity, Math.max(-this.maxVelocity, this.vX));
		this.vY = Math.min(this.maxVelocity, Math.max(-this.maxVelocity, this.vY));     
		
		if(debugging){
			debugRender();
		}
		
    }
	
	//takes the object attacking, and the enemy instance itself
	p.hit = function(attacker,enemy){	
		switch(attacker.type){
			case "enemy":
				//change velocity of enemies
				enemy.vX+=attacker.vX;
				enemy.vY+=attacker.vY;
				
				attacker.vX-=enemy.vX;
				attacker.vY-=enemy.vY;
				break;   
				
			case "ship":
				this.vX +=attacker.vX;
				this.vY +=attacker.vY;
				attacker.vX*=-1;
				attacker.vY*=-1;
				//lower hit points
				//based on velocity of ship
				var averageVelocity = Math.floor(Math.abs(attacker.vX)+Math.abs(attacker.vY));
				enemy.hitPoints-= averageVelocity/4;		
				//destroy enemy if out of life
				if(enemy.hitPoints <= 0){
					enemy.destroy(enemy);	
				}
				//create explosion debris
				Particle.explode({
					target:enemy,
					attacker:attacker,
					numDebrisFactor:0.5
				});
					
				break;
			case "shipBullet":
				//change velocity of enemies
				enemy.vX+=attacker.vX*0.05;
				enemy.vY+=attacker.vY*0.05;
				//decrease life
				enemy.hitPoints-=attacker.damage;
				//create debris
				Particle.explode({
					target:enemy,
					attacker:attacker,
					numDebrisFactor:attacker.alpha*0.5,
					explosionWidth:(Math.abs(attacker.vX)+Math.abs(attacker.vY))*(attacker.alpha*0.25),
					explosionHeight:(Math.abs(attacker.vX)+Math.abs(attacker.vY))*(attacker.alpha*0.25),
				});
				//remove bullet
				attacker.destroy();
				//destroy enemy if out of life
				if(enemy.hitPoints <= 0){
					enemy.destroy(enemy);		
				}
				break;
			case "enemyBullet":
				//can't hit itself
				if(attacker.enemyToken!=enemy.token){
				//change velocity of enemies
					enemy.vX+=attacker.vX*0.05;
					enemy.vY+=attacker.vY*0.05;
					//decrease life
					enemy.hitPoints-=attacker.damage;
					//create debris
					Particle.explode({
						target:enemy,
						attacker:attacker,
						numDebrisFactor:attacker.alpha*0.5,
						explosionWidth:(Math.abs(attacker.vX)+Math.abs(attacker.vY))*(attacker.alpha*0.25),
						explosionHeight:(Math.abs(attacker.vX)+Math.abs(attacker.vY))*(attacker.alpha*0.25),
					});
					//remove bullet
					attacker.destroy();
					//destroy enemy if out of life
					if(enemy.hitPoints <= 0){
						enemy.destroy(enemy);		
					}
				}
				break;
			case "explosionParticle":
				//change velocity of enemies
				enemy.vX+=attacker.vX*0.025;
				enemy.vY+=attacker.vY*0.025;
				//decrease life
				enemy.hitPoints-=attacker.damage;
				//create debris
				Particle.explode({
					target:enemy,
					attacker:enemy,//no attacker, but we'll pass it in for the data
					numDebrisFactor:0.1,
				});
				
				//destroy enemy if out of life
				if(enemy.hitPoints <= 0){
					//an explosion took this one out, so don't give as many points
					enemy.points = Math.ceil(Math.random()*enemy.points)
					enemy.destroy(enemy);		
				}
			break;
		}
	}
	
	p.fire = function(){
		if(this.fireCooldown>0||//wait to create bullet until we are off cooldown
		this.weaponRange==0||//don't fire if enemy has no range
		this.wayPoints[0]&&this.wayPoints[0].type!="target"){//don't fire if enemy is not headed towards its target
			return false;
		}
		//velocity for the bullet
		var velocity = Physics.getVelocity(this.rotation,this.projectileSpeed);
		//create particles for bullets
		var bullet = new Particle({
			type:"enemyBullet",
			shape:"rectangle",
			color:this.color,
			width:1*Director.scaleFactor||1,
			height:30*Director.scaleFactor||30,
			x:this.x,
			y:this.y,
			life:2,
			vX:this.vX+velocity.x,
			vY:this.vY+velocity.y,
			rotation:this.rotation,
			hasFriction:false,
			hasCollision:true,
			damage:this.damage,
			enemyToken:this.token//for keeping track of its own bullets
		});
		
		//add it
		map.stage.container.addChild(bullet);
		this.fireCooldown=this.origFireCooldown;
		
		
	}
	
	
	p.destroy = function(target){
		var target = target || this;
		//only if it is alive
		if(!target.alive)return false;
		//create debris from explosion
		Particle.explode({
			target:target,
			attacker:target,
			numDebrisFactor:1,
			numDebris:target.radius,
			explosionWidth:target.radius*0.5,
			explosionHeight:target.radius*0.5,
			debrisOptions:{type:"explosionParticle",life:1.5,hasCollision:true,damage:2}
		});
		

		//unsubscribe from all events
		Director.unsubscribeAll(target.token);
		//give points to player
		Director.publish('enemyDead',this);
		//remove the passed in target or this if none was given
		map.stage.container.removeChild(target);
		//used for removing object
		var tokenIDX = Util.Array.indexOfObject(enemies,'token',target.token);
		enemies.splice(tokenIDX,1);
		//set state to dead
		target.alive=false;

	}
	
	
	//SUBSCRIPTIONS
	p.subscriptions = [
		function(){
			Director.subscribe('render',function(){this.render()},this,this.token);
		},
		
		function(){
			Director.subscribe('debugging',function(){debugging = true;},null,this.token);
		},
		
		function(){
			Director.subscribe('enemyHit',function(attacker,enemy){
				//only register hit for the actual object passed in, not everyone on the list
				if(enemy.token!==this.token)return false;
				this.hit(attacker,enemy);
			},this,this.token);	
		}
	];
	
	p.subscribe = function(){
		if(this.subscribed) return false;
		this.subscribed = true;
		for(var sub in this.subscriptions){
			this.subscriptions[sub].call(this);	
		}			
	}

    //************************PRIVATE FUNCTIONS************************//

	debugRender = function(){
		for(var i=0;i<enemies.length;i++){
			//update collision rectangles
			//is it in the viewport?
			if(!Collision.inViewport(enemies[i],map.stage.container.view)){
				//only if it has the property otherwise just continue
				if(enemies[i].collisionBox){
					map.stage.container.removeChild(enemies[i].collisionBox);
					map.stage.container.removeChild(enemies[i].collisionBoxText);
					delete enemies[i].collisionBox;
					delete enemies[i].collisionBoxText;
				}
				continue;
			};
			
			//doesn't have a collision box...create it
			if(!enemies[i].collisionBox){
				var colBox = enemies[i].collisionBox = new createjs.Shape();
				colBox.graphics.beginStroke('#f00');
				colBox.graphics.drawRect(0,0,enemies[i].width,enemies[i].height)
				//add text to track coordinates
				var text = enemies[i].collisionBoxText = new createjs.Text("x: "+ Math.round(enemies[i].x)+" y: "+ Math.round(enemies[i].y), "12px Arial", "#ff7700");
				text.x = enemies[i].x;
				text.y = enemies[i].y;
		
				map.stage.container.addChild(text);
				map.stage.container.addChild(colBox);   
			}else{
				//update position of box
				enemies[i].collisionBox.x = enemies[i].x-enemies[i].halfWidth;
				enemies[i].collisionBox.y = enemies[i].y-enemies[i].halfHeight;	
				
				//update text
				enemies[i].collisionBoxText.x = enemies[i].x;
				enemies[i].collisionBoxText.y = enemies[i].y;
				enemies[i].collisionBoxText.text = "x: "+ Math.round(enemies[i].x)+" y: "+ Math.round(enemies[i].y);
			}
		}
		
	}
	
	function placeEnemy(enemy){
		//place them within the bounds of the map minus a little padding
		//distribute them evenly across map
		enemy.x = Util.Number.randomRange(-(map.mapBoundsWidth-map.stage.width-(enemy.width*2))/2,((map.mapBoundsWidth-map.stage.width-(enemy.width*2))/2)+map.stage.width)
		enemy.y = Util.Number.randomRange(-(map.mapBoundsHeight-map.stage.height-(enemy.height*2))/2,((map.mapBoundsHeight-map.stage.height-(enemy.height*2))/2)+map.stage.height)
		
		//avoid starting with enemy on player
		if(Collision.boundingRect(enemy,ship,map.stage.container,true,8)){
				placeEnemy(enemy);
		}
		
		//check against everone on the field now too
		for(var k=0;k<enemies.length;k++){
			if(Collision.boundingRect(enemy,enemies[k],false,true,4)){
				placeEnemy(enemy);	
			}
			
		}		
	}
	
	
	//listener for when map is ready to add the enemies
	Director.subscribe('restartGame',function(){
		window.enemies = [];//to store all enemies
		//create the enemies
		for(var i=0;i<30;i++){
			var enemy = new Enemy();
			//place the enemy
			placeEnemy(enemy);
			//add it to the map
			map.stage.container.addChild(enemy);
			//add them to global array
			enemies.push(enemy);			
		}		
	});
	

    //return our prototype
    return p;
})();