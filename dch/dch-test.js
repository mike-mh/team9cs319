'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should(); 
var expect = chai.expect;
var request = require('supertest');
var test_data = require('./sample-data.js');
chai.use(chaiHttp);

var database;
var DbConnection; 
var data = [];
var BASE_URL  = "http://localhost:3000/api";
var mqtt = require('mqtt');
var TEST_WATCH = ['Watch 1', 'Watch 2', 'Watch 3','Watch 4', 'Watch 5', 'Watch 6','Watch 7', 'Watch 8', 'Watch 9', 'Watch 10'];

/**

 * Test for the Express API
 *
 * TO-DO: Write functions to insert data into MongoDB
 */


  //API paths
var DELETE_DATA_PATH = '/delete-data/';
var GET_WATCH_IDS = '/get-watch-ids/'
var TOTAL_CONNECTED_DEVICES = '/total-connected-devices';
var GET_DATA_PATH = '/get-data/';
var GET_IDLE_ALERT_PATH = '/get-idle-alert/:watchId/:startTime/:stopTime';
var GET_SPIKE_ALERT_PATH = '/get-spike-alert/:watchId/:startTime/:stopTime';
var GET_RECENT = '/get-recent';
var START_DATE = new Date(2016,1,1,0,0,0,0);
var END_DATE = new Date(2016,1,1,1,0,0,0);  


var MQTT_BROKER_URL = 'tcp://localhost:1883';
var dcappClient = mqtt.connect(MQTT_BROKER_URL);
var sysClient = mqtt.connect(MQTT_BROKER_URL);

var MQTT_CONNECT_EVENT = 'connect';
var DCAPP_CHANNEL = '$SYS';
 
describe('DCH API', function(){
      this.timeout(15000);
      //before anything save random data in database 
      before(function(done){
       console.log('Setting up data');
       database = require('./db.js');
       DbConnection = database.DbConnection;
       DbConnection.on('connected', function(){ 
        /*
        add 2 mqtt clients here
        */
       done();   
      });
     
           for(var i = 0; i < TEST_WATCH.length; i++){
            data = data.concat(test_data.genIncreasing(TEST_WATCH[i] , START_DATE.getTime(), END_DATE.getTime() , 2000, 9));
         }
        dcappClient.on(MQTT_CONNECT_EVENT, function () {
          console.log('We are subscribing');
          dcappClient.subscribe(DCAPP_CHANNEL);
          sysClient.publish(DCAPP_CHANNEL, "HELLLOO");
      });
        sysClient.on(MQTT_CONNECT_EVENT, function () {
          console.log('We are subscribing');
          dcappClient.subscribe(DCAPP_CHANNEL);
          sysClient.publish(DCAPP_CHANNEL, "HELLLOO");
      });        
});




    it('Put sample data into database', function(done){
      database.bulkInsert(data, function(err, data){
        if(err){
           should.fail('Could not insert data into data base');
        }else{
            console.log('Inserted Watch data into database');
            done();
        }
      });
    });

    it('Test get watchId api', function(done){
      chai.request(BASE_URL)
      .get("/get-watch-ids")
      .end(function(err,res){
        res.should.be.json; 
        res.body.should.be.a('array');
        res.body.length.should.equal(10);
        done();
      });
    });

    it('Get the total connected devices', function(done){
      chai.request(BASE_URL)
      .get(TOTAL_CONNECTED_DEVICES)
      .end(function(err,res){
        console.log('There are a total of: '+JSON.stringify(res.body));
        res.should.be.json; 
        res.body.should.be.a('array');
        done();
      });      
    });


    it('Testing api to get data of a watch', function(done){
        chai.request(BASE_URL)
        .get(GET_DATA_PATH+TEST_WATCH[0]+'/'+START_DATE.getTime()+'/'+END_DATE.getTime()+'/24000') //get data for every  24 seconds
        .end(function(err, res){
          console.log("The body is: "+ res.body.length);          
          res.body.should.be.a('array');
          res.body.length.should.equal(150);
          done();
        });
      });

    it('Delete data for a watch id id', function(done){
      chai.request(BASE_URL)
        .delete(DELETE_DATA_PATH+TEST_WATCH[1])
        .end(function(err, res){
          expect(res.body.success).to.be.true;
        });


      chai.request(BASE_URL)
      .get(GET_WATCH_IDS)
      .end(function(err,res){
        res.should.be.json; 
        res.body.should.be.a('array');
        console.log('THe length of the body is: '+JSON.stringify(res.body));
        res.body.length.should.equal(9);
        done();
      });        
   });

    it('Get alert for idel alert', function(){
      //TO-DO
    });

    it('Get spike alert', function(){
      //TO-DO
    });

});

