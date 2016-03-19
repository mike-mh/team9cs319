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
var ALERT_BROADCAST_DELAY = 5000;

var TOTAL_NODEJS_MQTT_CLIENTS = 2;

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
  return res.end(totalWatches.toString());
});

// SSE connections start here
router.get(ACCELERATION_SSE, function(req, res) {
  var broadcastInterval;
  var data;

  req.socket.setTimeout(999999999999);

  console.log('broadcasting');

  writeSSEHead(res, function() {
    broadcastInterval = setInterval(function() {
      try {
        console.log('broadcasting');
        data = JSON.stringify(db.accelerationChanges);
        console.log(data);
        writeSSEData(res, ACCELERATION_EVENT, data);

        // Average all the data before broadcasting
      } catch (e) {
        console.log("Error parsing acceleration data to broadcast");
      }
    }, ACCELERATION_BROADCAST_DELAY);
  }); 

  // If the connection closes, be sure to unregister interval
  req.connection.addListener("close", function() {
    clearInterval(broadcastInterval);
  });
});

router.get(BATTERY_SSE, function(req, res) {
  // TO-DO: Implement when battery data is sent
});

router.get(ALERT_SSE, function(req, res) {
  // TO-DO: Implement when data analysis is completed
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

  // After data is broadcast, remove it.
  db.resetAccelerationChanges();
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
