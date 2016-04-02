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
    .service('GraphService', GraphService);

  GraphService.$inject = ['WatchDataService'];

  function GraphService(WatchDataService) {
    // Use to generate the c3 chart
    var chart;

    var ACCELERATION_STREAM_PATH = '/api/acceleration-sse/';

    // These constants are shared by both battery and acceleration charts
    var IDENTIFIER_INDEX = 0;
    var Y_AXIS_LABEL_POSITION = 'outer-middle';
    var X_AXIS_TYPE = 'timeseries';
    var LABEL_POSITION = 'inset'
    var MAX_X_INDEX_LABELS = 6;

    var Y_AXIS_LABEL_ACCELERATION = 'Acceleration (m/s^2)';
    var Y_AXIS_DEFAULT_RANGE_ACCELERATION = [0, 12];
    var X_AXIS_COLUMN_INDEX_ACCELERATION = 0;
    var X_ACCELERATION_COLUMN_INDEX = 1;
    var Y_ACCELERATION_COLUMN_INDEX = 2;
    var Z_ACCELERATION_COLUMN_INDEX = 3;
    var GRADIENT_COLUMN_INDEX = 4;

    var X_AXIS_ARRAY_IDENTIFIER = 'x-axis';
    var X_ACCELERATION_ARRAY_IDENTIFIER = 'x-acceleration';
    var Y_ACCELERATION_ARRAY_IDENTIFIER = 'y-acceleration';
    var Z_ACCELERATION_ARRAY_IDENTIFIER = 'z-acceleration';
    var GRADIENT_ARRAY_IDENTIFIER = 'gradient'

    // Make an array with the identifiers and ensure they are stored in the
    // proper index. This isn't the cleanest way to handle this data but it's
    // necessarry to work with the c3 library
    var ACCLERATION_ARRAY_IDENTIFIERS = [];

    ACCLERATION_ARRAY_IDENTIFIERS[X_AXIS_COLUMN_INDEX_ACCELERATION] =
      X_AXIS_ARRAY_IDENTIFIER;

    ACCLERATION_ARRAY_IDENTIFIERS[X_ACCELERATION_COLUMN_INDEX] =
      X_ACCELERATION_ARRAY_IDENTIFIER;

    ACCLERATION_ARRAY_IDENTIFIERS[Y_ACCELERATION_COLUMN_INDEX] =
      Y_ACCELERATION_ARRAY_IDENTIFIER;

    ACCLERATION_ARRAY_IDENTIFIERS[Z_ACCELERATION_COLUMN_INDEX] =
      Z_ACCELERATION_ARRAY_IDENTIFIER;

    ACCLERATION_ARRAY_IDENTIFIERS[GRADIENT_COLUMN_INDEX] =
      GRADIENT_ARRAY_IDENTIFIER;

    // These variables are used to handle SSE streams of acceleration data.
    // The accelerationStreamData is an array of no more than 300 bits of data
    // in length and showing a continuous stream of the last five minutes of
    // data from the current time.
    var accelerationStream;
    var accelerationStreamData = {};
    var accelerationStreamGraphControl = {
      'watchId' : '',
      'enabled' : false,
    }

    var accelerationGraphData = {};
    var batteryGraphData = {};

    // Configure graph data for chart rendernig
    accelerationGraphData.data = {};
    accelerationGraphData.data.x = 'x-axis';
    accelerationGraphData.data.columns = [
      [X_AXIS_ARRAY_IDENTIFIER],
      [X_ACCELERATION_ARRAY_IDENTIFIER],
      [Y_ACCELERATION_ARRAY_IDENTIFIER],
      [Z_ACCELERATION_ARRAY_IDENTIFIER],
      [GRADIENT_ARRAY_IDENTIFIER]
    ];

   // accelerationGraphData.data.type = 'spline';
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
      min: 0
    };
    accelerationGraphData.legend = {position: LABEL_POSITION};

    var GraphService = {
      renderAccelerationGraph: renderAccelerationGraph,
      clearAccelerationGraph: clearAccelerationGraph,
      setWatchIdToMonitor: setWatchIdToMonitor,
      startAccelerationStream: startAccelerationStream,
      stopAccelerationStream: stopAccelerationStream
    };

    // Initialize SSE stream
    intializeStream();

    // Return the service as an object. Angular treats it as a Singleton.
    return GraphService;

    /**
     * @desc - Initializes the SSE stream conenction for acceleration data
     *         and configures the on message event to perpetually update the
     *         accelerationStreamData with retreived data.
     */
    function intializeStream() {
      accelerationStream = new EventSource(ACCELERATION_STREAM_PATH);
      accelerationStream.addEventListener('acceleration-event', function(event) {
        try {
          var data = JSON.parse(event.data);
          analyzeRetrievedData(data);

          // Renders real-time data if it's enabled.
          renderRealtimeAccelerationGraph();

        } catch(e) {
          console.log(e);
        }
      }, false);

      accelerationStream.addEventListener('open', function(event) {
        console.log('Accelertion data stream open.');
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
      for(var watch in data) {
        var currentWatch = data[watch];
        var currentArrayIndex = 0;

        // Set watch if not yet defiend
        if (!accelerationStreamData[watch]) {
          accelerationStreamData[watch] = [];
        }

        for(var array in currentWatch) {
          var sum = 0;
          var currentArray = currentWatch[array];
          var average = 0;

          // Don't average an empty array!
          if (!currentArray.length) {
            continue;
          }
          for(var index = 0; index < currentArray.length; index++) {
            sum += currentArray[index];
          }

          average = sum / currentArray.length;

          if (!accelerationStreamData[watch][currentArrayIndex]) {
            accelerationStreamData[watch][currentArrayIndex] = [];
          }

          // Only show so many points in th stream
          if (accelerationStreamData[watch][currentArrayIndex].length >= 30) {
            accelerationStreamData[watch][currentArrayIndex].shift();
            console.log(accelerationStreamData[watch]);
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
      var retrievedData = WatchDataService.getData();

      // Clear out previous data
      clearAccelerationGraph();

      // Identifiers are stored in the proper index which allows for direct
      // insertion into the array. Again, this isn't the cleanest solution but
      // is needed to run c3
      for(var index in ACCLERATION_ARRAY_IDENTIFIERS) {
       // retrievedData[index].unshift(ACCLERATION_ARRAY_IDENTIFIERS[index]);
       // accelerationGraphData.data.columns[index] = retrievedData[index];
        accelerationGraphData.data.columns[index].push.apply(
          accelerationGraphData.data.columns[index],
          retrievedData[index]);
      }

      if (chart === undefined) {
        chart = c3.generate(accelerationGraphData);
      }

      else {
        chart.load({
          columns: [
            accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX_ACCELERATION],
            accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX],
            accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX],
            accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX],
            accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX]
          ]
        });
      }
    }

    /**
     * @desc - This function reads data published from the SSE stream and
     *         renders it to the chart if it is enabled.
     */
    function renderRealtimeAccelerationGraph() {
      // Only render when live streaming is set
      if (!accelerationStreamGraphControl.enabled) {
        return;
      }

      var currentWatch = accelerationStreamGraphControl.watchId;
      var watchData = accelerationStreamData[currentWatch];

      // Clear out previous data
      clearAccelerationGraph();

      // Identifiers are stored in the proper index which allows for direct
      // insertion into the array. Again, this isn't the cleanest solution but
      // is needed to run c3
      for(var index in ACCLERATION_ARRAY_IDENTIFIERS) {
        accelerationGraphData.data.columns[index].push.apply(
          accelerationGraphData.data.columns[index],
          watchData[index]);
      }

      if (chart === undefined) {
        chart = c3.generate(accelerationGraphData);
      }

      chart.load({
        columns: [
          accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX_ACCELERATION],
          accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX],
          accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX],
          accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX],
          accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX]
        ]
      });
    }

    /**
     * @desc - This function clears the data in the c3 chart. Arrays can't
     *         simply be reset because the first index contains the name data
     *         for the c3 chart.
     */
    function clearAccelerationGraph() {
      accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX_ACCELERATION] =
        accelerationGraphData.data.columns[X_AXIS_COLUMN_INDEX_ACCELERATION]
          .splice(0, 1);

      accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX] =
        accelerationGraphData.data.columns[X_ACCELERATION_COLUMN_INDEX]
          .splice(0, 1);

      accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX] =
        accelerationGraphData.data.columns[Y_ACCELERATION_COLUMN_INDEX]
          .splice(0, 1);

      accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX] =
        accelerationGraphData.data.columns[Z_ACCELERATION_COLUMN_INDEX]
          .splice(0, 1);

      accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX] =
        accelerationGraphData.data.columns[GRADIENT_COLUMN_INDEX]
          .splice(0, 1);
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
     * @desc - Sets the ID of the watch to monitor.
     *
     * @param uuid {string} - The UUID of the device to monitor.
     */
    function setWatchIdToMonitor(uuid) {
      accelerationStreamGraphControl.watchId = uuid;
    }


    /**
     * @desc - Starts the rendering of acceleration stream and clears previous
     *         data
     */
    function startAccelerationStream() {
      clearAccelerationGraph();
      accelerationStreamGraphControl.enabled = true;
    }

    /**
     * @desc - Stops the rendering of acceleration stream and clears previous
     *         data
     */
    function stopAccelerationStream() {
      accelerationStreamGraphControl.enabled = false;
    }

  }
})();
