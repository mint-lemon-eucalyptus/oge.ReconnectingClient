"use strict";
var WS = require('ws');

function Client(url, config) {
    this.ws = null;
    this.config = config;
    this.url = url;
}


Client.prototype.send = function (data) {
    try {
        this.connection.send(JSON.stringify(data));
    } catch (e) {    //connection is in state CLOSING
        console.log('send', e);
      var self=this;
        //setTimeout(function(){
        //    self.ws.send(data);
        //})
      //  this.ws.close(1000)
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