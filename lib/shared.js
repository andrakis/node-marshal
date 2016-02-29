/**
 * Shared functions for both server and client.
 */

var registeredConverters = {};

var MARSHAL_TYPE = '__marshal__type';
var MARSHAL_CONTENT = '__marshal__content';

var verbose = false;

function verb(/* arguments */) {
	if(verbose)
		console.log.apply(console, arguments);
}

function Converter (name, typeName, serialize, deserialize) {
	if (typeof name == "object") {
		typeName = name.typeName;
		serialize = name.serialize;
		deserialize = name.deserialize;
		name = name.name;
	}
	this.name = name;
	this.typeName = typeName;
	this.serialize = serialize;
	this.deserialize = deserialize;
}
Converter.prototype.Serialize = function(obj) {
	return this.serialize(obj);
};
Converter.prototype.Deserialize = function(content) {
	return this.deserialize(content);
}

function Serialize (obj) {
	if(obj === null) return null;
	if(obj === undefined) return undefined;

	var typeName = obj.constructor.name;
	verb("(Serialize) typeName: " + typeName);
	if(!registeredConverters[typeName]) {
		// No converter exists
		return obj;
	}
	var result = {};
	result[MARSHAL_TYPE] = typeName;
	result[MARSHAL_CONTENT] = registeredConverters[typeName].Serialize(obj);
	return result;
}

function Deserialize (obj) {
	if(obj === null) return null;
	if(obj === undefined) return undefined;

	var typeName = obj[MARSHAL_TYPE];
	console.log("Deserialize " + typeName);
	if(!registeredConverters[typeName]) {
		// No converter exists
		return obj;
	}
	return registeredConverters[typeName].Deserialize(obj[MARSHAL_CONTENT]);
}

function AddConverter(converter) {
	if(false&&registeredConverters[converter.typeName]) {
		console.log("WARN: overwriting converter: " + converter.typeName);
	}
	registeredConverters[converter.typeName] = converter;
	verb("Registered converter: " + converter.name);
}

exports.MARSHAL_TYPE = MARSHAL_TYPE;
exports.MARSHAL_CONTENT = MARSHAL_CONTENT;
exports.verbose = function(value) {
	if(value === undefined) return verbose;
	return verbose = value;
};
exports.Converter = Converter;
exports.Serialize = Serialize;
exports.Deserialize = Deserialize;
exports.AddConverter = AddConverter;

require('../conv/callback');
require('../conv/buffer');
