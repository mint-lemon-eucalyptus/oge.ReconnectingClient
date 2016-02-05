"use strict";
var WebSocket = require('ws');

function Client(url, config) {
    this.connection = null;
    this.config = config;
    this.url = url;
}


Client.prototype.sendRaw = function (data) {
    try {
        this.connection.send(JSON.stringify(data));
    } catch (e) {    //connection is in state CLOSING
        console.log('send', e);
    }
};
Client.prototype.connect = function () {
    this.connection = new WebSocket(this.url);
};
Client.prototype.close = function () {
    this.connection.close(1000);
    this.connection.removeAllListeners();
};

module.exports = Client;