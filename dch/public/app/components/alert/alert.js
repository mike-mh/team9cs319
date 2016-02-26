(function() {

  'use strict';

  /**
   * @desc - This will be used to generate alert blocks in GUI. This is very
   *         incomplete and open to interpretation but the idea is that the
   *         directive will display an alert based on the attributes passed
   *         into this directive's attributes.
   *
   * @example <alert alert-type="" alert-time-start="" alert-time-end=""></alert>
   */
  angular
    .module('dcgui.components')
    .directive('alert', alert);

  function connectedDevices() {
    // This is the object that is created and sent to the DOM to create
    // the view the user sees when the <sample-app-table> tag is parsed.
    // Note the directive uses the 'TableController'
    let directive = {
      templateUrl: '/app/components/alert/alert.html',
      restrict: 'E',
    };

    return directive;

  }

})();
