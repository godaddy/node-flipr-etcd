'use strict';

var sinon = require('sinon');

module.exports = { EventEmitter: EventEmitter };

function EventEmitter(){

}

EventEmitter.prototype.emit = sinon.spy();