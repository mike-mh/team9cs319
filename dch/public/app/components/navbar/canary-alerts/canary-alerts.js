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

  CanarayAlertsController.$inject = ['CanaryAlertService', '$interval'];

  function CanarayAlertsController(CanaryAlertService, $interval) {
    var vm = this;

    var TOAST_DISPLAY_INTERVALS = 5000;

    vm.tableColumns = ['MARK AS READ', 'TIME', 'WATCH ID', 'ALERT TYPE', 'ALERT', 'DELETE'];

    vm.showAlertToast = false;
    vm.alertToastTime;
    vm.alertToastWatchId;
    vm.alertToastAlertType;
    vm.alertToastAlertText;

    var alertsQueue = [];


    var displayInterval = $interval(displayConnectionData, TOAST_DISPLAY_INTERVALS);

    console.log(CanaryAlertService);
    console.log(CanaryAlertService.getWatchAlerts());
    vm.alerts = CanaryAlertService.getWatchAlerts();
    console.log(vm.alerts);
    CanaryAlertService.regiterCallback(pushConnectionDataToQueue);


    /**
     * @desc - Use to push data retrieved from the alerts sse 
     *
     * @param connectionData {object} - Data retrieved from alert SSE
     */
    function pushConnectionDataToQueue(connectionData) {
      alertsQueue.push(connectionData);
      console.log(alertsQueue);
    }

    /**
     * @desc - Used to render alert toast. Executes every five seconds
     */
    function displayConnectionData() {
      if (alertsQueue.length === 0) {
        console.log('NO DATA');
        vm.showAlertToast = false;
        return;
      }
      vm.showAlertToast = true;
     
      var data = alertsQueue.shift();
      var dateReceived = new Date(data.timestamp);
      console.log('MAKING TOAST');
 
      vm.alertToastTime = dateReceived.toString();
      vm.alertToastWatchId = data.watch_id;
      vm.alertToastAlertType = data.alert_type;
      vm.alertToastAlertText = data.alert_text;

      console.log(vm.showAlertToast);
      console.log(vm.alertToastAlertText);

      console.log(data);
    }

  }

})();
