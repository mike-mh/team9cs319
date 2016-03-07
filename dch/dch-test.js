'use strict';

var expect = require('chai').expect;
var should = require('should');
var assert = require('assert');
var request = require('supertest');  

var DCH_URL = 'http://localhost:3000';

/**
 * Test for the Express API
 *
 * TO-DO: Write functions to insert data into MongoDB
 */
describe('The DCH API', function() {
  describe('get_data', function() {
    it('should retrieve the proper data from MongoDB', function() {
      console.log('TO-DO');
    });
  });

  describe('delete_data', function() {
    it('should delete data from MongoDB', function() {
      console.log('TO-DO');
    });
  });

  describe('total_connected_devices', function() {
    it('should retrieve total unique, connected devices from MongoDB', function() {
      console.log('TO-DO');
    });

    it('this is a demonstration', function(done) {
      request(DCH_URL).get('/total_connected_devices')
        .send()
        // end handles the response
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          // this is should.js syntax, very clear
          // 
          // This is also incorrect. We should fix this! ;)
          res.text.should.equal('0');
          res.status.should.equal(200);
          done();
        });
    });
  });
});
