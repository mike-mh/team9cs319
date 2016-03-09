'use strict'

var mongoose = require('mongoose'); //include mongose module
// TODO: set up a path for the test db
var MONGODB_URL = 'mongodb://localhost:27017/mqtt-data';
var IDLE_TIME_THRESHOLD = 300000;
var IDLE_ACC_THRESHOLD = 2;
var SPIKE_ACC_THRESHOLD = 20;

mongoose.connect(MONGODB_URL);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open to ' + MONGODB_URL);
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

var dataSchema = mongoose.Schema({
  watch_id: String,
  acc_x: Number,
  acc_y: Number,
  acc_z: Number,
  gradient: Number,
  timestamp: Number
});

//create a model for the accelration data
var Data = mongoose.model('Data', dataSchema);
exports.model = Data;

exports.disconnect = function(){
  mongoose.disconnect();
};

// bulkInsert an array of data points (no validation checks)
exports.bulkInsert = function(arr, callback) {
  Data.collection.insert(arr, callback);
};

// callback takes in err, result as params
exports.getIdleAlert = function(watchID, startTime, stopTime, callback) {
  Data.aggregate({
    $match: {
      watch_id: watchID,
      timestamp: {
        $gt: startTime,
        $lt: stopTime
      }
    }
  }, {
    $group: {
      _id: {$subtract: ['$timestamp', { $mod: ['$timestamp', IDLE_TIME_THRESHOLD]}]},
      high: {$max: '$gradient'},
    }
  }, {
    $match: {
      high: {$lt: IDLE_ACC_THRESHOLD}
    }
  }, {
    $project: {
      time: '$_id'
    }
  }, callback);
};

// callback takes in err, result as params
exports.getSpikeAlert = function(watchID, startTime, stopTime, callback) {
  Data.find({
    watch_id: watchID,
    timestamp: {
      $gt: startTime,
      $lt: stopTime
    },
    gradient: {
      $gt: SPIKE_ACC_THRESHOLD
    }
  }, callback);
};

// callback takes in err, result as params
exports.getData = function(watchID, startTime, stopTime, freq, callback) {
  Data.aggregate({
    $match: {
      watch_id: watchID,
      timestamp: {
        $gt: startTime,
        $lt: stopTime
      }
    }
  }, {
    $group: {
      _id: {$subtract: ['$timestamp', { $mod: ['$timestamp', freq]}]},
      acc_x: {$avg: '$acc_x'},
      acc_y: {$avg: '$acc_y'},
      acc_z: {$avg: '$acc_z'},
      gradient: {$avg: '$gradient'}
    }
  }, callback);
};

// The callback takes in an error parameter
exports.deleteData = function(watchId, callback){
  Data.remove({watch_id: watch_id}, callback);
};

// callback takes in err, result as params
exports.getWatchData = function(callback){
  Data.aggregate({
    $group: {
      _id: '$watch_id',
      start: {$min: '$timestamp'},
      end: {$max: '$timestamp'}
    }
  }, callback);
};

// callback takes in err, result as params
exports.getRecent = function(callback){
  Data.find().sort({timestamp: -1}).limit(100).exec(callback);
};
