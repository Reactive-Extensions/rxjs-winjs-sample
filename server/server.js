var WebSocketServer = require('websocket').server;
var http = require('http');
var fileserver = require('./fileserver');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var data = fileserver.loadData();
var dataLength = data.length;
var rowLength = data[0].length;

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('stock-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    var currentRow = rowLength - 1;
    var id = setInterval(function () {

        var results = { data: [] };
        for (var i = 0; i < dataLength; i++) {
            if (i === 0) {
                results.date = data[i][currentRow].date;
            }
            results.data.push(data[i][currentRow]);
        }
        currentRow--;
        connection.sendUTF(JSON.stringify(results));

        if (currentRow === 0) {
            clearInterval(id);
        }        

    }, 1000);

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});