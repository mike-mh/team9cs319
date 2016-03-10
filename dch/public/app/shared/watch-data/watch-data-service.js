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
    .service('WatchDataService', WatchDataService);

  function WatchDataService() {
    var graphData = [];
    var dataList = [];

    var watchDataService = {
      putData: putData,
      getData: getData,
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

      var storage = {};

      storage.xAxis = [];
      storage.xAcceleration = [];
      storage.yAcceleration = [];
      storage.zAcceleration = [];
      storage.gradient = [];

      for (var i = 0; i<dataList.length; i++) {
        storage.xAxis[i] = dataList[i]._id;
        storage.xAcceleration[i] = dataList[i].acc_x;
        storage.yAcceleration[i] = dataList[i].acc_y;
        storage.zAcceleration[i] = dataList[i].acc_z;
        storage.gradient[i] = dataList[i].gradient;
      };

      var index = 0;
      for(var array in storage) {
        graphData[index] = storage[array];
        index++
      };
    }

    /**
     * @desc - This function is called by the acceleration graph to get the 
     *         data list for display.
     * 
     * @return [array] - Array containing arrays of data.
     */
    function getData() {
      return graphData;
    }
  }
})();
