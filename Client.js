"use strict";
var WS = require('ws');

function Client(url, config) {
    this.ws = null;
    this.config = config;
    this.url = url;
}


Client.prototype.send = function (data) {
    if (this.ws.readyState == 1) {
        this.ws.send(JSON.stringify(data));
    } else {
     //   qw('toMainServer FAIL', data);
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