'use strict';

var chai = require('chai');
var expect = chai.expect;

var FliprEtcd = require('../lib/flipr-etcd');
var source;

describe('basic tests', function(){
  before(function(){
    source = new FliprEtcd({
      directory: 'basic-tests',
      key: 'config',
      host: '10.0.0.200'
    });
  });
  it('gets config from etcd', function(done){
    source.getConfig(function(err, config){
      if(err) return done(err);
      expect(config).to.eql({some:'config'});
      done();
    });
  });
});