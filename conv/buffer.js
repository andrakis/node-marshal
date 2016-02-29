var shared = require('../lib/shared');
var Converter = shared.Converter;
var Buffer = require('buffer').Buffer;

var BufferConverter = new Converter({
	name: '__marshal_buffer',
	typeName: 'Buffer',
	serialize: function(obj) {
		return obj.toString();
	},
	deserialize: function(obj) {
		return new Buffer(obj);
	}
});
shared.AddConverter(BufferConverter);

exports.ReRegister = function() { shared.AddConverter(BufferConverter); };
exports.ReRegister();
