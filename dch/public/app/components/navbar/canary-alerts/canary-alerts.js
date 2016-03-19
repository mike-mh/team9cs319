(function() {

  'use strict';

  /**
   * @desc - Directive is responsible for both laying the architecture which
   *         allow for alert toasts to be displayed as events occur in real
   *         time and is responsible for holding the message modal that is
   *         navigated to via the navbar mail icon.
   *
   * @example <canary-alerts></canary-alerts>
   */
  angular
    .module('dcgui.components')
    .directive('canaryAlerts', canarayAlerts)

  function canarayAlerts() {
    var directive = {
      scope: {
        watches: '='
      },

      templateUrl: '/app/components/navbar/canary-alerts/canary-alerts.html',
      controller: CanarayAlertsController,
      controllerAs: 'canarayAlertsController',
      restrict: 'E',
      bindToController: true
    };

    return directive;
  }

  CanarayAlertsController.$inject = [];

  function CanarayAlertsController() {
  }

})();
