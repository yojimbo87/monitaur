var client = (function() {
	
	var _clients = {};
	
	function init(
		clientTemplate,
		overviewTemplate,
		infoMemTemplate,
		placeholderElement
	) {
		tmplClient = clientTemplate;
		tmplOverview = overviewTemplate;
		tmplInfoMem = infoMemTemplate;
		elementPlaceholder = placeholderElement;
		
		_get("init", function() {
			var item, client, clientElement;
		
			for(item in _clients) {
				client = _clients[item];
			
				tmplClient.tmpl({id: client.id}).appendTo(elementPlaceholder);
				tmplOverview.tmpl(client).appendTo(
					$("#" + client.id + " .overview")
				);
				tmplInfoMem.tmpl(client.collection.mem).appendTo(
					$("#" + client.id + " .mem .info")
				);
				

				client["memGraphData"] = [];
				client["memGraph"] = $.plot(
					$("#" + client.id + " .mem .graph"),
					[_memGraph(client)],
					{
						series: { shadowSize: 0 },
						yaxis: { min: 0, max: parseFloat(client.collection.mem.totalMem.substring(0, client.collection.mem.totalMem.length - 3)) },
						xaxis: { show: false }
					}
				);
			}
		});
		
		_interval();
	}
	
	function _interval() {
		setTimeout(function() {
			_get("dataTick", function() {
				var item, client;
			
				for(item in _clients) {
					client = _clients[item];
					
					$("#" + client.id + " .mem .info").html("");
					tmplInfoMem.tmpl(client.collection.mem).appendTo(
						$("#" + client.id + " .mem .info")
					);
					
					client.memGraph.setData([
						_memGraph(client)
					]);
					client.memGraph.draw();
				}
			});
		
			_interval();
		}, 5000);
	}
	
	function _get(type, callback, clients) {
		switch(type) {
			case "init":
				$.getJSON("/init", function(data) {
					var item;
				
					for(item in data.clients) {
						_processData(data.clients[item]);
					}
					
					callback();
				});
				break;
			case "dataTick":
				$.getJSON("/dataTick", function(data) {
					var item;
				
					for(item in data.clients) {
						_processData(data.clients[item]);
					}
					
					callback();
				});
			default:
				break;
		}
	}
	
	function _processData(data) {
		switch(data.type) {
			case "init":
				_clients[data.id] = data;
				break;
			case "dataTick":
				_clients[data.id].collection.mem = data.collection.mem;
				break;
			default:
				break;
		}
	}
	
	function _memGraph(client) {
		var res = [],
			data = client.memGraphData,
			rawValue = client.collection.mem.rss,
			previous, parsedValue, parsedType;
	
		if(data.length > 0) {
			data = data.slice(1);
		}
		
		while(data.length < 500) {
			previous = data.length > 0 ? data[data.length-1] : 0;
		
			data.push(previous);
		}
		
		data.push(_parseMemory(
			rawValue, 
			client.collection.mem.totalMem.substring(client.collection.mem.totalMem.length - 2)
		));
		
		client.memGraphData = data;
		
		for(var i = 0; i < data.length; i++) {
			res.push([i, data[i]]);
		}
		
		return res;
	}
	
	// parse for example 150 MB into 0.15 GB if the maxPostfix is GB
	function _parseMemory(memory, maxPostfix) {
		var result = 0,
			value, postfix;
		
		value = parseFloat(memory.substring(0, memory.length - 3));
		postfix = memory.substring(memory.length - 2);
		
		switch(postfix.toLowerCase()) {
			case "kb":
				if(maxPostfix === "kb") {
					result = value;
				} else if(maxPostfix === "mb") {
					result = value / 1024;
				} else {
					result = value / (1024*1024);
				}
				break;
			case "mb":
				if(maxPostfix === "kb") {
					result = value * 1024;
				} else if(maxPostfix === "mb") {
					result = value;
				} else {
					result = value / 1024;
				}
				break;
			case "gb":
				if(maxPostfix === "kb") {
					result = value * 1024 * 1024;
				} else if(maxPostfix === "mb") {
					result = value * 1024;
				} else {
					result = value;
				}
				break;
			default:
				result = value;
				break;
		}
		
		return result;
	}

	return {
		init: init
	}
}());

$(document).ready(function () {
	client.init(
		$("#tmpl-client"),
		$("#tmpl-overview"),
		$("#tmpl-info-mem"),
		$("#placeholder")
	);
});

function debug(data) {
	$("#debug").append(data + "<br />");
}