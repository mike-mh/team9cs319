// These are the modules imported from 'node_modules' directory
// This is the 'express' module for routing
var express = require('express');
var app = express();

// This is the path to the application index and static root directory 
var ROOT_DIRECTORY = './public';
var ANGULAR_INDEX_FILE = 'index.html';

// Tells the app to serve all files in the 'public' directory
app.use(express.static('public'));
app.get('/', function (req, res) {
  res.sendfile('Hello World!');
});

app.listen(3000, function () {
  console.log('View page in browser at "http://localhost:3000"');
});
