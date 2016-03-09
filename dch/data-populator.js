'use strict'

var db = require('./db.js');
var sample = require('./sample-data.js');
var genRandom = sample.genRandom;
var genAllRandom = sample.genAllRandom;
var genIncreasing = sample.genIncreasing;

var args = process.argv.slice(2);

function logErr(err) {
  if (err) {
    console.log('Error on bulkInsert');
  }
}

function populate() {
  for (var i = 0; i < 6; i++) {
    var arr = sample.genAllRandom('allRand'+i,
      1457500000000, 1457600000000, Math.pow(2, i), 500);
    db.bulkInsert(arr, logErr);
  }
  for (var i = 0; i < 3; i++) {
    var arr = sample.genRandom('rand'+i,
      1457500000000, 1457600000000, Math.pow(2, i), 200*(i+1));
    db.bulkInsert(arr, logErr);
  }
  for (var i = 0; i < 3; i++) {
    var arr = sample.genIncreasing('inc'+i,
      1457500000000, 1457600000000, 200*(i+1), i*Math.pow(10,i));
    db.bulkInsert(arr, logErr);
  }
}

// node data-populator.js
// node data-populator.js genIncreasing a 1457500000000 1457600000000 20000 99
// see sample-data.js for details on calling
// TODO: figure out how to terminate
if (args[0]) {
  db.bulkInsert(
    sample[args[0]](args[1],
      parseInt(args[2]),
      parseInt(args[3]),
      parseInt(args[4]),
      parseInt(args[5])),
      logErr);
} else {
  populate();
}