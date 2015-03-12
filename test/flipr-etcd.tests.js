'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var proxyquire = require('proxyquire');
var NodeEtcdFixture = require('./fixture/node-etcd');
var eventsFixture = require('./fixture/events');
var sutPath = '../lib/flipr-etcd';
var Sut;
var sut;
var nodeEtcd;

describe('flipr-etcd', function(){
  beforeEach(function(){
    Sut = proxyquire(sutPath, {
      'node-etcd': NodeEtcdFixture,
      'events': eventsFixture
    });
    sut = new Sut();
    nodeEtcd = NodeEtcdFixture.current();
  });
  it('passes default options to node-etcd', function(){
    expect(nodeEtcd.host).to.equal('127.0.0.1');
    expect(nodeEtcd.port).to.equal('4001');
  });
  it('sends new options to node-etcd', function(){
    sut = new Sut({host: 'a', port: 'b'});
    nodeEtcd = NodeEtcdFixture.current();
    expect(nodeEtcd.host).to.equal('a');
    expect(nodeEtcd.port).to.equal('b');
  });
  it('forces instantiation', function(){
    sut = Sut(); //jshint ignore:line
    expect(sut).to.be.instanceof(Sut);
  });
  describe('has events', function(){
    it('beforeChange', function(){
      expect(sut.events.beforeChange).to.equal('before-change');
    });
    it('flush', function(){
      expect(sut.events.flush).to.equal('flush');
    });
    it('afterChange', function(){
      expect(sut.events.afterChange).to.equal('after-change');
    });
    it('error', function(){
      expect(sut.events.error).to.equal('error');
    });
  });
  describe('#getConfig', function(){
    it('retrieves config from etcd', function(done){
     Sut = proxyquire(sutPath, {
        'node-etcd': NodeEtcdFixture,
        'events': eventsFixture,
        './parse-client-result': sinon.stub().returns({config:'someconfig'})
      });
      sut = new Sut();
      sut.getConfig(function(err, result){
        if(err)
          return done(err);
        expect(result).to.deep.equal('someconfig');
        done();
      });
    });
    it('memoizes config from etcd', function(done){
      var etcdResponse1 = {
        node: {
          value: '{"some":"config"}'
        }
      };
      var etcdResponse2 = {
        node: {
          value: '{"new":"config"}'
        }
      };
      nodeEtcd.mock({getReturn: etcdResponse1});
      sut.getConfig(function(err, result){
        if(err)
          return done(err);
        expect(result).to.eql({
          some: 'config'
        });
        nodeEtcd.mock({getReturn: etcdResponse2});
        sut.getConfig(function(err2, result2){
          if(err)
            return done(err);
          expect(result2).to.eql({
            some: 'config'
          });
          done();
        });
      });
    });
    it('returns last valid config if next call to etcd errors', function(done){
      var etcdResponse1 = {
        node: {
          value: '{"some":"config"}'
        }
      };
      var etcdResponse2 = 'error!';
      nodeEtcd.mock({getReturn: etcdResponse1});
      sut.getConfig(function(err, result){
        if(err)
          return done(err);
        expect(result).to.deep.equal({
          some: 'config'
        });
        nodeEtcd.mock({getError: etcdResponse2});
        sut.getConfig(function(err2, result2){
          if(err)
            return done(err);
          expect(result2).to.deep.equal({
            some: 'config'
          });
          done();
        });
      });
    });
    it('returns error if no last valid config found after etcd error', function(done){
      var etcdResponse = 'error!';
      nodeEtcd.mock({getError: etcdResponse});
      sut.getConfig(function(err){
        expect(err).to.equal('error!');
        done();
      });
    });
    it('passes last error from parseClientResult as err to cb', function(done){
      Sut = proxyquire(sutPath, {
        'node-etcd': NodeEtcdFixture,
        'events': eventsFixture,
        './parse-client-result': sinon.stub().returns({errors:['error1', 'error2']})
      });
      sut = new Sut();
      sut.getConfig(function(err){
        expect(err).to.equal('error2');
        done();
      });
    });
    it('passes error to cb even if parseClientResult does not return one', function(done){
      Sut = proxyquire(sutPath, {
        'node-etcd': NodeEtcdFixture,
        'events': eventsFixture,
        './parse-client-result': sinon.stub().returns({})
      });
      sut = new Sut();
      sut.getConfig(function(err){
        expect(err).to.eql(new Error());
        done();
      });
    });
  });
  describe('#flush', function(){
    it('clears memoized getConfig', function(done){
      var etcdResponse1 = {
        node: {
          value: '{"some":"config"}'
        }
      };
      var etcdResponse2 = {
        node: {
          value: '{"im":"different"}'
        }
      };
      nodeEtcd.mock({getReturn: etcdResponse1});
      sut.getConfig(function(err, result){
        if(err)
          return done(err);
        expect(result).to.deep.equal({
          some: 'config'
        });
        sut.flush();
        nodeEtcd.mock({getReturn: etcdResponse2});
        sut.getConfig(function(err2, result2){
          if(err)
            return done(err);
          expect(result2).to.deep.equal({
            im: 'different'
          });
          done();
        });
      });
    });
  });
  describe('watcher', function(){
    it('watches for changes and triggers events, calls flush, and preloads changes', function(done){
      sinon.spy(sut, 'flush');
      sut.preload = function(cb){cb();};
      sut.watcher.on('change', function(){
        expect(sut.emit).to.be.calledWith('before-change');
        expect(sut.flush).to.be.called;
        expect(sut.emit).to.be.calledWith('after-change');
        done();
      });
      sut.watcher.emit('change', {action: 'set'});
    });
    it('will not trigger change if etcd action is in exclusion list', function(done){
      sut.watcher.on('change', function(){
        expect(sut.emit).to.not.be.called;
        done();
      });
      sut.emit.reset();
      sut.watcher.emit('change', {action: 'delete'});
    });
    it('emits error and will not trigger change if etcd response is not recognized', function(done){
      sut.watcher.on('change', function(){
        expect(sut.emit).to.be.calledWithMatch('error', Error);
        done();
      });
      sut.watcher.emit('change', 'notavalidresponse');
    });
  });
});