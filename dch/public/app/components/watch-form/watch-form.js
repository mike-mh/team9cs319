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

    WatchFormController.$inject = ['$http', '$scope'];

    function WatchFormController($http, $scope) {

        $scope.watchSelected = false;
        $scope.timeSelected = false;
        $scope.times = [];

        // This will store the user selected information.
    	$scope.selectedWatch =  {
    		id: '',
    		startTime: '',
            interval: '',
    	}

    	var vm = this;	

    	var NO_DEVICE_DATA_DISPLAY = 'No data';
    	var GET_DATA_QUERY_PATH = '/get_data/';

    	vm.watchFormData = NO_DEVICE_DATA_DISPLAY;

        // This watches for if a watch has been selected by a user.
        $scope.$watch('selectedWatch.id', function () {
            if ($scope.selectedWatch.id === '') {
                console.log('No watch selected');
            } else {
                console.log("Selected watch:", $scope.selectedWatch.id);
                $scope.watchSelected = true;
                $scope.selectedWatch.startTime = '';
                $scope.selectedWatch.interval = '';
                populateTimes($scope.watches[0]);
            }
           
        });

        // This watches for if a time has been selected by a user.
        $scope.$watch('selectedWatch.startTime', function() {
            if($scope.selectedWatch.startTime === '' || $scope.selectedWatch.startTime === null) {
                console.log('No time selected');
            } else {
                console.log("Selected time:", $scope.selectedWatch.startTime);
                $scope.timeSelected = true;
            }
        })

       /**
        * @desc - This function validates and submits the watch form.
        *
        * @param - selectedWatch, startTime, interval - Object to post to 
        *          DCH server to get watch data.
        */
        $scope.submitForm = function(watch, startTime, interval) {
            console.log('Watch: ' + watch);   
            console.log('Start Time: ' + startTime);
            if (watch == null || watch == '') {
                alert("Please select a watch.");
            } 
            else if (startTime == null || startTime == '') {
                alert("Please select a start time.");
            } 
            else if (interval == null || interval == '') {
                alert("Please select a time interval.")
            }
            else {
                console.log("Requesting data.");
                console.log($scope.selectedWatch);
            }
            requestWatchData();
        }

       /**
        * @desc - This function populates the start times for a 
        *         selected watch at 5 minute intervals.
        *         
        * @param - watch {object} - the selected watch.
        */

        function populateTimes(watch) {
            var milliseconds = watch.TIMESTAMP; 
            for (var i=0; i<288; i++) {
                var dateFromMilliseconds = new Date(milliseconds);
                $scope.times[i] = dateFromMilliseconds.toString();
                milliseconds = milliseconds + 300000;
            }
            console.log($scope.times);
        }

       /**
        * @desc - This callback function is called when $http service completes
        *         its request for total connected devices successfully.
        *
        * @param response {object} - Response from the server.
        */
    	function successCallback(response) {
    		$scope.watches = response.data;
    		console.log($scope.watches);
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

        // Request data from the DCH server.
    	requestData();

        /**
         * @desc - This function parses out the query string and requests 
         *         the data from the DCH server. The watch id, start time,
         *         and interval is provided by the user. Stop time is the
         *         current date.       
         */
        function requestWatchData() {

            var watch_id = removeSpaces($scope.selectedWatch.id);   

            var start_time = new Date($scope.selectedWatch.startTime);
            start_time = start_time.getTime();

            var stop_time = new Date();
            stop_time = stop_time.getTime();

            var interval = $scope.selectedWatch.interval * 60000;

            console.log(watch_id)
            var query = '/getData/:'+watch_id+'/:'+start_time+'/:'+ stop_time+'/:'+interval;
            console.log(query);

        }

        // Helper function to remove the spaces in a string.
        function removeSpaces(field) {
            field = field.replace(/\s+/g, '');
            return field;
        }
    }


})();