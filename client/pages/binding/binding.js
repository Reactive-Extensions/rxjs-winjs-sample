/// <reference path="/rxjs/rx.js" />
/// <reference path="/rxjs/reactivewinjs.js" />
(function () {
    "use strict";

    var subscription;

    WinJS.UI.Pages.define("/pages/binding/binding.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {

            subscription = new Rx.CompositeDisposable();
            
            var person1 = {
                firstName: 'Matthew',
                lastName: 'Podwysocki'
            };  

            WinJS.Binding.processAll(document.getElementById('customerDetails1'), person1);

            subscription.add(person1.toObservable('firstName', 'lastName').subscribe(function (x) {
                console.log(x);
            }));
            
            var person2 = {
                firstName: 'Bart',
                lastName: 'De Smet'
            };

            WinJS.Binding.processAll(document.getElementById('customerDetails2'), person2);
            
            subscription.add(person2.toObservable('firstName', 'lastName').subscribe(function (x) {
                console.log(x);
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
