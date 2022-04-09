/*******************************************************************************************************************************
*@brief			The Director acts as a mediator between modules
*
*@description	The purpose of the Director is to help keep modules from directly interacting with each other as
*				the very nature of a module directly interacting with another module makes it unmodular.
*				The Director also handles user input and general functions that relate to the game state.
*				
*				The store function, stores the generated token in an array if the storeCopy parameter is true
*				The get function returns the array that the used tokens are held in
*
*@example 		The most common use of the Director is allowing modules to subscribe to and publish events
*				ex. A player object may call Director.subscribe('restartGame',function(){...}).  The preceding function will be run
				when Director.publish('restartGame') is called.  More on this below.
*									
*@return		immediately returns the publicly defined parameters to the Director object
********************************************************************************************************************************/
var Director = (function (Director,window, undefined){
	"use strict";
	var viewport = window.document;
    
    //empty object we will return to Director
    var Director = {};
    //pub/sub channels
    Director.channels = {};

    //define our keys
    var keyLeft=false;
    var keyUp=false;
    var keyRight=false;
    var keyDown=false;
	var keyCtrl=false;
    
	//flag for debugging
    var debug = false;
	var fpsCounter;
	var fpsBounds;
	var stageCoords;
	var stageBounds;
	
	var checkRestart=false;
    
     //use requestAnimationFrame instead of setTimeout
    createjs.Ticker.useRAF = true;
    //set the frames to 30
    createjs.Ticker.setFPS(30);
	//make it available to everyone
	Director.FPS = Math.floor(createjs.Ticker.getFPS());
	Director.token = Util.Token.create();
	
    //register button events
    viewport.onkeydown = handleKeyDown;
    viewport.onkeyup = handleKeyUp;
	//prevent keys listed here from registering after tab was switched
	window.onblur = function(){
		keyLeft=false;
		keyUp=false;
		keyRight=false;
		keyDown=false;
		keyCtrl=false;	
		
		//pause the background music
		if(deepSpace){
			if(deepSpace.pause){
				deepSpace.pause();
				ambientSwell.pause();
			}
		}
	}
	
	window.onfocus = function(){
		//resume the background music
		if(deepSpace){
			if(deepSpace.resume){
				deepSpace.resume();
				ambientSwell.resume();	
			}
		}
	}
	
	//load our assests and listen for them to be loaded to initialize game
	var loadAssets = function(){
		Director.publish('loadAssets');
		Director.subscribe('assetsLoaded',init,null,this.token);
		
		//check for key to restart
		Director.subscribe('checkRestart',function(){
			checkRestart = true;
		},null,this.token);
		
		//reset game
		Director.subscribe('okToRestart',function(){
			//reset all channels except restartGame
			//because we still need that one...and a few others
			for(var channel in Director.channels){
				if(channel!="restartGame"&&channel!='okToRestart'&&channel!="checkRestart"){
					delete(Director.channels[channel]);
				}
			}
			//restart the game
			Director.publish('restartGame')});
	}
	

    //initialize game...called after all dependencies have loaded
    var init = function(){
        
		//let everyone know that we are initializing now			
		Director.publish('restartGame');

		//start game timer   
		createjs.Ticker.addEventListener("tick", render);
		//debug
		if(debug){
			//stage xy coords text
			stageCoords =  new createjs.Text("stage view x: "+map.stage.container.x.toFixed(1)+" stage view y: "+map.stage.container.y.toFixed(1), "20px Arial", "#ff7700");
			stageCoords.x = 10;
			stageCoords.y = 10;
			map.stage.addChild(stageCoords);
			
			stageBounds = new createjs.Shape();
			stageBounds.graphics.beginStroke('#f00').drawRect(0,0,map.stage.width,map.stage.height);
			map.stage.container.addChild(stageBounds);
			
			//FPS
			fpsCounter = new createjs.Text("FPS: "+Math.round(createjs.Ticker.getMeasuredFPS()), "20px Arial", "#ff7700");
			fpsBounds = fpsCounter.getBounds();
			fpsCounter.x = map.stage.container.x+map.stage.width-(fpsBounds.width*1.5);
			fpsCounter.y = map.stage.container.y+10;
			map.stage.addChild(fpsCounter);
			//let everyone know we are debugging
			Director.publish('debugging');
		}
        
    }
    
    //game render loop
    function render(){
        //left key held
		//all subscribers will be notified
        if(keyLeft){ Director.publish('keyLeft'); }
		
        //right key held
		//all subscribers will be notified
        if(keyRight){ Director.publish('keyRight'); }
		
        //up key held
		//all subscribers will be notified
        if(keyUp){ Director.publish('keyUp'); }
		
		//up key held
		//all subscribers will be notified
		if(keyCtrl){ Director.publish('keyCtrl'); }
		
		//up key let go
		//all subscribers will be notified
		 if(!keyUp){ Director.publish('keyUpFalse'); }
		
		
		//let everyone know we are rendering;
		Director.publish('render');

		if(debug){
			//update fps counter
			fpsCounter.text = "FPS: "+Math.round(createjs.Ticker.getMeasuredFPS());
			stageCoords.text = "stage view x: "+map.stage.container.view.x.toFixed(1)+" stage view y: "+map.stage.container.view.y.toFixed(1);
			
			stageBounds.x = map.stage.container.view.x
			stageBounds.y = map.stage.container.view.y			
			
		}
       
        //update the stage or we won't see anything happen
        map.stage.update();
    }
	/************************************************************************************************************************************
	*@brief			Publish and subscribe to interesting events
	*
	*@description	The pub/sub model is very useful for keep modules...well, modular.  It helps keep a module from directly
	*				interacting with another module which is important for being able to disable, remove, or install a module to
	*				a different interface.
	*				
	*				Think of this system like a magazine publication.  There is one publisher (there can be more, but for simplicity
	*				we'll use one in this example) with possibly thousands and hundreds of thousands of subscribers.  When a new issue
	*				is published, ALL subscribers are sent a copy of the issue.  Each subscriber has the liberty of doing whatever
	*				they want to do with the new publication (each subscriber can run its own special function).  Each subscriber may
	*				also unsubscribe from the publication at any time by sending their name and address(unique token/id) along with a 
	*				request to not receive any more issues.	
	*
	*@example 		Imagine that a bullet particle was just created by a player ship.  Now the bullet needs to know when to update itself.
	*				So when the bullet is created it will subscribe to the render event.  The Director is already publishing this event
	*				every frame with Director.publish('render'); So all we need to do is subscribe to the event and do something with it.
	*				Director.subscribe('render',function(){this.render()},this,this.token);  We pass in the function we want to run,
	*				(this.render()), the context of what 'this' refers to (itself), and its token for unsubscribing later (this.token);
	*
	* 				Now, the bullet has hit something and is removed from the game.  We need to unsubscribe this bullet, or we will be
	*				unnecessarily be calling its function every frame.  To do this we can either unsubscribe from a specific channel,
	*				Director.unsubscribe('render',this.token), or if we are subscribed to a lot of publications, we can simply call,
	*				Director.unsubscribeAll(this.token), which will find each publication that the token is subscribed to and remove it.					
	*											
	*							TYPE				DESCRIPTION
	*@param		channel			string				The name of the publication.  Used to look up the right channel, can be named anything.
	*
	*@param		fn				function			The function to be run when a channel is published (will be unique to each subscriber)
	*
	*@param		context			object				What is the 'this' context?  Pass in null or undefined if no special context is needed
	*
	*@param		token			string				Unique identifier to associate subscriptions with the subscriber
	**************************************************************************************************************************************/
    Director.subscribe = function(channel, fn, context,token){
		token = token||"";
		context = context||this;
        //if we don't already have the channel, create it
        if (!Director.channels[channel]) Director.channels[channel] = [];
        //add the channels context and function
        Director.channels[channel].push({ context: context, callback: fn,token:token });
        return this;
    };
	Director.unsubscribe = function(channel, token){
		//check for a token and channel, must exist to unsubscribe
		if(typeof(channel)==="undefined"||channel===""){throw('You must specify a channel to unsubscribe from.')}
		if(typeof(token)==="undefined"){throw('You may not unsubscribe without a token')}
        //if the channel doesn't exist...exit
        if (!Director.channels[channel]) throw('That channel does not exist');
        //unsubscribe caller from channel
		var tokenIDX = Util.Array.indexOfObject(Director.channels[channel],'token',token);
		if(tokenIDX==-1)throw("That token does not exist for channel '"+channel+"'");
		//unsubscribe
		Director.channels[channel].splice(tokenIDX,1);
        return this;
    };
	
	Director.unsubscribeAll = function(token){
		//check for a token , must exist to unsubscribe
		if(typeof(token)==="undefined"){throw('You may not unsubscribe without a token')}
        //unsubscribe caller from all channels
		//test every channel for the token
		for(var channel in Director.channels){
			var tokenIDX = Util.Array.indexOfObject(Director.channels[channel],'token',token);
			//found a match
			if(tokenIDX!=-1){
				//unsubscribe from each channel
				Director.channels[channel].splice(tokenIDX,1);
			}
		}
        return this;
    };
	
    Director.publish = function(channel){
        //if the channel doesn't exist...exit
        if (!Director.channels[channel]) return false;
        //grab all the arguments passed in starting with the 2nd one
        //first argument is channel
        var args = Array.prototype.slice.call(arguments, 1);
        //iterate through all
        for (var i = 0, l = Director.channels[channel].length; i < l; i++) {
            var subscription = Director.channels[channel][i];
			if(typeof(subscription)!=="undefined"){
            	subscription.callback.apply(subscription.context, args);
			}
			
        }
        return this;
    };
	
	 //handle key press events
    function handleKeyDown(e){
		//if we are checking for a restart
		if(checkRestart){checkRestart = false;Director.publish('okToRestart');return false;}
        //cross browser compatibility		
        if(!e){ var e = window.event; }
		switch(e.keyCode) {
			case 17:
				keyCtrl = true;
				break;
            case 37:
                keyLeft = true;
                break;
            case 38:
                keyUp = true;
                break;
            case 39:
                keyRight = true;
                break;
            case 40:
                keyDown = true;
                break;	 
        }
    }
    function handleKeyUp(e){
        //cross browser compatibility issues
       if(!e){ var e = window.event; }
		switch(e.keyCode) {
			case 17:
				keyCtrl = false;
				break;
            case 37:
                keyLeft = false;
                break;
            case 38:
                keyUp = false;
                break;
            case 39:
                keyRight = false;
                break;
            case 40:
                keyDown = false;
                break;	 
        }
    }
	
		
	//attach event listener to load all dependencies
	window.addEventListener("load", loadAssets, false);
    
    //return our game Director object
    return Director;
}(Director||{},window));