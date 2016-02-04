/* This is the entry point for the AngularJS app. */
/* All client JS files should be palved in an *Immediately Invoked Function Expression* (IIFE) */
(function() {
    // This forces the browser to use the strict JavaScript interpretor 
    'use strict';

    angular
        .module('sampleApp', [
            'sampleApp.components']); 
})();

