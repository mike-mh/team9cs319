
"use strict"
//Import database stuff: connection, 
var required = require('./DB.js');
const accelrationData = required.model;

for(var i = 0; i < 10; i++){

	for(var l = 0; l < 100; l++){
			let x = {watchId: 'watch ' + i, X_ACCELERATION: (Math.random() * 100), Y_ACCELERATION:(Math.random() * 100), 
			Z_ACCELERATION:(Math.random() * 100), 
			TIMESTAMP: randomDate(new Date(2012,1,1,0,0,0,0), new Date(2016,1,1,0,0,0,0))}; 

			var data = new accelrationData(x); 
			data.save(function(){
				console.log(JSON.stringify(x) + " added to database");
				if((i == 10) && (l == 100)){
					required.disconnect();
				}
			});
			//x = JSON.stringify(x);
	}
}
	

function randomDate(start, end) {
     var date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
     //console.log(date);
  	return date.getTime();
}
	

 