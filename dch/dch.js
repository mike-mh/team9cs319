'use strict';

var database = require('./DB.js');
var mqttSubscriber = require('./mqtt-subscriber/mqtt-subscriber.js');

const express = require('express');
const app = express();
const router = express.Router();

const APP_PORT = 3000; 


//basic paths 
const NO_PATH = '/';
const API_BASE_PATH = '/api';
const PUBLIC_DIR = 'public';
//API paths
const DELETE_DATA_PATH = '/deleteData/:watchId';
const GET_WATCH_ID = '/getWatchID'
const TOTAL_CONNECTED_DEVICES = '/total_connected_devices';
const GET_DATA_PATH = '/get/:watchiId/:StartTime/:stopTime/:frequence';

//make the home directory to be public
app.use(express.static(PUBLIC_DIR));

//Decrypt the data here
router.use(function(req, res, next) {
    console.log('The data we get '+res);
    next(); // make sure we go to the next routes and don't stop here
});


router.delete(DELETE_DATA_PATH, function(req, res) {
	//putd data for deleting data for a watch id
    	req.json({watchID: req.params.watchId});
});

router.get(GET_DATA_PATH, function(req, res){
	try{
		var data = database.getData(req.params.watchId, req.params.StartTime, req.params.stopTime,req.params.frequence );
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
	console.log('Total watch clients: ' + systemListener.totalClients);
  	var totalClients = parseInt(systemListener.totalClients);
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