(function() {

  'use strict';

  /**
   * @desc - Directive used to create the connected devices widget. Renders
   *         all watches connected to the network during startup.
   *
   * @example <connected-devices></connected-devices>
   */
  angular
    .module('dcgui.components')
    .directive('connectedDevices', connectedDevices);

  function connectedDevices() {
    // This is the object that is created and sent to the DOM to create
    // the view the user sees when the <sample-app-table> tag is parsed.
    // Note the directive uses the 'TableController'
    let directive = {
      templateUrl: '/app/components/connected-devices/connected-devices.html',
      controller: ConnectedDevicesController,
      controllerAs: 'connectedDevicesCtrl',
      restrict: 'E',
      bindToController: true
    };

    return directive;

  }

  ConnectedDevicesController.$inject = ['$http'];

  function ConnectedDevicesController($http) {
    var vm = this;

    const NO_DEVICE_DATA_DISPLAY = 'No data';
    const SERVER_ERROR_DISPLAY = 'ERROR: Couldn\'t retrieve data';
    const CONNECTED_DEVICE_QUERY_PATH = '/total_connected_devices';

    vm.totalConnectedDevices = NO_DEVICE_DATA_DISPLAY;


    /**
     * @desc - This callback function is called when $http service completes
     *         its request for total connected devices successfully.
     *
     * @param response {object} - Response from the server.
     */
    function successCallback(response) {
      let connectedDevices = response.data;
      vm.totalConnectedDevices = connectedDevices;
    }

    /**
     * @desc - This callback function is called when $http service completes
     *         its request for total connected devices with an error response.
     *
     * @param response {object} - Response from the server.
     */
    function errorCallback(response) {
      vm.totalConnectedDevices = SERVER_ERROR_DISPLAY;
    }

    /**
     * @desc - This function is used to request the total connected devices
     *         from the DCH server. Once the request completes, a callback is
     *         executed based on whether or not the request was successful.
     */
    function requestTotalConnectedDevices() {
      let responsePromise = $http.get(CONNECTED_DEVICE_QUERY_PATH);

      /*
       * After the request promise is completed, execute callbacks based on
       * whether or not request was successful.
       */
      responsePromise.then(successCallback, errorCallback);
    }

    // Request total connected devices
    requestTotalConnectedDevices();
  }

})();
