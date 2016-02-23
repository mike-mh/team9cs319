'use strict';

// These are the modules imported from 'node_modules' directory. Couldn't get
// the Airbnb style of "import { express } from 'express';" working.
const express = require('express');
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
let mqttSubscriber = require('./mqtt-subscriber/mqtt-subscriber.js');
//const mqttSubscriber = require('./mqtt-subscriber.js');

// Port to run app
const PORT_APP = 3000;

// This is the path to the application index and static root directory 
const PUBLIC_DIRECTORY = 'public';

// API paths
const NO_PATH = '/';
const GET_DATA_PATH = '/get_data/';
const DELETE_DATA_PATH = '/delete_data/';
const TOTAL_CONNECTED_DEVICES_PATH = '/total_connected_devices/';

// URLs
const MONGODB_URL = 'mongodb://localhost:27017/mqtt-database';

// Mongoose events
const MONGOOSE_OPEN = 'open';

// Mongoose Schema data. Didn't finish reading up on the intricacies of
// Mongoose. This can be made more elaborate but it is enough to fetch all
// data required as a single JSON object.
const acccelerationCollectionDataTypes = {data: String};
const accelerationCollection = {collection: 'mqtt-data'};
const watchDataModelName = 'watchDataModel';

// Conosle messages and errors
const SERVER_INITIALIZED_MESSAGE = 'View page in browser at ' +
  '"http://localhost:3000"';
const DB_CONNECTION_ESTABLISHED_MESSAGE = 'Connection made with MongoDB';

const TOTAL_NODEJS_MQTT_CLIENTS = 2;

// Database schema and connection configurations
let watchDataSchema = mongoose.Schema(
  acccelerationCollectionDataTypes,
  accelerationCollection
);

let watchDataModel = mongoose.model(watchDataModelName, watchDataSchema);
let db = mongoose.connection;

let app = express();
let systemListener = mqttSubscriber.sysClient;

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
