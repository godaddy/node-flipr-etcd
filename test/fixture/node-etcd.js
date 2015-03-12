'use strict';

var sinon = require('sinon');
var EventEmitter = require('events').EventEmitter;

module.exports = Etcd;

var currentFixture;

function Etcd(host, port, sslopts) {
  this.host = host;
  this.port = port;
  this.sslopts = sslopts;
  currentFixture = this;
}

Etcd.prototype.mock = function(options) {
  options = options || {};
  this.getReturn = options.getReturn;
  this.getError = options.getError;
};

Etcd.prototype.get = sinon.spy(function(key, cb) {
  if(this.getError)
    return void cb(this.getError);
  cb(null, this.getReturn);
});

Etcd.prototype.watcher = sinon.spy(function() {
  return new EventEmitter();
});

Etcd.current = function(){
  return currentFixture;
};