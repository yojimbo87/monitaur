var client = (function() {
	
	var _clients = {};
	
	function init(
		debugElement
	) {
		elemDebug = debugElement;
		
		_get(function() {
			for(var client in _clients) {
				debug(JSON.stringify(_clients[client]));
			}
		});
		
		//_get();
		
		_interval();
	}
	
	function _interval() {

	
		/*setTimeout(function() {
			for(var client in _clients) {
				debug(JSON.stringify(_clients[client]));
			}
		}, 10000);*/
	}
	
	function _get(callback, clients) {
		if(clients) {
			$.getJSON("/get", clients, function(data) {
				var item;
				for(item in data.clients) {
					_processData(data.clients[item]);
				}
				
				callback();
			});
		} else {
			$.getJSON("/init", function(data) {
				var item;
				for(item in data.clients) {
					_processData(data.clients[item]);
				}
				
				callback();
			});
		}
	}
	
	function _processData(data) {
		switch(data.type) {
			case "init":
				_clients[data.id] = data;
				break;
			default:
				break;
		}
	}

	return {
		init: init
	}
}());

$(document).ready(function () {
	client.init(
		$("#container")
	);
});

function debug(data) {
	$("#debug").append(data + "<br />");
}