/*REVEALING PROTOTYPE PATTERN*/
/*******************************************************************************************************************************
*@usage		For creating particles with customizable shape, color, size, collision, etc.
*
*@example 	Pass in an object with all,some, or none of these properties.  The defaults are defined in the Particle function
			below this documentation and will be used whenever a different value is not specified.
			
			var bullet = new Particle({//create a bullet particle
				type:"shipBullet",
				shape:"rectangle",//circle or rectangle are supported
				color:'#0C8DCA',
				width:2*Director.scaleFactor||2,
				height:30*Director.scaleFactor||30,//used for rectangle
				radius:4*Director.scaleFactor||4,//used for circle
				x:this.x,//this refers to the player ship
				y:this.y,//this refers to the player ship
				life:2,//how long it lasts on the screen in seconds
				vX:this.vX+Math.sin(this.rotation * (Math.PI / -180)) * 20,//this refers to the player ship
				vY:this.vY+Math.cos(this.rotation * (Math.PI / -180)) * 20,//this refers to the player ship
				rotation:this.rotation,//this refers to the player ship
				hasFriction:false,//no friction--does not slow down over time
				hasCollision:true,//will collide with other objects
				damage:this.damage//this refers to the player ship
				quality:1,//number of blur iterations, more = fuzzier & more expensive
			});
			//add it to our screen otherwise we will never see it in action
			map.stage.container.addChild(bullet)
			
*									
*@return 	returns an instance of a Particle.  It needs to be added to the canvas after. (see example above)
********************************************************************************************************************************/

"use strict";
function Particle(options) {
	//default particle options
	var defaults = {
		x:0,
		y:0,
		vX:4*Director.scaleFactor||4,
		vY:4*Director.scaleFactor||4,
		life:2,
		color: "#" + Util.Color.randomHex(),
		shape:"circle",
		radius:4*Director.scaleFactor||4,
		width:4*Director.scaleFactor||4,
		height:20*Director.scaleFactor||20,
		rotation:0,
		quality:1,//number of blur iterations, more = fuzzier & more expensive
		hasFriction:true,
		hasCollision:false,
		damage:1,
		alpha:1.0,
		update:true,//whether to include item in render loop or not
		type:"effect"//important attribute to identify what kind of particle it is in later collision detection	
	}
	//merge settings with defaults
	Util.Array.merge(this,defaults,options)
	
	//add unique token for sub/unsub
	this.token = Util.Token.create();
	
    this.initialize();
}


