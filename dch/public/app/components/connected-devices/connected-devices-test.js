'use strict';

/*
 * Unit test for the connected-devices widget
 */
describe('The connected-devices widget', function() {
  const NO_DEVICE_DATA = 'No data';
  const CONNECTED_DEVICES_TAG = '<connected-devices></connected-devices>';
  const GET_CONNECTED_DEVICES_URL = '/total_connected_devices';

  let $controller;
  let $compile;
  let $rootScope;
  let $httpBackend;

  let connectedDevicesElement;
  let totalConnectedDevices;

  // Call the hosting module and HTML templates
  beforeEach(module('dcgui.components'));
  beforeEach(module('directive-templates'));

  // Render the directive before each test
  beforeEach(
    inject(function(_$compile_, _$rootScope_, $injector) {

      // Compile HTML file to connect javascript to DOM
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      connectedDevicesElement = $compile(CONNECTED_DEVICES_TAG)($rootScope);

      // Create mock response when requesting connected devices
      totalConnectedDevices = Math.floor(20 * Math.random());
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.whenGET(GET_CONNECTED_DEVICES_URL)
        .respond(200, totalConnectedDevices);

      // Digest connects the directive to the DOM
      $rootScope.$digest();
    })
  );

  describe('directive', function() {

    it('should contain the connected devices header', function() {
      expect(connectedDevicesElement.html())
        .toContain('<h2>Connected Devices</h2>');
    });

    it('should display that no data is available before a request is made for data', function() {
      expect(connectedDevicesElement.html())
        .toContain('Total: ' + NO_DEVICE_DATA);
    });

    it('should display the total devices connected after it has been requested', function() {
      $httpBackend.flush();
      expect(connectedDevicesElement.html())
        .toContain('Total: ' + totalConnectedDevices);
    });
  });
});
