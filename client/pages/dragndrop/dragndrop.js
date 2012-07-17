/// <reference path="/rxjs/rx.js" />
/// <reference path="/rxjs/reactivewinjs.js" />
(function () {
    "use strict";

    function getOffset(element) {
        var doc = element.ownerDocument,
            docElem = doc.documentElement,
            body = doc.body,
            clientTop = docElem.clientTop || body.clientTop || 0,
            clientLeft = docElem.clientLeft || body.clientLeft || 0,
            scrollTop = window.pageYOffset,
            scrollLeft = window.pageXOffset;

        return { top: scrollTop - clientTop, left: scrollLeft - clientLeft };
    }

    var subscription = new Rx.SingleAssignmentDisposable();
    function initialize() {
        if (subscription && !subscription.isDisposed) {
            subscription.dispose();
        }

        var dragTarget = document.querySelector('#dragTarget');

        // Get the three major events
        var mouseup = Rx.Observable.fromEvent(dragTarget, 'mouseup');
        var mousemove = Rx.Observable.fromEvent(mousemove, 'mousemove');
        var mousedown = Rx.Observable.fromEvent(dragTarget, 'mousedown').select(function (event) {
            // calculate offsets when mouse down
            event.preventDefault();
            var offset = getOffset(dragTarget);
            return { left: event.clientX - offset.left, top: event.clientY - offset.top };
        });

        // Combine mouse down with mouse move until mouse up
        var mousedrag = mousedown.selectMany(function (imageOffset) {
            return mousemove.select(function (pos) {
                // calculate offsets from mouse down to mouse moves
                return {
                    left: pos.clientX - imageOffset.left, top: pos.clientY - imageOffset.top
                };
            }).takeUntil(mouseup);
        });

        subscription.setDisposable(mousedrag.subscribe(function (pos) {
            // Update position
            dragTarget.style.top = pos.top + 'px';
            dragTarget.style.left = pos.left + 'px';         
        }));
    }

    WinJS.UI.Pages.define("/pages/dragndrop/dragndrop.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            initialize();
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />
            /// <param name="viewState" value="Windows.UI.ViewManagement.ApplicationViewState" />
            /// <param name="lastViewState" value="Windows.UI.ViewManagement.ApplicationViewState" />

            // TODO: Respond to changes in viewState.
        },

        unload: function () {
            subscription.dispose();
        }
    });
})();
