(function() {

  'use strict';

  /**
   * @desc - This will be responsible for both receiving alert streams from
   *         the DCH server and fetching all alerts during initialization.
   *         It will also be responsible for issuing deletion commands.
   *
   * @ngInject
   *  - WatchDataService
   */
  angular
    .module('dcgui.shared')
    .service('CanaryAlertService', CanaryAlertService);

  CanaryAlertService.$inject = ['$http'];

  function CanaryAlertService($http) {
    var canaryAlertService = {
      getWatchAlerts: getWatchAlerts
    };

    // Initialize SSE stream
    //intializeStream();

    var testDate = new Date();
    var watchAlerts = {
      alerts: [
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',

          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        },
        {
          timestamp: testDate.toString(),
          watchId: '7982347af7982',
          alertType: 'Connection',
          alertText: 'Device has connected to network',
          read: false
        }
      ]
    };

    /**
     * @desc - Getter for the watch alerts object
     *
     * @return {object} - The watch alerts object
     */
     function getWatchAlerts() {
       return watchAlerts;
    }

    // Return the service as an object. Angular treats it as a Singleton.
    return canaryAlertService;

    /**
     * @desc - Initialize the alert stream
     */
    function initializeStream() {

    }

  }
})();
