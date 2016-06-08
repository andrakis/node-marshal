var marshal = require('../index');
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
			demo_timers();
		}
	};
	console.log("Marshalling fs.readFileSync request");
	client.marshalRequest(request);
}

function demo_timers() {
	var callback = function(a, b, c) {
		console.log("Timers demo: timeout with [", [a, b, c], "]");
		demo_interval();
	};
	var id = false;
	try {
		var id = setTimeout(callback, 1000, [1, 2, 3]);
	} catch (e) {
		console.log("Error: " + e);
		demo_done();
		return;
	}
	console.log("Timers demo: setup a timeout, got id: " + id);
}

var interval_counter = 0;
var cleared = false;
function demo_interval() {
	var interval_id;
	var callback = function() {
		console.log("Interval called " + interval_counter + " times");
		interval_counter++;
		if(interval_counter >= 5 && !cleared) {
			cleared = true;
			console.log("Counter exceeded, clearing: " + interval_id);
			clearInterval(interval_id);
			// Use a timeout to prove that the interval is cleared
			console.log("Waiting a moment before exiting");
			setTimeout(function() {
				demo_done();
			}, 1000);
		}
	};
	interval_id = setInterval(callback, 250, [1, 2, 3]);
	console.log("Interval setup, id: " + interval_id);
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
	//console.log("Client demo onmessage", event);
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
