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
var Client = module.exports = function Client(options) {
	this._socket = null;
	this._isConnected = false;
	this._name = options.name || "none";
	
	this._initClient(options);
}

/*------------------------------------------------------------------------------
  (private) _initClient
  
  + port
  + host
  - void
  
  Initialize client which communicated with server based on port and host.
------------------------------------------------------------------------------*/
Client.prototype._initClient = function(options) {
	var self = this,
		socket = self._socket,
		buffer = "",
		jsonBegin = -1,
		jsonEnd = -1;

	if(options.host) {
		socket = net.createConnection(options.port, options.host);
	} else {
		socket = net.createConnection(options.port);
	}
	
	socket.setEncoding("utf8");
	
	socket.on("connect", function() {
		self._isConnected = true;
		socket.write(JSON.stringify({
			collection:[{type: "init", name: self._name}]
		}));
		
		util.log("con");
	});

	socket.on("data", function(data) {
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
			case "sys":
				partial = self._system();
				util.log(JSON.stringify(partial));
				break;
			case "cpu":
				break;
			case "mem":
				partial = self._memory();
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

/*------------------------------------------------------------------------------
  (private) _system
  
  + none
  - object
  
  Get basic information about system where is program running.
------------------------------------------------------------------------------*/
Client.prototype._system = function() {
	return {
		type: "sys",
		pid: process.pid,
		version: process.version,
		platform: process.platform,
		hostname: os.hostname(),
		osType: os.type(),
		release: os.release()
	};
};