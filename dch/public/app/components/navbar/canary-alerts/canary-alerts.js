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

  CanarayAlertsController.$inject = ['CanaryAlertService', '$interval', '$scope'];

  function CanarayAlertsController(CanaryAlertService, $interval, $scope) {
    var vm = this;

    var TOAST_DISPLAY_INTERVALS = 5000;

    vm.tableColumns = ['MARK AS READ', 'TIME', 'WATCH ID', 'ALERT TYPE', 'ALERT'];

    vm.readAlerts = [];
    vm.readTableColumns = ['TIME', 'WATCH ID', 'ALERT TYPE', 'ALERT', 'DELETE'];

    vm.showAlertToastConnect = false;
    vm.showAlertToastDisconnect = false;
    vm.showAlertToastIdle = false;
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
     * @desc - Used to render alert toast. Executes every five seconds. 
     *         Green - New device connected
     *         Yellow - Device disconnected
     *         Red - Idle device
     */
    function displayConnectionData() {
      if (alertsQueue.length === 0) {
        console.log('NO DATA');
        vm.showAlertToastConnect = false;
        vm.showAlertToastDisconnect = false;
        vm.showAlertToastIdle = false;
        vm.showAlertToastSpike = false;
        return;
      }
      
      UpdateInbox();

      var data = alertsQueue.shift();
      var dateReceived = new Date(data.timestamp);
      console.log('MAKING TOAST');
      
      vm.alertToastTime = dateReceived.toString();
      vm.alertToastWatchId = data.watch_id;
      vm.alertToastAlertType = data.alert_type;
      vm.alertToastAlertText = data.alert_text;

      if (vm.alertToastAlertText.indexOf(' connected') >= 0) {
        vm.showAlertToastConnect = true;
      }

      if (vm.alertToastAlertText.indexOf('disconnected') >= 0) {
        vm.showAlertToastDisconnect = true;
      }

      if (vm.alertToastAlertType.indexOf('ACC_IDLE') >= 0) {
        vm.showAlertToastIdle = true;
      }

      if (vm.alertToastAlertType.indexOf('ACC_SPIKE') >= 0) {
        vm.showAlertToastSpike = true;
      }

      console.log(vm.showAlertToast);
      console.log(vm.alertToastAlertText);

      console.log(data);

    }

    /*
     * @desc - This function updates the mail inbox badge
     *
     */
    function UpdateInbox() {
      $scope.$emit('inboxUpdate', vm.alerts.alerts.length);
      console.log('updating');
    }

    /**
     * @desc - This function marks an alert as read
     *
     * @param alert {object} - Alert to be marked as read
     *        index - Index of the alert to be marked as read
     */
    vm.MarkAsRead = function(alert, index) {
      vm.alerts.alerts.splice(index, 1);
      vm.readAlerts.push(alert)
      console.log(vm.readAlerts);
      UpdateInbox();
    }

    /*
     * @desc - This function clears all alerts in alert inbox
     *
     */
    vm.ClearAlerts = function() {
      vm.readAlerts.push.apply(vm.readAlerts, vm.alerts.alerts);
      vm.alerts.alerts.splice(0);
      console.log(vm.alerts.alerts);
      UpdateInbox();
    }

  }

})();
