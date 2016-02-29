var server = require('./lib/server');
var shared = require('./lib/shared');
var Buffer = require('buffer').Buffer;

var serialized = shared.Serialize(new Buffer(01));
console.log("Serialized: ", serialized);
console.log("Deserialized: ", shared.Deserialize(serialized));

// Callback test

var request = function(/* arguments */) {
	console.log("Callback!");
};
serialized = shared.Serialize(request);
console.log("Serialized: ", serialized);
console.log("Deserialized: ", shared.Deserialize(serialized));


