
function HeadsUpDisplay(){
	this.initialize();
}


HeadsUpDisplay.prototype = (function(){
	"use strict";
	
	var p = new createjs.Container();
    p.Container_initialize = p.initialize;	//unique to avoid overiding base class
    
    p.initialize = function () {
        this.Container_initialize();
		//ship shields
		this.shipShield = new createjs.Container();
		this.addChild(this.shipShield);
		//add health bar and border
		this.shipShield.border = new createjs.Shape();
		this.shipShield.addChild(this.shipShield.border);
		this.shipShield.health = new createjs.Shape();
		this.shipShield.addChild(this.shipShield.health);
		//health counter		
		this.shipShield.shieldText = new createjs.Text("", "bold 14px Arial", "#c0c0c0");
		this.shipShield.addChild(this.shipShield.shieldText);	
		
		//ship health
		this.shipHealth = new createjs.Container();
		this.addChild(this.shipHealth);
		//add health bar and border
		this.shipHealth.border = new createjs.Shape();
		this.shipHealth.addChild(this.shipHealth.border);
		this.shipHealth.health = new createjs.Shape();
		this.shipHealth.addChild(this.shipHealth.health);
		//health counter		
		this.shipHealth.healthText = new createjs.Text("", "bold 14px Arial", "#c0c0c0");
		this.shipHealth.addChild(this.shipHealth.healthText);	
		
		
		//player score
		this.shipScore = new createjs.Container();
		this.addChild(this.shipScore);

		this.shipScore.value = new createjs.Text("0", "bold 20px Arial", "#c0c0c0");
		this.shipScore.addChild(this.shipScore.value);
		
		//add the hiscore
		this.hiScoreVal = localStorage.getItem('hiScore')||0;
		this.hiScore = new createjs.Text('HISCORE: '+this.hiScoreVal,"bold 16px Arial", "#c0c0c0");
		this.addChild(this.hiScore);
		
		this.messages = [];//for storing floating messages
			
	
		//create it
		this.create();	
		
		//subscribe to listeners
		this.subscribe();	
	}
	
	p.create = function(){
		/**************************************************
		*
		*HISCORE
		*
		***************************************************/	
		this.hiScore.x = this.hiScore.y = 10;
		
		/**************************************************
		*
		*SHIP SHIELD
		*
		***************************************************/
			var width = this.shipShield.width = this.SHIP_SHIELD_WIDTH = map.stage.width*0.15;
			var height = this.shipShield.height = this.SHIP_SHIELD_HEIGHT = map.stage.height*0.045;
			
			
			this.shipShield.offSetX = 20;
			this.shipShield.x = map.stage.width-width-this.shipShield.offSetX;
			this.shipShield.y = 20;
			this.shipShield.alphaTimer = this.shipShield.ALPHA_TIMER = Director.FPS;
			//draw border
			var g = this.shipShield.border.graphics;
			g.setStrokeStyle(1).beginStroke('#000').beginFill('#fff').drawRect(0,0,width,height);
			
			this.shipShield.border.alpha = 0.2;
			
			var g = this.shipShield.health.graphics;
	
			g.beginFill('#0C8DCA').drawRect(0,0,width,height);
	
			
			//set text position --arbitrary width & height
			this.shipShield.shieldText.x = this.shipShield.width - 60
			this.shipShield.shieldText.y = -18;
		/**************************************************
		*
		*SHIP HEALTH
		*
		***************************************************/
			var width = this.shipHealth.width = this.SHIP_HEALTH_WIDTH = map.stage.width*0.15;
			var height = this.shipHealth.height = this.HEALTH_HEIGHT = map.stage.height*0.045;
			
			
			this.shipHealth.offSetX = 20;
			this.shipHealth.x = map.stage.width-width-this.shipHealth.offSetX;
			this.shipHealth.y = this.shipShield.height+this.shipShield.y + 20;
			this.shipHealth.alphaTimer = this.shipHealth.ALPHA_TIMER = Director.FPS;
			//draw border
			var g = this.shipHealth.border.graphics;
			g.setStrokeStyle(1).beginStroke('#000').beginFill('#fff').drawRect(0,0,width,height);
			
			this.shipHealth.border.alpha = 0.2;
			
			var g = this.shipHealth.health.graphics;
	
			g.beginFill('#05C451').drawRect(0,0,width,height);
	
			
			//set text position --arbitrary width & height
			this.shipHealth.healthText.x = this.shipHealth.width - 45
			this.shipHealth.healthText.y = -18;
		/**************************************************
		*
		*PLAYER POINTS
		*
		***************************************************/	
			this.shipScore.width = 200;
			this.shipScore.height = 30;
			this.shipScore.x = map.stage.width/2-this.shipScore.width/2;
			this.shipScore.y = 2;
			//set text position --arbitrary width & height
			this.shipScore.value.x = this.shipScore.width/2 - 20
			this.shipScore.value.y = 10;		
	}
	
	p.render = function(){
		/**************************************************
		*
		*MESSAGE UPDATING
		*
		***************************************************/
		if(this.messages.length){//if there are any messages to show
			for(var i=0;i<this.messages.length;i++){
				this.messages[i].y -=2;
				this.messages[i].alpha-=1/(Director.FPS*2);
				if(this.messages[i].alpha<=0){
					map.stage.container.removeChild(this.messages[i]);
					this.messages.splice(i,1);//remove item from list
					continue;	
				}
			}
		}
		
		/**************************************************
		*
		*HISCORE UPDATING
		*
		***************************************************/
		if(ship.score > this.hiScoreVal){
			this.hiScore.text = "HISCORE: "+ship.score;	
		}
		
		/**************************************************
		*
		*SHIP SHIELD UPDATING
		*
		***************************************************/
			var shield = this.shipShield;
			//show health status as percentage of total width
			//erase it
			shield.health.graphics.clear();
			//set width to health bar status
			var width = shield.width =  this.SHIP_SHIELD_WIDTH * (ship.shieldPower/Ship.SHIELD_POWER); 
			var g = shield.health.graphics;
			var color ="#0C8DCA" ;//shield blue
			var shieldRatio = shield.width/this.SHIP_SHIELD_WIDTH;
			
			//update health bar
			g.beginFill(color).drawRect(0,0,width,shield.height);
			
			//flash that shield health is low
			if(healthRatio <= 0.3){
				shield.alphaTimer--;
				if(shield.alphaTimer<=0){
					shield.health.alpha+=1/shield.ALPHA_TIMER;
					if(shield.health.alpha >= 1.0){
						shield.alphaTimer=shield.ALPHA_TIMER;
					}
				}else{
					shield.health.alpha-=1/shield.ALPHA_TIMER;	
				}
			}else{//reset to full opacity
				shield.health.alpha = 1.0;	
			}
		
			
			//update text
			shield.shieldText.text =Math.round(ship.shieldPower)+" / "+Ship.SHIELD_POWER;
			
		/**************************************************
		*
		*SHIP HEALTH UPDATING
		*
		***************************************************/
			var health = this.shipHealth;
			//show health status as percentage of total width
			//erase it
			health.health.graphics.clear();
			//set width to health bar status
			health.width =  this.SHIP_HEALTH_WIDTH * (ship.health/Ship.HEALTH); 
			var g = health.health.graphics;
			var color ="#05C451" ;//green
			var healthRatio = health.width/this.SHIP_HEALTH_WIDTH;
			//change color based on health status
			if(healthRatio < 0.8){
				color = "#FFD118";//yellow	
			}
			if(healthRatio < 0.50){
				color="#ff7a00";//orange	
			}
			if(healthRatio < 0.30){
				color="#f00";//red	
			}
			
			//update health bar
			g.beginFill(color).drawRect(0,0,health.width,health.height);
			
			//flash that health health is low
			if(healthRatio <= 0.3){
				health.alphaTimer--;
				if(health.alphaTimer<=0){
					health.health.alpha+=1/health.ALPHA_TIMER;
					if(health.health.alpha >= 1.0){
						health.alphaTimer=health.ALPHA_TIMER;
					}
				}else{
					health.health.alpha-=1/health.ALPHA_TIMER;	
				}
			}else{//reset to full opacity
				health.health.alpha = 1.0;	
			}
		
			
			//update text
			health.healthText.text =Math.round(ship.health)+" / "+Ship.HEALTH;
			
			
			
		/**************************************************
		*
		*PLAYER POINTS UPDATING
		*
		***************************************************/
			this.shipScore.value.text = (ship.score);
	}
	
	p.gameOver = function(){
		//game over text
		var gameOverMsg = new createjs.Text("GAME OVER", "bold 32px Arial", "#f00");
		map.stage.addChild(gameOverMsg);
		var gameOverBounds = gameOverMsg.getBounds();
		gameOverMsg.x = map.stage.width/2 - gameOverBounds.width/2;
		gameOverMsg.y = map.stage.height/2 - gameOverBounds.height/2;
		
		//press any key to play again
		//game over text
		var playAgain = new createjs.Text("Press any key to play again", "bold 18px Arial", "#c0c0c0");
		map.stage.addChild(playAgain);
		var playAgainBounds = playAgain.getBounds();
		playAgain.x = map.stage.width/2 - playAgainBounds.width/2;
		playAgain.y = map.stage.height/2 - playAgainBounds.height/2 + gameOverBounds.height;
		
		//save the score
		var hiScore = parseInt(localStorage.getItem('hiScore'))||0;
		
		//only if player's score was greater than the hiScore
		if(ship.score > hiScore){localStorage.setItem('hiScore',ship.score);}
		
		
		//check for a restart
		Director.publish('checkRestart');	
				
	}
	
	p.addMessage = function(item){
		var msg = new createjs.Text("+"+item.info, "bold 12px Arial", "#c0c0c0");
		this.messages.push(msg);					
		map.stage.container.addChild(msg);
		msg.x = item.x;
		msg.y = item.y;
	}
	
	
	//SUBSCRIPTIONS
	p.subscriptions = [
		function(){
			Director.subscribe('render',function(){this.render()},this);
		},
		function(){
			Director.subscribe('shipDead',function(){this.gameOver()},this);
		},
		function(){
			Director.subscribe('gotPowerUp',function(item){this.addMessage(item)},this)
		},
		function(){
			Director.subscribe('enemyDead',function(item){this.addMessage(item)},this)
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
	
	//wait for map to be ready
	Director.subscribe('restartGame',function(){
		window.HUD = new HeadsUpDisplay();
		map.stage.addChild(HUD);
	});

	return p;
}());
