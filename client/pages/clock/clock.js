/// <reference path="/rxjs/rx.js" />
/// <reference path="/rxjs/rx.time.js" />
/// <reference path="/rxjs/reactivewinjs.js" />
(function () {
    "use strict";

    var timeConverter = WinJS.Binding.converter(function(date) {
        var currentDate = new Date(date),
            hours = currentDate.getHours(),
            minutes = currentDate.getMinutes(),
            seconds = currentDate.getSeconds();
        
        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;
        if (seconds < 10) seconds = '0' + seconds;

        return hours + ':' + minutes + ':' + seconds;
    });

    WinJS.Namespace.define('WinJSClock.Converters', {
       timeConverter: timeConverter 
    });

    var subscription;

    WinJS.UI.Pages.define("/pages/clock/clock.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {

            var clock = WinJS.Binding.as({
                currentTime: new Date().getTime()  
            });

            WinJS.Binding.processAll(null, clock);

            subscription = new Rx.SingleAssignmentDisposable();

            subscription.setDisposable(Rx.Observable.interval(100).timestamp().subscribe(function(ts) {
                clock.currentTime = ts.timestamp;
            }));
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
