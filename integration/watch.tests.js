'use strict';

var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var async = require('async');
var etcd = require('./etcd');
var helper = require('./helper');
var FliprEtcd = require('../lib/flipr-etcd');
var source;

describe('watch tests', function(){
  before(function(){
    source = new FliprEtcd({
      directory: 'watch-tests',
      key: 'config',
      host: '10.0.0.200'
    });
  });
  beforeEach(function(done){
    etcd.set('flipr/watch-tests/config', JSON.stringify({some:'config'}), done);
  });
  it('change in etcd triggers change on watcher', function(done){
    source.watcher.once('change', function(){
      done();
    });
    etcd.set('flipr/watch-tests/config', JSON.stringify({updated:'config'}), function(err){
      if(err) return done(err);
    });
  });
  it('change in etcd triggers before-change, flush, and after-change', function(done){
    var events = [];
    function eventsCalled(name) {
      events.push(name);
      if(events.length !== 3)
        return;
      if(_.contains(events, source.events.beforeChange) && _.contains(events, source.events.flush) && _.contains(events, source.events.afterChange))
        done();
    }
    source.once(source.events.beforeChange, function(){
      eventsCalled(source.events.beforeChange);
    });
    source.once(source.events.flush, function(){
      eventsCalled(source.events.flush);
    });
    source.once(source.events.afterChange, function(){
      eventsCalled(source.events.afterChange);
    });
    etcd.set('flipr/watch-tests/config', JSON.stringify({updated:'config'}));
  });
  it('receives updated config when etcd is updated, within 500ms', function(done){
    async.series([
      function(cb) {
        source.getConfig(function(err, config){
          if(err) return cb(err);
          expect(config).to.eql({some:'config'});
          cb();
        });  
      },
      _.partial(etcd.set, 'flipr/watch-tests/config', JSON.stringify({updated:'config'})),
      _.partial(wait, 500),
      function(cb) {
        source.getConfig(function(err, config){
          if(err) return cb(err);
          expect(config).to.eql({updated:'config'});
          cb();
        });  
      }      
    ], done);
  });
  it('reconnects watcher if etcd restarts', function(done){
    this.timeout(10000);
    async.series([
      function(cb) {
        source.getConfig(function(err, config){
          if(err) return cb(err);
          expect(config).to.eql({some:'config'});
          cb();
        });  
      },
      helper.restartEtcd,
      _.partial(wait, 500),
      _.partial(etcd.set, 'flipr/watch-tests/config', JSON.stringify({updated:'config'})),
      _.partial(wait, 500),
      function(cb) {
        source.getConfig(function(err, config){
          if(err) return cb(err);
          expect(config).to.eql({updated:'config'});
          cb();
        });  
      }      
    ], done);
  });
});

function wait(milliseconds, cb) {
  setTimeout(function(){
    cb();
  }, milliseconds || 1000);
}