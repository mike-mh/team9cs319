'use strict';

var db = require('./db.js');
var mqttSubscriber = require('./mqtt-subscriber/mqtt-subscriber.js');

var express = require('express');
var app = express();
var router = express.Router();

var APP_PORT = 3000;


//basic paths
var NO_PATH = '/';
var API_BASE_PATH = '/api';
var PUBLIC_DIR = 'public';

//API paths
var DELETE_DATA_PATH = '/delete-data/:watchId';
var GET_WATCH_IDS = '/get-watch-ids'
var TOTAL_CONNECTED_DEVICES = '/total-connected-devices';
var GET_DATA_PATH = '/get-data/:watchId/:startTime/:stopTime/:frequency';
var GET_IDLE_ALERT_PATH = '/get-idle-alert/:watchId/:startTime/:stopTime';
var GET_SPIKE_ALERT_PATH = '/get-spike-alert/:watchId/:startTime/:stopTime';
var GET_RECENT = '/get-recent';
var GET_ALERTS_PATH = '/get-alerts';
var DELETE_ALERT_PATH = '/delete-alert/:alertId';
var GET_ALL_BATTERY_DATA_PATH = '/get-battery-data/:watchId';

// These are SSE paths
var ACCELERATION_SSE = '/acceleration-sse';
var BATTERY_SSE = '/battery-sse';
var ALERT_SSE = '/alert-sse';

// SSE events
var ACCELERATION_EVENT = 'acceleration-event';
var BATTERY_EVENT = 'battery-event';
var ALERT_EVENT = 'alert-event';

// Use these to set interval for data broadcasts
var ACCELERATION_BROADCAST_DELAY = 1000;
var BATTERY_LIFE_BROADCAST_DELAY = 1000;
var ALERT_BROADCAST_DELAY = 1000;

var TOTAL_NODEJS_MQTT_CLIENTS = 2;

// Time before elements in the acceleration change object are cleared
var CLEAR_ACCELERATION_DATA_DELAY = 2000;

// Objects to hold data that has been published and is waiting to be published.

// This map contains the IP address of connected clients as an index and the
// acceleration data 
var accelerationUpdateIpMap = {};

// Use this to generate SSE IDs
var sseIdAccumulator = 1;

function standardCallback(res) {
  return function(err, result) {
    if (err) {
      //TODO: what should be the response in case of error
      res.json({success: false});
      console.log(err);
    } else {
      res.json(result);
    }
  };
}

//make the home directory to be public
app.use(express.static(PUBLIC_DIR));

//Decrypt the data here
router.use(function(req, res, next) {
  next(); // make sure we go to the next routes and don't stop here
});

router.delete(DELETE_DATA_PATH, function(req, res) {
  //putd data for deleting data for a watch id
  db.deleteData(req.params.watchId, function(err){
    if (err) {
      res.json({success: false});
      console.log(err);
    } else {
      res.json({success: true});
    }
  });
});

router.get(GET_DATA_PATH, function(req, res) {
  db.getData(req.params.watchId, parseInt(req.params.startTime),
    parseInt(req.params.stopTime), parseInt(req.params.frequency),
    standardCallback(res));
});

router.get(GET_IDLE_ALERT_PATH, function(req, res) {
  db.getIdleAlert(req.params.watchId, parseInt(req.params.startTime),
    parseInt(req.params.stopTime), standardCallback(res));
});

router.get(GET_SPIKE_ALERT_PATH, function(req, res) {
  db.getSpikeAlert(req.params.watchId, parseInt(req.params.startTime),
    parseInt(req.params.stopTime), standardCallback(res));
});

router.get(GET_WATCH_IDS, function(req, res) {
  db.getWatchData(standardCallback(res));
});

router.get(GET_RECENT, function(req, res) {
  db.getRecent(standardCallback(res));
});

router.get(TOTAL_CONNECTED_DEVICES, function(req, res){
  console.log('Total watch clients: ' + mqttSubscriber.sysClient.totalClients);
  var totalClients = parseInt(mqttSubscriber.sysClient.totalClients);
  var totalWatches = totalClients - TOTAL_NODEJS_MQTT_CLIENTS;
  console.log("The total watches are: "+totalWatches);
  return res.end(totalWatches.toString());
});

router.get(GET_ALERTS_PATH, function(req, res){
  db.getAlerts(standardCallback(res));
});

