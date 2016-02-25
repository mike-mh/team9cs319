/* This is the entry point for the DCGUI.
 *
 * All client JS files should be in wrapped in a
 * 'Immediately Invoked Function Expression' (IIFE)
 */
(function() {
  // This forces the browser to use the strict JavaScript interpretor
  'use strict';

  angular
    .module('dcgui', [
      'dcgui.shared',
      'dcgui.components',
      'ui.bootstrap'      
    ]); 

   
})();

