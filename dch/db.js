var MONGOOSE = require('mongoose'); //include mongose moduel 
var SCHEMA = MONGOOSE.Schema;
// TODO: set up a path for the test db
var MONGODB_URL = 'mongodb://localhost:27017/accelration_user_data';

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

var accelrationDataSCHEMA = new SCHEMA({
  watch_id: String, 
  acc_x: Number, 
  acc_y: Number, 
  acc_z: Number, 
  timestamp: Number
});

module.exports.disconnect = function(){
  MONGOOSE.disconnect();
};

module.exports.getData = function(watchID, startTime, stopTime, freq){
  //TODO: return string for gettingd data throw an error if there is a problem
  var returnData = JSON.stringify({'watchId': ['watchi1', 'watch id 2', 'watch id 3']}); 
  console.log("DB.js: " + returnData);
  console.log("WatchID: "+watchID + "; StartTime "+ startTime + " StopTime" + stopTime + " Freq:"+ freq);
  return returnData
};

module.exports.deleteData = function(watchId){
  //TODO: throw an error if there is a problem deleting data otherwise return 1
};

module.exports.getWatchData = function(watchId){
  //TODO: return json formated string with data otherwise throw an error
  return "{watch_id: }"
};

//create a model for the accelration data
var accelrationData = MONGOOSE.model('AccelrationData', accelrationDataSCHEMA);
module.exports.model = accelrationData;







