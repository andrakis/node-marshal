// Provide marshalled versions of:
//   setTimeout and clearTimeout
//   setInterval and clearInterval.

var shared = require('./shared');
var client = require('./client');
var conv_callback = require('../conv/callback');

var timeout_id = 0;
var timeout_ids = {};
var interval_id = 0;
var interval_ids = {};

var module = './server_timers';

console.log("(Client) Setting up timer functions");

if(!global.clearTimeout)
global.clearTimeout = function(id) {
	var real_id = timeout_ids[id];
	if(!id) {
		console.log("(Client) Failed to find timeout to remove: " + id);
		return;
	}
	delete timeout_ids[id];
	if(real_id === null) {
		console.log("(Client) Don't have timeout id yet for " + id);
		return;
	}
	var request = {
		module: module, function: 'clearTimeout',
		arguments: [our_callback, timeout, args]
	};
	client.marshalRequest( request );
};

if(!global.setTimeout)
global.setTimeout = function(_callback, _timeout, _args) {
	try{
	//console.log("Setting up timeout");
	return (function(callback, timeout, args) {
		var id = ++timeout_id;
		var our_callback = function() {
			//console.log("(Client) Timeout calling, clearing id " + id);
			delete timeout_ids[id];
			try {
				callback.apply(this, args);
			} catch (e) {
				console.log("(Client) Error in timeout: ", e);
			}
		};
		var request = {
			module: module, function: 'setTimeout',
			arguments: [our_callback, timeout, args],
			callback: function(real_id) {
				//console.log("(Client) got setTimeout id: " + real_id);
				timeout_ids[id] = real_id;
			}
		};
		timeout_ids[id] = null;
		//console.log("marshal: ", request);
		client.marshalRequest( request );
		return id;
	})(_callback, _timeout, _args);
	} catch (e) {
		console.log("setTimeout error", e);
	}
};

if(!global.clearInterval)
global.clearInterval = function(id) {
	var real_id = interval_ids[id];
	if(!id) {
		console.log("(Client) Failed to find timeout to remove: " + id);
		return;
	}
	delete interval_ids[id];
	if(real_id === null) {
		console.log("(Client) Don't have timeout id yet for " + id);
		return;
	}
	var request = {
		module: module, function: 'clearInterval',
		arguments: [id]
	};
	//console.log(request);
	client.marshalRequest( request );
}

if(!global.setInterval)
global.setInterval = function(_callback, _timeout, _args) {
	return (function(callback, timeout, args) {
		var id = ++interval_id;
		var our_callback = function() {
			//console.log("(Client) Interval calling");
			callback.apply(this, args);
		};
		var request = {
			module: module, function: 'setInterval',
			arguments: [our_callback, timeout, args],
			callback: function(real_id) {
				//console.log("(Client) got setInterval id: " + real_id);
				interval_ids[id] = real_id;
			}
		};
		interval_ids[id] = null;
		//console.log("marshal: ", request);
		// Special case: do not clear this callback.
		// Will result in memory leaks, but presently no other way to avoid
		// deleting the callback.
		conv_callback.SetDoNotClear(true);
		client.marshalRequest( request );
		conv_callback.SetDoNotClear(false);
		return id;
	})(_callback, _timeout, _args);
};

