'use strict';

/**
* Note, this sample won't run unless you have etcd running locally
* and you have populated the my-app/config key with some JSON data.
*/

var FliprEtcd = require('../lib/flipr-etcd');

var source = new FliprEtcd({
  directory: 'my-app',
  key: 'config'
});

source.preload(function(){
  console.log('Config is loaded and cached!');
});