var util = require("util"),
	 net = require("net"),
	Uuid = require("./node-uuid/uuid.js"),
 Manager = require("./manager"),
	 HOST = "vps-19-ubuntu-server.developmententity.sk",
	 PORT = 8001;

var manager = new Manager();	 
	 
var server = net.createServer(function (socket) {
	util.log("connection");
	socket.setEncoding("utf8");
	
	socket.on("connect", function () {
		var client = {
			id: Uuid(),
			socket: socket
		};
	
		manager.attachClient(client);
		
		util.log("connect " + client.id);
	});
    
	/*socket.on("data", function (data) {
		util.log("data: " + data);
	});
  
	socket.on("end", function () {
		manager.detachClient(1);
	
		//util.log("end");
	});*/
});

server.listen(PORT, HOST);

util.log("Monitaur is listening on " + PORT);