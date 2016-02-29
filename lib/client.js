var Buffer = require('buffer').Buffer;
//var targetFile = "../jorconsole/jor1k/sys/or1k/vmlinux.bin.bz2";
var targetFile = 'compile';
var _callback_counter = 0;
var _callbacks = {};
function _callback(cb) {
	this.id = ++_callback_counter;
	this.cb = cb;
	_callbacks[this.id] = this.cb;
}

function start_demo() {
	var request = {
		module: 'fs', function: 'readFile',
		arguments: [targetFile, new _callback(function(err, data) {
			console.log("Client request, err: ", err);
			if(data) {
				console.log("              ,data: ", data.length);
			}
			fileReceived(data);
		})]
	};
	console.log("Marshalling");
	marshalRequest(request);
}

function fileReceived(data) {
	// Now do a readFileSync request
	var request = {
		module: 'fs', function: 'readFileSync',
		arguments: [targetFile],
		callback: function(data) {
			if(data) {
				console.log("            ,data: ", data.length);
			}
			demo_done();
		}
	};
	console.log("Marshalling fs.readFileSync request");
	marshalRequest(request);
}

function demo_done() {
	console.log("Requesting exit");
	var request = {
		module: 'process', function: 'exit',
		arguments: [0]
	};
	console.log("Marshalling");
	marshalRequest(request);
}

onmessage = function(event) {
	switch(event.data) {
		case "start":
			console.log("FKN START");
			start_demo();
			break;
		default:
			try {
				var response = JSON.parse(event.data);
				if(response['callbackResponse']) {
					var id = response['callbackResponse'].id;
					console.log("HAVE");
					var cb = _callbacks[id];
					if(!cb) {
						console.log("Error, callback " + id + " not found");
						return;
					}
					console.log("Callback time!");
					var ourArgs = [];
					var thierArgs = response['callbackResponse'].args;
					console.log("theirArgs: ", thierArgs);
					if(thierArgs) {
						for(var i = 0; i < thierArgs.length; i++) {
							var arg = thierArgs[i];
							if(arg && arg['__marshal_buffer']) {
								ourArgs.push(new Buffer(arg['__marshal_buffer']));
							} else {
								ourArgs.push(arg);
							}
						}
					} else {
						ourArgs = thierArgs;
					}
					cb.apply(cb, ourArgs);
					return;
				} else if(response['marshalResult']) {
					var id = response['marshalResult'].request_id;
					console.log("Marshal response id: ", id);
					var result = response['marshalResult'].result;
					if(result) {
						if(result.__marshal_buffer) {
							console.log("Marshalling from buffer");
							result = new Buffer(result.__marshal_buffer);
						}
					}
					var cb = marshalRequestCallbacks[id];
					console.log("Callback time!");
					if(cb)
						cb.call(cb, result);
					else
						console.log("There was no callback :(");
					return;
				}
			} catch (e) {
				console.log("Error: " + utils.inspect(e));
				console.log(e.stack);
			}
			console.log("Client can't handle: " + event.data);
			break;
	}
};
onerror = function(data) {
	console.log("(worker) Error: ", data);
};

var marshalRequestIds = 0;
var marshalRequestCallbacks = {};
function marshalRequest(r) {
	// Parse arguments
	var ourArgs = [];
	for(var i = 0; i < r.arguments.length; i++) {
		var arg = r.arguments[i];
		if(arg.constructor == _callback) {
			ourArgs.push({_callback: arg.id});
		} else {
			ourArgs.push(arg);
		}
	}
	var oldArgs = r.arguments;
	r.arguments = ourArgs;
	r.request_id = ++marshalRequestIds;
	marshalRequestCallbacks[r.request_id] = r.callback;
	var rSerialized = JSON.stringify({marshal: r});
	r.arguments = oldArgs;
	console.log("Serialized: ", rSerialized);

	postMessage(rSerialized);
}


console.log("Worker started");
