(function(window){
	"use strict";
	function Movement(func) {
		this.move = func;
	};
	Movement.prototype.execute = function(context) {
		this.move(context);
	};
	window.Movement = Movement;
}(window));