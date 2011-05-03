var util = require("util"),
	 net = require("net"),
	Uuid = require("./node-uuid/uuid.js");

/*------------------------------------------------------------------------------
  (public) Server
  
  + none
  - void
  
  Set up Server.
------------------------------------------------------------------------------*/
var Server = module.exports = function Server(port, host) {
	this._clients = {};
	this._clientsCount = 0;
	this._server = null;
	
	this._initServer(port, host);
};

/*------------------------------------------------------------------------------
  (public) clientsCount
  
  - get

  Getter for number of actively connected sockets.
------------------------------------------------------------------------------*/
Object.defineProperty(Server.prototype, "clientsCount", {
    get: function() {
        return this._clientsCount;
    }
});

/*------------------------------------------------------------------------------
  (private) _initServer
  
  + none
  - void
  
  .
------------------------------------------------------------------------------*/
Server.prototype._initServer = function(port, host) {
	var self = this;

	self._server = net.createServer(function(socket) {
		util.log("connection");
		socket.setEncoding("utf8");
		
		socket.on("connect", function () {
			var client = {
				id: Uuid(),
				socket: socket
			};
		
			self._attachClient(client);
			
			util.log("connect " + client.id);
		});
	});
	
	if(host) {
		self._server.listen(port, host, function() {
			util.log("Monitaur is listening on " + host + ":" + port);
		});
	} else {
		self._server.listen(port, function() {
			util.log("Monitaur is listening on port " + port);
		});
	}	
};

/*------------------------------------------------------------------------------
  (private) _attachClient

  + client - to be attached
  - void
  
  Attaches new client for managing.
------------------------------------------------------------------------------*/
Server.prototype._attachClient = function(clientArg) {
	var client,
		self = this;
	
	if(!self._clients[clientArg.id]) {
		client = {
			id: clientArg.id,
			socket: clientArg.socket
		};
		
		client.socket.on("data", function (data) {
			self._processData(JSON.parse(data));
		});
	  
		client.socket.on("end", function () {
			self._detachClient(client.id);
		});
		
		setInterval(function() {
			// TODO: if is connected
			var obj = {
				cmds: [{cmd: "mem"}]
			};
			
			client.socket.write(JSON.stringify(obj));
		}, 5000);
		
		self._clients[client.id] = client;
		self._clientsCount++;
		
		util.log("Client attached [" + this._clientsCount + "]");
	}
};

/*------------------------------------------------------------------------------
  (private) _detachClient

  + clientID - identifier of client to be detached
  - void
  
  Detaches client from Server.
------------------------------------------------------------------------------*/
Server.prototype._detachClient = function(clientID) {
	if(this._clients[clientID]) {
		delete this._clients[clientID];
		this._clientsCount--;
		
		util.log("Client detached [" + this._clientsCount + "]");
	}
};

/*------------------------------------------------------------------------------
  (private) _processData

  + data - to be processed
  - void
  
  Process data received from client.
------------------------------------------------------------------------------*/
Server.prototype._processData = function(data) {
	var i, len;

	util.log(data.timestamp);
	
	for(i = 0, len = data.collection.length; i < len; i++) {
		var partial = data.collection[i];
		
		switch(partial.type) {
			case "mem":
				util.log(
					partial.type + " " +
					this._formatBytes(partial.totalMem) + " " + 
					this._formatBytes(partial.freeMem) + " " + 
					this._formatBytes(partial.memUsage.rss) + " " + 
					this._formatBytes(partial.memUsage.vsize) + " " + 
					this._formatBytes(partial.memUsage.heapTotal) + " " + 
					this._formatBytes(partial.memUsage.heapUsed) 
				);
				break;
			default:
				break;
		}
	}
};

/*------------------------------------------------------------------------------
  (private) _formatBytes

  + bytes - to be formatted
  - formatted bytes
  
  Format bytes into meaningful string.
------------------------------------------------------------------------------*/
Server.prototype._formatBytes = function(bytes) {
	var kb = 1024, 
		mb = 1024 * kb,
		gb = 1024 * mb;
	
	if (bytes < kb) {
		return bytes + " B";
	}
  
	if (bytes < mb) {
		return (bytes / kb).toFixed(2) + " KB";
	}
  
	if (bytes < gb) {
		return (bytes / mb).toFixed(2) + " MB";
	}
  
	return (bytes / gb).toFixed(2) + " GB";
};