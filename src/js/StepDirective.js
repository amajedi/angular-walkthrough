'use strict';

angular.module('angular-walkthrough')
.directive('wtStep', ['$compile', '$q', '$document', '$templateCache', '$timeout', function ($compile, $q, $document, $templateCache, $timeout) {
    return {
        restrict: 'A',
        require: ['^walkthrough', 'wtStep'],
        controller: 'StepController',
        link: function (parentScope, element, attrs, ctrls) {
            var scope = {}
            scope.wtText        = attrs.wtText;
            scope.wtPosition    = attrs.wtPosition;
            scope.wtGroup       = attrs.wtGroup;
            scope.wtBtnText     = attrs.wtBtnText;
            scope.wtOnNext      = attrs.wtOnNext;
            scope.customCss     = attrs.wtStepCss;
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
                        element.popover({
                            html: true,
                            trigger: 'manual',
                            container: 'body',
                            template: '<div class="popover wt-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content wt-popover-content"></div></div>',
                            viewport: {
                                selector: 'body',
                                padding: 2
                            },
                            placement: (this.wtPosition ? this.wtPosition : 'auto'),
                            content: function () {
                                return StepController._contentElement;
                            }
                        });

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
        }
    }
}]);