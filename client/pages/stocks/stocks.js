/// <reference path="~/rxjs/rx.js" />
/// <reference path="~/rxjs/rx.time.js" />
/// <reference path="~/rxjs/reactivewinjs.js" />

(function () {
    'use strict';

    var subscription;

    function setupChart() {

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

        smoothie.streamTo(document.querySelector('#chart'), 1000);

        return smoothie;
    }

    function calculate(t) {

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
            timestamp: new Date().getTime(),
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
    }

    WinJS.UI.Pages.define('/pages/stocks/stocks.html', {

        // the current selected item on the legend
        selection: WinJS.Binding.as({
            symbol: '',
            lastClose: ''
        }),

        // status about the serve connection
        connection: WinJS.Binding.as({
            state: 'connecting'
        }),

        // the list of symbols that have been received from the server
        legend: new WinJS.Binding.List(),

        // setting up the bindings and controls
        setupBindings: function (element) {
            var processAll = WinJS.Binding.processAll;
            var self = this;

            processAll(element.querySelector('#selectedSymbol'), this.selection);
            processAll(element.querySelector('#state'), this.connection);

            var lv = document.querySelector('#legend').winControl;
            lv.itemDataSource = this.legend.dataSource;
            lv.addEventListener('selectionchanged', function () {
                // when an item is selected on the legend,
                // begin tracking the stats of that item
                lv.selection.getItems().then(function (items) {
                    self.selection.symbol = items[0].data.symbol;
                    self.selection.lastClose = '...';
                });
            });
        },

        ready: function (element, options) {
            var self = this;
            var sets = {};
            var connection = this.connection;
            var selection = this.selection;
            var legend = this.legend;
            var colors = new Sample.colorProvider();

            var smoothie = setupChart();

            this.updateLayout();
            this.setupBindings(element);

            function getOrAddSet(name, type) {

                var setName = (type) ? name + '.' + type : name;
                if (sets[setName]) return sets[setName];

                var set = new TimeSeries({ type: type });
                sets[setName] = set;
                smoothie.addTimeSeries(set, { strokeStyle: colors.forKey(name), lineWidth: 1 });
                return set;
            }

            function onError(err) {
                connection.state = 'error';
                console.log(err);
                debugger;
            }

            subscription = new Rx.CompositeDisposable();

            var observable = Rx.Subject.fromWebSocket('ws://localhost:8080', 'stock-protocol', function () {
                connection.state = 'server found';
            });

            var stream = observable
                .selectMany(function (value) {
                    var data = JSON.parse(value.data);
                    return Rx.Observable.fromArray(data);
                })
                .groupBy(function (quote) {
                    return quote.symbol;
                })
                .selectMany(function (stockStream) {
                    return stockStream.bufferWithCount(5, 1);
                }, function (stockStream, window) {
                    return { stockStream: stockStream, window: window };
                })
                .where(function (t) {
                    return t.window.length > 0;
                })
                .select(calculate)
                .publish()
                .refCount();

            var latestPrice = stream
                .where(function (x) {
                    return x.symbol === selection.symbol;
                })
                .sample(3000 /*ms*/)
                .subscribe(function (x) {
                    selection.lastClose = x.lastClose;
                });

            var symbols = stream
                .subscribe(function (x) {
                    if (connection.state !== 'receiving data') { connection.state = 'receiving data'; }
                    if (!legend.some(function (item) { return item.symbol === x.symbol; })) {
                        legend.push({
                            symbol: x.symbol,
                            color: colors.forKey(x.symbol)
                        });
                    }
                }, onError);

            var lineGraph = stream
                .subscribe(function (x) {
                    var set = getOrAddSet(x.symbol);
                    set.append(x.timestamp, x.lastClose);
                }, onError);

            var spikes = stream
                .doAction(function (x) {
                    x.spike = (x.lastClose - x.firstClose) / x.firstClose;
                })
                .where(function (x) {
                    return Math.abs(x.spike) >= 0.1;
                })
                .subscribe(function (x) {
                    //console.log('Price spiked by ' + x.symbol + ' from ' + x.firstClose + ' to ' + x.lastClose + ' in the week ending ' + x.lastDate);
                    var sticks = getOrAddSet(x.symbol, 'candlestick');
                    var radius = Math.abs(x.spike) * 33;
                    sticks.append(x.timestamp, x.lastClose, radius);
                }, onError);

            subscription.add(lineGraph, spikes);
        },

        updateLayout: function () {
            // Make the chart the same size as it's container.
            var section = document.querySelector('#chartLayoutRoot');
            var chart = document.querySelector('#chart');
            chart.width = section.clientWidth;
            chart.height = section.clientHeight;
        },

        unload: function () {
            subscription.dispose();
        }
    });
})();
