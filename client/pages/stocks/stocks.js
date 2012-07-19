/// <reference path="~/rxjs/rx.js" />
/// <reference path="~/rxjs/rx.time.js" />
/// <reference path="~/rxjs/reactivewinjs.js" />

(function () {
    'use strict';

    var subscription;

    WinJS.UI.Pages.define('/pages/stocks/stocks.html', {
        connection: WinJS.Binding.as({
            state: 'connecting'
        }),
        ready: function (element, options) {
            var sets = {};
            var colors = new Sample.colorProvider();
            var connection = WinJS.Binding.as({
                state: 'connecting'
            });

            WinJS.Binding.processAll(element.querySelector('#state'), connection);

            function getOrAddSet(name, type) {

                var setName = (type) ? name + '.' + type : name;
                if (sets[setName]) return sets[setName];

                var set = new TimeSeries({ type: type });
                sets[setName] = set;
                smoothie.addTimeSeries(set, { strokeStyle: colors.forKey(name), lineWidth: 1 });
                return set;
            }

            var smoothie = new SmoothieChart({
                minValue: 0.0,
                millisPerPixel: 20,
                grid: {
                    strokeStyle: '#555555',
                    lineWidth: 1,
                    millisPerLine: 1000,
                    verticalSections: 12
                }
            });

            smoothie.streamTo(document.getElementById('chart'), 1000);

            subscription = new Rx.CompositeDisposable();

            var observable = Rx.Subject.fromWebSocket('ws://localhost:8080', 'stock-protocol', function () {
                connection.state = 'server found';
            });

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
                stream
                .subscribe(function (x) {
                    var timeStamp = new Date().getTime()
                    var set = getOrAddSet(x.symbol);
                    var price = parseFloat(x.lastClose);
                    set.append(timeStamp, price);

                    var percentage = (x.lastClose - x.firstClose) / x.firstClose;
                    if (Math.abs(percentage) >= 0.1) {
                        console.log('Price spiked by ' + x.symbol + ' from ' + x.firstClose + ' to ' + x.lastClose + ' in the week ending ' + x.lastDate);
                        var sticks = getOrAddSet(x.symbol, 'candlestick');
                        var radius = Math.abs(percentage) * 33;
                        sticks.append(timeStamp, price, radius);
                    }
                    
                }, function (err) {
                    connection.state = 'error';
                    console.log(err);
                })
            );
        },

        unload: function () {
            subscription.dispose();
        }
    });
})();
