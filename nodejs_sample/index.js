// These are the modules imported from 'node_modules' directory
// This is the 'express' module for routing
var express = require('express');
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var app = express();

mongoose.connect('mongodb://localhost:27017/test');
var mqttSubscriber = require('./mqtt-subscriber');

// This is the path to the application index and static root directory 
var ROOT_DIRECTORY = './public';
var ANGULAR_INDEX_FILE = 'index.html';

var testSchema = mongoose.Schema({data: String},
  {collection: 'mqttData'});

var testModel = mongoose.model('testModel', testSchema);
var db = mongoose.connection;
db.once('open', function() {
  console.log('Mongoose has connected');
});

// Tells the app to serve all files in the 'public' directory
app.use(express.static('public'));
app.get('/', function (req, res) {
  res.sendfile('Hello World!');
});

app.get('/db_test/', function (req, res) {
  console.log(req.query);
  testModel.find(function (err, data) {
      return res.end(JSON.stringify(data));
    });
});


app.listen(3000, function () {
  console.log('View page in browser at "http://localhost:3000"');
});
