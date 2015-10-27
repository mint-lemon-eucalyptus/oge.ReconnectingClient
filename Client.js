"use strict";
var WS = require('ws');

function Client(url, config) {
    this.ws = null;
    this.config = config;
    this.url = url;
}


Client.prototype.send = function (data) {
    try {
        this.connection.send(JSON.stringify(js));
    } catch (e) {    //connection is in state CLOSING
//        console.log(this.profile.id, 'connection', this.connection.readyState,js);
        this.ws.close(1000)
    }
};
Client.prototype.connect = function () {
    var self = this;
    self.ws = new WS(self.url);
};
Client.prototype.disconnect = function () {
    this.ws.close();
    delete this.ws;
};

module.exports = Client;