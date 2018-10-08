var fs = require('fs');
var colors = require('colors/safe');
var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 40510 });
console.log(colors.magenta("Web Socket Listenning on Port:" + 40510));



wss.on('connection', function (ws) {
    console.log("connected");
    ws.on('message', function (message) {
        console.log('received: %s', message)
    })

    // setInterval(
    //     () => {
    //         if (ws.readyState == 1) {
    //             ws.send(`${Math.random() * 200}`)
    //         }
    //     },
    //     1000
    // );
})


var configObj = JSON.parse(fs.readFileSync('./serial-config.json', 'utf8'));

var rs232WeighingListener = require("./modules/rs232Listener");
var rs232RfIdListener = require("./modules/rs232Listener");

// rs232Listener.init('/dev/ttyUSB0', 9600, 8,'none',wss);
rs232WeighingListener.init('weight',configObj.weighingPort, 9600, 8,'none',wss);
rs232RfIdListener.init('rfId',configObj.rfIdPort, 9600, 8,'none',wss);

