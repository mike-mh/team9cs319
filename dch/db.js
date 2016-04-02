'use strict'

var mongoose = require('mongoose'); //include mongose module

// TODO: set up a path for the test db
var MONGODB_URL = 'mongodb://localhost:27017/mqtt-data';
var IDLE_TIME_THRESHOLD = 300000;
var IDLE_ACC_THRESHOLD = 2;
var SPIKE_ACC_THRESHOLD = 20;

// Alert polling interval in milliseconds
var ALERT_POLLING_INTERVAL = 5000;

// This array will hold all alerts found to be broadcasted. Resets after each
// broadcast event through SSE
exports.alertsQueue = [];

// Segregates the data to be published for each unique connection
exports.alertMemoryPool = {};

/*
 * Use these objects to encapsulate data retrieved from watches. This data is
 * then broadcast through the SSE 
 */
// Acceleration events
exports.accelerationQueue = [];

// Segregates the data to be published for each unique connection
exports.accelerationChangeMemoryPool = {};

// Battery stream events
exports.batteryChanges = {};

// Alert events. Think about checking for alerts every 5 seconds or so. We'll
// need to adjust the polling rate to something the server can handle.
exports.alertStream = {};

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
  timestamp: Number,
  battery: Number,
  publish_rate: Number
});

var alertSchema = mongoose.Schema({
  timestamp: Number,
  watch_id: String,
  alert_type: String,
  alert_text: String
});


//create a model for the accelration data
var Data = mongoose.model('Data', dataSchema);

//create a model for the alert data
var AlertData = mongoose.model('AlertData', alertSchema);

exports.model = Data;
exports.alertModel = AlertData

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
      _id: 0,
      time: '$_id'
    }
  }, {
    $limit: 20
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
  }).select({_id: 0}).limit(20).exec(callback);
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
      gradient: {$avg: '$gradient'},
      battery: {$avg: '$battery'},
      publish_rate: {$avg: '$publish_rate'},
    }
  }, {
    $limit: 300,
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
  Data.find().sort({timestamp: -1}).select({_id: 0}).limit(100).exec(callback);
};

/**
 * @desc - Use this function to retrieve all alerts from Mongo.
 *
 * @param callback {function} - Function to execute after mongo process is
 *         complete.
 */
exports.getAlerts = function(callback) {
  AlertData.find({}, callback);
};


/**
 * @desc - This funtion will delete an alert from the alert collection.
 *
 * @param alertId {string} -    Id of the alert to be removed from MongoDB.
 * @param callback {function} - Function to execute after mongo process is
 *         complete
 */
exports.removeAlert = function(alertId, callback) {
  AlertData.remove({_id: alertId}, callback);
};

/**
 * @desc - Getter function for accelerationChanges. It will then reset the
 *         acceleration object because that data will have been broadcast
 *         already.
 *
 * @return {object} - The accelerationChanges object.
 */
exports.getAccelerationChanges = function() {
  return accelerationChanges;
};

/**
 * @desc -  Because acceleration changes will have already been broadcast,
 *          this function clears the data still remaining so that new data can
 *          be broadcast.
 */
exports.resetAccelerationChanges = function() {
  for(var watchId in exports.accelerationChanges) {
    var watch = exports.accelerationChanges[watchId];
    for(var data in watch) {
      watch[data] = [];
    }
  }
}

/**
 * @desc - Getter function for batteryChanges. 
 *
 * @return {object} - The batteryChanges object.
 */
exports.getBatteryChanges = function() {
  return batteryChanges;
};

/**
 * @desc -  Because changes changes will have already been broadcast, this
 *          function clears the data still remaining so that new data can
 *          be broadcast.
 */
exports.resetBatteryChanges = function() {
  for(var watchId in exports.batteryChanges) {
    var watch = exports.batteryChanges[watchId];
    for(var data in watch) {
      watch[data] = [];
    }
  }
}

/**
 * @desc - This funtion will analyze mongoDB for fall alerts and modifies the
 *         'exports.alertStream' object to include new events (if they occur).
 *         These alerts should then be stored in the database in the 'alerts'
 *         collection.
 */
function analyzeForFalls() {
  // TO-DO
};

/**
 * @desc - This funtion will analyze mongoDB for extended idleness and
 *         modifies the'exports.alertStream' object to include new events (if
 *         they occur). These alerts should then be stored in the database in
 *         the 'alerts' collection.
 */
function analyzeForIdleness() {
  // TO-DO
};

// After the implementation is completed, all you need to do is set an
// interval to the polling time specified and the polling will run forever

/*
setInterval(function() {
  analyzeForFalls();
  analyzeForIdleness();
}, ALERT_POLLING_INTERVAL);
*/

// These should have been saved in a different file but because we don't have
// time to re-work the architecture, they've been included here. These are
// threading modules and they will be responsible for copying all data
// retrieved for different events to be stored in memory pools segregated such
// that different SSE connection will have access to the same memory. This
// prevents race conditions from different SSE connection handlers trying to
// clear data before other handlers could broadcast their data.

/**
 * @desc - This function is responsible for pushing all data retrieved from
 *         acceleration events into the SSE shared memory pool.
 */
function pushAccelerationDataToMemoryPool() {
  var currentDataPoint = exports.accelerationQueue.pop();

  // If there is no data is in the queue, nothing to be done.
  if (currentDataPoint === undefined) {
    return;
  }

  for (var client in exports.accelerationChangeMemoryPool) {
    var currentClient = exports.accelerationChangeMemoryPool[client];
    var watchId = currentDataPoint.watch_id
    var currentClientWatch;

    // Sanity check
    if (watchId === undefined) {
      console.log("Could not queue. No watch ID.");
    }

    // Insert watch ID to object if it does not exist
    if (currentClient[watchId] === undefined) {
      currentClient[watchId] = {
        timestamp: [],
        acc_x: [],
        acc_y: [],
        acc_z: [],
        gradient: []
      };
    }

    currentClientWatch = currentClient[watchId]

    // Push all acceleration data
    for (var accelerationVector in currentClient[watchId]) {
      currentClient[watchId][accelerationVector]
        .push(currentDataPoint[accelerationVector]);
    }
  }
}

/**
 * @desc - This function is responsible for pushing all alerts pushed into the
 *         queue into the shared memory pool for SSE clients.
 */
function pushAlertDataToMemoryPool() {
  var currentAlert = exports.alertsQueue.shift();

  // If there is no data is in the queue, nothing to be done.
  if (currentAlert === undefined) {
    return;
  }

  // Push the alert to each client
  for (var client in exports.alertMemoryPool) {
    exports.alertMemoryPool[client].push(currentAlert);
  }
}

// Poll acceleration events and alerts
setInterval(pushAccelerationDataToMemoryPool, 500);
setInterval(pushAlertDataToMemoryPool, 500);
