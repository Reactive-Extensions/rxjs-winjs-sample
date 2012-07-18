(function () {
    'use strict';

    var navigate = WinJS.Navigation.navigate,
        animation = WinJS.UI.Animation;

    var menu = [
    {
        name: 'Image Crop',
        page: 'crop'
    },
    {
        name: 'Stocks',
        page: 'stocks'
    },
    {
        name: 'Time Files',
        page: 'timeflies'
    },
    {
        name: 'AutoComplete',
        page: 'autocomplete'
    },
    {
        name: 'Canvas Painting',
        page: 'canvaspaint'
    },
    {
        name: 'Drag and Drop',
        page: 'dragndrop'
    },
    {
        name: 'Buffering',
        page: 'buffering'
    },
    {
        name: 'Binding',
        page: 'binding'
    }
    ];


    function gotoPage(args) {
        args.detail.itemPromise.then(function (item) {
            var id = item.data.page;
            navigate('/pages/' + id + '/' + id + '.html'); 
        });
    }

    WinJS.UI.Pages.define('/pages/hub/hub.html', {

        ready: function (element, options) {
            var listView = document.querySelector('[data-win-control="WinJS.UI.ListView"]').winControl;
            listView.itemDataSource = new WinJS.Binding.List(menu).dataSource;
            listView.addEventListener('iteminvoked', gotoPage);

            animation.enterPage(document.querySelectorAll('header,section'));
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name='element' domElement='true' />
            /// <param name='viewState' value='Windows.UI.ViewManagement.ApplicationViewState' />
            /// <param name='lastViewState' value='Windows.UI.ViewManagement.ApplicationViewState' />

            // TODO: Respond to changes in viewState.
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        }
    });
})();
