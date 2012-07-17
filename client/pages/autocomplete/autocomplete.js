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

    function searchWikipedia(term) {
        var url = 'http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search='
            + window.encodeURI(term);// + '&callback=JSONPCallback';
        return WinJS.xhr({url: url}).toObservable();
    }

    var subscription;
    function initialize() {
        if (subscription) {
            subscription.dispose();
        }

        // Get input/output
        var input = document.querySelector('#rxInput');
        var resultsList = document.querySelector('#rxResults');

        var keyup = Rx.Observable.fromEvent(input, 'keyup')
            .select(function (ev) {
                return ev.currentTarget.value;
            })
            .where(function (text) {
                return text.length > 2;
            })
            .throttle(500)
            .distinctUntilChanged();

        var searcher = keyup
            .select(function (text) {
                return searchWikipedia(text);
            })
            .switchLatest()
            .select(function (response) {
                return JSON.parse(response.response);
            })
            .where(function (results) {
                return results.length === 2;
            });

        subscription = searcher.subscribe(
            function (data) {
                var results = data[1];
                clearChildren(resultsList);

                results.forEach(function (result) {
                    var li = document.createElement('li');
                    li.innerText = result;
                    resultsList.appendChild(li);
                });
            },
            function (err) {
                clearChildren(resultsList);
                var li = document.createElement('li');
                li.innerText = err;
                resultsList.appendChild(li);
            });
    }

    WinJS.UI.Pages.define("/pages/autocomplete/autocomplete.html", {
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
            if (subscription) {
                subscription.dispose();
            }
        }
    });
})();
