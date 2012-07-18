(function () {
    'use strict';

    var socket;
    var connection = WinJS.Binding.as({
        state: 'connecting'
    });

    Rx.Observable.fromSocket = function (url, protocol) {
        return Rx.Observable.create(function (observer) {
            var socket = new WebSocket(url, protocol);

            socket.onmessage = function (data) {
                observer.onNext(data);
            };

            socket.onerror = function (err) {
                observer.onError(err);
            };

            socket.onclose = function () {
                observer.onCompleted();
            };

            return function () {
                socket.close();
            };
        });
        
    };

    var subscription;

    WinJS.UI.Pages.define('/pages/stocks/stocks.html', {

        ready: function (element, options) {

            WinJS.Binding.processAll(element.querySelector('#state'), connection);

            var sets = {};

            function getOrAddSet(name) {

                if (sets[name]) return sets[name];

                var set = new TimeSeries();
                sets[name] = set;
                smoothie.addTimeSeries(set, { strokeStyle: 'rgba(255, 0, 0, 1)', fillStyle: 'rgba(255, 0, 0, 0.2)', lineWidth: 1 });
                return set;
            }

            var smoothie = new SmoothieChart({
                minValue: 0.0,
                maxValue: 100.0,
                millisPerPixel: 20,
                grid: {
                    strokeStyle: '#555555',
                    lineWidth: 1,
                    millisPerLine: 1000,
                    verticalSections: 12
                }
            });

            //smoothie.addTimeSeries(dataSet1, { strokeStyle: 'rgba(255, 0, 0, 1)', fillStyle: 'rgba(255, 0, 0, 0.2)', lineWidth: 3 });
            //smoothie.addTimeSeries(dataSet2, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 3 });
            //smoothie.addTimeSeries(dataSet3, { strokeStyle: 'rgba(0, 0, 255, 1)', fillStyle: 'rgba(0, 0, 255, 0.2)', lineWidth: 3 });
            smoothie.streamTo(document.getElementById('chart'), 1000);

            subscription = new Rx.SingleAssignmentDisposable();

            var observable = Rx.Observable.fromSocket('ws://localhost:8080', 'stock-protocol');

            subscription.setDisposable(observable.subscribe(function (args) {
                var data = JSON.parse(args.data);
                var setDate = new Date().getTime();

                data.data.forEach(function (entry) {
                    var set = getOrAddSet(entry.symbol);
                    var x = parseFloat(entry.open);
                    set.append(setDate, x);
                });
            }));

            //socket = new WebSocket('ws://localhost:8080', 'stock-protocol');
            //socket.addEventListener('open', function () {
            //    connection.state = 'server found';
            //});

            //socket.addEventListener('error', function (args) {
            //    connection.state = 'error';
            //    debugger;
            //});

            //socket.addEventListener('message', function (args) {
                //var data = JSON.parse(args.data);
                ////var setDate = new Date(data.date).getTime();
                //var setDate = new Date().getTime();

                //data.data.forEach(function (entry) {
                //    var set = getOrAddSet(entry.symbol);
                //    var x = parseFloat(entry.open);
                //    set.append(setDate, x);
                //});
            //});


        },

        unload: function () {
            //socket.close();
            subscription.dispose();
        }
    });
})();
