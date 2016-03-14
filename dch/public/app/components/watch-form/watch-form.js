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
    // This filter is temporary. Will later use the API to directly
    // retrieve the WatchIDs. Right now it simply removes duplicates
    // of WatchIDs when populating the list of WatchIDs.  

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

    WatchFormController.$inject = ['$http', '$scope', 'WatchDataService'];

    function WatchFormController($http, $scope, WatchDataService) {
      var vm = this;

      vm.dataList = [];
      vm.times = [];
      vm.watchSelected = false;
      vm.intervalSelected = false; 
      vm.dataRetrieved = false;  
      vm.intervalOptions = [5, 10, 30];

      // This will store the user selected information.
      vm.selectedWatch = {
        id: '',
    	  startTime: '',
        stopTime: '',
        interval: '',
      }

      var NO_DEVICE_DATA_DISPLAY = 'No data';
      var GET_WATCH_IDS = '/api/get-watch-ids';

      vm.watchFormData = NO_DEVICE_DATA_DISPLAY;

     /**
      * @desc - This function is called when a watch selection
      *         is updated by the user. It calls populateTimes(watch)
      *         to populate the correct start times for the selected
      *         watch.
      */
      vm.updateWatch = function() {
        vm.watchSelected = true;
        vm.selectedWatch.interval = '';
      }

     /**
      * @desc - This function is called when an interval selection
      *         is updated by the user. 
      */
      vm.updateInterval = function() { 
        queryTimes(); 
        vm.intervalSelected = true;
      }

     /**
      * @desc - This function populates the start times for a 
      *         selected watch at 5 minute intervals.
      *         
      * @param - watch {object} - the selected watch.
      */

      function queryTimes() {
        vm.times.splice(0, vm.times.length);
        var id = vm.selectedWatch.id.trim();
        var interval = vm.selectedWatch.interval;

        var result = vm.watches.filter(function(watch){
          return watch._id == id;
        })
        
        // Set the stop time for the query.
        vm.selectedWatch.stopTime = result[0].end;

        var currentTime = result[0].start;
        console.log(currentTime);
        var endTime = result[0].end;
        console.log(endTime);
        var intervalInMilliseconds = 60000 * interval;

        while(currentTime < endTime) {
          var startIteration = new Date(currentTime);
          var dateFromMilliseconds = startIteration.toString()
          vm.times.push(dateFromMilliseconds);
          currentTime += intervalInMilliseconds;
        }
      }

     /**
      * @desc - This function is called when a time selection
      *         is updated by the user. 
      */
      vm.updateTime = function() {
        vm.timeSelected = true;
      }

     /**
      * @desc - This function validates and submits the watch form.
      *
      * @param - selectedWatch, startTime, interval - Object to post to 
      *          DCH server to get watch data.
      */
      vm.submitForm = function(watch, startTime, interval) {
        console.log('Watch: ' + watch);   
        console.log('Start Time: ' + startTime);
        if (watch == null || watch == '') {
          alert('Please select a watch.');
        } 
        else if (startTime == null || startTime == '') {
          alert('Please select a start time.');
        } 
        else if (interval == null || interval == '') {
          alert('Please select a time interval.')
        }
        else {
          console.log('Requesting data.');
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
    	  console.log(vm.watches); 
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
      *         its request for selected watch data successfully.
      *
      * @param response {object} - Response from the server.
      */
      function dataSuccessCallback(response) {
        vm.dataList = response.data;
        console.log(vm.dataList);
        WatchDataService.putData(vm.dataList);
        $scope.$emit('populate-graph');
        vm.dataRetrieved = true;
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
      *         current date.       
      */
      function requestWatchData() {
        var watchId = removeSpaces(vm.selectedWatch.id);   
        var startTime = new Date(vm.selectedWatch.startTime);
        startTime = startTime.getTime();
        var stopTime = vm.selectedWatch.stopTime;
        var interval = vm.selectedWatch.interval * 60000;
        var dataQuery = '/api/get-data/'+watchId+'/'+startTime+'/'+stopTime+'/'+interval;
        console.log(dataQuery);

        var responsePromise = $http.get(dataQuery);
        responsePromise.then(dataSuccessCallback, dataErrorCallback);

      }

      // Helper function to remove the spaces in a string.
      function removeSpaces(field) {
        field = field.replace(/\s+/g, '');
        return field;
      }

      // Request data from the DCH server.
      requestWatchIds();
    }

})();