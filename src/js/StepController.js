'use strict';

angular.module('angular-walkthrough')
.controller('StepController', ['$scope', function ($scope) {

    var self = this;
    self._contentElement = null;

    self._registerContent = function (contentEle) {
        if (self._contentElement) {
            console.log('Multiple wtStepContent directives detected. Only one is allowed per wtStep.');	
        } else {
            self._contentElement = contentEle;
        }
    };

    self._unregisterContent = function () {
        this._contentElement = null;
    }
}]);