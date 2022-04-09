var Geometry = (function(Geometry){

	Geometry.distanceTo = function(p1, p2) {
	  return Math.sqrt(Geometry.sqDistanceTo(p1, p2));
	};
	
	Geometry.sqDistanceTo = function(p1, p2) {
	  return (p1.x -p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
	};
	
	Geometry.directionTo = function(p1, p2) {
	  return {x: p2.x - p1.x, y: p2.y - p1.y};
	};
	
	Geometry.unitVelocityTo = function(p1, p2) {
	  return Geometry.normalize(Geometry.directionTo(p1,p2));
	};
	
	Geometry.normalize = function(v) {
	  var mag = Geometry.magnitude(v);
	  return {x: v.x / mag, y: v.y / mag};
	};
	
	Geometry.angleTo = function(p1, p2) {
	  var v = Geometry.directionTo(p1, p2);
	  return 180 / Math.PI * Math.atan2(v.y, v.x);
	};
	
	//returns the angle in degrees that is needed to face the p2
	Geometry.angleToTarget = function(p1,p2){
		var v = Geometry.directionTo(p1, p2);
	  	return 180 / Math.PI * Math.atan2(v.x, v.y)*-1;
	}
	
	Geometry.rotateVector = function(v, ang) {
	  var cos = Geometry.degreeCos(ang);
	  var sin = Geometry.degreeSin(ang);
	  return {x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos};
	};
	
	Geometry.degreeCos = function(ang) {
	  return Math.cos(ang / 180 * Math.PI);
	};
	
	Geometry.degreeSin = function(ang) {
	  return Math.sin(ang / 180 * Math.PI);
	};
	
	Geometry.magnitude = function(v) {
	  return Geometry.distanceTo({x: 0, y: 0}, v);
	};

	return Geometry;
}(Geometry||{}));