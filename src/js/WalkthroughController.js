'use strict';

angular.module('angular-walkthrough')
.controller('WalkThroughController', ['$scope', '$rootScope', '$q', function ($scope, $rootScope, $q) {

    var self = this;
    self.activeStep = null;
    self.registeredSteps = {};

    // public
    self.deferred = $q.defer();
    self.start = function (group, step ) {
    	console.log('start: ' + group);
        $scope._addOverlayLayer();
        self.startStep = ( step ) ? step - 1 : 0;
        self._showNextStep( step? step : 1, group);
        return self.deferred.promise;
    };
    self.next = function () { self._showNextStep(); };
    self.prev = function () { self._showPreviousStep(); };
    self.cancel = function ( cancelCondition, group ) {
        var deferred = self.deferred;
        $scope._removeOverlayLayer();
        if (self.activeStep) {
            self.activeStep.hide().then(function () {
                var activeStepTemp = self.activeStep;
                self.activeStep = undefined;
                deferred.resolve({
                    "cancel"    : !cancelCondition,
                    step        : activeStepTemp,
                    totalSteps  : self._getNumSteps( activeStepTemp.group )
                });
            });
        }
        return deferred.promise;
    };
    self.active = function () {
        return (self.activeStep ? true : false);
    };

    self._registerStep = function (step) {
        if (!self.registeredSteps[step.group]) self.registeredSteps[step.group] = {};
        self.registeredSteps[step.group][step.step] = step;
    };

    self._unregisterStep = function (step) {
        if (!self.registeredSteps[step.group]) self.registeredSteps[step.group] = {};
        delete self.registeredSteps[step.group][step.step];
    };
    //
    // can be used to start the walkthrough, go to the next step, or jump to a step
    //
    // if step provided, show that step,
    // otherwise, if active step, show next if exists
    self._showNextStep = function (step, group) {
        function showNext(ns, ng) {
            self.activeStep = self.registeredSteps[ng][ns];
            self.activeStep.show();
        }
        var nextStep = step || (self.activeStep ? self.activeStep.step + 1 : 1);
        var nextGroup = group || (self.activeStep ? self.activeStep.group : 'default');
        if (self.registeredSteps[nextGroup] && self.registeredSteps[nextGroup][nextStep]) {
            if (self.activeStep) {
                self.activeStep.hide().then(function () {
                    showNext(nextStep, nextGroup);
                });
            } else {
                showNext(nextStep, nextGroup);
            }
        } else {
            self.cancel(true, group);
        }
    };
    self._showPreviousStep = function () {
        if (self.activeStep && self.registeredSteps[self.activeStep.group][self.activeStep.step - 1]) {
            self._showNextStep(self.activeStep.step - 1);
        }
    };
    self._getNumSteps = function (group) {
        group = group || 'default';
        return Object.keys(self.registeredSteps[group]).length;
    };
    self._addHelperLayer = function (element) { $scope._addHelperLayer(element); };
    self._removeHelperLayer = function () { $scope._removeHelperLayer(); };
    self._addCoverLayer = function (element) { $scope._addCoverLayer(element); };
    self._removeCoverLayer = function () { $scope._removeCoverLayer(); };
    self._addOverlayLayer = function (element) { $scope._addOverlayLayer(element); };
    self._removeOverlayLayer = function () { $scope._removeOverlayLayer(); };

}]);