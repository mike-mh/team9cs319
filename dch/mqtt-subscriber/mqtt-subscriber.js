'use strict';

// These are the modules imported from 'node_modules' directory. Couldn't get

//Database variables
var database = require('../db.js');
var accelrationData = database.model;

var DECIPHER  = require('./encryption.js'); 

// the Airbnb style of "import { express } from 'express';" working.
//MQTT constant
var mqtt = require('mqtt');

var MQTT_BROKER_URL = 'tcp://localhost:1883';
var MQTT_MESSAGE_EVENT = 'message';
var MQTT_CONNECT_EVENT = 'connect';

// Channels (Should change DCAPP channel)
var DCAPP_CHANNEL = '$SYS';
var SYS_CHANNEL = '$SYS/broker/clients/total';

// Console messages and errors
var DCAPP_CLIENT_INIT_MESSAGE = 'Listening for acceleration data';
var SYS_CLIENT_INIT_MESSAGE = 'Listening for total devices';

var WATCH_ID = 'watch_id';
var TIMESTAMP = 'timestamp';
var X_ACCELERATION = 'x_acc';
var Y_ACCELERATION = 'y_acc';
var Z_ACCELERATION = 'z_acc';

var dcappClient = mqtt.connect(MQTT_BROKER_URL);
var sysClient = mqtt.connect(MQTT_BROKER_URL);


// Initialize totalClients value
sysClient.totalClients = '0';

var checkFormat = function (stringData){
  console.log('Checking format of JSON data');
  try{
    var objectData = Object.keys(JSON.parse(stringData));
    if (objectData.length == 5 && 
      objectData.indexOf(WATCH_ID) != -1 &&
      objectData.indexOf(TIMESTAMP) != -1 && 
      objectData.indexOf(X_ACCELERATION) != -1 &&
      objectData.indexOf(Y_ACCELERATION) != -1 &&
      objectData.indexOf(Z_ACCELERATION) != -1) {
      return true; 
    }
  }catch(e){
    return false;
  }
  return false;
}

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
  console.log("MQTT message: "+message.toString());
  var decrypted = DECIPHER.decryptText(message.toString());

  if(checkFormat(decrypted)){
    let data = accelrationData(decrypted);
    accelrationData.save(message.toString(), function(err){
      if(err){
        console.log('There was an error inserting ' + data + ' into the database'); 
      }else{
        console.log('Data saved to database'); 
      }
      console.log(message.toString()+" saved to database");
    });
  }else{
    console.log('The format of the requested json was not correct');
  }
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
