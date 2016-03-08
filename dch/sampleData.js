
'use strict'
//Import database stuff: connection, 
var required = require('./db.js');
var accelrationData = required.model;

for(var i = 0; i < 10; i++){

	for(var l = 0; l < 100; l++){
		var json_data = {
      watch_id: 'watch ' + i, 
      x_acc: (Math.random() * 100), 
      y_acc:(Math.random() * 100), 
			z_acc:(Math.random() * 100), 
			TIMESTAMP: randomDate(new Date(2012,1,1,0,0,0,0), new Date(2016,1,1,0,0,0,0))}; 

			var data = new accelrationData(json_data); 
			data.save(function(){
				console.log(JSON.stringify(json_data) + " added to database");
				if((i == 10) && (l == 100)){
					required.disconnect();
				}
			});			
	}
}
	

function randomDate(start, end) {
     var date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
     //console.log(date);
  	return date.getTime();
}
	

 