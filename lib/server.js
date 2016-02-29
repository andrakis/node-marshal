var Worker = require('webworker-threads').Worker;
var util = require('util');
var shared = require('./shared');

var workerPath = __dirname + '/../runtime/worker.js';

var CallbackConverter = require('../conv/callback').CallbackConverter;

function handleMarshalRequest(r)
{
	console.log("Handle request: ", r);
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
		ourArgs.push(shared.Deserialize(arg));
	}
	console.log("Calling " + r.module + "." + r.function + "(" + ourArgs.join(', ') + ")");
	var result = module[r.function].apply(module, ourArgs);
	console.log("Result: " + util.inspect(result));
	handleMarshalResult(r, result);
}

var worker;
function handleMarshalCallback(id, args) {
	var ourArgs = [];
	for(var i = 0; i < args.length; i++) {
		ourArgs.push(shared.Serialize(args[i]));
	}
	var response = {
		callbackResponse: {
			id: id,
			args: ourArgs
		}
	};
	var rSerialized = JSON.stringify(response);
	console.log("Posting back: " + rSerialized);
	worker.postMessage(rSerialized);
}

function handleMarshalResult(r, result) {
	var resultObj = result;
	var response = {
		marshalResult: {
			request_id: r.request_id,
			result: shared.Serialize(resultObj)
		}
	};
	var rSerialized = JSON.stringify(response);
	console.log("Posting back: " + rSerialized);
	worker.postMessage(rSerialized);
}

function Init () {
	// Modify the Callback Converter
	CallbackConverter.deserialize = function(obj) {
		// Here we create our own function that calls handleMarshalCallback
		return (function(id) {
			return function() {
				console.log("CallbackConverter(modified).deserialize!");
				var args = Array.prototype.slice.call(arguments);
				handleMarshalCallback(id, args);
			};
		})(obj.id);
	};

	// Start worker
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
module.handleMarshalRequest = handleMarshalRequest;
