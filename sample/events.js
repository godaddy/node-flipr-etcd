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

source.on(source.events.flush, function(){
  console.log('A flush was triggered on the source!  This may have been ' +
    'manually triggered, or it was triggered by a change to the etcd key.');
});

source.on(source.events.beforeChange, function(){
  console.log('A change was detected on the etcd key.  Cache will be ' +
    'flushed automatically.');
});

source.on(source.events.afterChange, function(){
  console.log('The cached config has been flushed and reloaded.  All calls ' +
    'to getConfig will now return the new config.');
});

source.on(source.events.error, function(){
  var errors = Array.prototype.slice(arguments, 0);
  console.log('An error occurred!');
  console.dir(errors);
});

source.getConfig(function(err, config){
  console.dir(config);
});