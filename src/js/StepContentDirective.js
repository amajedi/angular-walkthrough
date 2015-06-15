'use strict';

angular.module('angular-walkthrough')
.directive('wtStepContent', [function () {
    return {
        restrict: 'E',
        require: '^^wtStep',
        transclude: true,
        scope: {},
        link: function (scope, element, attrs, StepController, transclude) {
            transclude(scope.$parent.$new(), function (clone, cloneScope) {
                var wrapped = angular.element('<div></div>').append(clone);
                StepController._registerContent(wrapped);

                clone.on('$destroy', function () {
                    cloneScope.$destroy();
                });
            });

            scope.$on('$destroy', function () {
                StepController._unregisterContent();
            });
        }
    }
}]);