router.get(DELETE_ALERT_PATH, function(req, res){
  console.log('deleted alert');
  db.removeAlert(req.params.alertId, standardCallback(res));
});

router.get(GET_ALL_BATTERY_DATA_PATH, function(req, res){
  db.getAllBatteryData(req.params.watchId, standardCallback(res));
});

// SSE connections start here
router.get(ACCELERATION_SSE, function(req, res) {
  var broadcastInterval;
  var data;
  var accelerationDataPool;

  // Generate a unique ID for each SSE connection
  var sseId = sseIdAccumulator++;

  if (db.accelerationChangeMemoryPool[sseId] === undefined) {
    db.accelerationChangeMemoryPool[sseId] = {};
  }

  var accelerationDataPool = db.accelerationChangeMemoryPool[sseId];

  writeSSEHead(res, function() {
    broadcastInterval = setInterval(function() {
      try {
        data = JSON.stringify(accelerationDataPool);
        writeSSEData(res, ACCELERATION_EVENT, data);

        // Reset used data
        for (var watch in accelerationDataPool) {
          var currentWatch = accelerationDataPool[watch];
          for (var accelerationVector in currentWatch) {
            currentWatch[accelerationVector] = [];
          }
        }
      } catch (e) {
        console.log('Error parsing acceleration data to broadcast');
      }
    }, ACCELERATION_BROADCAST_DELAY);
  }); 

  // If the connection closes, be sure to unregister interval
  req.connection.addListener('close', function() {
    if(broadcastInterval !== undefined) {
      clearInterval(broadcastInterval);
    }
  });
});

// This is for battery updates (Do we want this?)
router.get(BATTERY_SSE, function(req, res) {
  // TO-DO: Implement when battery data is sent
});

// This broadcasts all alerts generated by server.
router.get(ALERT_SSE, function(req, res) {
  var broadcastInterval;
  var data;
  var alertDataPool;

  // Generate a unique ID for each SSE connection
  var sseId = sseIdAccumulator++;

  if (db.alertMemoryPool[sseId] === undefined) {
    db.alertMemoryPool[sseId] = [];
  }

  writeSSEHead(res, function() {
    broadcastInterval = setInterval(function() {
    alertDataPool = db.alertMemoryPool[sseId];

      try {
        data = JSON.stringify(alertDataPool);
        writeSSEData(res, ALERT_EVENT, data);
        // Alerts have been broadcasted. Clear data.
        db.alertMemoryPool[sseId] = [];
      } catch (e) {
        console.log("Error parsing acceleration data to broadcast");
      }
    }, ALERT_BROADCAST_DELAY);
  }); 

  // If the connection closes, be sure to unregister interval
  req.connection.addListener("close", function() {
    if (broadcastInterval !== undefined) {
      clearInterval(broadcastInterval);
    }
  });
});

/**
 * @desc - This function writes the header for the SSE event. This is
 *         important. When a connection is established, this header
 *         is what is responsible for keeping the connection alive in perpetuity.
 *
 * @param broadcast {object} - The broadcast to have data fetched from MongoDB
 *         inserted into (the same thing as 'response').
 *
 * @param callback {function} - function to be executed after header is set.
 */
function writeSSEHead(broadcast, callback) {
  // Set the header so that connection is not closed and data can be received
  // forever (or until the conneciton is closed)
  broadcast.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  callback();
}

/**
 * @desc - This funciton will be used to write data received from the db.js
 *         file during polling intervals to be packaged into the proper SSE
 *         format so that it can be sent to and then read by the client. 
 *
 * @param broadcast {object} - The broadcast to have data fetched from MongoDB
 *         inserted into (the same thing as 'response').
 *
 * @param event {string} - The type of event to broadcast, e.g. 'acceleration'
 *
 * @param data {string} - The data to send (should be a stringified JSON).
 */
function writeSSEData(broadcast, event, data) {
  broadcast.write("retry: 10000\n");
  broadcast.write("event: " + event + "\n");

  // Two new lines needed to signal end of message
  broadcast.write("data: " + data + "\n\n");
};

/**
 * @desc - Helper function to averate acceleration data before it is broadcast
 *
 * @param data {object} - Data mqtt-subscriber sent to broadcast
 */
function averageAccelerationData(data) {
  for(var watch in data) {
    
  }
  return data;
}

app.use(API_BASE_PATH, router);
app.use('*', function(req, res){
  res.sendStatus(404);
});

app.listen(APP_PORT, function(){
  console.log("The app is now listeing on port 3000");
});

