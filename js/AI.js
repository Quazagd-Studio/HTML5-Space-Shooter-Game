var AI = (function(AI){
	"use strict";
	/*
	//returns the velocity and angle required to intersect with p2, also returns estimated travel time
	AI.getVelAngleToTarget = function(p1,p2,speed,pixelError){
		//the margin of intentional error > and < actual coords
		var error = pixelError || 0;
		//cache a reference
		var p2C = {};
		p2C.x = p2.x;
		p2C.y = p2.y;
		//if a margin of error is wanted
		if(error){
			p2C.x = Util.Number.randomRange(p2.x-error,p2.x+error);
			p2C.y = Util.Number.randomRange(p2.y-error,p2.y+error)
		}

		//calculate angle to rotate to
		var rotation = Geometry.angleToTarget(p1,p2C);
		
		//get the velocity to destination
		var unitVelocity = Geometry.unitVelocityTo(p1,p2C);
		
		//multiply by speed
		var vX = unitVelocity.x * speed;
		var vY = unitVelocity.y * speed;
		
		//calculate an ETA
		var distance = Geometry.distanceTo(p1,p2C);
		var ETA = distance/speed;
		
		return {
			vX:vX,
			vY:vY,
			rotation:rotation,
			ETA:ETA	
		}
	}
	*/
	
	/*********************************************************************
	*@brief		Rotate an object towards a point in the shortest distance
	*
	*					@TYPE		@DESCRIPTION
	*@param p1			Object		object to rotate
	*@param p2			Object		object to rotate towards
	*@param rotSpeed	Number		How fast to rotate p1 towards p2
	*********************************************************************/
	AI.rotateToTarget = function(obj1,obj2,rotSpeed){
		//the angle we want to end up at
		obj1.targetRotation = Geometry.angleToTarget(obj1,obj2);
		var diff = (obj1.targetRotation-obj1.rotation)*(Math.PI/180);
        // find the rotation of the vector created by the sin and cos of the difference
		var rotationDifference = Math.atan2(Math.sin(diff),Math.cos(diff));
		//rotate p1 until it is facing p2
		obj1.rotation+=Math.max(Math.min((180/Math.PI)*rotationDifference,rotSpeed),-rotSpeed);
	}
	
	
	//returns a random point in the opposite direction the object is traveling 
	AI.getRandomPointBehindObject = function(obj){
		var newX;
		var newY;
		var viewport = map.stage.container.view;
		
		//if the object is heading right and its x velocity is greater than its y velocity (mostly going right)
		if(obj.vX > 0 && Math.abs(obj.vX) > Math.abs(obj.vY)){
			//turn it left
			newX = Util.Number.randomRange((viewport.x+viewport.width-200)/2,viewport.x + obj.width + 150);
		//if the object is heading left and its x velocity is greater than its y velocity (mostly going left)	
		}else if(obj.vX < 0 && Math.abs(obj.vX) > Math.abs(obj.vY)){
			//turn it right
			newX =  Util.Number.randomRange((viewport.x+viewport.width+200)/2,viewport.x + map.stage.width - obj.width - 150);
		}
		//if it is not going mostly right or left, it's okay to choose either one
		else{
			if(Math.random() > 0.5){
				//turn it right
				newX =  Util.Number.randomRange((viewport.x+viewport.width+200)/2,viewport.x + map.stage.width - obj.width - 150);
			}else{
				//turn it left
				newX = Util.Number.randomRange((viewport.x+viewport.width-200)/2,viewport.x + obj.width + 150);
			}
		}
		//if the object is heading down and its y velocity is greater than its x velocity (mostly going down)
		if(obj.vY > 0 && Math.abs(obj.vY) > Math.abs(obj.vX)){
			//turn it up
			newY = Util.Number.randomRange((viewport.y+viewport.height-100)/2,viewport.y + obj.height + 150);
		//if the object is heading up and its y velocity is greater than its x velocity (mostly going up)
		}else if(obj.vY < 0 && Math.abs(obj.vY) > Math.abs(obj.vX)){
			//turn it down
			newY =  Util.Number.randomRange((viewport.y+viewport.height+100)/2,viewport.y + map.stage.height - obj.height - 150);
		//if it is not going mostly down or up, it's okay to choose either one
		}else{
			if(Math.random() > 0.5){
				//turn it down
				newY =  Util.Number.randomRange((viewport.y+viewport.height+100)/2,viewport.y + map.stage.height - obj.height - 150);
			}else{
				//turn it up
				newY = Util.Number.randomRange((viewport.y+viewport.height-100)/2,viewport.y + obj.height + 150);
			}
		}
		//return the point
		return{x:newX,y:newY};
	}
	
	return AI;
}(AI||{}));