'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');
var Etcd = require('node-etcd');
var memoize = require('memoizee');
var parseClientResult = require('./parse-client-result');

module.exports = FliprEtcd;

function FliprEtcd(options) {
  //Force instantiation
  if(!(this instanceof FliprEtcd))
    return new FliprEtcd(options);
  EventEmitter.call(this);
  options = _.defaults({}, options, {
    host: '127.0.0.1',
    port: '4001',
    directory: 'default',
    key: 'config'
  });

  var _changeActionsToIgnore = ['delete', 'compareAndDelete', 'expire'];
  var _fullKey = util.format('flipr/%s/%s', options.directory, options.key);
  var _lastValidConfig;

  this.events = {
    beforeChange: 'before-change',
    flush: 'flush',
    afterChange: 'after-change',
    error: 'error'
  };

  this.client = new Etcd(options.host, options.port, options.ssl);

  this.getConfig = memoize(_.bind(function(cb){
    this.client.get(_fullKey, _.bind(function(err, result){
      result = parseClientResult(err, _lastValidConfig, result);
      if(!result.config) {
        _.partial(this.emit, this.events.error).apply(this, result.errors || []);
        return cb(err || _.last(result.errors) || new Error('Unexpected error while getting config from etcd.'));
      }
      return cb(null, result.config);
    }, this));
  }, this), {async: true});

  //Calling getConfig will memoize the cache.
  this.preload = this.getConfig;

  this.flush = _.bind(function(){
    this.getConfig.clear();
    this.emit(this.events.flush);
  }, this);

  this.watcher = this.client.watcher(_fullKey);

  this.watcher.on('change', _.bind(function(result){
    if(!result || !result.action) {
      this.emit(this.events.error, new Error('Unrecognized result from etcd watcher.'), result);
      return;
    }

    if(_changeActionsToIgnore.indexOf(result.action) > -1)
      return;

    this.emit(this.events.beforeChange);
    //TODO: change should be able to update the cached config without
    //making the second call to preload.
    this.flush();
    this.preload(_.bind(function(){
      this.emit(this.events.afterChange);
    }, this));
  }, this));

  this.watcher.on('error', _.partial(this.emit, this.events.error));
}

util.inherits(FliprEtcd, EventEmitter);