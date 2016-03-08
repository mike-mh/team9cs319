(function() {

  'use strict';

  /**
   * @desc - This will be used to generate alert blocks in GUI. This is very
   *         incomplete and open to interpretation but the idea is that the
   *         directive will display an alert based on the attributes passed
   *         into this directive's attributes.
   *
   * @example <acceleration-alert alert-type="" alert-time-start="" alert-time-end=""></acceleration-alert>
   */
  angular
    .module('dcgui.components')
    .directive('accelerationAlert', accelerationAlert);

  function accelerationAlert() {
    var directive = {
      templateUrl: '/app/components/acceleration-alert/accerlation-alert.html',
      restrict: 'E',
    };

    return directive;

  }

})();
