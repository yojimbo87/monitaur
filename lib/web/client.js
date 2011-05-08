var client = (function() {
	
	function init(
		debugElement
	) {
		elemDebug = debugElement;
		
		interval();
	}
	
	function interval() {
		get("sys", function(data) {
			debug(data);
		});
	
		setTimeout(interval, 10000)
	}
	
	function get(type, callback) {
		$.getJSON(
			"/" + type, 
			function(data) {
				callback(data);
			}
		);
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
	$("#debug").text(data + "<br />");
}