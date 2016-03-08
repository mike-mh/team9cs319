'use strict';

// These are the modules imported from 'node_modules' directory. Couldn't get
// the Airbnb style of "import { express } from 'express';" working.
const MongoClient = require('mongodb').MongoClient;
let mqtt = require('mqtt');

// MQTT constants
const MQTT_BROKER_URL = 'tcp://localhost:1883';
const MQTT_MESSAGE_EVENT = 'message';
const MQTT_CONNECT_EVENT = 'connect';

// Channels (Should change DCAPP channel)
const DCAPP_CHANNEL = '$SYS';
const SYS_CHANNEL = '$SYS/broker/clients/total';

// Console messages and errors
const DCAPP_CLIENT_INIT_MESSAGE = 'Listening for acceleration data';
const SYS_CLIENT_INIT_MESSAGE = 'Listening for total devices';

// Database constants
const MONGODB_URL = 'mongodb://localhost:27017/mqtt-database';
const MQTT_COLLECTION = 'mqtt-data';
const WATCH_ID = 'watch_id';
const TIMESTAMP = 'timestamp';
const X_ACCELERATION = 'x_acc';
const Y_ACCELERATION = 'y_acc';
const Z_ACCELERATION = 'z_acc';
const GRADIENT

let dcappClient = mqtt.connect(MQTT_BROKER_URL);
let sysClient = mqtt.connect(MQTT_BROKER_URL);


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
      let messageString = message.toString();
      try {
        let messageJson = JSON.parse(messageString);
        let collection = db.collection(MQTT_COLLECTION);
        // TODO (Brenda):  
        // 1. add gradient on insert later
        // 2. have a table to record start time for device 
        // Both are for performance purposes
        let input = {
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
