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
    let directive = {
      templateUrl: '/app/components/acceleration-graph/acceleration-graph.html',
      controller: DataGraphController,
      controllerAs: 'dataGraphController',
      restrict: 'E',
      bindToController: true
    };

    return directive;

  }

  DataGraphController.$inject = ['DataAnalyzerService'];

  function DataGraphController(DataAnalyzerService) {
    var vm = this;

    const Y_AXIS_LABEL = 'Acceleration (m/s^2)';
    const Y_AXIS_LABEL_POSITION = 'outer-middle';
    const X_AXIS_TYPE = 'timeseries';
    const LABEL_POSITION = 'inset'
    const CONNECTED_DEVICE_QUERY_PATH = '/total_connected_devices';
    const X_AXIS_COLUMN_INDEX = 0;
    const X_ACCELERATION_COLUMN_INDEX = 1;
    const Y_ACCELERATION_COLUMN_INDEX = 2;
    const Z_ACCELERATION_COLUMN_INDEX = 3;
    const GRADIENT_COLUMN_INDEX = 4;

    let graphData = {};

    // Use to generate the c3 chart
    var chart;

    vm.test = 'Derp';

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

    /**
     * @desc - This function is used during the c3 chart rendering to convert
     *         millisecond timestamps received from the server to a datetime
     *         string.
     *
     * @return {string} - The translated datetime string.
     */
    function convertMillisecondsToDateString(milliseconds) {
          let dateFromMilliseconds = new Date(milliseconds);
          return dateFromMilliseconds.toString();
    }

    /**
     * @desc - This function generates the data to populate the c3 chart
     *         object and uses it to render the c3 chart.
     */
    function renderDataGraph() {
      // Use test data for now
      let retrievedData = DataAnalyzerService.getTestData();

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
    renderDataGraph();
  }

})();
