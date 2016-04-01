'use strict';

// These are the modules imported from 'node_modules' directory. Couldn't get

//Database variables
var database = require('../db.js');
var Data = database.model;

var decipher  = require('./encryption.js');

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
var BATTERY_LIFE = 'battery_life';
var PUBLISH_RATE = 'publish_rate';
var X_ACCELERATION = 'acc_x';
var Y_ACCELERATION = 'acc_y';
var Z_ACCELERATION = 'acc_z';

var dcappClient = mqtt.connect(MQTT_BROKER_URL);
var sysClient = mqtt.connect(MQTT_BROKER_URL);


// Initialize totalClients value
sysClient.totalClients = '0';

var getDataObject = function (stringData){
  console.log('Checking format of JSON data');
  try{
    var messageJson = JSON.parse(stringData);
    
    if (
      Object.keys(messageJson).length === 7 &&
      messageJson[WATCH_ID] &&
      messageJson[TIMESTAMP] &&
      messageJson[X_ACCELERATION] &&
      messageJson[Y_ACCELERATION] &&
      messageJson[Z_ACCELERATION] &&
      messageJson[BATTERY_LIFE] &&
      messageJson[PUBLISH_RATE]) {
      console.log('The data is correct');
      return messageJson;
    }
  }catch(e){
    console.log('The data is not correct');
    return null;
  }
}

// TODO: this is duplicated in mqtt-subscriber maybe put this into db.js
// to avoid duplication
// get the magnitude of the vector <x,y,z>
var getGradient = function (x, y, z) {
  return Math.sqrt(x*x + y*y + z*z);
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
  var decrypted = decipher.decryptText(message);
  console.log("Decrytped data: "+decrypted);
  var dataObj = getDataObject(decrypted);
  if (dataObj){
    // TODO should consider bulk insert
    // TODO add gradient field
    dataObj.gradient = getGradient(dataObj.acc_x, dataObj.acc_y, dataObj.acc_z);
    Data.create(dataObj, function(err, data){
      // TODO we might want to delete the log or log only in debug mode
      if (err) {
        console.log('There was an error inserting ' + data + ' into the database');
      } else {
        console.log(data.toString() + ' saved to database');
      }
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
