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
    .filter('unique', function(){
      return function(collection, keyname) {
    	  var output = [],
    	  keys = [];

    	  angular.forEach(collection, function(item) {
    		  var key = item[keyname];
    		  if(keys.indexOf(key) === -1) {
    		    keys.push(key);
    			output.push(item);
    	   }
        });
    	return output;
       }
    });

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

    WatchFormController.$inject = ['$http'];

    function WatchFormController($http) {
      var vm = this;

      vm.times = [];
      vm.watchSelected = false;
      vm.timeSelected = false;   

      // This will store the user selected information.
      vm.selectedWatch =  {
    	  id: '',
    	  startTime: '',
          interval: '',
      }

      var NO_DEVICE_DATA_DISPLAY = 'No data';
      var GET_DATA_QUERY_PATH = '/get_data/';

      vm.watchFormData = NO_DEVICE_DATA_DISPLAY;

     /**
      * @desc - This function is called when a watch selection
      *         is updated by the user. It calls populateTimes(watch)
      *         to populate the correct start times for the selected
      *         watch.
      */
      vm.updateWatch = function() {
        queryTimes(vm.watches[0])
        vm.watchSelected = true;
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
      * @desc - This function populates the start times for a 
      *         selected watch at 5 minute intervals.
      *         
      * @param - watch {object} - the selected watch.
      */

      function queryTimes(watch) {
        // For now, this function gets the time of the first element
        // in watches[]. Once the api call is defined, this will make
        // a query to the DCH to grab the start time of the selected watch.
        var milliseconds = watch.TIMESTAMP; 
        console.log(milliseconds);
        for (var i=0; i<288; i++) {
          var dateFromMilliseconds = new Date(milliseconds);
          vm.times[i] = dateFromMilliseconds.toString();
          milliseconds = milliseconds + 300000;
        }
          console.log(vm.times);
      }

     /**
      * @desc - This callback function is called when $http service completes
      *         its request for total connected devices successfully.
      *
      * @param response {object} - Response from the server.
      */
      function successCallback(response) {
    	vm.watches = response.data;
    	console.log(vm.watches);
      }

     /**
      * @desc - This callback function is called when $http service completes
      *         its request for total connected devices with an error response.
      *
      * @param response {object} - Response from the server.
      */
      function errorCallback(response) {
    	console.log(response);
      }

     /**
      * @desc - This function is used to request the all the data from the 
      *         DCH server. Once the request completes, a callback is
      *         executed based on whether or not the request was successful.
      */
      function requestData() {
    	var responsePromise = $http.get(GET_DATA_QUERY_PATH);
    		responsePromise.then(successCallback, errorCallback);
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

        var stopTime = new Date();
        stopTime = stopTime.getTime();

        var interval = vm.selectedWatch.interval * 60000;

        var dataQuery = 'api/getData/:'+watchId+'/:'+startTime+'/:'+stopTime+'/:'+interval;
        console.log(dataQuery);

      }

      // Helper function to remove the spaces in a string.
      function removeSpaces(field) {
        field = field.replace(/\s+/g, '');
        return field;
      }

      // Request data from the DCH server.
      requestData();
    }

})();