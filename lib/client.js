var util = require("util"),
	 net = require("net"),
	  os = require("os");
	 
/*------------------------------------------------------------------------------
  (public) Client
  
  + none
  - void
  
  Set up Client.
------------------------------------------------------------------------------*/
var Client = module.exports = function Client(port, host) {
	this._socket = null;
	
	this._initClient(port, host);
}

/*------------------------------------------------------------------------------
  (private) _initClient
  
  + none
  - void
  
  .
------------------------------------------------------------------------------*/
Client.prototype._initClient = function(port, host) {
	var self = this,
		socket = self._socket;

	if(host) {
		socket = net.createConnection(port, host);
	} else {
		socket = net.createConnection(port);
	}
	
	socket.setEncoding("utf8");
	
	socket.on("connect", function() {
		util.log("con");
	});

	socket.on("data", function(data) {
		var message = JSON.parse(data),
			response = { timestamp: new Date().getTime(), collection: [] },
			i, len,
			item,
			partial;
		
		for(i = 0, len = message.cmds.length; i < len; i++) {
			switch(message.cmds[i].cmd) {
				case "mem":
					partial = self._memory();
					break;
				case "cpu":
					break;
				default:
					break;
			}
			
			if(partial) {
				response.collection.push(partial);
			}
		}
		
		if(response.collection) {
			socket.write(JSON.stringify(response));
		}
	});

	socket.on("end", function() {
		util.log("dis");
	});
};

/*------------------------------------------------------------------------------
  (private) _memory
  
  + none
  - void
  
  .
------------------------------------------------------------------------------*/
Client.prototype._memory = function() {
	return {
		type: "mem",
		totalMem: os.totalmem(),
		freeMem: os.freemem(),
		memUsage: process.memoryUsage()
	};
};