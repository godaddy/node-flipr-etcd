'use strict';

var path = require('path');
var exec = require('child_process').exec;
var async = require('async');
var _ = require('lodash');
var etcd = require('./etcd');

before(function(done){
  this.timeout(125000);
  console.log('Spinning up Vagrant VM running Etcd, this will take a minute...');
  exec('vagrant up --provider virtualbox', {
    timeout: 1200000, 
    cwd: path.resolve(__dirname, '..')
  }, function(err, stdout, stderr){
    if(err) return done(err);
    if(stderr) return done(stderr);
    console.log('Adding data to Etcd for tests');
    async.series([
      _.partial(etcd.set, 'flipr/basic-tests/config', JSON.stringify({some:'config'})),
      _.partial(etcd.set, 'flipr/watch-tests/config', JSON.stringify({some:'config'}))
    ], done);
  });
});

after(function(done){
  this.timeout(65000);
  console.log('Destroying Vagrant VM');
  exec('vagrant destroy -f', {
    timeout: 60000, 
    cwd: path.resolve(__dirname, '..')
  }, function(err, stdout, stderr){
    if(err) return done(err);
    if(stderr) return done(stderr);
    done();
  });
});