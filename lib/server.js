var util = require('util');
var shared = require('./shared');
var server_timers = require('./server_timers');

var CallbackConverter = require('../conv/callback').CallbackConverter;

var worker;

function handleMarshalRequest(r)
{
	//console.log("Handle request: ", r);
	var module = r.module;
	if(module == 'global')
		module = global;
	else if(global[module])
		module = global[module];
	else if(module == './server_timers')
		module = server_timers;
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
	//console.log("Calling " + r.module + "." + r.function + "(" + ourArgs.join(', ') + ")");
	var result;
	try {
		result = module[r.function].apply(module, ourArgs);
	} catch (e) {
		console.log("(SERVER) Error in marshalled call: ", e);
		return;
	}
	//console.log("Result: " + util.inspect(result));
	handleMarshalResult(r, result);
}

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
	var rSerialized = JSON.stringify({marshal: response});
	//console.log("Posting back: " + rSerialized);
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
	//console.log("Attempting to marshal: " + util.inspect(response));
	var rSerialized = JSON.stringify({marshal: response});
	//console.log("Posting back: " + rSerialized);
	worker.postMessage(rSerialized);
}

function CallbackConverterOverride (obj) {
	// Here we create our own function that calls handleMarshalCallback
	return (function(id) {
		return function() {
			//console.log("CallbackConverter(modified).deserialize!");
			var args = Array.prototype.slice.call(arguments);
			handleMarshalCallback(id, args);
		};
	})(obj.id);
};

function Init () {
	// Modify the Callback Converter
	CallbackConverter.deserialize = CallbackConverterOverride;
}

exports.Init = Init;
exports.handleMarshalRequest = handleMarshalRequest;
exports.handleMarshalCallback = handleMarshalCallback;
exports.handleMarshalResult = handleMarshalResult;
exports.CallbackConverterOverride = CallbackConverterOverride;
exports.SetWorker = function(w) {
	worker = w;
};