Particle.prototype = (function(){
    
    var p = new createjs.Shape();
        
    // public CONSTANTS:
    Particle.FRICTION = 0.97;
	
	//public properties
	p.x;
	p.y;
    p.vX;//x velocity
    p.vY;//y velocity
	p.color;
    p.width;
    p.height;
	p.radius;
	p.life;
	p.alpha=1.00;
	p.alive = true;
	p.alphaDec;
	p.token;//holds unique identifier for sub/unsub to events

    p.Shape_initialize = p.initialize;	//unique to avoid overiding base class
    p.initialize = function () {
		this.Shape_initialize();//initialize shape...needed to be unique instance
		
		//how much we will decrease alpha each frame
		this.alphaDec = 1/(this.life*Director.FPS);
        
		//create the particle
        this.create();
			
		//SUBSCRIPTIONS
		//only render if setting is true
		if(this.update){
			Director.subscribe('render',function(){this.render()},this,this.token);
		}
    }
    
    // public methods:
    p.create = function () {
        //draw Particle
        var g = this.graphics; 
        g.clear();
		//fill the color
        g.beginFill(this.color);
		
		//what kind of shape?
		switch(this.shape){
			case "circle":
				//for rectangle bounds collision box
				this.width = this.height = this.radius*1.6;
				g.drawCircle(0,0,this.radius);
				break;
			case "rectangle":
				g.drawRect(0,0,this.width,this.height);
				break;	
			default:	
				throw('shape not supported');
		}
		
		//to speed up calculations later
		this.halfWidth = this.width/2;
		this.halfHeight = this.height/2;
		
		this.DAMAGE = this.damage;//for calculations from original value
		
		//blur it
		var blurFilter = new createjs.BlurFilter(4, 4, this.quality);
		this.filters = [blurFilter];
		var bounds = blurFilter.getBounds();
		this.cache(-this.width/2+bounds.x, -this.height/2+bounds.y, this.width+bounds.width, this.height+bounds.height);
    }
	
	/*******************************************************************************************************************************
	*@usage		Call whenever there is a reason to create some debris!!
	*
	*@example 	Particle.explode({target:enemy,attacker:bullet...});
	*									
	*		TYPE				VAR					DESCRIPTION
	*@param object 				target				The target of the explosion
	*@param object				attacker			The object that inflicted the damage  
	*
	*@param	number 				numDebrisFactor		A multiplier used in conjunction with attacker 
	*												velocity to determine the number of particles to create
	*
	*@param number|function		explosionWidth		Width of explosion, default is based off the velocity of attacker
	*@param number|function		explosionHeight		Height of explosion, default is based off the velocity of attacker
	*
	*@param object				debrisOptions		Object with Particle options -- see Particle prototype for all available options
	********************************************************************************************************************************/
	p.explode = Particle.explode = function(options){
		
		var defaults = {
			target:this,
			attacker:this,
			numDebrisFactor:0.3,
			numDebris:function(){return Math.floor(Math.abs(this.attacker.vX)+Math.abs(this.attacker.vY))},
			explosionWidth:function(){return this.attacker.vX*0.25},
			explosionHeight:function(){return this.attacker.vY*0.25},
			radius:3*Director.scaleFactor||3,
			debrisOptions:{}
		}
		
		//our settings
		var s = Util.Array.merge({},defaults,options);	
		
	
		//test if this param is a function or not and assign accordingly
		var explosionWidth = typeof(s.explosionWidth)==="function" ? s.explosionWidth() : s.explosionWidth;
		var explosionHeight = typeof(s.explosionWidth)==="function" ? s.explosionWidth() : s.explosionWidth;
		
		//random number of debris based on velocity, or what caller passed in
		var numDebris = typeof(s.numDebris)==="function" ? s.numDebris()*s.numDebrisFactor : s.numDebris*s.numDebrisFactor;

		for(var i=0;i<numDebris;i++){
			//random direction
			var vX = Math.sin(Math.floor(Math.random()*360) * (Math.PI / -180))*explosionWidth;
			var vY = Math.cos(Math.floor(Math.random()*360) * (Math.PI / -180))*explosionHeight;
			
			var defaultDebris = {
				life:1,
				x:s.target.x,
				y:s.target.y,
				vX:vX,
				vY:vY,
				radius:s.radius,
				color:s.target.color
			}
			
			var debrisSettings = Util.Array.merge({},defaultDebris,s.debrisOptions);
			
			var debris = new Particle(debrisSettings)
			//show it
			map.stage.container.addChild(debris);
		}
	}
	
	p.destroy = function(){
		//only register one destroy event
		if(!this.alive)return false;
		this.alive = false;
		//unsubscribe from events to prevent buildup
		Director.unsubscribeAll(this.token);
		//remove it when it is not visible
		map.stage.container.removeChild(this);
	}

    
    p.render = function () {
		//no longer active...get rid of it
		if(this.alpha <= 0){
			//remove it when it is not visible
			this.destroy();
		}
		
		//move by velocity
		this.x += this.vX;
		this.y += this.vY;
	
		
		//if we are trying to go out of bounds...
		if(!Collision.inMapBounds(this, map)){
			//remove it
			this.destroy();
		}
		
		//fade it out
		if(this.life!=-1){//-1 is a perma particle
			this.alpha-=this.alphaDec;
		}
		
		//damage of particle is based off it's alpha value, the farther away from the creation, the less the damage
		this.damage= this.DAMAGE*this.alpha;

		//at least 1 damage though
		if(this.damgage<1){this.damage=1}
		
		//decelerate over time
		if(this.hasFriction){
			this.vX *= Particle.FRICTION;
			this.vY *= Particle.FRICTION;
		}
		//if collision for particle is enabled
		if(this.hasCollision){
			for(var i=0;i<enemies.length;i++){
				//particle to enemy collision
				if(Collision.boundingRect(this,	enemies[i],map.stage.container.view)){
					Director.publish('enemyHit',this,enemies[i]);
				}
			}
			
			//particle to ship collision
			if(Collision.boundingRect(this,	ship,map.stage.container.view)){
				Director.publish('shipHit',this);
			}
		}
    }
    //return our prototype
    return p;
})();