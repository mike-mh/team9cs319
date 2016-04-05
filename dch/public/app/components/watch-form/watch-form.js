(function() {

  'use strict';

  /**
   * @desc - Directive used to create the watch form query. Posts
   *         user selected information to the DCH server.
   *
   * @example <watch-form></watch-form>
   */
  angular
    .module('dcgui.components')
    .directive('watchForm', watchForm)

  function watchForm() {
    var directive = {
      scope: {
        watches: '='
      },

      templateUrl: '/app/components/watch-form/watch-form.html',
      controller: WatchFormController,
      controllerAs: 'watchFormCtrl',
      restrict: 'E',
      bindToController: true
    };

    return directive;
  }

  WatchFormController.$inject = ['$http', 'GraphService', 'WatchDataService'];

  function WatchFormController($http, GraphService, WatchDataService) {
    console.log('SERVICE');
    console.log(GraphService);
    var vm = this;

    vm.livestreamControls = false;
    vm.hasLivestreamData = false;

    vm.dataList = [];
    vm.times = [];
    vm.intervalOptions = [5, 10, 30];

    // This will store the user selected information.
    vm.selectedWatch = {
      id: '',
      startTime: '',
      interval: '',
    }

    var GET_WATCH_IDS = '/api/get-watch-ids';

    var MILLISECONDS_IN_MINUTE = 60000;
    var DATA_POINTS_IN_GRAPH = 300;

   /**
    * @desc - This function is called when a watch selection
    *         is updated by the user. It clears previous data
    *         in the dropdown menus. Checks if livestream is available.
    */
    vm.updateWatch = function() {
      GraphService.setWatchIdToMonitor(vm.selectedWatch.id.trim());
      var livestreamData = GraphService.checkHasLivestream();

      for (var watch in livestreamData) {
        if (watch == vm.selectedWatch.id.trim()) {
          vm.hasLivestreamData = true;
          console.log('Has livestream data')
        } else {
          vm.hasLivestreamData = false;
        }
      }

      console.log(livestreamData)
      vm.selectedWatch.interval = '';
      vm.selectedWatch.startTime = '';
    }

    /**
     * @desc - This function is used to create timestamps to populate the
     *         start time selection menu.
     */
    vm.queryTimes = function() {
      var id = vm.selectedWatch.id.trim();
      var interval = vm.selectedWatch.interval;
      var intervalInMilliseconds = MILLISECONDS_IN_MINUTE * interval;

      // Used to generate times in dropdown menu
      var currentTime;
      var endTime;

      var result = vm.watches.filter(function(watch){
        return watch._id === id;
      });

      // Clear out previous times
      vm.times.splice(0, vm.times.length);
        
      // Find the latest timestamp available for current watch
      endTime = result[0].end;
      currentTime = result[0].start;

      // Create all necessarry date strings
      while(currentTime < endTime) {
        var dateIterationObject = new Date(currentTime);
        var dateString = dateIterationObject.toString();
        vm.times.push(dateString);
        currentTime += intervalInMilliseconds;
      }
    }

   /**
    * @desc - This function validates and submits the watch form.
    *
    * @param - selectedWatch, startTime, interval - Object to post to 
    *          DCH server to get watch data.
    */
    vm.submitForm = function() {
      var currentWatch = vm.selectedWatch
      if (!currentWatch.id) {
        alert('Please select a watch.');
      } 
      else if (!currentWatch.startTime) {
        alert('Please select a start time.');
      } 
      else if (!currentWatch.interval) {
        alert('Please select a time interval.')
      }
      else {
        console.log('Requesting data.');
        vm.livestreamControls = false;
      }

      requestWatchData();
    }


    /**
     * @desc - This callback function is called when $http service completes
     *         its request for watch ids successfully.
     *
     * @param response {object} - Response from the server.
     */
    function idSuccessCallback(response) {
      vm.watches = response.data;
    }

    /**
     * @desc - This callback function is called when $http service completes
     *         its request for watch ids with an error response.
     *
     * @param response {object} - Response from the server.
     */
    function idErrorCallback(response) {
      console.log(response);
    }

    /**
     * @desc - This function is used to request the all the data from the 
     *         DCH server. Once the request completes, a callback is
     *         executed based on whether or not the request was successful.
     */
    function requestWatchIds() {
      var responsePromise = $http.get(GET_WATCH_IDS);
      responsePromise.then(idSuccessCallback, idErrorCallback);
    }


    /**
     * @desc - This callback function is called when $http service completes
     *         its request for selected watch data successfully. Proceeds to
     *         render the chart.
     *
     * @param response {object} - Response from the server.
     */
    function dataSuccessCallback(response) {
      vm.dataList = response.data;
      WatchDataService.putData(vm.dataList);
      GraphService.renderAccelerationGraph();
      GraphService.renderBatteryGraph();
    }

    /**
     * @desc - This callback function is called when $http service completes
     *         its request for selected watch data with an error response.
     *
     * @param response {object} - Response from the server.
     */
    function dataErrorCallback(response) {
      console.log(response);
    }

    /**
     * @desc - This function parses out the query string and requests 
     *         the data from the DCH server. The watch id, start time,
     *         and interval is provided by the user. Stop time is the
     *         last one interval away from the time user selected.
     *
     *         E.g. If the user selected a five minute interval
     *              starting from 17:32, 300 data points would be
     *              collected from between 17:32 and 17:37.
     */
    function requestWatchData() {
      var watchId = removeSpaces(vm.selectedWatch.id);   
      var startTime = new Date(vm.selectedWatch.startTime);
      startTime = startTime.getTime();
      var stopTime = startTime + vm.selectedWatch.interval * 60000;
      var interval = vm.selectedWatch.interval * 300;
      var dataQuery = '/api/get-data/' +
                      watchId + '/' +
                      startTime + '/' + 
                      stopTime + '/' + interval;

      var responsePromise = $http.get(dataQuery);

      // If the user was watching live stream data, stop stream.
      GraphService.stopAccelerationStream();

      responsePromise.then(dataSuccessCallback, dataErrorCallback);
    }

    // Helper function to remove the spaces in a string.
    function removeSpaces(field) {
      field = field.replace(/\s+/g, '');
      return field;
    }

   /**
     * @desc - This function initializes the rendering of the acceleration
     *         stream.
     */
    vm.showAcclerationStream = function() {
      vm.livestreamControls = true;
      GraphService.startAccelerationStream();
    }

   /**
     * @desc - This function stops the rendering of the acceleration stream.
     */
    vm.stopAcclerationStream = function() {
      GraphService.stopAccelerationStream()
    }

    // Request watch ID data from the DCH server to populate drop down menu.
    requestWatchIds();
  }

  /**
   * @desc - Renders the battery graph to contain all known data for a
   *         battery. If time permits, architecture should change and this
   *         should be moved.
   */
  vm.getAllBatteryData = function() {
    console.log('GETTING DATA');
    GraphService.renderBatteryReport();
  };
})();
