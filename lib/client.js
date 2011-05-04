var util = require("util"),
	 net = require("net"),
	  os = require("os");
	 
/*------------------------------------------------------------------------------
  (public) Client
  
  + port
  + host
  - void
  
  Set up Client.
------------------------------------------------------------------------------*/
var Client = module.exports = function Client(port, host) {
	this._socket = null;
	this._isConnected = false;
	
	this._initClient(port, host);
}

/*------------------------------------------------------------------------------
  (private) _initClient
  
  + port
  + host
  - void
  
  Initialize client which communicated with server based on port and host.
------------------------------------------------------------------------------*/
Client.prototype._initClient = function(port, host) {
	var self = this,
		socket = self._socket,
		buffer = "",
		jsonBegin = -1,
		jsonEnd = -1;

	if(host) {
		socket = net.createConnection(port, host);
	} else {
		socket = net.createConnection(port);
	}
	
	socket.setEncoding("utf8");
	
	socket.on("connect", function() {
		self._isConnected = true;
		
		util.log("con");
	});

	socket.on("data", function(data) {
		/*buffer += data;
		
		if(data.substring(data.length - 2) === "]}") {
			socket.write(self._processData(buffer));
			
			buffer = "";
		}*/
		
		buffer += data;
		jsonBegin = buffer.indexOf("{");
		jsonEnd = buffer.indexOf("]}");
		
		if((jsonBegin !== -1) && (jsonEnd !== -1)) {
			if(self._isConnected) {
				socket.write(
					self._processData(buffer.substring(jsonBegin, jsonEnd + 2))
				);
			}
			buffer = buffer.substring(jsonEnd + 2);
		}
	});

	socket.on("close", function(hadError) {
		self._isConnected = false;
	
		util.log("dis " + hadError);
	});
};

/*------------------------------------------------------------------------------
  (private) _processData

  + buffer
  - object - stringified JSON object
  
  Process data received from client.
------------------------------------------------------------------------------*/
Client.prototype._processData = function(buffer) {
	var self = this,
		response = { timestamp: new Date().getTime(), collection: [] },
		data = JSON.parse(buffer),
		i, len,
		partial;
	
	for(i = 0, len = data.cmds.length; i < len; i++) {
		switch(data.cmds[i].cmd) {
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
	
	return JSON.stringify(response);
};

/*------------------------------------------------------------------------------
  (private) _memory
  
  + none
  - object
  
  Get data about current memory usage.
------------------------------------------------------------------------------*/
Client.prototype._memory = function() {
	var processMemoryUsage = process.memoryUsage();

	return {
		type: "mem",
		totalMem: os.totalmem(),
		freeMem: os.freemem(),
		rss: processMemoryUsage.rss,
		vsize: processMemoryUsage.vsize,
		heapTotal: processMemoryUsage.heapTotal,
		heapUsed: processMemoryUsage.heapUsed
	};
};