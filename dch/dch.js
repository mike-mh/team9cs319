'use strict';

var database = require('./db.js');
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
var DELETE_DATA_PATH = '/deleteData/:watchId';
var GET_WATCH_ID = '/getWatchID/:watchID'
var TOTAL_CONNECTED_DEVICES = '/total_connected_devices';
var GET_DATA_PATH = '/getData/:watchId/:StartTime/:stopTime/:frequency';

var TOTAL_NODEJS_MQTT_CLIENTS = 2;
//make the home directory to be public
app.use(express.static(PUBLIC_DIR));

//Decrypt the data here
router.use(function(req, res, next) {
  console.log('The data we get '+res);
  next(); // make sure we go to the next routes and don't stop here
});

router.delete(DELETE_DATA_PATH, function(req, res) {
	//putd data for deleting data for a watch id
  res.json({watchID: req.params.watchId});
});

router.get(GET_DATA_PATH, function(req, res){
  try{
     var data = database.getData(req.params.watchId, req.params.StartTime, req.params.stopTime, req.params.frequency);
	 res.json(data);
	}catch(e){
	 console.log('There was an error getting data from database: ' + e);
	}
});

router.get(GET_WATCH_ID, function(req, res){
  console.log('At get watch id');
  //database.getData(watch_id, startTime, stopTime, freq);
});

router.get(TOTAL_CONNECTED_DEVICES, function(req, res){
  console.log('Total watch clients: ' + mqttSubscriber.sysClient.totalClients);
  var totalClients = parseInt(mqttSubscriber.sysClient.totalClients);
  var totalWatches = totalClients - TOTAL_NODEJS_MQTT_CLIENTS;
  return res.end(totalWatches.toString());
});


app.use(API_BASE_PATH, router);
app.use('*', function(req, res){
	res.sendStatus(404);
});
app.listen(APP_PORT, function(){
	console.log("The app is now listeing on port 3000");
});