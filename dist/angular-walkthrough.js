(function(window, document, undefined) {
'use strict';
angular.module("angular-walkthrough", []);
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
    };
}]);
angular.module('angular-walkthrough')
.directive('wtStep', ['$compile', '$q', '$document', '$templateCache', '$timeout', function ($compile, $q, $document, $templateCache, $timeout) {
    return {
        restrict: 'A',
        require: ['^walkthrough', 'wtStep'],
        controller: 'StepController',
        link: function (parentScope, element, attrs, ctrls) {
            var scope = parentScope.$new(true);
            scope.wtText        = attrs.wtText;
            scope.wtPosition    = attrs.wtPosition;
            scope.wtGroup       = attrs.wtGroup;
            scope.wtBtnText     = attrs.wtBtnText;
            scope.wtOnNext      = attrs.wtOnNext;
            scope.customCss     = attrs.wtStepCss;
            scope.wtTitle       = attrs.wtTitle;
            var WalkThroughController = ctrls[0];
            var StepController = ctrls[1];
            (attrs.wtStep ? scope.wtStep = attrs.wtStep : console.log('Missing step number on wtStep directive'));
            if (!StepController._contentElement && !scope.wtText) {
                console.log('wtStep directive is missing content, need either wtText or wtStepContent.');
            } else {
                // Popover template calls into these
                scope.cancel = WalkThroughController.cancel;
                scope.next = function () {
                    if (scope.wtOnNext) scope.wtOnNext();
                    WalkThroughController.next();
                };
                scope.restart = WalkThroughController.start;
                scope.previous = WalkThroughController.prev;

                scope.$watch(function () {
                    return WalkThroughController._getNumSteps(scope.wtGroup);
                }, function (newval, oldval) {
                    if (newval) scope.totalSteps = newval;
                });

                // add the bottom toolbar to the content the user provided
                var tb = $compile($templateCache.get('wt-popover-toolbar.html'))(scope);
                if (!StepController._contentElement) {
                    var e = angular.element('<div></div>').html(scope.wtText);
                    StepController._registerContent(e);
                }
                StepController._contentElement.append(tb);

                // if this is an interactive step, disable the "next" or "finish" button,
                // the consumer will be responsible for explicitly calling next once
                // the user has finished interacting with the target element
                if ('wtInteract' in attrs) {
                    var e = StepController._contentElement[0].querySelector('.next-btn');
                    angular.element(e).addClass('hide');
                }

                // we need to register the step with the walkthrough controller
                var originalZIndex, originalPosition;
                WalkThroughController._registerStep({
                    step: parseInt(scope.wtStep),
                    group: scope.wtGroup || 'default',
                    show: function () {
                        var deferred = $q.defer();
                        element[0].scrollIntoView(false);
                        var popoverOptions = {
                            html: true,
                            trigger: 'manual',
                            container: 'body',
                            template: '<div class="popover wt-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title popover-title-custom"></h3><div class="popover-content wt-popover-content wt-popover-content-custom"></div></div>',
                            viewport: {
                                selector: 'body',
                                padding: 2
                            },
                            placement: (this.wtPosition ? this.wtPosition : 'auto'),
                            content: function () {
                                return StepController._contentElement;
                            }
                        };
                        scope.startStep = WalkThroughController.startStep || 0;
                        if( this.wtTitle ) popoverOptions.title = this.wtTitle +
                            "<div class='floatR colo99 step-custom-class'>" +
                                ( scope.wtStep - WalkThroughController.startStep ) + ' of ' +
                                ( scope.totalSteps - WalkThroughController.startStep )+
                            "</div>" +
                            "<div class='clear'></div>";
                        element.popover( popoverOptions );

                        element.on('shown.bs.popover', function () {
                            deferred.resolve();
                        });

                        // store the old values so we can restore them later
                        originalZIndex = element.css('z-index');
                        originalPosition = element.css('position');

                        // move target element up in the stacking context
                        element.css({
                            'z-index': 9999999,
                            position: 'relative'
                        });
                        element.popover('show');
                        WalkThroughController._addHelperLayer(element);
                        if (!('wtInteract' in attrs)) WalkThroughController._addCoverLayer(element);

                        // fix The Stacking Contenxt problem.
                        // More detail: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Understanding_z_index/The_stacking_context
                        var parentElm = element[0].parentNode;
                        while (parentElm != null) {
                            if (parentElm.tagName.toLowerCase() === 'body') break;
                            var position = _getPropValue(parentElm, 'position');
                            var zIndex = _getPropValue(parentElm, 'z-index');
                            var opacity = parseFloat(_getPropValue(parentElm, 'opacity'));
                            var transform = _getPropValue(parentElm, 'transform') || _getPropValue(parentElm, '-webkit-transform') || _getPropValue(parentElm, '-moz-transform') || _getPropValue(parentElm, '-ms-transform') || _getPropValue(parentElm, '-o-transform');
                            if (/[0-9]+/.test(zIndex) || opacity < 1 || transform !== 'none') {
                                parentElm.className += ' wt-fixParent';
                                if (position === "fixed") {
                                    parentElm.className += ' wt-position-fixed';
                                    WalkThroughController._removeHelperLayer(element);
                                    WalkThroughController._removeCoverLayer();
                                }
                            }
                            parentElm = parentElm.parentNode;
                        }

                        function _getPropValue (element, propName) {
                           // this seems to work fine for now
                           return angular.element(element).css(propName);
                            /*
                            var propValue = '';
                            if (element.currentStyle) { //IE
                                propValue = element.currentStyle[propName];
                            } else if (document.defaultView && document.defaultView.getComputedStyle) { //Others
                                propValue = document.defaultView.getComputedStyle(element, null).getPropertyValue(propName);
                            }
                            //Prevent exception in IE
                            if (propValue && propValue.toLowerCase) {
                                return propValue.toLowerCase();
                            } else {
                                return propValue;
                            }
                            */
                        }

                        return deferred.promise;
                    }.bind(scope),
                    hide: function () {
                        var deferred = $q.defer();
                        element.on('hidden.bs.popover', function () {
                            element.popover('destroy');
                            deferred.resolve();
                        });

                        // restore css properties
                        element.css({
                            'z-index': originalZIndex,
                            position: originalPosition
                        });

                        //remove `wt-fixParent` class from the elements
                        var parentElm = element[0].parentNode;
                        while (parentElm != null) {
                            if (parentElm.tagName.toLowerCase() === 'body') break;
                            if (parentElm.className.indexOf('wt-fixParent' > -1)) {
                                parentElm.className = parentElm.className.replace(/wt-fixParent/g, '').replace(/^\s+|\s+$/g, '');
                                parentElm.className = parentElm.className.replace(/wt-position-fixed/g, '').replace(/^\s+|\s+$/g, '');
                            }
                            parentElm = parentElm.parentNode;
                        }
						
                        element.popover('hide');
                        WalkThroughController._removeHelperLayer();
                        WalkThroughController._removeCoverLayer();
                        return deferred.promise;
                    }
                });
            }
            parentScope.$on( "$destroy", function () {
                WalkThroughController._unregisterStep({
                    step: scope.wtStep,
                    group: scope.wtGroup || 'default'
                })
            });
        }
    }
}]);
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
angular.module('angular-walkthrough')
.directive('walkthrough', ['$rootScope', '$document', function ($rootScope, $document) {
    return {
        restrict: 'A',
        scope: {
            wtStart: '=',
            wtNext: '=',
            wtPrev: '=',
            wtCancel: '=',
            wtActive: '='
        },
        controller: 'WalkThroughController',
        link: function (scope, element, attrs, WalkThroughController) {

            // public interface
            if ('wtStart' in attrs) scope.wtStart = WalkThroughController.start;
            if ('wtNext' in attrs) scope.wtNext = WalkThroughController.next;
            if ('wtPrev' in attrs) scope.wtPrev = WalkThroughController.prev;
            if ('wtCancel' in attrs) scope.wtCancel = WalkThroughController.cancel;
            if ('wtActive' in attrs) scope.wtActive = WalkThroughController.active;

            var overlayLayerAdded = false;
            var overlayLayer = angular.element('<div></div>').addClass('wt-overlay');
            scope._addOverlayLayer = function () {
                // check if the target element is body, we should calculate the size of overlay layer in a better way
                if (element[0].tagName.toLowerCase() === 'body') {
                    overlayLayer.css({ top: 0, bottom: 0, left: 0, right: 0, position: 'fixed' });
                } else {
                    // set overlay layer position
                    overlayLayer.css({
                        top: element.offset().top,
                        left: element.offset().left,
                        width: element[0].offsetWidth,
                        height: element[0].offsetHeight,
                        opacity: "0.6",
                        background: "#000",
                        position: "absolute"
                    });
                }
                if (!overlayLayerAdded) {
                	overlayLayerAdded = true;
                	element.append(overlayLayer); 
                }
            };
            scope._removeOverlayLayer = function () {
            	overlayLayerAdded = false;
                overlayLayer.remove();
            };

            var helperLayerAdded = false;
            var helperLayer = angular.element('<div class="wt-helperLayer"></div>');
            scope._addHelperLayer = function (e) {
                helperLayer.css({
                    position: 'absolute',
                    top: e.offset().top,
                    left: e.offset().left,
                    width: e[0].offsetWidth,
                    height: e[0].offsetHeight
                });
                if (!helperLayerAdded) {
                	element.append(helperLayer);
                }
            };
            scope._removeHelperLayer = function () {
            	helperLayerAdded = false;
                helperLayer.remove();
            };

            var coverLayerAdded = false;
            var coverLayer = angular.element('<div class="wt-coverLayer"></div>');
            scope._addCoverLayer = function (e) {
                coverLayer.css({
                    position: 'absolute',
                    top: e.offset().top,
                    left: e.offset().left,
                    width: e[0].offsetWidth,
                    height: e[0].offsetHeight
                });
                if (!coverLayerAdded) {
                	coverLayerAdded = true;
                	element.append(coverLayer);
                }
            };
            scope._removeCoverLayer = function () {
            	coverLayerAdded = false;
                coverLayer.remove();
            }
        }
    }
}]);
})(window, document);
