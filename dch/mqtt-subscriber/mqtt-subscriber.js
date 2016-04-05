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
var BATTERY = 'battery';
var PUBLISH_RATE = 'publish_rate';
var X_ACCELERATION = 'acc_x';
var Y_ACCELERATION = 'acc_y';
var Z_ACCELERATION = 'acc_z';
var BATTERY = 'battery';
var PUBLISH_RATE = 'publish_rate';

var dcappClient = mqtt.connect(MQTT_BROKER_URL);
var sysClient = mqtt.connect(MQTT_BROKER_URL);

// All connected devices are stored here. After a timeout occurs and no ping
// is received, the device is considered 'disconnected'. If the UUID does not
// exist in this array, a connection alert is triggered. Each UUID maps to a
// setTimeout object which must be reset each time a ping is received.
var connectedDeviceMap = {};

var idleDeviceMap = {};

var batteryDeviceMap = {};

// Initialize totalClients value
sysClient.totalClients = '0';

var getDataObject = function (stringData){
  //console.log('Checking format of JSON data');
  try{
    var messageJson = JSON.parse(stringData);

      if (Object.keys(messageJson).length === 7 &&
      messageJson[WATCH_ID] &&
      messageJson[TIMESTAMP] &&
      messageJson[X_ACCELERATION] &&
      messageJson[Y_ACCELERATION] &&
      messageJson[Z_ACCELERATION] &&
      messageJson[BATTERY] &&
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

var createAlert = function (alert) {
  AlertData.create(alert, function(err, data) {
    if (err) {
      console.log('There was an error inserting ' + data + ' into the database');
    } else {
      console.log(data.toString() + ' saved to database');

      alert['mongo_id'] = data._id
      database.alertsQueue.push(alert);
    }
  });
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

    // Push data to the publication queue for realtime updates
    var accelerationDataToQueue = {
      watch_id: dataObj.watch_id,
      timestamp: dataObj.timestamp,
      acc_x: dataObj.acc_x,
      acc_y: dataObj.acc_y,
      acc_z: dataObj.acc_z,
      gradient: dataObj.gradient
    }

    database.accelerationQueue.push(accelerationDataToQueue);

    var watchId = dataObj.watch_id;

    // Generate spike alert if necessary
    if (dataObj.gradient > 20) {
      createAlert({
          timestamp: dataObj.timestamp,
          watch_id: watchId,
          alert_type: 'ACC_SPIKE',
          alert_text: 'Device has gradient = ' + dataObj.gradient + "."
      });
    }

    // Generate idle alert if necessary
    var idleInfo = idleDeviceMap[watchId];
    if (dataObj.gradient < 1) {
      if (idleInfo === undefined) {
        idleDeviceMap[watchId] = {begin: dataObj.timestamp, threshold: 5};
      } else if ((dataObj.timestamp - idleInfo.begin) > (idleInfo.threshold * 60000)) {
        idleDeviceMap[watchId].threshold += 5; // update threshold
        createAlert({
          timestamp: dataObj.timestamp,
          watch_id: watchId,
          alert_type: 'ACC_IDLE',
          alert_text: 'Device has been idle for more than ' +  idleInfo.threshold - 5 + ' minutes.'
        });
      }
    } else {
      idleDeviceMap[watchId] = undefined;
    }

    // Generate low battery alert if necessary
    var lastThreshold = batteryDeviceMap[watchId];
    if (!lastThreshold) {
      batteryDeviceMap[watchId] = 1;
    }
    if (dataObj.battery > 0.3) {
      batteryDeviceMap[watchId] = 1;
    } else if (lastThreshold >= 0.01 && dataObj.battery < 0.01) {
      batteryDeviceMap[watchId] = dataObj.battery;
      createAlert({
        timestamp: dataObj.timestamp,
        watch_id: watchId,
        alert_type: 'LOW_BATTERY',
        alert_text: 'Battery life is under 1%.'
      });
    } else if (lastThreshold >= 0.02 && dataObj.battery < 0.02) {
      batteryDeviceMap[watchId] = dataObj.battery;
      createAlert({
        timestamp: dataObj.timestamp,
        watch_id: watchId,
        alert_type: 'LOW_BATTERY',
        alert_text: 'Battery life is under 2%.'
      });
    } else if (lastThreshold >= 0.05 && dataObj.battery < 0.05) {
      batteryDeviceMap[watchId] = dataObj.battery;
      createAlert({
        timestamp: dataObj.timestamp,
        watch_id: watchId,
        alert_type: 'LOW_BATTERY',
        alert_text: 'Battery life is under 5%.'
      });
    } else if (lastThreshold >= 0.1 && dataObj.battery < 0.1) {
      batteryDeviceMap[watchId] = dataObj.battery;
      createAlert({
        timestamp: dataObj.timestamp,
        watch_id: watchId,
        alert_type: 'LOW_BATTERY',
        alert_text: 'Battery life is under 10%.'
      });
    }

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
      createAlert({
        timestamp: dataObj.timestamp,
        watch_id: watchId,
        alert_type: 'CONNECTION',
        alert_text: 'Device has connected to DCH.'
      });

      // Reset the timeout
      connectedDeviceMap[watchId] = setTimeout(generateDisconnectionAlert,
                                               CONNECTION_TIMEOUT,
                                               watchId);
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

  createAlert(disconnectionAlert);

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

