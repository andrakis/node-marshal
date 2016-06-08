/**
 * Converts callbacks into marshallable data
 */

var shared = require('../lib/shared');
var Converter = shared.Converter;

var _callback_counter = 0;
var _callbacks = {};

var _do_not_clear_list = {};
var _do_not_clear = false;

function Callback(cb) {
	this.id = ++_callback_counter;
	this.cb = cb;
	_callbacks[this.id] = this.cb;
	if(_do_not_clear)
		_do_not_clear_list[this.id] = true;
}

exports.Callback = Callback;

var CallbackConverter = new Converter({
	name: '__marshal_callback',
	typeName: 'Function',
	serialize: function(fun) {
		var cb = new Callback(fun);
		return {id: cb.id};
	},
	deserialize: function(obj) {
		var cb = _callbacks[obj.id];
		return cb;
	}
});

exports.CallbackConverter = CallbackConverter;
shared.AddConverter(CallbackConverter);

exports.ReRegister = function() { shared.AddConverter(CallbackConverter); };
exports.ReRegister();

exports.GetCallback = function(id) {
	return _callbacks[id];
};

exports.ClearCallback = function(id) {
	if(!_do_not_clear_list[id])
		delete _callbacks[id];
};

exports.SetDoNotClear = function(should_do_not_clear) {
	_do_not_clear = should_do_not_clear;
};
