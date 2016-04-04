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
   * @example <graph></graph>
   */
  angular
    .module('dcgui.components')
    .directive('graph', graph);

  function graph() {
    var directive = {
      templateUrl: '/app/components/graph/graph.html',
      controller: GraphController,
      controllerAs: 'graphController',
      restrict: 'E',
      bindToController: true
    };

    return directive;

  }

  GraphController.$inject = ['GraphService', 'WatchDataService', '$scope', '$window'];

  function GraphController(GraphService, WatchDataService, $scope, $window) {
    var vm = this;

    var chartRenderFunctionMap = {
      'acceleration': GraphService.renderAccelerationGraph,
      'battery': GraphService.renderBatteryChart
    }

    /**
     * @desc - This function is triggered when the user clicks the 'Get Data'
     *         button with real time updates disabled. It first removes
     *         previous data from the graph then re-renders the chart.
     */
    function populateAccelerationGraph() {
      //Clear previous data
      GraphService.clearAccelerationGraph();
      GraphService.renderAccelerationGraph();
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

    /**
     * @desc - This function initializes the rendering of the acceleration
     *         stream.
     */
    vm.showAcclerationStream = function() {
      vm.livestreamControls = true;
      console.log(vm.livestreamControls);
      GraphService.startAccelerationStream();
    }

    /**
     * @desc - This function stops the rendering of the acceleration stream.
     */
    vm.stopAcclerationStream = function() {
      GraphService.stopAccelerationStream()
    }
  }

})();
