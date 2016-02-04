(function() {

    /**
     * @desc - Directive used to create a table
     * @example <sample-app-table></sample-app-table>
     */
    angular
        .module('sampleApp.components')
        .directive('sampleAppTable', sampleAppTable);

    function sampleAppTable () {

        // This is the object that is created and sent to the DOM to create
        // the view the user sees when the <sample-app-table> tag is parsed.
        // Note the directive uses the 'TableController'
        var directive = {
            link: link,
            templateUrl: '/app/components/sample_table/table.html',
            controller: 'sampleAppTableController',
            controllerAs: 'tableCtrl',
            restrict: 'E',
            bindToController: true
        };

        return directive;

       function link(scope, element) {

       }
    }

})();
