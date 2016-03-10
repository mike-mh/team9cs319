(function() {

  'use strict';

  /**
   * @desc - Directive used to render the c3 data-graph and its controls.
   *         It makes use of its own controller which performs the logic and
   *         interaction needed with the data analyzer to render the c3 graph
   *
   *         NOTE: Had to change the name from the original architecture plan.
   *               Angular does not allow the word 'data' as the first word in
   *               a directive.
   *
   * @example <acceleration-graph></acceleration-graph>
   */
  angular
    .module('dcgui.components')
    .directive('accelerationGraph', accelerationGraph);

  function accelerationGraph() {
    var directive = {
      templateUrl: '/app/components/acceleration-graph/acceleration-graph.html',
      controller: AccelerationGraphController,
      controllerAs: 'accelerationGraphController',
      restrict: 'E',
      bindToController: true
    };

    return directive;

  }

  AccelerationGraphController.$inject = ['DataAnalyzerService', '$http'];

  function AccelerationGraphController(DataAnalyzerService, $http) {
    var vm = this;

    var GET_WATCH_ID_QUERY_PATH = '/api/get-watch-ids';
    var GET_WATCH_DATA_QUERY_PATH = '/api/get-data';

    var MILLISECONDS_IN_MINUTE = 60 * 1000;

    var Y_AXIS_LABEL = 'Acceleration (m/s^2)';
    var Y_AXIS_LABEL_POSITION = 'outer-middle';
    var X_AXIS_TYPE = 'timeseries';
    var LABEL_POSITION = 'inset'
    var X_AXIS_COLUMN_INDEX = 0;
    var X_ACCELERATION_COLUMN_INDEX = 1;
    var Y_ACCELERATION_COLUMN_INDEX = 2;
    var Z_ACCELERATION_COLUMN_INDEX = 3;
    var GRADIENT_COLUMN_INDEX = 4;

    var watchStartTimeMap = {};

    // Use to generate the c3 chart
    var chart;

    var graphData = {};

    // Configure graph data for chart rendernig
    graphData.data = {};
    graphData.data.x = 'x-axis';
    graphData.data.columns = [
      ['x-axis'],
      ['x-acceleration'],
      ['y-acceleration'],
      ['z-acceleration'],
      ['gradient']
    ];
    graphData.subchart = {show: true};
    graphData.axis = {};
    graphData.axis.x = {
      type : X_AXIS_TYPE,
      tick: {
        // Takes all labels in 'x-axis' array and generates date string
        format: convertMillisecondsToDateString
      }
    };
    graphData.axis.y = {
      label: {
        text: Y_AXIS_LABEL,
        position: Y_AXIS_LABEL_POSITION
      }
    };
    graphData.legend = {position: LABEL_POSITION}

    // This array holds watch ids and start times
    vm.watchData = [];
    vm.idToQuery = '';
    vm.startTimeToQuery = '';
    vm.intervalToQuery = '';

    vm.watchDataToQuery = {
      id: '',
      startTime: '',
      interval: ''
    }

    vm.INTERVAL_OPTIONS = [5, 10, 30];
    vm.startTimeOptions = [];
    vm.generateStartTimeOptions = generateStartTimeOptions;
    vm.getAccelerationData = getAccelerationData;

    /**
     * @desc - Callback function for successful retrieval of watch IDs and
     *         start times from DCH via HTTP request. On success, it appends
     *         the appropriate data to the 'watchData' field.
     *
     * @param response {object} - Response from the server.
     */
     function getWatchIdSuccessCallback(response) {
       var watchData = response.data;
       for(var watch in watchData) {
         var currentWatch = watchData[watch];
         var retrievedData = {
           id: currentWatch._id,
           startTime: currentWatch.start,
           endTime: currentWatch.end
         }

         watchStartTimeMap[currentWatch._id] = {};
         watchStartTimeMap[currentWatch._id].startTime = currentWatch.start;
         watchStartTimeMap[currentWatch._id].endTime = currentWatch.end;

         vm.watchData.push(retrievedData);
       }
     }

    /**
     * @desc - Callback function for errors occuring during the retrieval of
     *         watch IDs and start times from DCH via HTTP request.
     *
     * @param response {object} - Response from the server.
     */
     function getWatchIdErrorCallback(response) {
     }

    /**
     * @desc - Callback function for successful retrieval of watch IDs and
     *         start times from DCH via HTTP request.
     *
     * @param response {object} - Response from the server.
     */
     function getWatchDataSuccessCallback(response) {
       var responseData = response.data;

       // Contains timestamps for x-axis
       var xAxisData = [];
       var xAccelerationData = [];
       var yAccelerationData = [];
       var zAccelerationData = [];
       var gradientData = [];

       // Store data in 2 x 2 array to pyt into c3 chart
       var dataMatrix = [
         xAxisData,
         xAccelerationData,
         yAccelerationData,
         zAccelerationData,
         gradientData,
       ];

       for(var dataPoint in responseData) {
         var timestap = responseData[dataPoint]._id;
         var xAcc = responseData[dataPoint].acc_x;
         var yAcc = responseData[dataPoint].acc_y;
         var zAcc = responseData[dataPoint].acc_z;
         var gradient = responseData[dataPoint].gradient;

         dataMatrix[X_AXIS_COLUMN_INDEX].push(timestap);
         dataMatrix[X_ACCELERATION_COLUMN_INDEX].push(xAcc);
         dataMatrix[Y_ACCELERATION_COLUMN_INDEX].push(yAcc);
         dataMatrix[Z_ACCELERATION_COLUMN_INDEX].push(zAcc);
         dataMatrix[GRADIENT_COLUMN_INDEX].push(gradient);
       }

       renderAccelerationGraph(dataMatrix);
     }

    /**
     * @desc - Callback function for errors occuring during the retrieval of
     *         watch IDs and start times from DCH via HTTP request.
     *
     * @param response {object} - Response from the server.
     */
     function getWatchDataErrorCallback(response) {
     }

    /**
     * @desc - This function is used to request the watch IDs and their start
     *         times from DCH.
     */
    function requestWatchIds() {
      var responsePromise = $http.get(GET_WATCH_ID_QUERY_PATH);

      /*
       * After the request promise is completed, execute callbacks based on
       * whether or not request was successful.
       */
      responsePromise
        .then(getWatchIdSuccessCallback, getWatchIdErrorCallback);
    }

    /**
     * @desc - This function is used during the c3 chart rendering to convert
     *         millisecond timestamps received from the server to a datetime
     *         string.
     *
     * @return {string} - The translated datetime string.
     */
    function convertMillisecondsToDateString(milliseconds) {
      var dateFromMilliseconds = new Date(milliseconds);
      return dateFromMilliseconds.toString();
    }

    /**
     * @desc - This function is used to create timestamps to populate the
     *         start time selection menu.
     */
    function generateStartTimeOptions() {
      vm.startTimeOptions = [];
      var id = vm.idToQuery.trim();
      var currentTimeIteration = watchStartTimeMap[vm.idToQuery.trim()].startTime;
      var endTime = watchStartTimeMap[vm.idToQuery.trim()].endTime;
      console.log('foo');
      console.log(vm.interval);
      var millisecondInterval = MILLISECONDS_IN_MINUTE * vm.intervalToQuery;
      while(currentTimeIteration < endTime) {
        var iterationDate = new Date(currentTimeIteration);
        var dateStringOption = iterationDate.toString();
        vm.startTimeOptions.push(dateStringOption);
        currentTimeIteration += millisecondInterval;
      }
    }

    /**
     * @desc - Retrieves data from the server and uses them to populate the c3
     *         chart,
     */
    function getAccelerationData() {
      console.log(vm.intervalToQuery);
      var startTime = new Date(vm.startTimeToQuery.trim());
      var startTimeMilliSec = startTime.getTime();
      var endTimeMilliSec = startTimeMilliSec + MILLISECONDS_IN_MINUTE * vm.intervalToQuery;
      var totalPoints = 1200 * vm.intervalToQuery / 5
      var dataPath = GET_WATCH_DATA_QUERY_PATH +
                       '/' + vm.idToQuery.trim() +
                       '/' + startTimeMilliSec +
                       '/' + endTimeMilliSec +
                       '/' + totalPoints;
      console.log(dataPath);
      var responsePromise = $http.get(dataPath);

      /*
       * After the request promise is completed, execute callbacks based on
       * whether or not request was successful.
       */
      responsePromise
        .then(getWatchDataSuccessCallback, getWatchDataErrorCallback);
    }

    /**
     * @desc - This function generates the data to populate the c3 chart
     *         object and uses it to render the c3 chart.
     *
     * @param {Number[][]} - 2D matrix with timestamps and acceleration.
     */
    function renderAccelerationGraph(retrievedData) {
      // Clear previous data
      graphData.data.columns[X_AXIS_COLUMN_INDEX] =
        graphData.data.columns[X_AXIS_COLUMN_INDEX].splice(0, 1);

      graphData.data.columns[X_ACCELERATION_COLUMN_INDEX] =
        graphData.data.columns[X_ACCELERATION_COLUMN_INDEX].splice(0, 1);

      graphData.data.columns[Y_ACCELERATION_COLUMN_INDEX] =
        graphData.data.columns[Y_ACCELERATION_COLUMN_INDEX].splice(0, 1);

      graphData.data.columns[Z_ACCELERATION_COLUMN_INDEX] =
        graphData.data.columns[Z_ACCELERATION_COLUMN_INDEX].splice(0, 1);

      graphData.data.columns[GRADIENT_COLUMN_INDEX] =
        graphData.data.columns[GRADIENT_COLUMN_INDEX].splice(0, 1);

      // Populate columns with data
      graphData.data.columns[X_AXIS_COLUMN_INDEX].push.apply(
        graphData.data.columns[X_AXIS_COLUMN_INDEX],
        retrievedData[X_AXIS_COLUMN_INDEX]);

      graphData.data.columns[X_ACCELERATION_COLUMN_INDEX].push.apply(
        graphData.data.columns[X_ACCELERATION_COLUMN_INDEX],
        retrievedData[X_ACCELERATION_COLUMN_INDEX]);

      graphData.data.columns[Y_ACCELERATION_COLUMN_INDEX].push.apply(
        graphData.data.columns[Y_ACCELERATION_COLUMN_INDEX],
        retrievedData[Y_ACCELERATION_COLUMN_INDEX]);

      graphData.data.columns[Z_ACCELERATION_COLUMN_INDEX].push.apply(
        graphData.data.columns[Z_ACCELERATION_COLUMN_INDEX],
        retrievedData[Z_ACCELERATION_COLUMN_INDEX]);

      graphData.data.columns[GRADIENT_COLUMN_INDEX].push.apply(
        graphData.data.columns[GRADIENT_COLUMN_INDEX],
        retrievedData[GRADIENT_COLUMN_INDEX]);

      chart = c3.generate(graphData);
    }

    // Render the chart
    //renderAccelerationGraph();

    // Populate the watch ID dropdown menu
    requestWatchIds();
  }

})();
