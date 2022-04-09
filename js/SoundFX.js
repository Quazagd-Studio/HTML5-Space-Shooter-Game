(function(){
	"use strict";
	var engineSoundPlaying = false;
	var engineSound;
	var exhaustTimer = Director.FPS/5;
	var token = Util.Token.create();
	//ship is accelerating
	Director.subscribe('restartGame',function(){
		/************************************************
		*SHIP SOUNDS
		*************************************************/
		Director.subscribe('shipAccelerating',function(){
				//add sound only if it is not already playing
				if(!engineSoundPlaying){
					engineSoundPlaying = true;
					engineSound = createjs.Sound.play("shipThrust");
					engineSound.volume=1.0;//make sure volume is full
					//allow the sound to play after it's done
					engineSound.addEventListener("complete",function(){engineSoundPlaying = false;});
				}
		});
		
		//ship not accelerating
		Director.subscribe('keyUpFalse',function(){
			if(engineSound&&engineSoundPlaying){//only if the sound has been initialized
				//fade out sound
				engineSound.volume-=0.05;
				//if we are done fading out
				if(engineSound.volume <= 0){
					engineSound.volume = 1.0;//make sure volume is full
					engineSound.stop();
					engineSoundPlaying = false;
				}
				
			}
		});
		Director.subscribe('shipHit',function(attacker){
			if(attacker.type=="shipBullet")return false;//can't hit ourself
			if(ship.health > 0){
				//play the sound effect
				createjs.Sound.play("shipHit", {interrupt:createjs.Sound.INTERUPT_LATE});	
			}else{	
				//unsub since ship is dead
				Director.unsubscribe('shipHit',token);
			}
		},null,token);
		
		Director.subscribe('shipExploding',function(){
			//play the sound effect
			createjs.Sound.play("shipExplode", {interrupt:createjs.Sound.INTERUPT_NONE});
		});
		
		Director.subscribe('shipFiring',function(){
			//play the sound effect
			createjs.Sound.play("shipLaser", {interrupt:createjs.Sound.INTERUPT_LATE});	
		});
		
		
		/************************************************
		*DISC SOUNDS
		*************************************************/
		Director.subscribe('enemyHit',function(attacker,enemy){
			//console.log(attacker.type);
			switch(attacker.type){
				case "enemy":
					//play sound 
					//createjs.Sound.play("enemy-hit-bump", {interrupt:createjs.Sound.INTERUPT_LATE}); 
					break;   				
				case "ship":
					//play sound of ship hitting enemy
					createjs.Sound.play("enemy-hit-bump", {interrupt:createjs.Sound.INTERUPT_LATE});
					break;
				case "shipBullet":
					//play sound of bullet hitting enemy
					createjs.Sound.play("enemy-hit-bullet", {interrupt:createjs.Sound.INTERUPT_LATE});
					break;
				case "enemyBullet":
					if(attacker.enemyToken!=enemy.token){//can't hit itself
						//play sound of bullet hitting enemy
						createjs.Sound.play("enemy-hit-bullet", {interrupt:createjs.Sound.INTERUPT_LATE});
					}
					break;
			}
		});
		
		Director.subscribe('enemyDead',function(){
			//play the explosion sound
			createjs.Sound.play("enemy-explode", {interrupt:createjs.Sound.INTERUPT_LATE});	
		});
		
		
		/************************************************
		*POWERUP SOUNFS
		*************************************************/
		Director.subscribe('gotPowerUp',function(){
			//play the sound
			createjs.Sound.play("powerup");	
		});
	});	
}());