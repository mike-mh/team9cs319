var MONGOOSE = require('mongoose'); //include mongose moduel 
var SCHEMA = MONGOOSE.Schema;
// TODO: set up a path for the test db
var MONGODB_URL = 'mongodb://localhost:27017/acc_data';

MONGOOSE.connect(MONGODB_URL); 
//Sucessfully connected to the databse
MONGOOSE.connection.on('connected', function() {
  console.log('Connected to database');
});

//Failed the connection to the database
MONGOOSE.connection.on('err', function(err) {
  console.log('Unable to connect to the databse '+ err);
});

MONGOOSE.connection.on('disconnect', function(err) {
  console.log('The database has been disconnected');
});

var dataSchema = new SCHEMA({
  watch_id: String, 
  acc_x: Number, 
  acc_y: Number, 
  acc_z: Number, 
  timestamp: Number
});

//create a model for the accelration data
var Data = MONGOOSE.model('Data', dataSchema);
module.exports.model = Data;

module.exports.disconnect = function(){
  MONGOOSE.disconnect();
};

// callback takes in err, result as params
module.exports.getData = function(watchID, startTime, stopTime, freq, callback){
  Data.aggregate(
  { $match: { watch_id: watchID, timestamp: { $gt: startTime, $lt: stopTime}}},
  { $group: { 
    _id: { $substract: ['$timestamp', { $mod: ['$timestamp', freq]}]},
      acc_x: {$avg: '$acc_x'},
      acc_y: {$avg: '$acc_y'},
      acc_z: {$avg: '$acc_z'},
    }},
  { $project: { acc_z: 1, acc_y: 1, acc_z: 1, timestamp: '$_id'} },
  callback);
};

// The callback takes in an error parameter
module.exports.deleteData = function(watchId, callback){
  Data.remove({watch_id: watch_id}, callback);
};

// callback takes in err, result as params
module.exports.getWatchData = function(callback){
  Data.aggregate({ $group: { _id: '$watch_id', start: {$min: '$timestamp'}}}, callback);
};







