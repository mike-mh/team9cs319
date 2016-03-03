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

    	let directive = {
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

        // This will store the user selected information.
    	$scope.selectedWatch =  {
    		id: '',
    		startTime: '',
    	}

    	var vm = this;	

    	const NO_DEVICE_DATA_DISPLAY = 'No data';
    	const GET_DATA_QUERY_PATH = '/get_data/';

    	vm.watchFormData = NO_DEVICE_DATA_DISPLAY;

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
    		let responsePromise = $http.get(GET_DATA_QUERY_PATH);

   			responsePromise.then(successCallback, errorCallback);
    	}

        // Request data from the DCH server.
    	requestData();
    }


})();