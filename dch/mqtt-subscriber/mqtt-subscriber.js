'use strict';

// These are the modules imported from 'node_modules' directory. Couldn't get
// the Airbnb style of "import { express } from 'express';" working.
var MongoClient = require('mongodb').MongoClient;
var mqtt = require('mqtt');

// MQTT constants
var MQTT_BROKER_URL = 'tcp://localhost:1883';
var MQTT_MESSAGE_EVENT = 'message';
var MQTT_CONNECT_EVENT = 'connect';

// Channels (Should change DCAPP channel)
var DCAPP_CHANNEL = '$SYS';
var SYS_CHANNEL = '$SYS/broker/clients/total';

// Console messages and errors
var DCAPP_CLIENT_INIT_MESSAGE = 'Listening for acceleration data';
var SYS_CLIENT_INIT_MESSAGE = 'Listening for total devices';

// Database constants
var MONGODB_URL = 'mongodb://localhost:27017/mqtt-database';
var MQTT_COLLECTION = 'mqtt-data';
var WATCH_ID = 'watch_id';
var TIMESTAMP = 'timestamp';
var X_ACCELERATION = 'x_acc';
var Y_ACCELERATION = 'y_acc';
var Z_ACCELERATION = 'z_acc';

var dcappClient = mqtt.connect(MQTT_BROKER_URL);
var sysClient = mqtt.connect(MQTT_BROKER_URL);


// Initialize totalClients value
sysClient.totalClients = '0';


// Signal dcappClient is listening for watch data
dcappClient.on(MQTT_CONNECT_EVENT, function () {
  dcappClient.subscribe(DCAPP_CHANNEL);
  dcappClient.publish(DCAPP_CHANNEL, DCAPP_CLIENT_INIT_MESSAGE);
});


// Signal sysClient is listening for MQTT totals
sysClient.on(MQTT_CONNECT_EVENT, function () {
  sysClient.subscribe(SYS_CHANNEL);
  
  // Lazy code. Decided to post message through DCAPP channel
  sysClient.publish(DCAPP_CHANNEL, SYS_CLIENT_INIT_MESSAGE);

});


// Acceleration data is received here and is plaved into MongoDB
dcappClient.on(MQTT_MESSAGE_EVENT, function (topic, message) {
  // Print for debugging 
  console.log(message.toString());
  // Connect to the db and insert received data
  MongoClient.connect(
    MONGODB_URL,
    function(err, db) {
      if(err) { return console.dir(err); }
      var messageString = message.toString();
      try {
        var messageJson = JSON.parse(messageString);
        var collection = db.collection(MQTT_COLLECTION);
        var input = {
          WATCH_ID: messageJson.watch_id,
          TIMESTAMP: messageJson.timestamp,
          X_ACCELERATION: messageJson.acc_x,
          Y_ACCELERATION: messageJson.acc_y,
          Z_ACCELERATION: messageJson.acc_z
        };
        collection.insert(input);
      } catch (exception) {
        console.log('Insert exception: ' + exception);
      }
  });
});


// Update sysClient.totalClients when connected device total changes
sysClient.on(MQTT_MESSAGE_EVENT, function (topic, message) {
  // message is Buffer 
  sysClient.totalClients = message.toString();
  // (use for debugging)
  console.log(sysClient.totalClients);
});


// Export sysClient to DCH.js to have access to total conencted devices
exports.sysClient = sysClient;

// Export dcappClient to use for testing
exports.dcappClient = dcappClient;
