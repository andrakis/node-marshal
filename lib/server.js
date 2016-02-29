var Worker = require('webworker-threads').Worker;
var util = require('util');

workerPath = __dirname + '/../runtime/worker.js';

function handleMarshalRequest(r)
{
	var module;
	if(global[module])
		module = global[module];
	else
		module = require(r.module);
	if(!module || !module[r.function]) {
		throw "marshalRequest: unable to satisfy";
	}
	// Place our own callback args in here
	var ourArgs = [];
	for(var i = 0; i < r.arguments.length; i++) {
		var arg = r.arguments[i];
		if(arg['_callback']) {
			var callbackId = arg['_callback'];
			ourArgs.push((function(id) {
				return function() {
					var args = Array.prototype.slice.call(arguments);
					handleMarshalCallback(id, args);
				}
			})(callbackId));
		} else {
			ourArgs.push(arg);
		}
	}
	console.log("Calling " + r.module + "." + r.function + "(" + ourArgs.join(', ') + ")");
	var result = module[r.function].apply(module, ourArgs);
	console.log("Result: " + util.inspect(result));
}

var worker;
function handleMarshalCallback(id, args) {
	var ourArgs = [];
	for(var i = 0; i < args.length; i++) {
		if(args[i] && args[i].constructor == Buffer) {
			ourArgs.push({__marshal_buffer: args[i].toString()});
		} else {
			ourArgs.push(args[i]);
		}
	}
	var response = {
		callbackResponse: {
			id: id,
			args: ourArgs
		}
	};
	var rSerialized = JSON.stringify(response);
	//console.log("Posting back: " + rSerialized);
	worker.postMessage(rSerialized);
}

function Init () {
	worker = new Worker(workerPath);
	worker.onmessage = function(event) {
		console.log("Received: " + util.inspect(event));
		try {
			var cmd = JSON.parse(event.data);
			if(cmd.marshal) {
				handleMarshalRequest(cmd.marshal);
			}
		} catch(e) {
		}
	};
	worker.onerror = function(event) {
		console.log("Error", event);
		console.log("Event stack:", event.stack);
	};
	console.log("Posting start");
	worker.postMessage("start");
}

module.exports.Init = Init;
