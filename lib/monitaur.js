var util = require("util"),
  Client = require("./client"),
  Server = require("./server");

/*------------------------------------------------------------------------------
  (public) Monitaur
  
  + none
  - void
  
  Set up Monitaur.
------------------------------------------------------------------------------*/
var Monitaur = module.exports = function Monitaur(options) {

	this._server = null;
	
	if(options && options.server) {
		options.server.port = options.server.port || 8001;
		
		this._server = new Server(
			options.server.port, 
			options.server.host
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