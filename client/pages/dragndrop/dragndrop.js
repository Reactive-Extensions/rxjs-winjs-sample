/// <reference path="/rxjs/rx.js" />
/// <reference path="/rxjs/reactivewinjs.js" />
(function () {
    "use strict";

    var subscription;
    function initialize() {
        subscription =  new Rx.SingleAssignmentDisposable();

        var dragTarget = document.querySelector('#dragTarget');

        // Get the three major events
        var mouseup = Rx.Observable.fromEvent(dragTarget, 'mouseup').publish().refCount();
        var mousemove = Rx.Observable.fromEvent(document, 'mousemove').publish().refCount();
        var mousedown = Rx.Observable.fromEvent(dragTarget, 'mousedown').publish().refCount();

        // Get the three major events
        
        var mousedrag = mousedown.selectMany(function (md) {
            // calculate offsets when mouse down
            var startX = md.offsetX;
            var startY = md.offsetY;

            return mousemove.select(function (mm) {
                mm.preventDefault();

                return {
                    element: md.target,
                    left: mm.clientX - startX,
                    top: mm.clientY - startY
                };
            }).takeUntil(mouseup);
        });

        subscription.setDisposable(mousedrag.subscribe(function (pos) {
            // Update position
            var element = pos.element;
            element.style.top = pos.top + 'px';
            element.style.left = pos.left + 'px';
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
