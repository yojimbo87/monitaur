var util = require("util"),
	 net = require("net"),
	  os = require("os"),
	HOST = "vps-19-ubuntu-server.developmententity.sk",
	PORT = 8080;
	
/*var socket = net.createConnection(PORT, HOST);

socket.on("connect", function() {
	util.log("con");
});

socket.on("data", function(data) {
	util.log("data: " + data);
});

socket.on("disconnect", function() {
	util.log("dis");
});*/

/*------------------------------------------------------------------------------
  (public) Monotaur
  
  + options - setting
  - void
  
  Set up Monotaur with options.
------------------------------------------------------------------------------*/

var Monotaur = module.exports = function Monotaur(options) {
	this._settings = {
		PORT: options.port || 8080,
		HOST: options.host || "127.0.0.1"
	};
	
	this._socket = null;
};

/*------------------------------------------------------------------------------
  (public) init
  
  + none
  - void
  
  Initialize socket connection with monitaur server.
------------------------------------------------------------------------------*/
Monotaur.prototype.init = function() {
	var self = this
		socket = self._socket;

	socket = net.createConnection(
		self._settings.PORT,
		self._settings.HOST
	);
	
	util.log(self._settings.PORT+ " " +  self._settings.HOST);
	
	/*socket = new net.Socket();
	socket.connect(
		self._settings.PORT,
		self._settings.HOST
	);*/
	
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
Monotaur.prototype._memory = function() {
	return {
		type: "mem",
		totalMem: os.totalmem(),
		freeMem: os.freemem(),
		memUsage: process.memoryUsage()
	};
};