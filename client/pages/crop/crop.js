(function () {
    'use strict';

    var utilities = WinJS.Utilities;

    WinJS.UI.Pages.define('/pages/crop/crop.html', {

        ready: function (element, options) {

            var tools = [];
            var rect = {
                x: null,
                y: null,
                x2: null,
                y2: null
            };

            var selectedElement = null;

            var container = document.querySelector('#container'),
                buffer = document.querySelector('#buffer'),
                overlay = document.querySelector('#overlay'),
                // We use a DOM element to draw a dotted line, because
                // it is a bit complicated to do so with a canvas.
                box = document.querySelector('#bounding-box');

            var ctx = overlay.getContext('2d');

            var img = document.createElement('img');
            img.src = '/pages/crop/images/leaf twirl.jpg';
            img.addEventListener('load', function (args) {
                overlay.width = img.width;
                overlay.height = img.height;

                buffer.width = img.width;
                buffer.height = img.height;
                buffer.getContext('2d').drawImage(img, 0, 0);

                resetHandles();
            }, false);

            function resetHandles() {
                rect.x = 0;
                rect.y = 0;
                rect.x2 = overlay.width;
                rect.y2 = overlay.height;

                var w = rect.x2 - rect.x;
                var h = rect.y2 - rect.y;
                drawOverlay(rect.x, rect.y, w, h);
            }

            function drawOverlay(x, y, w, h) {
                var dotted_line = box.style;

                ctx.globalCompositeOperation = 'source-over';

                ctx.clearRect(0, 0, overlay.width, overlay.height);

                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, overlay.width, overlay.height);

                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.fillRect(x, y, w, h);
                ctx.fill();

                tools.forEach(function (tool) { tool['position'](); });

                dotted_line.top = y + 'px';
                dotted_line.left = x + 'px';
                dotted_line.width = w + 'px';
                dotted_line.height = h + 'px';
            }

            function animateOverlay() {
                var w = rect.x2 - rect.x;
                var h = rect.y2 - rect.y;

                drawOverlay(rect.x, rect.y, w, h);

                if (selectedElement) {
                    window.requestAnimationFrame(animateOverlay);
                }
            }

            createHandle(container, 'tl', function () {
                this.style.top = rect.y + 'px';
                this.style.left = rect.x + 'px';
            });

            createHandle(container, 'tr', function () {
                this.style.top = rect.y + 'px';
                this.style.left = rect.x2 + 'px';
            });

            createHandle(container, 'bl', function (s) {
                this.style.top = rect.y2 + 'px';
                this.style.left = rect.x + 'px';
            });

            createHandle(container, 'br', function (s) {
                this.style.top = rect.y2 + 'px';
                this.style.left = rect.x2 + 'px';
            });

            function createHandle(container, id, position) {
                var handle = document.createElement('div');
                utilities.addClass(handle, 'handle');
                handle.setAttribute('id', id);
                container.appendChild(handle);

                handle.addEventListener('mousedown', function (args) {
                    selectedElement = args.currentTarget;;
                    window.requestAnimationFrame(animateOverlay);
                }, false);

                overlay.addEventListener('mousemove', function (args) {
                    if (!selectedElement) return;

                    var t = selectedElement,
                        x = (args.offsetX),
                        y = (args.offsetY);

                    switch (t.id) {
                        case 'tl':
                            rect.x = x;
                            rect.y = y;
                            break;
                        case 'tr':
                            rect.y = y;
                            rect.x2 = x;
                            break;
                        case 'bl':
                            rect.x = x;
                            rect.y2 = y;
                            break;
                        case 'br':
                            rect.y2 = y;
                            rect.x2 = x;
                            break;
                    }

                }, true);

                document.addEventListener('mouseup', function (args) {
                    selectedElement = null;
                }, true);

                handle['position'] = position;

                tools.push(handle);
            };
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
