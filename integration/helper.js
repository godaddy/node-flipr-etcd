'use strict';

var exec = require('child_process').exec;

module.exports = {
  restartEtcd: function restartEtcd(cb) {
    exec('vagrant ssh -c "sudo kill $(ps auxf | grep \'sudo ./etcd\' | grep -v grep | awk \'{print $2}\')"', function(){
      exec('vagrant ssh -c "nohup sudo ./etcd-v2.0.4-linux-amd64/etcd -listen-client-urls \'http://0.0.0.0:2379,http://0.0.0.0:4001\' 2> /dev/null & sleep 1"', cb);
    });
  }
};