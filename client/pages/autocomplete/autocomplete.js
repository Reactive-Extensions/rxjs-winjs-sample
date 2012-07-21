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

    var searchPane = Windows.ApplicationModel.Search.SearchPane.getForCurrentView();
    var suggestionsRequested = Rx.Observable.fromEvent(searchPane, 'suggestionsrequested').publish().refCount();

    suggestionsRequested.subscribe(function (x) {
        console.log(x.queryText);
    });

    var suggestionObs = suggestionsRequested
        .select(function (e) { return { deferral: e.request.getDeferral(), eventObject: e }; })
        .throttle(1000)
        .select(function (e) {
            return searchWikipedia(e.eventObject.queryText).select(function (r) {
                return { results: r, eventObject: e.eventObject, deferral: e.deferral };
            });
        })
        .switchLatest();

    suggestionObs.subscribe(function (e) {
        var suggestionRequest = e.eventObject.request;
        suggestionRequest.searchSuggestionCollection.appendQuerySuggestions(e.results[1]);
        e.deferral.complete();
    });

    function searchWikipedia(term) {
        var url = 'http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search='
            + window.encodeURI(term);
        return WinJS.xhr({ url: url }).toObservable().select(function (response) {
            return JSON.parse(response.response);
        });
    }

    var subscription;
    function initialize() {

        if (subscription && !subscription.isDisposed) {
            subscription.dispose();
        }
        subscription = new Rx.SingleAssignmentDisposable();

        // Get input/output
        var input = document.querySelector('#rxInput');
        var resultsList = document.querySelector('#rxResults');

        // Handle Key ups
        var keyup = Rx.Observable.fromEvent(input, 'keyup')
            .select(function (ev) {
                return ev.currentTarget.value;
            })
            .where(function (text) {
                return text.length > 2;
            })
            .throttle(500)
            .distinctUntilChanged();

        // Handle query
        var searcher = keyup
            .select(function (text) {
                return searchWikipedia(text);
            })
            .switchLatest()
            .where(function (results) {
                return results.length === 2;
            });

        // Subscribe to results and handle the cancellation
        subscription.setDisposable(searcher.subscribe(
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
            }));
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
            subscription.dispose();
        }
    });
})();
