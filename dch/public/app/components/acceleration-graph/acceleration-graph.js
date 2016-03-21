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
      controller: DataGraphController,
      controllerAs: 'dataGraphController',
      restrict: 'E',
      bindToController: true
    };

    return directive;

  }

  DataGraphController.$inject = ['DataGraphService', 'WatchDataService', '$scope', '$window'];

  function DataGraphController(DataGraphService, WatchDataService, $scope, $window) {
    var vm = this;
    vm.foo = 'bar';

    var chartRenderFunctionMap = {
      'acceleration': DataGraphService.renderAccelerationGraph,
      'battery': DataGraphService.renderBatteryChart
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
     * @desc - This function generates the data to populate the c3 chart
     *         object and uses it to render the c3 chart.
     */
    function renderDataGraph() {

      var retrievedData = WatchDataService.getData();
      console.log(retrievedData);

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

    /**
     * @desc - This function clears the data in the c3 chart.
     */
    function clearDataGraph() {
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
    }

    /**
     * @desc - This function is triggered when the user clicks the 'Get Data'
     *         button with real time updates disabled. It first removes
     *         previous data from the graph then re-renders the chart.
     */
    function populateAccelerationGraph() {
      //Clear previous data
      DataGraphService.clearAccelerationGraph();
      DataGraphService.renderAccelerationGraph();
    }

    /**
     * @desc - Set active tab so that it is known whether to render
     *         acceleration or battery graph.
     *
     * @param tabName {string} - The name of the tab selected.
     */
    vm.setActiveTab = function(tabName) {
      //chartRenderFunctionMap(tabName);
    }

    vm.showAcclerationStream = function() {
      DataGraphService.startAccelerationStream();
    }

    vm.stopAcclerationStream = function() {
      DataGraphService.stopAccelerationStream()
    }
  }

})();
