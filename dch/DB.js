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

const accelrationDataSchema = new Schema({
	watch_id: String, 
	acc_x: Number, 
	acc_y: Number, 
	acc_z: Number, 
	timestamp: Number
	});

module.exports.disconnect = function(){
		mongoose.disconnect();
};

module.exports.getData = function(watch_id, startTime, stopTime, freq){
//TODO: return string for gettingd data throw an error if there is a problem
	var returnData = JSON.stringify("{watchId: ['watchi1', 'watch id 2', 'watch id 3']}"); 
	console.log("DB.js: " + returnData);
	return returnData
};

module.exports.deleteData = function(watch_id){
	//TODO: throw an error if there is a problem deleting data otherwise return 1
};

module.exports.getWatchData = function(watch_id){
	//TODO: return json formated string with data otherwise throw an error
	return "{watch_id: }"
};

//create a model for the accelration data
var accelrationData = mongoose.model('AccelrationData', accelrationDataSchema);
module.exports.model = accelrationData;







