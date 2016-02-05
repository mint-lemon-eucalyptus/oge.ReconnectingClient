/**
 * Created by user00 on 10/18/15.
 */
"use strict";
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Client = require('./Client.js');
function ReconnectingClient() {
//    Client.call( this, config);
    this.masterReconnectHandle = null;
    this.masterSocket = null;

    this.restoreConnection = true;
    this.reqIdCounter = 0;    //это ид запроса, при каждом вызове send, error, close он должен увеличиваться
    this.callbacks = {};
    this.commands = {};
}

util.inherits(ReconnectingClient, EventEmitter);

/**
 * sending JSON-serialized object as string
 * @function
 * @param {Object} data
 * @param {Function} callback
 */
ReconnectingClient.prototype.send = function (data, callback) {
    //callback имеет 2 аргумента = запрос и объект для отправки ответа
    ++this.reqIdCounter;

    if (this.masterSocket) {
        //отослать данные можно - добавляем коллбек в очередь
        //когда приходит ответ, определить, к какому коллбеку он относится можно по req_id
        if (typeof callback === "function") {
            this.callbacks[this.reqIdCounter] = callback;
            data.__t = 'q';
        }
        data.__ = this.reqIdCounter;
        this.masterSocket.sendRaw(data);
    } else {
        //если сокет не открыт, выполняем коллбек с ошибкой
        if (typeof callback === "function") callback('not_opened');
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
    this.masterSocket.connection.once('open', function () {
        if (self.masterReconnectHandle) {
            clearInterval(self.masterReconnectHandle);
        }
        self.emit('connected');
    });

    this.masterSocket.connection.on('message', function (message) {
        var msg;
        try {
            msg = JSON.parse(message);
        } catch (e) {
            console.log('JSON parseError');
        }
        //определить к какому коллбеку относится ответ можно по полю req_id
        var reqId = msg.__;
        var callback = self.callbacks[reqId];
        if (callback) {  //коллбек остался, подставим туда данные
            delete msg.__;
            callback(null, msg);
            delete self.callbacks[reqId];
        } else {
            //это сообщение - инициатива другой стороны.
            //надо обработать его как команду(для совместимости со старой версией)
            var cmdName = msg.cmd;
            if (typeof self.commands[cmdName] == "function") {
                self.commands[cmdName](msg);    //тут надо передать контекст
            }
        }
        //если коллбека не найдено, значит данные отправляли без гарантии доставки
    });
    this.masterSocket.connection.once('error', onceError);
    this.masterSocket.connection.once('close', onceClose);


    function onceClose(code) {
        self.emit('disconnected');
        onceError(code);
    }

    function onceError(code) {
        self.masterSocket.close();
        console.log('onceError', self.masterSocket.connection._events);
        //сокет отвалился - все колбеки выполним с ошибкой code
        for (var cb in self.callbacks) {
            self.callbacks[cb](code);
        }
        if (self.restoreConnection && self.config.reconnectInterval > 0) {
            self.masterReconnectHandle = setTimeout(function () {
                self.connectToMaster();
            }, self.config.reconnectInterval);
        }
    }
};

/**
 * принудительно закрываем соединение и не восстанавливаем соединение
 */
ReconnectingClient.prototype.disconnect = function () {
    this.restoreConnection = false;
    this.masterSocket.close(1000);
}

module.exports = ReconnectingClient;

