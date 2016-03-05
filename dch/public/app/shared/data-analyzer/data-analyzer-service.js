(function() {

  'use strict';

  /**
   * @desc - This will be the work horse for data analysis on the client side.
   *         When data is retrieved from the server it will be analyzed here
   *         so that it can be properly displayed. There is a test function
   *         used to allow for rendering of the acceleration graph but it's
   *         only for testing! We'll need to get rid of it.
   */
  angular
    .module('dcgui.shared')
    .service('DataAnalyzerService', DataAnalyzerService);

  function DataAnalyzerService() {
    // This is for testing and demonstration. Remove later.
    var currentDate = new Date();
    var testTimeValue = currentDate.getTime();

    var dataAnalyzerService = {
      getTestData: getTestData
    };

    // Return the service as an object. Angular treats it as a Singleton
    return dataAnalyzerService;

    /**
     * @desc - This is a test method for proof of concept. Remove later.
     *
     * @return [array] - Array containing arrays of data.
     */
    function getTestData() {
      var returnValue = [];
      var storageObject = {};

      storageObject.xAxis = [];
      storageObject.xAcceleration = [];
      storageObject.yAcceleration = [];
      storageObject.zAcceleration = [];
      storageObject.gradient = [];

      for (var i = 0; i<=100; i++) {
        testTimeValue += 1000;
        storageObject.xAxis[i] = testTimeValue;
        storageObject.xAcceleration[i] = 12 * Math.random();
        storageObject.yAcceleration[i] = 12 * Math.random();
        storageObject.zAcceleration[i] = 12 * Math.random();
        storageObject.gradient[i] = Math.sqrt(
          Math.pow(storageObject.xAcceleration[i], 2) +
          Math.pow(storageObject.yAcceleration[i], 2) +
          Math.pow(storageObject.zAcceleration[i], 2)
        );
      }

      var index = 0;
      for(var array in storageObject) {
        returnValue[index] = storageObject[array];
        index++;
      }

      return returnValue;
    }
  }
})();
