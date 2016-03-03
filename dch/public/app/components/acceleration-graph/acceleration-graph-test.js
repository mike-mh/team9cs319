'use strict';

/*
 * Unit test for the acceleration-graph
 */
describe('The acceleration-graph', function() {
  var ACCELERATION_GRAPH_TAG = '<acceleration-graph></acceleration-graph>';

  // Used to insert values into the URL params
  // See http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
  var GET_ACCELERATION_DATA_URL = 
    '/get_data?watch_id={0}&start_time={1}&time_interval={2}';

  var $controller;
  var $compile;
  var $rootScope;

  var accelerationGraphElement;

  // Call the hosting module and HTML templates
  beforeEach(module('dcgui.components'));
  beforeEach(module('directive-templates'));

  // Render the directive before each test
  beforeEach(
    inject(function(_$compile_, _$rootScope_, $injector) {

      // Compile HTML file to connect javascript to DOM
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      accelerationGraphElement = $compile(ACCELERATION_GRAPH_TAG)($rootScope);

      // This is just a sample. After the API is accurately implemented in DCH
      // this method can be used to generate mock data in the form of a JSON
      // which in turn can be used to confirm that the proper data is stored
      // in the AccelerationGraphControl and AccelerationGraphService (when or
      // if it is implemented.
      // 
      // $httpBackend = $injector.get('$httpBackend');
      // $httpBackend.whenGET(GET_CONNECTED_DEVICES_URL)
      //  .respond(200, TO_BE_DETERMINED_REPONSE_JSON);

      // Digest connects the directive to the DOM
      $rootScope.$digest();
    })
  );

  // This is to be done after AccelerationGraphService is created (we'll come
  // back to this)
  describe('service', function() {
    it('should return the proper data on HTTP error', function() {
      console.log('TO-DO');
    });

    it('should return the proper acceleration data upon successful request', function() {
      console.log('TO-DO');
    });

  });

  describe('directive', function() {
    it('should not render the graph before the user requests data from DCH', function() {
      console.log('TO-DO');
    });

    it('should not allow a user to request data from DCH if no devices are connected', function() {
      console.log('TO-DO');
    });

    it('should display the proper error template on a request error', function() {
      console.log('TO-DO');
    });

    it('should render a graph with data after the user requests data', function() {
      console.log('TO-DO');
    });

    it('should render a graph x, y, z accleration and gradient data', function() {
      console.log('TO-DO');
    });

    it('should render a legend for x, y, z accleration and gradient data', function() {
      console.log('TO-DO');
    });

    it('should render an x-axis labelled with dates and times', function() {
      console.log('TO-DO');
    });

    it('should render a y-axis labelled with acceleration points', function() {
      console.log('TO-DO');
    });

    it('should render a subchart under the graph', function() {
      console.log('TO-DO');
    });

    it('should render timestamps on the x-axis of the subchart', function() {
      console.log('TO-DO');
    });
  });
});
