//var server = require('./server');

var timeout_id = 0;
var timeout_ids = {};

var interval_id = 0;
var interval_ids = {};

exports.setTimeout = function(callback, timeout, args) {
	return (function() {
		var id = ++timeout_id;
		var our_callback = function() {
			//console.log("(Server Timers) Timeout triggered");
			exports.clearTimeout(id);
			callback.apply(this, arguments);
		};
		timeout_ids[id] = setTimeout(our_callback, timeout, args);
		return id;
	})();
};

exports.clearTimeout = function(id) {
	if(!timeout_ids[id]) {
		console.log("(Server Timers) Failed to find timeout to clear: " + id);
		return;
	}
	var timer = timeout_ids[id];
	delete timeout_ids[id];
	return clearTimeout(timer);
};

exports.setInterval = function(callback, timeout, args) {
	var id = ++interval_id;
	interval_ids[id] = setInterval(callback, timeout, args);
	//console.log("Intervals: ", interval_ids);
	return id;
};

exports.clearInterval = function(id) {
	if(!interval_ids[id]) {
		console.log("(Server Timers) Failed to find interval to clear: " + id);
		console.log("Intervals: ", interval_ids);
		return;
	}
	var timer = interval_ids[id];
	delete interval_ids[id];
	//console.log("(Server Timers) Clearing interval " + id);
	return clearInterval(timer);
};
