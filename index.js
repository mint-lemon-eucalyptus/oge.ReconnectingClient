/**
 * Created by user00 on 10/18/15.
 */
"use strict";
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Client = require('./Client.js');
function ReconnectingClient() {

    this.masterReconnectHandle = null;

    this.commands = {    };
}

util.inherits(ReconnectingClient, EventEmitter);

/**
 * sending JSON-serialized object as string
 * @function
 * @param {Object} a
 */
ReconnectingClient.prototype.send = function (a) {
    if (this.masterSocket) {
        this.masterSocket.send(a);
    }
};

/**
 * setup config params like url and reconnect interval
 * @function
 * @param {Object} config
 * @param {String} config.url
 * @param {Number} config.reconnectInterval
 */
ReconnectingClient.prototype.setConfig = function (config) {
    this.config = config;
    this.masterSocket = new Client(this.config.url, {});
};

/**
 * connecting to target websocket server
 * @function
 */
ReconnectingClient.prototype.connectToMaster = function () {
    var self = this;

    this.masterSocket.connect();
    this.masterSocket.ws.once('open', function () {
        if (self.masterReconnectHandle) {
            clearInterval(self.masterReconnectHandle);
        }
        self.emit('connected');
        self.send({cmd: 'slave_auth_ack', strategy: 'servertoken', data: self.config.token});
    });

    this.masterSocket.ws.on('message', function (message) {
        var msg;
        try {
            msg = JSON.parse(message);
        } catch (e) {
            console.log('JSON parseError');
        }
        var cmdName = msg.cmd;
        var command = self.commands[cmdName];
        if (typeof command == "function") {
            self.commands[cmdName](msg);    //тут надо передать контекст
        }
    });
    this.masterSocket.ws.on('error', function (e) {
        self.handleMasterError(e);
    });
    this.masterSocket.ws.once('close', function (code) {
        self.onMasterDisconnect(code);
    });
};

ReconnectingClient.prototype.onMasterDisconnect = function (code) {
    var self = this;
    this.masterSocket.disconnect();
    this.emit('disconnected');
    self.handleMasterError(code);
    this.rooms = {};
};
ReconnectingClient.prototype.handleMasterError = function (code) {
    var self = this;
    if (self.config.reconnectInterval > 0) {
        self.masterReconnectHandle = setTimeout(function () {
            self.connectToMaster();
        }, self.config.reconnectInterval);
    }
};

/**
 * adding new command
 * @function
 * @param {String} name
 * @param {Function} fn
 */
ReconnectingClient.prototype.addCommand = function (name, fn) {
    if (typeof  fn !== "function") {
        throw Error('command must be a function');
    }
    if (typeof  name !== "string") {
        throw Error('command name must be a string');
    }
    this.commands[name] = fn;
};

module.exports = ReconnectingClient;

