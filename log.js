'use strict';

var colors = require('colors'),
    config = require('./config'),

	_message = function(type, color) {
        return function(text) {
            if(config.log.indexOf(type) > -1 && text) { // if this type of logging is allowed and there is text to log
                text = type.toUpperCase() + ': ' + text;
                console.log(text[color] ? text[color] : text);
            }
        };
    };

module.exports = {
	notice: _message('notice'),
	warning: _message('warning', 'yellow'),
	error: _message('error', 'red')
};
