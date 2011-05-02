var util = require("util");

/*------------------------------------------------------------------------------
  (public) Manager
  
  + none
  - void
  
  Set up Manager.
------------------------------------------------------------------------------*/

var Manager = module.exports = function Manager(options) {
	this._clients = {};
	this._clientsCount = 0;
};

/*------------------------------------------------------------------------------
  (public) clientsCount
  
  - get

  Getter for number of actively connected sockets.
------------------------------------------------------------------------------*/
Object.defineProperty(Manager.prototype, "clientsCount", {
    get: function() {
        return this._clientsCount;
    }
});

/*------------------------------------------------------------------------------
  (public) attachClient

  + client - to be attached
  - void
  
  Attaches new client for managing.
------------------------------------------------------------------------------*/
Manager.prototype.attachClient = function(newClient) {
	var client,
		self = this;
	
	if(!self._clients[newClient.id]) {
		client = {
			id: newClient.id,
			socket: newClient.socket
		};
		
		client.socket.on("data", function (data) {
			self._processData(JSON.parse(data));
		});
	  
		client.socket.on("end", function () {
			self.detachClient(client.id);
		});
		
		setInterval(function() {
			// TODO: if is connected
			var obj = {
				cmds: [{cmd: "mem"}]
			};
			
			client.socket.write(JSON.stringify(obj));
		}, 5000);
		
		self._clients[client.id] = newClient;
		self._clientsCount++;
		
		util.log("Client attached [" + this._clientsCount + "]");
	}
};

/*------------------------------------------------------------------------------
  (public) detachClient

  + clientID - identifier of client to be detached
  - void
  
  Detaches client from manager.
------------------------------------------------------------------------------*/
Manager.prototype.detachClient = function(clientID) {
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
Manager.prototype._processData = function(data) {
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
Manager.prototype._formatBytes = function(bytes) {
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