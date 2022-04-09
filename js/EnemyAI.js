//Enemy AI
Enemy.prototype.movements = {
	'static':new Movement(function(self){
		//if it's a sleeper and it has been hit, activate it
		if(self.subType=="Sleeper"&&self.hitPoints < self.HIT_POINTS){
			self.changeBehavior('Tracker');
		}
		if(self.subType!="Sleeper"){
			self.wayPoints[0] = {x:ship.x,y:ship.y,type:'target'};
			//rotate it towards its target
			AI.rotateToTarget(self,self.wayPoints[0],Enemy.ROT_SPEED);
		}
	}),
	'wander':new Movement(function(self){//self = the 'this' parameter
		
		if(!self.wayPoints[0]){
			var newX = Util.Number.randomRange(
							-(map.mapBoundsWidth-map.stage.width-(self.width*2))/2,
							((map.mapBoundsWidth-map.stage.width-(self.width*2))/2)+map.stage.width
						);
			var newY = Util.Number.randomRange(
							-(map.mapBoundsHeight-map.stage.height-(self.height*2))/2,
							((map.mapBoundsHeight-map.stage.height-(self.height*2))/2)+map.stage.height
						);
								
			self.wayPoints[0] = {x:newX,y:newY,type:'target'};
		}

		//rotate it towards its target
		AI.rotateToTarget(self,self.wayPoints[0],Enemy.ROT_SPEED);
		//set velocity
		var velocity = Physics.getVelocity(self.rotation,self.maxVelocity);
		self.vX = velocity.x;
		self.vY = velocity.y;
		
		//if we reached the point, remove it from our wayPoints...
		//some margin of error is allowed or the condition will rarely/never be met
		if(Util.Number.inRange(self.x,self.wayPoints[0].x-10,self.wayPoints[0].x+10)&&
			Util.Number.inRange(self.y,self.wayPoints[0].y-10,self.wayPoints[0].y+10)
		){
			 self.wayPoints.shift();//remove the way point we just traveled to
			 self.wayPointReached = true;
		}

	}),
	'track':new Movement(function(self){//self = the 'this' parameter
		if(self.wayPoints[0]){
			//rotate it towards its target
			AI.rotateToTarget(self,self.wayPoints[0],Enemy.ROT_SPEED);
			//set velocity
			var velocity = Physics.getVelocity(self.rotation,self.maxVelocity);
			self.vX = velocity.x;
			self.vY = velocity.y;
			
			//if we reached the point, remove it from our wayPoints...
			//some margin of error is allowed or the condition will rarely/never be met
			if(Util.Number.inRange(self.x,self.wayPoints[0].x-10,self.wayPoints[0].x+10)&&
				Util.Number.inRange(self.y,self.wayPoints[0].y-10,self.wayPoints[0].y+10)
			){
				 self.wayPoints.shift();//remove the way point we just traveled to
				 self.wayPointReached = true;
			}
		}else{
			//default way point, only set first time through
			self.wayPoints[0] = {x:ship.x,y:ship.y,type:'target'};
		}
			
		if(Collision.boundingRect(self,ship,map.stage.container.view,true,7)){	
				//if we haven't reached our last way point and the way point is something other than the ship
				//return false
				if(!self.wayPointReached&&self.wayPoints[0].type!="target") return false;
				var newPoint = AI.getRandomPointBehindObject(self);
				newPoint.type = "random";
				self.wayPoints[0] = newPoint;
				self.wayPointReached = false;
		}else{
			if(!self.wayPoints[0])return false;//make sure there is a point
			//if the enemy is trying to navigate away from the ship, don't reassign it to the ship
			if(self.wayPoints[0].type=="random") return false;
			self.wayPoints[0] = {x:ship.x,y:ship.y,type:'target'};
			self.wayPointReached = false;
		}
		
	}),
	'suicide':new Movement(function(self){//self = the 'this' parameter
		//set target
		self.wayPoints[0] = {x:ship.x,y:ship.y,type:'target'};
		//rotate it towards its target
		AI.rotateToTarget(self,self.wayPoints[0],Enemy.ROT_SPEED);
		//set velocity
		var velocity = Physics.getVelocity(self.rotation,self.maxVelocity);
		self.vX = velocity.x;
		self.vY = velocity.y;
		
		//KAMIKAZE!!!
		if(Collision.boundingRect(self,self.wayPoints[0],map.stage.container.view,true,1)){								
			self.destroy(self);
		}
	}),
	
};