var marshal = require('marshal');
var client = marshal.Client;

var targetFile = 'compile';

function start_demo() {
	var request = {
		module: 'fs', function: 'readFile',
		arguments: [targetFile, function(err, data) {
			console.log("Client request, err: ", err);
			if(data) {
				console.log("              ,data: ", data.length);
			}
			fileReceived(data);
		}]
	};
	console.log("Marshalling:", request);
	client.marshalRequest(request);
}

function fileReceived(data) {
	// Now do a readFileSync request
	var request = {
		module: 'fs', function: 'readFileSync',
		arguments: [targetFile],
		callback: function(data) {
			console.log("Should have deserialized data");
			console.log("data: ", data.length);
			demo_done();
		}
	};
	console.log("Marshalling fs.readFileSync request");
	client.marshalRequest(request);
}

function demo_done() {
	console.log("Requesting exit");
	var request = {
		module: 'process', function: 'exit',
		arguments: [0]
	};
	console.log("Marshalling");
	client.marshalRequest(request);
}

onmessage = function(event) {
	console.log("Client demo onmessage", event);
	switch(event.data) {
		case "start":
			start_demo();
			break;
		default:
			client.client_onmessage(event);
			break;
	}
};

onerror = client.client_onerror;
