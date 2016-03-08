const mongoose = require('mongoose'); //include mongose moduel 
const Schema = mongoose.Schema;
const mongoDB_url = 'mongodb://localhost:27017/accelration_user_data';

mongoose.connect(mongoDB_url); 
//Sucessfully connected to the databse
mongoose.connection.on('connected', function() {
	console.log('Connected to database');
});

//Failed the connection to the database
mongoose.connection.on('err', function(err) {
	console.log('Unable to connect to the databse '+ err);

});

mongoose.connection.on('disconnect', function(err) {
	console.log('The database has been disconnected');
});

// TODO (Brenda):  
// 1. add gradient on insert later
// 2. have a table to record start time for device 
// Both are for performance purposes

const accelrationDataSchema = new Schema({
	watch_id: String, 
	acc_x: Number, 
	acc_y: Number, 
	acc_z: Number, 
	timestamp: Number
	});

//create a model for the accelration data
var Data = mongoose.model('mqtt-data', accelrationDataSchema);
module.exports.model = accelrationData;

module.exports.disconnect = function(){
	mongoose.disconnect();
};

module.exports.getData = function(watch_id, startTime, stopTime, freq, callback){
	Data.aggregate(
		{ $match: { watch_id: watch_id, timestamp: { $gt: startTime, $lt: stopTime}}},
		{ $group: { 
			_id: { $substract: ['$timestamp', { $mod: ['$timestamp', freq]}]},
		    acc_x: {$avg: '$acc_x'},
		    acc_y: {$avg: '$acc_y'},
		    acc_z: {$avg: '$acc_z'},
			}},
		{ $project: { acc_z: 1, acc_y: 1, acc_z: 1, timestamp: '$_id'} },
		callback);
};

// The callback takes in a parameter that indicates error
module.exports.deleteData = function(watch_id, callback){
	Data.remove({watch_id: watch_id}, callback);
};

module.exports.getWatchData = function(watch_id, callback){
	Data.aggregate(
		{ $group: { _id: '$watch_id', start: {$min: '$timestamp'}}},
		callback);
};







