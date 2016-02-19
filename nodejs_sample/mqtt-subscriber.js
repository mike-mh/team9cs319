var MongoClient = require('mongodb').MongoClient;
var mqtt = require('mqtt');

var MQTT_BROKER_URL = 'tcp://localhost:1883';
var client = mqtt.connect(MQTT_BROKER_URL);

client.on('connect', function () {
  client.subscribe('$SYS');
  client.publish('$SYS', 'MQTT Connection established');
});
 
client.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString());
  // Connect to the db
  MongoClient.connect(
    "mongodb://localhost:27017/test",
    function(err, db) {
      if(err) { return console.dir(err); }
      console.log('Scar tissue');
      var collection = db.collection('mqttData');
      var doc1 = {'data':message.toString()};
      collection.insert(doc1);
  });

});

exports.mqttClient = client;
