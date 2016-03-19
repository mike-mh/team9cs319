(function() {

  'use strict';

  /**
   * @desc - Directive used to create the navbar. Will be coupled with the
   *         alerts module and include its directive in the HTML.
   *
   * @example <navbar></navbar>
   */
  angular
    .module('dcgui.components')
    .directive('navbar', navbar)

  function navbar() {
    var directive = {
      scope: {
        watches: '='
      },

      templateUrl: '/app/components/navbar/navbar.html',
      controller: NavbarController,
      controllerAs: 'navbarCtrl',
      restrict: 'E',
      bindToController: true
    };

    return directive;
  }

  NavbarController.$inject = [];

  function NavbarController() {
  }

})();
