'use strict';

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