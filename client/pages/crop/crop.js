/// <reference path="../../rxjs/rx.js" />
/// <reference path="../../rxjs/reactivewinjs.js" />

(function () {
    'use strict';

    var utilities = WinJS.Utilities,
        promise = WinJS.Promise;

    // Start with `ready`. It's the function that is invoked when the page is loaded.

    WinJS.UI.Pages.define('/pages/crop/crop.html', {

        // a model for the region of the image about to be cropped
        boundingBox: {
            x: 0,
            y: 0,
            x2: 0,
            y2: 0
        },
        // an array of draggable elements that modify the crop region
        handles: [],
        loadImage: function () {
            var overlay = this.overlay;

            // This promise completes when the img is loaded.
            return new promise(function (complete, error, progress) {

                // `buffer` displays the actual image to crop
                var buffer = document.querySelector('#buffer');

                var img = document.createElement('img');
                img.src = '/pages/crop/images/leaf twirl.jpg';

                img.addEventListener('load', function (args) {
                    overlay.width = img.width;
                    overlay.height = img.height;

                    buffer.width = img.width;
                    buffer.height = img.height;
                    buffer.getContext('2d').drawImage(img, 0, 0);

                    // return the dimensions of the image we just loaded
                    complete({
                        width: img.width,
                        height: img.height
                    });

                }, false);
            });
        },
        initBoundingBox: function (size) {
            this.boundingBox.x = 0;
            this.boundingBox.y = 0;
            this.boundingBox.x2 = size.width;
            this.boundingBox.y2 = size.height;
            return promise.wrap(this.boundingBox);
        },
        createHandles: function (boundingBox) {
            var container = document.querySelector('#container'),
                handles = [];

            function createHandle(id, render, updateModel) {
                var handle = document.createElement('div');
                utilities.addClass(handle, 'handle');
                handle.setAttribute('id', id);
                container.appendChild(handle);

                // `render` allows us to visually update the handle after it has been dragged
                handle['render'] = render;
                // `updateModel` allows us to modify the correct part of the crop region model
                handle['updateModel'] = updateModel;

                handles.push(handle);
            };

            // top left
            createHandle('tl', function () {
                this.style.top = boundingBox.y + 'px';
                this.style.left = boundingBox.x + 'px';
            }, function (x, y) {
                boundingBox.x = x;
                boundingBox.y = y;
            });

            //top right
            createHandle('tr', function () {
                this.style.top = boundingBox.y + 'px';
                this.style.left = boundingBox.x2 + 'px';
            }, function (x, y) {
                boundingBox.y = y;
                boundingBox.x2 = x;
            });

            // bottom left
            createHandle('bl', function (s) {
                this.style.top = boundingBox.y2 + 'px';
                this.style.left = boundingBox.x + 'px';
            }, function (x, y) {
                boundingBox.x = x;
                boundingBox.y2 = y;
            });

            // bottom right
            createHandle('br', function (s) {
                this.style.top = boundingBox.y2 + 'px';
                this.style.left = boundingBox.x2 + 'px';
            }, function (x, y) {
                boundingBox.y2 = y;
                boundingBox.x2 = x;
            });

            // render the handles in their initial positiions
            handles.forEach(function (element) { element['render'](); });

            return new promise(function (complete, error, progress) {
                complete(handles);
            });
        },
        drawOverlay: function (x, y, w, h) {
            var boundingBox = this.boundingBox,
                x = boundingBox.x,
                y = boundingBox.y,
                w = boundingBox.x2 - boundingBox.x,
                h = boundingBox.y2 - boundingBox.y,
                ctx = this.ctx;

            ctx.globalCompositeOperation = 'source-over';

            ctx.clearRect(0, 0, overlay.width, overlay.height);

            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, overlay.width, overlay.height);

            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fillRect(x, y, w, h);
            ctx.fill();

            if (this.handles)
                this.handles.forEach(function (tool) { tool['render'](); });
        },
        respondToGestures: function (handles) {
            var self = this,
                fromEvent = Rx.Observable.fromEvent,
                boundingBox = this.boundingBox,
                moves = fromEvent(self.overlay, 'mousemove');

            self.handles = handles;

            fromEvent(handles, 'mousedown')
                // When the mouse is down on a handle, return the handle element
                .select(function (x) { return x.currentTarget; })
                .merge(fromEvent(document, 'mouseup')
                // However, when the mouse is up (anywhere on the document),
                // then don't return an element 
                .select(function (x) { return false; }))
                // Then combine the handle element with the position of the 
                // the mouse with respect to the overlay
                .select(function (el) {
                    return moves.select(function (args) {
                        return {
                            element: el,
                            offsetX: args.offsetX,
                            offsetY: args.offsetY
                        };
                    });
                })
                .switchLatest()
                // Throw out any items that didn't have an element
                .where(function (x) {
                    return x.element !== false;
                })
                // Finally, update the bounding box model and request a redraw
                .subscribe(function (data) {
                    data.element.updateModel(data.offsetX, data.offsetY);
                    window.requestAnimationFrame(self.drawOverlay.bind(self));
                });
        },
        ready: function (element, options) {
            var self = this;

            var
            // When we invoke these functions from a Promise
            // they lose their binding to `this`.
            // TODO: Is there a way to fix this?
            initBoundingBox = self.initBoundingBox.bind(self),
            createHandles = self.createHandles.bind(self),
            respondToGestures = self.respondToGestures.bind(self);

            // `overlay` allows us to darken the portion 
            // of the image that will be removed.
            this.overlay = document.querySelector('#overlay');
            this.ctx = overlay.getContext('2d');

            // We use a DOM element to draw a dotted line, because
            // it is a bit complicated to do so with a canvas.
            this.box = document.querySelector('#bounding-box');

            this.loadImage()
                .then(initBoundingBox)
                .then(createHandles)
                .then(respondToGestures);
        }
    });
})();
