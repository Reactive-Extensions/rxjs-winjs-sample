/// <reference path="~/rxjs/rx.js" />
/// <reference path="~/rxjs/rx.time.js" />
/// <reference path="~/rxjs/reactivewinjs.js" />
(function () {
    "use strict";

    function clearChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    var subscription;
    function initialize() {
        if (subscription && !subscription.isDisposed) {
            subscription.dispose();
        }

        subscription = new Rx.SingleAssignmentDisposable();

        var results = document.querySelector('#rxResults');
        var mousemoves = Rx.Observable.fromEvent(document, 'mousemove')
            .select(
                function (ev) {
                    return { left: ev.clientX, top: ev.clientY };
                })
            .bufferWithTime(100);

        subscription.setDisposable(mousemoves.subscribe(function (positions) {
            clearChildren(results);

            positions.forEach(function (position) {
                var li = document.createElement('li');
                li.innerText = position.left + ',' + position.top;
                results.appendChild(li);
            });
        }));


    }

    WinJS.UI.Pages.define("/pages/buffering/buffering.html", {
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
