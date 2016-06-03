#!/usr/bin/env node

var Worker = require('webworker-threads').Worker;
var util = require('util');
var server = require('../lib/server');
var workerPath = __dirname + '/../runtime/worker.js';

// Start worker
var worker = new Worker(workerPath);
worker.onmessage = function(event) {
	console.log("Received: " + util.inspect(event));
	try {
		var cmd = JSON.parse(event.data);
		if(cmd.marshal) {
			server.handleMarshalRequest(cmd.marshal);
		}
	} catch(e) {
		console.log(e);
		console.log(e.stack);
	}
};
worker.onerror = function(event) {
	console.log("Error", event);
	console.log("Event stack:", event.stack);
};

server.Init();
server.SetWorker(worker);
console.log("Posting start");
worker.postMessage("start");
