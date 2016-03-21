(function() {

  'use strict';

  /**
   * @desc - This will be the work horse for rendering the c3 chart. It will
   *         be capable of rendering both the acceleration and battery graph
   *         and will also be capable of rendering charts with real time
   *         updates.
   *
   * @ngInject
   *  - WatchDataService
   */
  angular
    .module('dcgui.shared')
    .service('DataGraphService', DataGraphService);

  DataGraphService.$inject = ['WatchDataService'];

  function DataGraphService(WatchDataService) {
    // Use to generate the c3 chart
    var chart;

    var ACCELERATION_STREAM_PATH = '/api/acceleration-sse/';

    var Y_AXIS_LABEL_ACCELERATION = 'Acceleration (m/s^2)';
    var Y_AXIS_LABEL_POSITION = 'outer-middle';
    var Y_AXIS_DEFAULT_RANGE = [0, 12];
    var X_AXIS_TYPE = 'timeseries';
    var LABEL_POSITION = 'inset'
    var X_AXIS_COLUMN_INDEX = 0;
    var X_ACCELERATION_COLUMN_INDEX = 1;
    var Y_ACCELERATION_COLUMN_INDEX = 2;
    var Z_ACCELERATION_COLUMN_INDEX = 3;
    var GRADIENT_COLUMN_INDEX = 4;
    var MAX_X_INDEX_LABELS = 6;

    // These variables are used to handle SSE streams of acceleration data.
    // The accelerationStreamData is an array of no more than 300 bits of data
    // in length and showing a continuous stream of the last five minutes of
    // data from the current time.
    var accelerationStream;
    var accelerationStreamData = {};
    var accelerationStreamGraphControl = {
      'watchId' : '7fc32430c461bb7f',
      'enabled' : true,
    }

    var accelerationGraphData = {};
    var batteryGraphData = {};

    // Configure graph data for chart rendernig
    accelerationGraphData.data = {};
    accelerationGraphData.data.x = 'x-axis';
    accelerationGraphData.data.columns = [
      ['x-axis'],
      ['x-acceleration'],
      ['y-acceleration'],
      ['z-acceleration'],
      ['gradient']
    ];
    accelerationGraphData.data.type = 'spline';
    accelerationGraphData.point = {show: false};
    accelerationGraphData.subchart = {show: true};
    accelerationGraphData.axis = {};
    accelerationGraphData.axis.x = {
      type : X_AXIS_TYPE,
      tick: {
        // Takes all labels in 'x-axis' array and generates date string
        format: convertMillisecondsToDateString,
        culling: {
          max: MAX_X_INDEX_LABELS
        }
      }
    };
    accelerationGraphData.axis.y = {
      label: {
        text: Y_AXIS_LABEL_ACCELERATION,
        position: Y_AXIS_LABEL_POSITION
      },
      //max: 15,
      min: 0
    };
    accelerationGraphData.legend = {position: LABEL_POSITION};

    var dataGraphService = {
      renderAccelerationGraph: renderAccelerationGraph,
      clearAccelerationGraph: clearAccelerationGraph
    };

    // Initialize SSE stream
    intializeStream();

    // Return the service as an object. Angular treats it as a Singleton.
    return dataGraphService;

    /**
     * @desc - Initializes the SSE stream conenction for acceleration data
     *         and configures the on message event to perpetually update the
     *         accelerationStreamData with retreived data.
     */
    function intializeStream() {
      accelerationStream = new EventSource(ACCELERATION_STREAM_PATH);
      console.log('do it');
      accelerationStream.addEventListener("acceleration-event", function(event) {
        try {
          var data = JSON.parse(event.data);
          analyzeRetrievedData(data);
          renderRealtimeAccelerationGraph();
        } catch(e) {
          console.log(e);
        }
        //console.log(event.data);
      }, false);

      accelerationStream.addEventListener("open", function(event) {
        console.log("Connection open!");
      }, false);
    }

    /**
     * @desc - Analyzes retrieved data and places it into the
     *         accelerationGraphData object. All data is averaged and inserted
     *         as a single point.
     *
     * @param data {object} - Data retreived from the acceleration SSE.
     */
    function analyzeRetrievedData(data) {
      // Data is stored in a particular sequence. E.g. x-axis is at index 0
      // and z-axis at index 2
      var currentIndex = 0;
//      console.log(data);
      for(var watch in data) {
        var currentWatch = data[watch];
// console.log(currentWatch);
        var currentArrayIndex = 0;

        // Set watch if not yet defiend
        if (!accelerationStreamData[watch]) {
          accelerationStreamData[watch] = [];
        }
        for(var array in currentWatch) {
          var sum = 0;
          var average = 0;
          var currentArray = currentWatch[array];
          // Don't average an empty array!
          if (!currentArray.length) {
            continue;
          }
          for(var index = 0; index < currentArray.length; index++) {
            sum += currentArray[index];
          }

          average = sum / currentArray.length;

          //console.log(accelerationStreamData);

          if (!accelerationStreamData[watch][currentArrayIndex]) {
            accelerationStreamData[watch][currentArrayIndex] = [];
          }

          // Array should not exceed 300 data points
          if (accelerationStreamData[watch][currentArrayIndex].length >= 100) {
            accelerationStreamData[watch][currentArrayIndex].splice(0, 1);
          }

          accelerationStreamData[watch][currentArrayIndex].push(average);
          currentArrayIndex++;
        }
        
      }
    }

    /**
     * @desc - This function uses the data retrieved from data source to
     *         generate realtime updates of the c3 chart.
     */
    function rednerBatteryChart() {
    }

    /**
     * @desc - This function generates the data to populate the acceleration
     *         c3 chart with data passed in from a successful 'get-data'
     *         object.
     */
    function renderAccelerationGraph() {
      clearAccelerationGraph();
      var retrievedData = WatchDataService.getData();
      console.log(retrievedData);

      // Populate columns with data
      accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX],
        retrievedData[X_AXIS_COLUMN_INDEX]);

      accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX],
        retrievedData[X_ACCELERATION_COLUMN_INDEX]);

      accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX],
        retrievedData[Y_ACCELERATION_COLUMN_INDEX]);

      accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX],
        retrievedData[Z_ACCELERATION_COLUMN_INDEX]);

      accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX],
        retrievedData[GRADIENT_COLUMN_INDEX]);

      chart = c3.generate(accelerationGraphData);
    }

    /**
     * @desc - This function reads data published from the SSE stream and
     *         renders it to the chart if it is enabled.
     */
    function renderRealtimeAccelerationGraph() {
      clearAccelerationGraph();

      // Only render when live streaming is set
      if (!accelerationStreamGraphControl.enabled) {
        return;
      }

      var currentWatch = accelerationStreamGraphControl.watchId;
      var watchData = accelerationStreamData[currentWatch];

      if (!chart) {
        chart = c3.generate(accelerationGraphData);
      }

      console.log(watchData);

      // Populate columns with data //FIX LATER! TERRIBLE!
      accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX],
        watchData[3]);

      accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX],
        watchData[0]);

      accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX],
        watchData[1]);

      accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX],
        watchData[2]);

      accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX].push.apply(
        accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX],
        watchData[4]);

      chart.load({
        columns: [
          accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX],
          accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX],
          accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX],
          accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX],
          accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX]
        ]
      });
    }

    /**
     * @desc - This function clears the data in the c3 chart.
     */
    function clearAccelerationGraph() {
      accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX] = 
        accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX].splice(0, 1);

      accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX] =
        accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX].splice(0, 1);

      accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX] =
        accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX].splice(0, 1);

      accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX] =
        accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX].splice(0, 1);

      accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX] =
        accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX].splice(0, 1);
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
  }
})();
