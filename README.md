node-flipr-etcd
===============

[![NPM](https://nodei.co/npm/flipr-etcd.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/flipr-etcd/)
[![Build Status](https://travis-ci.org/godaddy/node-flipr-etcd.svg)](https://travis-ci.org/godaddy/node-flipr-etcd)

**Stability: 1 - Experimental** 

This project is part of the [flipr family](https://github.com/godaddy/node-flipr).

node-flipr-etcd is a [flipr source](http://todoaddurl) for retrieving flipr configuration data from etcd, a distributed, consistent key-value store.

![node-flipr](/flipr.png?raw=true "node-flipr")

# How does it work?
The examples below are just showing you how to create the flipr etcd source.  A source by itself isn't very useful.  You'll still need to give the source to flipr, so that it can use it to do awesome things.  See the [flipr documentation](https://github.com/godaddy/node-flipr/blob/master/README.md) for more information on how to use a flipr source.

## Basic usage
This example shows you to how create a flipr-etcd source and give it to flipr.  This example assumes you have etcd running locally on the default port.
```javascript
var flipr = require('flipr');
var FliprEtcd = require('flipr-etcd');
var source = new FliprEtcd({
  directory: 'my-app-name',
  key: 'some-config'
});
flipr.init({
  source: source
});
```
Based on the options passed to flipr-etcd, you should be storing your application configuration under ~keys/flipr/my-app-name/some-config in etcd.

## Subscribing to important events
This example shows you the events you can subscribe to and what you might want to do when the events fire.

```javascript
var flipr = require('flipr');
var FliprEtcd = require('flipr-etcd');
var source = new FliprEtcd();
source.on(source.events.error, function(err1, err2){
  //log these errors!
});
source.on(source.events.beforeChange, function(){
  //your config is about to change!
  //log this event and do stuff
});
source.on(source.events.flush, function(){
  //the cached config has now been flushed, expect
  //the next call to getConfig to talk to etcd
});
source.on
flipr.init({
  source: source
});
```

# Methods

In most cases, you should not need to call flipr-etcd's methods directly, flipr takes care of that.  However, for testing, it can be useful to know the source's interface.

* `getConfig` - (cb) - Takes a callback that receives the config after it is read from etcd.  The first call to this method caches the config, which can be cleared by calling the `flush` method.
* `preload` - (cb) - Does the same thing as getConfig.  It's called preload to fulfill flipr's expectation of a preload method on sources, which caches all data that can be cached.
* `flush` - () - Flushes all cached values in flipr-etcd.  This is not guaranteed to be a synchronous action.  There is a chance you may still receive a cached config for a short time after flushing.
* `on` - (event, cb) - Flipr-etcd is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).  See the events section for a list of events to listen to.

# Events

Flipr-etcd is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).  Flipr-etcd emits the following events:

* `error`: Any time the flipr-etcd source encounters an error, it is emitted.  Sometimes there are multiple errors emitted at once (usually a descriptive error, followed by the originating error), so your callback should handle multiple arguments.
* `before-change`: This occurs when a change is detected in your source's etcd key.  It indicates the cache is about to be flushed and reloaded with the new config.
* `after-change`: This occurs after the `before-change`, when the old config has been flushed and the new config has been cached.  Any calls to getConfig after this event should receive the updated config.
* `flush`: This occurs when flush is called, either manually or due to a change event.

The `events` property on the source exposes an object with all the event names/keys.

# Options

* `host` - _optional_ - string - The etcd host.  Defaults to `"127.0.0.1"`.
* `port` - _optional_ - number - The etcd port.  Defaults to `4001`.
* `directory` - _recommended_ - string - The etcd directory which contains your config key.  Typically, this would be your application name.  Must be url-safe, stick to letters, numbers, and hyphens.  Defaults to `"default"`.
* `key` - _recommended_ - string - The etcd key that your flipr config will be published to.  You may want your key to indicate what environment your in if you share the same etcd cluster across multiple environments.  Or, if you have a unique etcd cluster per environment, you can just leave this as the default `"config"`.

# Integration Tests

node-flipr-etcd is equipped a set of integration tests that run the source against a live instance of Etcd.  To make them work, you need Vagrant and VirtualBox installed.  Running `npm run integration` will spin up a VM with Etcd installed, run some tests against that VM, and destroy the VM.
