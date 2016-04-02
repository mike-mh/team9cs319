'use strict'

// TODO: should standardize the documentation comments so doc
// can be auto-generated

// return a random integer between min and max
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// get the magnitude of the vector <x,y,z>
function getGradient(x, y, z) {
  return Math.sqrt(x*x + y*y + z*z);
}

// return an object with random x_acc, y_acc, z_acc within [0, multiplier]
// and the corresponding gradient
function getRandomAccData(multiplier) {
  var x = Math.random() * multiplier;
  var y = Math.random() * multiplier;
  var z = Math.random() * multiplier;
  var gradient = getGradient(x, y, z);
  return {
    acc_x: x,
    acc_y: y,
    acc_z: z,
    gradient: gradient,
    battery: 1.0,
    publish_rate: 400
  };
}

// return array of random data points with timestamps from startTime to
// endTime in interval increments
function genRandom(watchId, startTime, endTime, multiplier, interval) {
  var dataArr = [];
  for (var ts = startTime; ts < endTime; ts+=interval) {
    var data = getRandomAccData(multiplier);
    data.watch_id = watchId;
    data.timestamp = ts;
    dataArr.push(data);
  }
  return dataArr;
};

// generate count number of data
// returns an array which can be bulk inserted into the db
function genAllRandom(watchId, startTime, endTime, multiplier, count) {
  var dataArr = [];
  for (var i = 0; i < count; i++) {
    var data = getRandomAccData(multiplier);
    data.watch_id = watchId;
    data.timestamp = getRandomInt(startTime, endTime);
    dataArr.push(data);
  }
  return dataArr;
};

// return array of increasing data points with timestamps from startTime to
// endTime in interval increments
// this is primarily used for testing and maybe sample data
function genIncreasing(watchId, startTime, endTime, interval, rate) {
  var dataArr = [];
  var i = 0;
  rate = rate * 0.001;
  for (var ts = startTime; ts < endTime; ts+=interval) {
    var data = {
      watch_id: watchId,
      acc_x: i,
      acc_y: i,
      acc_z: i,
      gradient: getGradient(i,i,i),
      timestamp: ts,
      battery: 1.0
    }
    dataArr.push(data);
    i += rate;
  }
  return dataArr;
}

exports.genRandom = genRandom;
exports.genAllRandom = genAllRandom;
exports.genIncreasing = genIncreasing;
