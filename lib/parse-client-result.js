'use strict';

module.exports = parseClientResult;

function parseClientResult(err, lastValidConfig, result) {
  if(err) {
    if(lastValidConfig) 
      return {
        errors: [new Error('Error encounted while getting config from etcd.  Returned last valid config.'), err],
        config: lastValidConfig
      };
    return {
      errors: [new Error('Error encountered while getting config from etcd.  No valid config found, returned error'), err]
    };
  }
    
  var value = result && result.node && result.node.value;
  if(!value) {
    if(lastValidConfig) {
      return {
        errors: [new Error('Value not found in etcd results.  Returned last valid config.')],
        config: lastValidConfig
      };
    }
    return {
      errors: [new Error('Value not found in etcd results.  No valid config found, returned error.')]
    };
  }
    
  try {
    var deserializedValue = JSON.parse(value);
    lastValidConfig = deserializedValue;
    return {
      config: deserializedValue
    };
  } catch (e) {
    if(lastValidConfig) {
      return {
        errors: [new Error('Flipr could not parse value as JSON.  Returned last valid config.'), e],
        config: lastValidConfig
      };
    }
    return {
      errors: [new Error('Flipr could not parse value as JSON.  No valid config found, returned error.'), e]
    };
  }
}