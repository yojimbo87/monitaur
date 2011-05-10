var util = require("util"),
	 net = require("net"),
	http = require("http"),
	 url = require("url"),
      fs = require("fs"),
	Uuid = require("./node-uuid/uuid.js");

/*------------------------------------------------------------------------------
  (public) Server
  
  + port
  + host
  - void
  
  Set up Server.
------------------------------------------------------------------------------*/
var Server = module.exports = function Server(socketServer, httpServer) {
	var self = this;

	socketServer.port = socketServer.port || 8001;

	this._clients = {};
	this._clientsCount = 0;
	this._server = null;
	
	this._initServer(socketServer.port, socketServer.host);
	
	if(httpServer) {
		this._httpServer = http.createServer(function(request, response){ 
			var path = url.parse(request.url).pathname,
				prefix = "../../lib/web";
			
			switch(path) {
				case "/":
					fs.readFile(prefix + "/monitaur.html", function (err, data) {
						response.writeHead(200, {"Content-Type": "text/html"});
						response.write(data, "utf8");
						response.end();
					});
					break;
				case "/style.css":
					fs.readFile(prefix + path, function (err, data) {
						response.writeHead(200, {"Content-Type": "text/css"});
						response.write(data, "utf8");
						response.end();
					});
					break;
				case "/client.js":
				case "/jquery.flot.min.js":
					fs.readFile(prefix + path, function (err, data) {
						response.writeHead(200, {"Content-Type": "text/javascript"});
						response.write(data, "utf8");
						response.end();
					});
					break;
				case "/init":
					self._response(response, "init");
					break;
				case "/dataTick":
					self._response(
						response,
						"dataTick",
						url.parse(request.url, true).query.clients
					);
					break;
				default:
					break;
			}
		});
		
		if(httpServer.host) {
			this._httpServer.listen(httpServer.port, httpServer.host);
		} else {
			this._httpServer.listen(httpServer.port);
		}
	}
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
  
  + port
  + host
  - void
  
  Initialize server which listens for client connections based on port and host.
------------------------------------------------------------------------------*/
Server.prototype._initServer = function(port, host) {
	var self = this,
		client;

	self._server = net.createServer(function(socket) {
		util.log("connection");
		socket.setEncoding("utf8");
		
		socket.on("connect", function () {
			self._attachClient({
				id: Uuid(),
				socket: socket
			});
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

  + clientArg
  - void
  
  Attaches new client for managing.
------------------------------------------------------------------------------*/
Server.prototype._attachClient = function(clientArg) {
	var self = this,
		buffer = "",
		jsonBegin = -1,
		jsonEnd = -1,
		client;
	
	if(!self._clients[clientArg.id]) {
		client = {
			id: clientArg.id,
			name: "0",
			socket: clientArg.socket,
			isConnected: true,
			collection: {
				cpu: [],
				mem: [],
				sys: {}
			}
		};
		
		client.socket.on("data", function (data) {
			buffer += data;
			jsonBegin = buffer.indexOf("{");
			jsonEnd = buffer.indexOf("]}");
			
			if((jsonBegin !== -1) && (jsonEnd !== -1)) {
				self._processData(
					client.id,
					buffer.substring(jsonBegin, jsonEnd + 2)
				);
				buffer = buffer.substring(jsonEnd + 2);
			}
		});
	  
		client.socket.on("close", function (hadError) {
			client.isConnected = false;
			self._detachClient(client.id);
		});
		
		// get initial info about system and memory and start interval
		setTimeout(function() {
			self._write(client.id, {cmds: [{cmd:"sys"},{cmd:"mem"}]});
			
			setInterval(function() {
				self._write(client.id, {
					cmds: [{cmd: "mem"}]
				});
			}, 5000);
		}, 1000);
		
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

  + buffer
  - void
  
  Process data received from client.
------------------------------------------------------------------------------*/
Server.prototype._processData = function(clientID, buffer) {
	var self = this,
		data = JSON.parse(buffer),
		collection = self._clients[clientID].collection,
		partial, i, len;
		
	for(i = 0, len = data.collection.length; i < len; i++) {
		partial = data.collection[i];
		
		switch(partial.type) {
			case "init":
				self._clients[clientID].name = partial.name;
				break;
			case "sys":
				collection.sys = {
					pid: partial.pid,
					version: partial.version,
					platform: partial.platform,
					hostname: partial.hostname,
					osType: partial.osType,
					release: partial.release
				};
				break;
			case "cpu":
				break;
			case "mem":
				collection.mem.push({
					totalMem: self._formatBytes(partial.totalMem),
					freeMem: self._formatBytes(partial.freeMem),
					rss: self._formatBytes(partial.rss),
					vsize: self._formatBytes(partial.vsize),
					heapTotal: self._formatBytes(partial.heapTotal),
					heapUsed: self._formatBytes(partial.heapUsed)
				});
				break;
			default:
				break;
		}
	}
};

/*------------------------------------------------------------------------------
  (private) _write

  + clientID
  + data
  - void
  
  Write data to certain client if he exists and is connected.
------------------------------------------------------------------------------*/
Server.prototype._write = function(clientID, data) {
	var self = this;
		client = self._clients[clientID];
		
	if(client && client.isConnected) {
		client.socket.write(JSON.stringify(data));
	}
};

/*------------------------------------------------------------------------------
  (private) _response

  + clientID
  + respone
  - void
  
  Send HTTP reponse with data about certain client.
------------------------------------------------------------------------------*/
Server.prototype._response = function(response, type, clients) {
	var self = this,
		data = {clients: []},
		client, dataClient, item, subitem, lastIndex;
	
	switch(type) {
		case "init":
			for(item in self._clients) {
				client = self._clients[item];
				
				dataClient = {
					type: "init",
					id: client.id,
					name: client.name,
					collection: {}
				};
				
				for(subitem in client.collection.sys) {
					dataClient[subitem] = client.collection.sys[subitem];
				}
				
				lastIndex = client.collection.mem.length - 1;
				dataClient.collection["mem"] = client.collection.mem[lastIndex];
			
				data.clients.push(dataClient);
			}
			break;
		case "dataTick":
			for(item in self._clients) {
				client = self._clients[item];
			
				dataClient = {
					type: "dataTick",
					id: client.id,
					collection: {}
				};
				
				lastIndex = client.collection.mem.length - 1;
				dataClient.collection["mem"] = client.collection.mem[lastIndex];
			
				data.clients.push(dataClient);
			}
			break;
		default:
			break;
	}

	response.writeHead(200, {"Content-Type": "application/json"});
	response.write(JSON.stringify(data), "utf8");
	response.end();
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