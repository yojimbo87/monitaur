var util = require("util"),
	http = require("http"),
Monotaur = require("../../lib/client/monotaur");
	
var monotaur = new Monotaur({
	port: 8001,
	host: "vps-19-ubuntu-server.developmententity.sk"
});
monotaur.init();


var randomTimeout = generateTimeout(),
	iteration = 0,
	collection = [];

setInterval(function() {
	if(iteration === 5) {
		collection.length = 0;
		iteration = 0;
	} else {
		for(var i = 0; i < randomTimeout; i++) {
			var foo = {
				payload: generateString(50)
			};
			
			collection.push(foo);
		}
		
		iteration++;
	}
	
	util.log("Count: " + collection.length);

	randomTimeout = generateTimeout();
}, randomTimeout);


function generateString(sLength) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < sLength; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function generateTimeout() {
	return (Math.floor(Math.random() * 11) + 1) * 1000;
}