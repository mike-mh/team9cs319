'use strict';

// These are the modules imported from 'node_modules' directory. Couldn't get
// the Airbnb style of "import { express } from 'express';" working.
var express = require('express');
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var mqttSubscriber = require('./mqtt-subscriber/mqtt-subscriber.js');

// Port to run app
var PORT_APP = 3000;

// This is the path to the application index and static root directory 
var PUBLIC_DIRECTORY = 'public';

// API paths
var NO_PATH = '/';
var GET_DATA_PATH = '/get_data/';
var DELETE_DATA_PATH = '/delete_data/';
var TOTAL_CONNECTED_DEVICES_PATH = '/total_connected_devices/';

// URLs
var MONGODB_URL = 'mongodb://localhost:27017/mqtt-database';

// Mongoose events
var MONGOOSE_OPEN = 'open';

// Mongoose Schema data. Didn't finish reading up on the intricacies of
// Mongoose. This can be made more elaborate but it is enough to fetch all
// data required as a single JSON object.
var acccelerationCollectionDataTypes = {data: String};
var accelerationCollection = {collection: 'mqtt-data'};
var watchDataModelName = 'watchDataModel';

// Conosle messages and errors
var SERVER_INITIALIZED_MESSAGE = 'View page in browser at ' +
  '"http://localhost:3000"';
var DB_CONNECTION_ESTABLISHED_MESSAGE = 'Connection made with MongoDB';

var TOTAL_NODEJS_MQTT_CLIENTS = 2;

// Database schema and connection configurations
var watchDataSchema = mongoose.Schema(
  acccelerationCollectionDataTypes,
  accelerationCollection
);

var watchDataModel = mongoose.model(watchDataModelName, watchDataSchema);
var db = mongoose.connection;

var app = express();
var systemListener = mqttSubscriber.sysClient;

// Connect Mongoose to the database
mongoose.connect(MONGODB_URL);

db.once(MONGOOSE_OPEN, function() {
  console.log(DB_CONNECTION_ESTABLISHED_MESSAGE);
});

// Tells the app to serve DCGUI files in the 'public' directory
app.use(express.static(PUBLIC_DIRECTORY));
app.get(NO_PATH, function (request, res) {
  res.sendfile();
});

// API functions
app.get(GET_DATA_PATH, function (request, res) {
  watchDataModel.find(function (err, data) {
      return res.end(JSON.stringify(data));
    });
});

app.get(TOTAL_CONNECTED_DEVICES_PATH, function (request, res) {
  // Message for debugging
  console.log('Total watch clients: ' + systemListener.totalClients);
  var totalClients = parseInt(systemListener.totalClients);
  var totalWatches = totalClients - TOTAL_NODEJS_MQTT_CLIENTS;
  return res.end(totalWatches.toString());
});

// Start the application
app.listen(PORT_APP, function () {
  console.log(SERVER_INITIALIZED_MESSAGE);
});
