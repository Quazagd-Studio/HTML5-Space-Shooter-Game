/***********************************************************************************************
*@brief			A utility wrapper for all non module specific, reusable functions
*
*@return		Returns the Util object which can be used to access all functions that are returned	
*
***********************************************************************************************/
var Util = (function(){
	"use strict";
	
	//our return object
	var utility = {};
	
	/*******************************************************************************************************************************
	*@brief			Generates a random token to be used in any way the caller sees  fit
	*
	*@description	Generate a random token with numbers 0-9 and letters [a-z] and [A-Z].  Default behavior
	*				is to create a token 12 characters in length with 62 unique possible characters.
	*				There are over 18 trillion combinations with the default, but with Math.random(),
	*				repetition is possible and therefore any function using Math.random() is NOT cryptographically secure.
	*				Use crypto.getRandomValues() instead for that purpose.
	*				
	*				The store function, stores the generated token in an array if the storeCopy paramater is true
	*				The get function returns the array that the used tokens are held in
	*
	*@example 		var myUniqueToken = Util.Token.create();
	*									
	*							@TYPE				@DESCRIPTION
	*@param storeCopy 			boolean				Stores the token generated in an array which can be accessed later
	*												through Util.Token.usedTokens;
	*
	*@param	tokenLength 		int					length of token to be generated
	********************************************************************************************************************************/
	utility.Token = {
		//store used tokens in an array
		usedTokens:[],
		//create a unique token
		create:function(storeCopy,tokenLength) { 
			tokenLength = tokenLength || 12;
			var i = '';
			var randomChar=function(){
				var n= Math.floor(Math.random()*62);//0-61
				if(n<10) return n; //0-9
				if(n<36) return String.fromCharCode(n+55); //A-Z
				return String.fromCharCode(n+61); //a-z
			}
			while(i.length< tokenLength) i+= randomChar();
			
			//don't check against other tokens if true...faster performance
			if(!storeCopy) return i;
			
			//if this token is already in use then create a new one...
			if(this.get().indexOf(i)!=-1){
				this.create(tokenLength);
			}
			//return it to the caller
			return i;
		},
		
		//store a token
		store:function(token){
			this.usedTokens.push(token);
		},
		get:function (){
			 return this.usedTokens;   
		}
	}
	
	
	utility.Array = {
	/*******************************************************************************************************************************
	*@brief 		For merging objects like jQuery.extend() does.  
	*				Useful for creating a 'settings' object by merging defaults and options
	*
	*@example		var settings = Util.Array.merge({},defaults,options)//settings now contains the merged result 
	*																//of defaults and options while defaults remain untouched
	*@example2		Util.Array.merge(defaults,options)//defaults is overwritten and now is the merged result of defaults and options
	*
	*
	*@arguments		Accepts an unlimited number of objects as arguments.  The first argument is the object that will be modified.
	*				The remaining arguments will all be merged together and applied to the first argument.  The last argument
	*				specified has the most importance and its properties will take precedence.					
	********************************************************************************************************************************/
		merge:function(){
			for(var i=1; i<arguments.length; i++)
				for(var key in arguments[i])
					if(arguments[i].hasOwnProperty(key))
						arguments[0][key] = arguments[i][key];
			return arguments[0];
		},
	/*******************************************************************************************************************************
	*@brief 		For obtaining the index in an Array has a specified property equaling the specified value
	*
	*@example		var movies = [{title:"Crash",director:"Paul Haggis"},{title:"Pursuit Of Happyness",director:"Gabriele Muccino"}]
	*				var index = Util.Array.indexOfObject(movies,'title','Crash');// returns 0
	*
	*					@TYPE				@DESCRIPTION	
	*@param	arr			Array				The array of objects to be tested
	*
	*@param property	String				The string name for the object property to be tested
	*
	*@param	value		String|Number		The value of the property to be tested	
	********************************************************************************************************************************/		
		indexOfObject:function(arr,property, value) {
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i][property] === value) return i;
			}
			return -1;
		}
	}
	
	utility.Number = {
		//test if a value is between a range
		inRange:function(val, minVal, maxVal){
			return ((val>=minVal) && (val<=maxVal));
		},
		//get random number between a range
		randomRange:function(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		//force a value between a range
		clamp:function(value,min,max){
			if(value>max)return max;
			if(value<min)return min;
			return value;
		}
	}
	
	utility.Color = {
		randomHex:function(){
			return Math.random().toString(16).slice(2, 8);
		}
		
	}
	
	return utility;
}());