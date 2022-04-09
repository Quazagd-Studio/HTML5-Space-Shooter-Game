/*REVEALING MODULE PATTERN*/
"use strict";
function Camera(viewport){
	this.viewport = viewport;
	this.init();
}

Camera.prototype = (function(){
    
    var p = {};
	
	p.init = function(){
		Director.subscribe('render',function(){
				this.panX(ship);//hardcoded for now
				this.panY(ship);//hardcoded for now
		},this);
	}
    
    //pan the viewport
    p.panX = function(actor){
		//far left bound of map bounds
		var offSetLeft = -(map.mapBoundsWidth-this.viewport.view.width)/2;
		//don't move camera past bounds
		if(Util.Number.inRange(actor.x,offSetLeft+this.viewport.view.width/2,map.mapBoundsWidth/2)){
			//center on actor
			this.viewport.x= -(actor.x-(this.viewport.view.width/2));
			//for collision testing
			this.viewport.view.x = actor.x - (this.viewport.view.width/2);
		}
    }
    
    p.panY = function(actor){
		//upper bound of map bounds
		var offSetTop = -(map.mapBoundsHeight-this.viewport.view.height)/2;
		//don't move camera past bounds
		if(Util.Number.inRange(actor.y,offSetTop+this.viewport.view.height/2,map.mapBoundsHeight/2)){
			//center on actor
			this.viewport.y = -(actor.y-(this.viewport.view.height/2));
			//for collision testing
			this.viewport.view.y = actor.y - (this.viewport.view.height/2);
		}
    }
    //return prototype
    return p;
}());
