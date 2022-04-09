var Physics = (function(Physics){
	
	Physics.getVelocity = function(rotation,speed){
		return {
			x:Math.sin(rotation * (Math.PI / -180)) * speed,
			y:Math.cos(rotation * (Math.PI / -180)) * speed,
		}
	}

	return Physics;
}(Physics||{}));