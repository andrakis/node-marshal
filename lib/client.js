var Buffer = require('buffer').Buffer;
var shared = require('./shared');

var callback = require('../conv/callback');

var client_onmessage = function(event) {
	try {
		var response = JSON.parse(event.data);
		if(response.marshal)
			return handleClientMessage(response.marshal);
	} catch (e) {
		console.log("Error: " + utils.inspect(e));
		console.log(e.stack);
	}
	console.log("Client can't handle: " + event.data);
};
var client_onerror = function(data) {
	console.log("(worker) Error: ", data);
};

function handleClientMessage(response) {
	if(response['callbackResponse']) {
		var id = response['callbackResponse'].id;
		var cb = callback.GetCallback(id);
		if(!cb) {
			console.log("Error, callback " + id + " not found");
			return;
		}
		var ourArgs = [];
		var thierArgs = response['callbackResponse'].args;
		if(thierArgs) {
			for(var i = 0; i < thierArgs.length; i++) {
				var arg = thierArgs[i];
				ourArgs.push(shared.Deserialize(arg));
			}
		} else {
			ourArgs = thierArgs;
		}
		cb.apply(cb, ourArgs);
		shared.ClearCallback(id);
		return;
	} else if(response['marshalResult']) {
		var id = response['marshalResult'].request_id;
		//console.log("Marshal response id: ", id);
		var result = response['marshalResult'].result;
		if(result) {
			result = shared.Deserialize(result);
		}
		var cb = marshalRequestCallbacks[id];
		if(cb) {
			cb.call(cb, result);
			delete marshalRequestCallbacks[id];
		}
		else
			false&&console.log("There was no callback registered (async?)");
		return;
	}
}

var marshalRequestIds = 0;
var marshalRequestCallbacks = {};
function marshalRequest(r) {
	// Parse arguments
	var ourArgs = [];
	for(var i = 0; i < r.arguments.length; i++) {
		var arg = r.arguments[i];
		ourArgs.push(shared.Serialize(arg));
	}
	var oldArgs = r.arguments;
	r.arguments = ourArgs;
	r.request_id = ++marshalRequestIds;
	marshalRequestCallbacks[r.request_id] = r.callback;
	var rSerialized = JSON.stringify({marshal: r});
	r.arguments = oldArgs;
	//console.log("Serialized: ", rSerialized);

	postMessage(rSerialized);
}

exports.marshalRequest = marshalRequest;
exports.handleClientMessage = handleClientMessage;
exports.enableMessageHandlers = function() {
	onmessage = client_onmessage;
	onerror = client_onerror;
};
exports.client_onmessage = client_onmessage;
exports.client_onerror   = client_onerror;
