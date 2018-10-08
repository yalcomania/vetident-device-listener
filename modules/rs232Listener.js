

var serialPortListener= function(type, portName, baudRare, dataBits, parity, wss){

    var SerialPort = require("serialport");
    var colors = require('colors/safe');
    var WebSocketServer = require('ws').Server;

    var _serialPortDevice=null;
    var PORT = portName;
    var _wss=wss;
    var _type = type;

    init();





function openPort() {
    if (!_serialPortDevice)
        return;

    var found = false;
    SerialPort.list(function (err, ports) {
        for (var i = 0; i < ports.length; i++) {
            console.log(ports[i].comName);
            if (ports[i].comName == _serialPortDevice.path) {
                found = true;
                break;
            }
        }

        if (!found) {
            setTimeout(openPort, 3000, 'reconnect');
            console.log(colors.red('[Rs232 Listener] Cannot found the port : ' + PORT));
        }
        else {
            _serialPortDevice.removeAllListeners('open');
            _serialPortDevice.on('open', onOpen);

            if (_serialPortDevice.portName != "")
            _serialPortDevice.open(function (err) {
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

    _serialPortDevice.removeAllListeners('close');
    _serialPortDevice.on('close', onClose);

    _serialPortDevice.removeAllListeners('error');
    _serialPortDevice.on('error', onError);

    _serialPortDevice.removeAllListeners('data');
    _serialPortDevice.on('data', onData);
}

function onClose() {
    console.log(colors.magenta('[Rs232 Listener] Connection closed from Port:' + PORT));
    if (_serialPortDevice) {
        _serialPortDevice.removeAllListeners('open');
        _serialPortDevice.removeAllListeners('close');
        _serialPortDevice.removeAllListeners('error');
        _serialPortDevice.removeAllListeners('data');
    }
    setTimeout(openPort, 3000, 'reconnect');
}

function onError(err) {
    var errMessage = err == null ? "Unknown" : err.message == null ? err : err.message;
    console.log(colors.red('[Rs232 Listener Error] on COM PORT: ' + PORT + ' ' + errMessage));
}

function onData(data) {
    var strData = data.toString().replace('\r', '').replace('\n', '');
    // console.log('[Rs232 Listener] Data on PORT:' + PORT + ': ' + strData);
    // return;
    var webSocketPacket = {};

    if (_type == 'weight') {
        var pattern = /(\d+\.\d+) kg/g;
        var match = pattern.exec(strData);
        if (match) {
            webSocketPacket = {
                type: 'weight', payload: {
                    weight: parseFloat(match[1]).toFixed(2)
                }
            };

        }
    }
    else if(_type=='rfId'){
        webSocketPacket = {
            type: 'rfId', payload: {
                rfId: strData
            }
        };
    }

    webSocketPacketJsonString = JSON.stringify(webSocketPacket);

    _wss.clients.forEach(function each(client) {
        if (client.readyState === 1) {
            client.send(webSocketPacketJsonString);
        }
    });





}

     function init () {
    
        _serialPortDevice = new SerialPort(PORT, {
        autoOpen: false,
        baudRate: 9600,//baudRare,
        dataBits: 8,//dataBits,
        parity: 'none'
    });

    if (_serialPortDevice == null)
        return;

    _wss = wss;
    openPort();
}
}

module.exports = serialPortListener;




