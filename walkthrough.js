// TODOS:
// create github io
// split apart into separate files
// create grunt task to concat/minify
// create/register bower package
// add ngDoc documentation
//
// Example
//
//		DOM:
//		<body walkthough [wt-start] [wt-cancel] [wt-next] [wt-prev] [wt-active]>
//			<div wt-step="1" [wt-group] [wt-text] [wt-position] [wt-helper] [wt-interact]>
//              <wt-step-content>
//				    <span> Hello, World! </span>
//              </wt-step-content>
//			</div>
//		</body>
//      
//

(function () {

    'use strict';

    angular.module('WalkThroughModule', []);
    //
    // Template for toolbar at the bottom of the popover
    //
    angular.module('WalkThroughModule')
    .run(['$templateCache', function ($templateCache) {
        $templateCache.put('wt-popover-toolbar.html',
        '<div class="wt-popover-tb">'                                   +
	        '<span class="tb-left">'                                    +
		        '<span>'                                                +
			        '{{wtStep}} of {{totalSteps}}'                      +
		        '</span>'                                               +
		        '<span>'                                                +
			        '<a ng-click="cancel()">'                           +
				        'Cancel'                                        +
			        '</a>'                                              +
		        '</span>'                                               +
		        '<span>'                                                +
			        '<a ng-click="restart()" ng-show="wtStep > 1">'     +
				        'Restart'                                       +
			        '</a>'                                              +
		        '</span>'                                               +
		        '<span>'                                                +
			        '<a ng-click="previous()" ng-show="wtStep > 1">'    +
				        'Back'                                          +
			        '</a>'                                              +
		        '</span>'                                               +
	        '</span>'                                                   +
	        '<span class="tb-right">'                                   +
		        '<a ng-click="next()" class="next-btn">'                +
			        '{{ (totalSteps == wtStep) ? "Finish" : "Next" }}'  +
		        '</a>'                                                  +
	        '</span>'                                                   +
	    '</div>');
    }]);

    angular.module('WalkThroughModule')
	.controller('WalkThroughController', ['$scope', '$rootScope', function ($scope, $rootScope) {

	    var self = this;
	    self.activeStep = null;
	    self.registeredSteps = {};

        // public
	    self.start = function (group) {
	    	console.log('start: ' + group);
	        $scope._addOverlayLayer();
	        self._showNextStep(1, group);
	    }
	    self.next = function () { self._showNextStep(); }
	    self.prev = function () { self._showPreviousStep(); }
	    self.cancel = function () {
	        $scope._removeOverlayLayer();
	        if (self.activeStep) {
	            self.activeStep.hide().then(function () {
	                self.activeStep = undefined;
	                $rootScope.$emit('wt:finish');
	            });
	        }
	    }
	    self.active = function () {
	        return (self.activeStep ? true : false);
	    }

	    self._registerStep = function (step) {
	        if (self.registeredSteps[step.group] && self.registeredSteps[step.group][step.step]) {
	            console.log('Step Number ' + step.step + ' has already been registered for group ' + step.group + ', you can\'t have two steps in the same group with the same step number.');
	        }
	        if (!self.registeredSteps[step.group]) self.registeredSteps[step.group] = {};
	        self.registeredSteps[step.group][step.step] = step;
	    }
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
	            self.cancel();
	        }
	    }
	    self._showPreviousStep = function () {
	        if (self.activeStep && self.registeredSteps[self.activeStep.group][self.activeStep.step - 1]) {
	            self._showNextStep(self.activeStep.step - 1);
	        }
	    }
	    self._getNumSteps = function (group) {
	        group = group || 'default';
	        return Object.keys(self.registeredSteps[group]).length;
	    }
	    self._addHelperLayer = function (element) { $scope._addHelperLayer(element); }
	    self._removeHelperLayer = function () { $scope._removeHelperLayer(); }
	    self._addCoverLayer = function (element) { $scope._addCoverLayer(element); }
	    self._removeCoverLayer = function () { $scope._removeCoverLayer(); }
	}]);

    angular.module('WalkThroughModule')
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
	                    var rect = element[0].getBoundingClientRect();
	                    overlayLayer.css({
	                        width: element[0].offsetWidth,
	                        height: element[0].offsetHeight,
	                        top: rect.top,
	                        left: reft.left
	                    });
	                }
	                if (!overlayLayerAdded) {
	                	overlayLayerAdded = true;
	                	element.append(overlayLayer); 
	                }
	            }
	            scope._removeOverlayLayer = function () {
	            	overlayLayerAdded = false;
	                overlayLayer.remove();
	            }

	            var helperLayerAdded = false
	            var helperLayer = angular.element('<div class="wt-helperLayer"></div>');
	            scope._addHelperLayer = function (e) {
	                var rect = e[0].getBoundingClientRect();
	                helperLayer.css({
	                    top: rect.top,
	                    left: rect.left,
	                    width: e[0].offsetWidth,
	                    height: e[0].offsetHeight
	                });
	                if (!helperLayerAdded) {
	                	element.append(helperLayer);
	                }
	            }
	            scope._removeHelperLayer = function () {
	            	helperLayerAdded = false;
	                helperLayer.remove();
	            }

	            var coverLayerAdded = false;
	            var coverLayer = angular.element('<div class="wt-coverLayer"></div>');
	            scope._addCoverLayer = function (e) {
	                var rect = e[0].getBoundingClientRect();
	                coverLayer.css({
	                    top: rect.top,
	                    left: rect.left,
	                    width: e[0].offsetWidth,
	                    height: e[0].offsetHeight
	                });
	                if (!coverLayerAdded) {
	                	coverLayerAdded = true;
	                	element.append(coverLayer);
	                }
	            }
	            scope._removeCoverLayer = function () {
	            	coverLayerAdded = false;
	                coverLayer.remove();
	            }
	        }
	    }
	}]);

    angular.module('WalkThroughModule')
	.controller('StepController', ['$scope', function ($scope) {

	    var self = this;
	    self._contentElement = null;

	    self._registerContent = function (contentEle) {
	        if (self._contentElement) {
	            console.log('Multiple wtStepContent directives detected. Only one is allowed per wtStep.');	
	        } else {
	            self._contentElement = contentEle;
	        }
	    }

	    self._unregisterContent = function () {
	        this._contentElement = null;
	    }
	}]);

    angular.module('WalkThroughModule')
	.directive('wtStep', ['$compile', '$q', '$document', '$templateCache', function ($compile, $q, $document, $templateCache) {
	    return {
	        restrict: 'A',
	        require: ['^walkthrough', 'wtStep'],
	        scope: {
                wtText: '@',
	            wtPosition: '@',
                wtGroup: '@'
	        },
	        controller: 'StepController',
	        link: function (scope, element, attrs, ctrls) {

	            var WalkThroughController = ctrls[0];
	            var StepController = ctrls[1];

	            (attrs.wtStep ? scope.wtStep = attrs.wtStep : console.log('Missing step number on wtStep directive'));
	            if (!StepController._contentElement && !scope.wtText) {
	                console.log('wtStep directive is missing content, need either wtText or wtStepContent.');
	            } else {
                    // Popover template calls into these
	                scope.cancel = WalkThroughController.cancel;
	                scope.next = WalkThroughController.next;
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

	                element.popover({
	                    html: true,
	                    trigger: 'manual',
	                    container: 'body',
	                    template: '<div class="popover wt-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>',
	                    viewport: {
	                        selector: 'body',
	                        padding: 2
	                    },
	                    placement: (scope.wtPosition ? scope.wtPosition : 'auto'),
	                    content: function () {
	                        return StepController._contentElement;
	                    }
	                });

	                // we need to register the step with the walkthrough controller
	                var originalZIndex, originalPosition;
	                WalkThroughController._registerStep({
	                    step: parseInt(scope.wtStep),
                        group: scope.wtGroup || 'default',
	                    show: function () {
	                        var deferred = $q.defer();
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
                            if ('wtHelper' in attrs) WalkThroughController._addHelperLayer(element);
                            if (!('wtInteract' in attrs)) WalkThroughController._addCoverLayer(element);

	                        // fix The Stacking Contenxt problem.
	                        // More detail: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Understanding_z_index/The_stacking_context
	                        var parentElm = element[0].parentNode;
	                        while (parentElm != null) {
	                            if (parentElm.tagName.toLowerCase() === 'body') break;
	                            var zIndex = _getPropValue(parentElm, 'z-index');
	                            var opacity = parseFloat(_getPropValue(parentElm, 'opacity'));
	                            var transform = _getPropValue(parentElm, 'transform') || _getPropValue(parentElm, '-webkit-transform') || _getPropValue(parentElm, '-moz-transform') || _getPropValue(parentElm, '-ms-transform') || _getPropValue(parentElm, '-o-transform');
	                            if (/[0-9]+/.test(zIndex) || opacity < 1 || transform !== 'none') {
	                                parentElm.className += ' wt-fixParent';
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
	                    },
	                    hide: function () {
	                        var deferred = $q.defer();
	                        element.on('hidden.bs.popover', function () {
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
	        }
	    }
	}]);

    angular.module('WalkThroughModule')
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
})();