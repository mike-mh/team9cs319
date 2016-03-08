'use strict';

/*
 * Unit test for the acceleration-alert widget
 */
describe('The acceleration-alert widget', function() {
  // Used to insert values into attributes as formatted string
  // See http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
  var ACCELERATION_ALERT_TAG =
    '<acceleration-alert alert-type="{0}" alert-time-start="{1}" alert-time-end="{2}">' +
    '</acceleration-alert>';
  
  var $controller;
  var $compile;
  var $rootScope;

  var accelerationAlertElement;

  // Call the hosting module and HTML templates
  beforeEach(module('dcgui.components'));
  beforeEach(module('directive-templates'));

  beforeEach(
    inject(function(_$compile_, _$rootScope_, $injector) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    })
  );

  describe('directive', function() {
    it('should not display an alert when inappropriate input given', function() {
      console.log('TO-DO');
    });

    it('should display green success widget when alert-type is set to \'ok\'', function() {
      console.log('TO-DO');
    });

    it('should display the alert-type text for alert when set', function() {
      console.log('TO-DO');
    });

    it('should display the time range for alert when set', function() {
      console.log('TO-DO');
    });
  });
});
