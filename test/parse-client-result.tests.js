'use strict';

var chai = require('chai');
var expect = chai.expect;
var sut = require('../lib/parse-client-result');

describe('parse-client-result', function(){
  it('returns last valid config if err exists', function(){
    var result = sut('someerror', 'someconfig', 'someresult');
    expect(result).to.eql({
      errors: [new Error(), 'someerror'],
      config: 'someconfig'
    });
  });
  it('returns errors when err exists and no last valid config', function(){
    var result = sut('someerror', null, 'someresult');
    expect(result).to.eql({
      errors: [new Error(), 'someerror']
    });
    expect(result).to.not.have.property('config');
  });
  it('returns last valid config if result.node.value does not exist', function(){
    var result = sut(null, 'someconfig', 'someresult');
    expect(result).to.eql({
      errors: [new Error()],
      config: 'someconfig'
    });
  });
  it('returns errors if result.node.value does not exist and no last valid config', function(){
    var result = sut(null, null, 'someresult');
    expect(result).to.eql({
      errors: [new Error()]
    });
    expect(result).to.not.have.property('config');
  });
  it('returns last valid config if result.node.value is not valid json', function(){
    var result = sut(null, 'someconfig', {node:{value:'{}}'}});
    expect(result).to.eql({
      errors: [new Error(), new Error()],
      config: 'someconfig'
    });
  });
  it('returns errors if result.node.value is not valid json and no last valid config', function(){
    var result = sut(null, null,  {node:{value:'{}}'}});
    expect(result).to.eql({
      errors: [new Error(), new Error()]
    });
    expect(result).to.not.have.property('config');
  });
});