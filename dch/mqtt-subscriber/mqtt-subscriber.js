'use strict';

// These are the modules imported from 'node_modules' directory. Couldn't get

//Database variables
var database = require('../db.js');
var Data = database.model;
var AlertData = database.alertModel;

var decipher = require('./encryption.js');

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

// Timeout for a device to be considered 'disconnected'
var CONNECTION_TIMEOUT = 5000;

var WATCH_ID = 'watch_id';
var TIMESTAMP = 'timestamp';
var X_ACCELERATION = 'acc_x';
var Y_ACCELERATION = 'acc_y';
var Z_ACCELERATION = 'acc_z';

var dcappClient = mqtt.connect(MQTT_BROKER_URL);
var sysClient = mqtt.connect(MQTT_BROKER_URL);

// All connected devices are stored here. After a timeout occurs and no ping
// is received, the device is considered 'disconnected'. If the UUID does not
// exist in this array, a connection alert is triggered. Each UUID maps to a
// setTimeout object which must be reset each time a ping is received.
var connectedDeviceMap = {
}


// Initialize totalClients value
sysClient.totalClients = '0';

var getDataObject = function (stringData){
  //console.log('Checking format of JSON data');
  try{
    var messageJson = JSON.parse(stringData);
    
    if (
      Object.keys(messageJson).length === 5 &&
      messageJson[WATCH_ID] &&
      messageJson[TIMESTAMP] &&
      messageJson[X_ACCELERATION] &&
      messageJson[Y_ACCELERATION] &&
      messageJson[Z_ACCELERATION]) {
      //console.log('The data is correct');
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
//  console.log("MQTT message: "+message.toString());
  var decrypted = decipher.decryptText(message);
//  console.log("Decrytped data: "+decrypted);
  var dataObj = getDataObject(decrypted);
  if (dataObj){
    // TODO should consider bulk insert
    // TODO add gradient field
    dataObj.gradient = getGradient(dataObj.acc_x, dataObj.acc_y, dataObj.acc_z);
    Data.create(dataObj, function(err, data){
      // TODO we might want to delete the log or log only in debug mode
      if (err) {
      //  console.log('There was an error inserting ' + data + ' into the database');
      } else {
     //   console.log(data.toString() + ' saved to database');
      }
    });

    // Modify the accelerationChange object with new data.
    var watchId = dataObj.watch_id;

    // Initialize the acceleration object if it has not yet been set.
    if(database.accelerationChanges[watchId] === undefined) {
      database.accelerationChanges[watchId] = {
        acc_x: [],
        acc_y: [],
        acc_z: [],
        gradient: [],
        timestamp: [],
      }
    }

    database.accelerationChanges[watchId].acc_x.push(dataObj.acc_x);
    database.accelerationChanges[watchId].acc_y.push(dataObj.acc_y);
    database.accelerationChanges[watchId].acc_z.push(dataObj.acc_z);
    database.accelerationChanges[watchId].gradient.push(dataObj.gradient);
    database.accelerationChanges[watchId].timestamp.push(dataObj.timestamp);

    // Reset timeout delay if it is in the connectedDevicesMap. Otherwise,
    // append an alert that a new device has connected and insert it into the
    // database
    if (connectedDeviceMap[watchId] !== undefined) {
      console.log(connectedDeviceMap[watchId].toString());
      var timeout = connectedDeviceMap[watchId];
      clearTimeout(timeout);
      connectedDeviceMap[watchId] = setTimeout(generateDisconnectionAlert,
                                               CONNECTION_TIMEOUT,
                                               watchId);
    } else {

      var connectionAlert =
        {
          timestamp: dataObj.timestamp,
          watch_id: watchId,
          alert_type: 'CONNECTION',
          alert_text: 'Device has connected to DCH.'
        };

      AlertData.create(connectionAlert, function(err, data) {
        if (err) {
          console.log('There was an error inserting ' + data + ' into the database');
        } else {
          console.log(data.toString() + ' saved to database');
        }
      });

      // Reset the timeout
      connectedDeviceMap[watchId] = setTimeout(generateDisconnectionAlert,
                                               CONNECTION_TIMEOUT,
                                               watchId);

      // This is a big architectural faux pas. If we have time, should fix this
      database.alerts.push(connectionAlert);
    }

  } else {
    console.log('The format of the requested json was not correct');
  }
});

/**
 * @desc - This function generates a 'disconnection' alert for a watch after
 *         its connection timeout and removes it from the connectedDeviceMap
 *
 * @param uuid {string} - The UUID of the disconnected watch
 */
function generateDisconnectionAlert(uuid) {
  var currentDate = new Date();
  var dateInMilliseconds = currentDate.getTime();

  var disconnectionAlert =
    {
      timestamp: dateInMilliseconds,
      watch_id: uuid,
      alert_type: 'CONNECTION',
      alert_text: 'Device has disconnected from DCH.'
    };

  AlertData.create(disconnectionAlert, function(err, data) {
    if (err) {
      console.log('There was an error inserting ' + data + ' into the database');
    } else {
      console.log(data.toString() + ' saved to database');
    }
  });

  // This is a big architectural faux pas. If we have time, we should fix this
  database.alerts.push(disconnectionAlert);

  // Remove the uuid timer from connected devices
  connectedDeviceMap[uuid] = undefined;
}

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

