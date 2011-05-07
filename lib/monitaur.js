var util = require("util"),
  Client = require("./client"),
  Server = require("./server");

/*------------------------------------------------------------------------------
  (public) Monitaur
  
  + object - options
  - void
  
  Set up Monitaur.
------------------------------------------------------------------------------*/
var Monitaur = module.exports = function Monitaur(options) {
	this._server = null;
	
	if(options && options.socketServer) {		
		this._server = new Server(
			options.socketServer, 
			options.httpServer
		);
	}
	
	this._client = null;
	
	if(options && options.client) {
		options.client.port = options.client.port || 8001;
	
		setTimeout(function() {
			this._client = new Client(
				options.client.port, 
				options.client.host
			);
		}, 1000);
	}
};