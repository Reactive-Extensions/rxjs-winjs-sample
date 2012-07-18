/// <reference path="~/rxjs/rx.js" />
/// <reference path="~/rxjs/rx.time.js" />
/// <reference path="~/rxjs/reactivewinjs.js" />

(function () {
    'use strict';

    var socket;
    var connection = WinJS.Binding.as({
        state: 'connecting'
    });

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

            subscription = new Rx.CompositeDisposable();

            var observable = Rx.Subject.fromWebSocket('ws://localhost:8080', 'stock-protocol');

            //subscription.add(observable.subscribe(function (args) {
            //    var data = JSON.parse(args.data);
            //    var setDate = new Date().getTime();

            //    data.data.forEach(function (entry) {
            //        var set = getOrAddSet(entry.symbol);
            //        var x = parseFloat(entry.open);
            //        set.append(setDate, x);
            //    });
            //}, function (err) {
            //    console.log(err);
            //}));

            var stream = observable.selectMany(function (value) {
                var data = JSON.parse(value.data);
                return Rx.Observable.fromArray(data);
            }).groupBy(function (quote) {
                return quote.symbol;
            }).selectMany(function (stockStream) {
                return stockStream.bufferWithCount(5, 1);
            }, function (stockStream, window) {
                return { stockStream: stockStream, window: window };
            }).where(function (t) {
                return t.window.length > 0;
            }).select(function (t) {

                var len = t.window.length,
                    averageVolume = 0,
                    averageClose = 0,
                    averageHigh = 0,                 
                    averageLow = 0,
                    maxVolume = 0,
                    maxClose = 0,
                    maxHigh = 0,
                    maxLow = Number.MAX_VALUE;

                for (var i = 0; i < len; i++) {
                    var current = t.window[i];
                    var high = parseInt(current.high);
                    var low = parseInt(current.low);
                    var close = parseInt(current.close);
                    var volume = parseInt(current.volume);

                    if (volume > maxVolume) maxVolume = volume;
                    if (close > maxClose) maxClose = close;
                    if (high > maxHigh) maxHigh = high;
                    if (low < maxLow) maxLow = low;

                    averageVolume += volume;
                    averageClose += close;
                    averageHigh += high;
                    averageLow += low;
                }

                // Calculate averages
                averageVolume = averageVolume / len;
                averageClose = averageClose / len;
                averageHigh = averageHigh / len;
                averageLow = averageLow / len;

                return {
                    symbol: t.stockStream.key,
                    firstClose: t.window[0].close,
                    lastClose: t.window[len - 1].close,
                    firstDate: t.window[0].date,
                    lastDate: t.window[len - 1].date,
                    averageVolume: averageVolume,
                    averageHigh: averageHigh,
                    averageLow: averageLow,
                    maxVolume: maxVolume,
                    maxClose: maxClose,
                    maxHigh: maxHigh,
                    maxLow: maxLow
                };
            });

            subscription.add(
                stream.where(function (x) {
                    var percentage = (x.lastClose - x.firstClose) / x.firstClose;
                    return Math.abs(percentage) >= 0.1;
                }).subscribe(function (x) {
                    console.log('Price spiked by ' + x.symbol + ' from ' + x.firstClose + ' to ' + x.lastClose + ' in the week ending ' + x.lastDate);
                }, function (err) {
                    console.log(err);
                })
            );

            //subscription.add(
            //    stream.subscribe(function (x) {
            //        console.log(JSON.stringify(x));
            //    }, function (err) {
            //        console.log(err);
            //    })
            //);

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
