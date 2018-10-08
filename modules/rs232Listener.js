var SerialPort = require("serialport");
var colors = require('colors/safe');
var WebSocketServer = require('ws').Server;

var port;
var PORT = "";
var _wss;

function openPort() {
    if (!port)
        return;

    var found = false;
    SerialPort.list(function (err, ports) {
        for (var i = 0; i < ports.length; i++) {
            console.log(ports[i].comName);
            if (ports[i].comName == port.path) {
                found = true;
                break;
            }
        }

        if (!found) {
            setTimeout(openPort, 3000, 'reconnect');
            console.log(colors.red('[Rs232 Listener] Cannot found the port : ' + PORT));
        }
        else {
            port.removeAllListeners('open');
            port.on('open', onOpen);

            if (port.portName != "")
                port.open(function (err) {
                    if (err) {
                        setTimeout(openPort, 3000, 'reconnect');
                        var errMessage = err == null ? "Unknown" : err.message == null ? err : err.message;
                        console.log(colors.red('[Rs232 Listener Error] Connection error on COM PORT: ' + PORT + ' ' + errMessage));
                    }

                });
        }
    });
}

function onOpen() {
    console.log(colors.green('[Rs232 Listener] Conection established on port:' + PORT));

    port.removeAllListeners('close');
    port.on('close', onClose);

    port.removeAllListeners('error');
    port.on('error', onError);

    port.removeAllListeners('data');
    port.on('data', onData);
}

function onClose() {
    console.log(colors.magenta('[Rs232 Listener] Connection closed from Port:' + PORT));
    if (port) {
        port.removeAllListeners('open');
        port.removeAllListeners('close');
        port.removeAllListeners('error');
        port.removeAllListeners('data');
    }
    setTimeout(openPort, 3000, 'reconnect');
}

function onError(err) {
    var errMessage = err == null ? "Unknown" : err.message == null ? err : err.message;
    console.log(colors.red('[Rs232 Listener Error] on COM PORT: ' + PORT + ' ' + errMessage));
}

function onData(data) {
    var strData=data.toString().replace('\r','').replace('\n','');
    console.log('[Rs232 Listener] Data on PORT:' + PORT + ': ' + strData);
    var webSocketPacket={type:'rfId',payload:{
        rfId:strData
    }};

    webSocketPacketJsonString= JSON.stringify(webSocketPacket);

    _wss.clients.forEach(function each(client) {
        if (client.readyState === 1) {
          client.send(webSocketPacketJsonString);
        }
      });

}

exports.init = function (portName, baudRare, dataBits, parity, wss) {
    PORT = portName;
    port = new SerialPort(portName, {
        autoOpen: false,
        baudRate: baudRare,
        dataBits: dataBits,
        parity: parity,
    });

    if (port == null)
        return;

    _wss = wss;
    openPort();
}





