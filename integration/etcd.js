'use strict';

var _ = require('lodash');
var Etcd = require('node-etcd');
var etcd = new Etcd('10.0.0.200');

//This fixes issues with using partial application
_.forEach(etcd, function(n, key){
  if(_.isFunction(etcd[key]))
    etcd[key] = _.bind(etcd[key], etcd);
});

['mkdir', 'set'].forEach(function(key){
  etcd[key] = _.bind(etcd[key], etcd);
});

module.exports = etcd;

