(function() {

    /**
     * This is an example controller for the table
     */
    angular
        .module('sampleApp.components')
        .controller('sampleAppTableController', sampleAppTableController);

    sampleAppTableController.$inject = [];

    function sampleAppTableController () {

        // Unique JavaScript trick. Helps solve pointer problems.
        var vm = this;

        // This array contains all of the data in the table as objects
        vm.tableData = [];

        // This is akin to a 'private field'
        // (needs get or set to be accessed from outside this file)
        var totalItemsMade = 0;

        // Make pointers to functions
        vm.addRow = addRow;
        vm.deleteRow = deleteRow;
        vm.deleteRows = deleteRows;

        function addRow() {
            // Create new data object and push to data array
            var dataObject = {};
            var currentDate = new Date();
            dataObject.timestamp = currentDate.toString();

            // Increment items made
            totalItemsMade++;
            dataObject.totalItemsMade = totalItemsMade;

            // Push new object to data
            vm.tableData.push(dataObject);
        }

        function deleteRow() {
            // Remove an item from the tableData
            vm.tableData.pop();
        }

        function deleteRows() {
            // Reset all data
            vm.tableData = [];
        }

    }
})();
