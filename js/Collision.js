var Collision = (function(){
	"use strict";
	
	var C = {};
	
	//test if an object is within the viewport
	C.inViewport = function(obj,viewport){
		 //off screen don't check
        if(obj.x+(obj.width)<viewport.x||
           obj.x-(obj.width)>viewport.x+viewport.width||
           obj.y+(obj.height)<viewport.y||
           obj.y-(obj.height)>viewport.y+viewport.height
         )return false;
		 
		 //object is on screen
		 return true;
	}
    
    C.boundingRect = function(obj1, obj2,viewport,usePadding,paddingFactor){
        // Object-to-object, bounding-box collision detector:
		//if object is off screen don't test it
		if(viewport){
	        if(!C.inViewport(obj1,viewport)||!C.inViewport(obj2,viewport)) return false;
		}
		var obj1Width = obj1.width;
		var obj2Width = obj2.width;
		var obj2Height = obj2.height;
		var obj1Height = obj1.height;
		
		var padding = paddingFactor || 2;
		
		//pad the width and height a bit
		if(usePadding){
			obj1Width +=obj1.width*padding;
			obj1Height +=obj1.height*padding;
			var obj1x = (obj1.x-obj1Width/2);
			var obj1y = (obj1.y-obj1Height/2);			
			/*for visual representation of weapon range
			if(!obj1.wRange){
				obj1.wRange = new createjs.Shape();
				var g = obj1.wRange.graphics;
				g.clear();
				g.beginFill('#f00').drawRect(obj1x,obj1y,obj1Width,obj1Height);
				obj1.wRange.alpha = 0.1;
				map.stage.container.addChild(obj1.wRange);
			}
			*/
			return !(
				obj1x > obj2.x + obj2Width||
				obj1x + obj1Width < obj2.x||
				obj1y > obj2.y + obj2Height||
				obj1y + obj1Height < obj2.y
			);
		}
		
		 return !(
			obj1.x > obj2.x + obj2Width||
			obj1.x + obj1Width < obj2.x||
			obj1.y > obj2.y + obj2Height||
			obj1.y + obj1Height < obj2.y
		);
    }
	
	C.circleToCircle = function(obj1,obj2,viewport){
		//don't bother testign if object isn't in viewport
		if(!C.inViewport(obj1,viewport)||!C.inViewport(obj2,viewport)) return false;
			
		//compare the distance to combined radii
		var dx = obj2.x - obj1.x;
		var dy = obj2.y - obj1.y;
		
		var radii = obj1.radius + obj2.radius;
		var isCollision = ( dx * dx )  + ( dy * dy ) < radii * radii;
		
		return isCollision; 
	}

	//for placement of objects
	 C.inMapBounds = function(obj,viewport){
			var offsetLeft = -(viewport.mapBoundsWidth-viewport.stage.width)/2;
			var offsetTop = -(viewport.mapBoundsHeight-viewport.stage.height)/2;

			var axis = {};
			//for determining which axis the object penetrated
			axis.x = false;
			axis.y = false
			//add it
			if(obj.x-(obj.width)<offsetLeft||
				obj.x+(obj.halfWidth)>-offsetLeft+viewport.stage.width
			){axis.x = true;}
			if(obj.y+(obj.halfHeight)>-offsetTop+viewport.stage.height||
				obj.y-(obj.height)<offsetTop
			){axis.y = true;}
			
			//object penetrated bounds
			if(axis.x||axis.y){
				return axis;	
			}
			
			
			return true;
    }
	
	//will slide object along a bound for a nice, smooth look
	C.keepInBounds = function(obj,viewport){
		
		//test if it is out of bounds
		var axis = C.inMapBounds(obj,viewport);
		
		//if not, then return
		if(typeof(axis)!=="object")return false;
		
		//redirect object
		var newX = obj.x;
		var newY = obj.y;
		//if the offending axis was x...
		if(axis.x){	
			if (obj.vX > 0){ // object came from the left
				newX = map.mapBoundsWidth-(viewport.stage.width*1.5) - obj.halfWidth;
			}else if (obj.vX < 0){ // object came from the right
				newX = -(map.mapBoundsWidth-viewport.stage.width)/2 + obj.width;
			}
		}
		//if the offending axis was y...
		if(axis.y){
			if (obj.vY > 0){ // object came from the top
				newY = map.mapBoundsHeight-(viewport.stage.height*1.5) - obj.halfHeight;
			}else if (obj.vY < 0){ // object came from the bottom
				newY = -(map.mapBoundsHeight-viewport.stage.height)/2 + obj.height;
			}
		}
			
		//prevent player from going through wall					
		obj.x = newX;
		obj.y = newY;
		
		//let the caller know we had to course correct
		return true;
	}
	
	//return public functions
	return C;
		
}());