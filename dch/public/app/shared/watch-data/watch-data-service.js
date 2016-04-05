(function() {

  'use strict';

  /**
   * @desc - This will be the work horse for data analysis on the client side.
   *         When data is retrieved from the server it will be analyzed here
   *         so that it can be properly displayed. There is a test function
   *         used to allow for rendering of the acceleration graph but it's
   *         only for testing! We'll need to get rid of it.
   *
   * @ngInject
   *   - $http
   */
  angular
    .module('dcgui.shared')
    .service('WatchDataService', WatchDataService);

  WatchDataService.$inject = ['$http'];

  function WatchDataService() {
    var ACCELERATION_DATA_INDEX = 0;
    var ACCELERATION_DATA_SIZE = 0;

    var BATTERY_DATA_INDEX = 0;
    var BATTERY_DATA_SIZE = 0;

    var accelerationGraphData = [];
    var batteryGraphData = [];

    var dataList = [];

    var watchDataService = {
      putData: putData,
      getAccelerationData: getAccelerationData,
      getBatteryData: getBatteryData,
    };

    var currentDate = new Date();
    var testTimeValue = currentDate.getTime();

    // Return the service as an object. Angular treats it as a Singleton
    return watchDataService;

    /**
     * @desc - This function is called when data request is made by the user.
     *         Stores the watch data to be graphed in the service. Builds the
     *         array which can be read by the c3 graph.
     *
     * @param [array] - Array containing arrays of data.
     */
    function putData(data) {
      dataList = data;

      // Use these objects to store data retrieved from the DCH server
      var accelerationStorage = {};
      var batteryStorage = {};

      accelerationStorage.xAxis = [];
      accelerationStorage.xAcceleration = [];
      accelerationStorage.yAcceleration = [];
      accelerationStorage.zAcceleration = [];
      accelerationStorage.gradient = [];

      batteryStorage.xAxis = [];
      batteryStorage.battery = [];
      batteryStorage.publishRate = [];

      for (var i = 0; i<dataList.length; i++) {
        accelerationStorage.xAxis[i] = dataList[i]._id;
        accelerationStorage.xAcceleration[i] = dataList[i].acc_x;
        accelerationStorage.yAcceleration[i] = dataList[i].acc_y;
        accelerationStorage.zAcceleration[i] = dataList[i].acc_z;
        accelerationStorage.gradient[i] = dataList[i].gradient;

        batteryStorage.xAxis[i] = dataList[i]._id;
        batteryStorage.battery[i] = dataList[i].battery;
        batteryStorage.publishRate[i] = dataList[i].publish_rate;
      };

      var index = 0;
      for(var array in accelerationStorage) {
        accelerationGraphData[index] = accelerationStorage[array];
        index++;
      };

      index = 0;
      for(var array in batteryStorage) {
        batteryGraphData[index] = batteryStorage[array];
        index++;
      };

    }

    /**
     * @desc - This function is called by the acceleration graph to get the 
     *         data list for display.
     * 
     * @return [array] - Array containing arrays of data.
     */
    function getAccelerationData() {
      return accelerationGraphData;
    }

    /**
     * @desc - This function is called by the battery graph to get the data
     *         list for display.
     * 
     * @return [array] - Array containing arrays of data.
     */
    function getBatteryData() {
      return batteryGraphData;
    }
  }
})();
