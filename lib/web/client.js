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
				
				//==============================================================
				
				client["graphData"] = [];
				
				/*if(client.graphData.length > 0) {
					client.graphData = client.graphData.slice(1);
				}
				
				while(client.graphData.length < 500) {
						var prev = client.graphData.length > 0 ? client.graphData.length[client.graphData.length-1] : 0;
					
						client.graphData.push(prev);
					}
				
				var lll = parseFloat(client.collection.mem.rss.substring(0, client.collection.mem.rss.length - 3));
				client.graphData.push(lll);
				
				var res = [];
				for(var i = 0; i < client.graphData.length; ++i) {
					res.push([i, client.graphData[i]]);
				}
				
				var kkk  = parseFloat(client.collection.mem.totalMem.substring(0, client.collection.mem.totalMem.length - 3));*/
				//client.graphData = memGraph(client.graphData, client.collection.mem.rss)
				client["graph"] = $.plot(
					$("#" + client.id + " .mem .graph"),
					[memGraph(client)],
					{
						series: { shadowSize: 0 },
						yaxis: { min: 0, max: parseFloat(client.collection.mem.totalMem.substring(0, client.collection.mem.totalMem.length - 3))*1000 },
						xaxis: { show: false }
					}
				);
				
				//client.graph.draw();

				
				//==============================================================
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
					
					
					/*if(client.graphData.length > 0) {
						client.graphData = client.graphData.slice(1);
					}
					
					while(client.graphData.length < totalPoints) {
						var prev = client.graphData.length > 0 ? client.graphData.length[client.graphData.length-1] : 0;
					
						client.graphData.push(prev);
					}
					
					var lll = parseFloat(client.collection.mem.rss.substring(0, client.collection.mem.rss.length - 3));
					client.graphData.push(lll+500);
				
					var res = [];
					for(var i = 0; i < client.graphData.length; ++i) {
						res.push([i, client.graphData[i]]);
					}

					client.graph.setData([ res ]);
					
					client.graph.draw();*/
					//client.graphData = memGraph(client.graphData, client.collection.mem.rss);
					client.graph.setData([
						memGraph(client)
					]);
					client.graph.draw();
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
	
	function memGraph(client) {
		var res = [],
			data = client.graphData,
			rawValue = client.collection.mem.rss,
			previous, parsedValue, parsedType;
	
		if(data.length > 0) {
			data = data.slice(1);
		}
		
		while(data.length < 500) {
			previous = data.length > 0 ? data[data.length-1] : 0;
		
			data.push(previous);
		}
		
		parsedType = rawValue.substring(rawValue.length - 2);
		parsedValue = parseFloat(rawValue.substring(0, rawValue.length - 3));
		data.push(parsedValue);
		client.graphData = data;
		
		for(var i = 0; i < data.length; i++) {
			res.push([i, data[i]]);
		}
		
		return res;
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