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
var DELETE_DATA_PATH = '/delete-data/:watchId';
var GET_WATCH_IDS = '/get-watch-ids'
var TOTAL_CONNECTED_DEVICES = '/total-connected-devices';
var GET_DATA_PATH = '/get-data/:watchId/:startTime/:stopTime/:frequency';

var TOTAL_NODEJS_MQTT_CLIENTS = 2;
//make the home directory to be public
app.use(express.static(PUBLIC_DIR));

//Decrypt the data here
router.use(function(req, res, next) {
  console.log('The data we get '+ res);
  next(); // make sure we go to the next routes and don't stop here
});

router.delete(DELETE_DATA_PATH, function(req, res) {
  //putd data for deleting data for a watch id
  database.deleteData(req.params.watchId, function(err){
    if (err) {
      res.json({success: false});
    } else {
      res.json({success: true});
    }
  });
});

router.get(GET_DATA_PATH, function(req, res){
  database.getData(req.params.watchId, req.params.startTime, 
    req.params.stopTime, req.params.frequency, function(err, result) {
      if (err) {
        //TODO: what should be the response in case of error
        res.json({success: false});
      } else {
        res.json(result);
      }
    });
});

router.get(GET_WATCH_IDS, function(req, res){
  database.getWatchData(function(err, result) {
    if (err) {
      //TODO: what should be the response in case of error
      res.json({success: false});
    } else {
      res.json(result);
    }
  });
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