/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2016 eBroker Systems Ltd.                 }
{       ALL RIGHTS RESERVED                                         }
{                                                                   }
{   RESTRICTIONS                                                    }
{                                                                   }
{   THIS SOURCE CODE AND ALL RESULTING INTERMEDIATE FILES           }
{   ARE CONFIDENTIAL AND PROPRIETARY TRADE                          }
{   SECRETS OF EBROKER SYSTEMS LTD.THE REGISTERED DEVELOPER IS      }
{   LICENSED TO DISTRIBUTE THE PRODUCT AND ALL ACCOMPANYING         }
{   JAVASCRIPT FUNCTIONS AS PART OF AN EXECUTABLE PROGRAM ONLY.     }
{                                                                   }
{   THE SOURCE CODE CONTAINED WITHIN THIS FILE AND ALL RELATED      }
{   FILES OR ANY PORTION OF ITS CONTENTS SHALL AT NO TIME BE        }
{   COPIED, TRANSFERRED, SOLD, DISTRIBUTED, OR OTHERWISE MADE       }
{   AVAILABLE TO OTHER INDIVIDUALS WITHOUT EXPRESS WRITTEN CONSENT  }
{   AND PERMISSION FROM EBROKER SYSTEMS LTD.                        }
{                                                                   }
{   CONSULT THE END USER LICENSE AGREEMENT FOR INFORMATION ON       }
{   ADDITIONAL RESTRICTIONS.                                        }
{                                                                   }
{*******************************************************************}

{ $Id: baseSocket.js,v 1.16 2018/02/27 05:27:01 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

var config = require(__config_path),
    EventEmitter = require('events'),
    net = require('net'),
    iconv = require(__node_modules + 'iconv-lite'),
    logger = require('common').Logger.instance().getLogger()


module.exports = class BaseSocket {
    constructor(options) {
        options = options || {}
        this.reconnectInterval = options.reconnectInterval || 0
        this.name = options.name || ''
        this.messEncoding = options.messEncoding || false  // for handle different encoding in one image

        this.socketClient
        this.clientHost
        this.clientPort
        this.event = new EventEmitter()
        this.event.setMaxListeners(0)
        this.dataTail
        this.pingMsg = 'PING|'
        this.event.on('error', (err) => {
            logger.error(err)
        })
        if (options.ping) {
            this.ping()
        }
        this.initializeSocket()
    }

    connect(options) {
        if (this.socketClient && this.socketClient.isConnected) {
            this.event.emit('connect')
            return
        }
        options = options || {}
        this.clientHost = options.host || this.clientHost
        this.clientPort = options.port || this.clientPort

        if(!this.clientHost || !this.clientPort) return

        this.socketClient.connect({ host: this.clientHost, port: this.clientPort })

    }

    initializeSocket() {
        this.socketClient = new net.Socket()
        this.socketClient.on('connect', function () {
            this.socketClient.isConnected = true
            this.event.emit('connect')
            logger.info(this.name + ' connected. ' + this.getSocketInfo(this.socketClient))
        }.bind(this))

        this.socketClient.on('close', function (had_error) {
            this.event.emit('close', had_error)
            if (this.socketClient.isConnected) {
                logger.info(this.name + ' disconnected.' + this.getSocketInfo(this.socketClient))
            }
            this.socketClient.isConnected = false
            if (!had_error) {
                this.reconnect()
            }
        }.bind(this))

        this.socketClient.on('error', function (err) {
            this.event.emit('error', err)
            logger.error(err)
        }.bind(this))

        if (this.reconnectInterval > 0) {
            setInterval(function () {
                this.reconnect()
            }.bind(this), this.reconnectInterval * 1000)
        }
        this.socketClient.on('data', function (data) {
            if (!data) return
            try {
                var buf = Buffer.isBuffer(this.dataTail) ? Buffer.concat([this.dataTail, data], this.dataTail.length + data.length) : data
                var len
                var ptr = 0
                var idx = buf.indexOf(10)
                while (idx >= 0) {
                    len = idx - ptr
                    if (len > 0 && buf[idx - 1] == 13) len--
                    var lineBuf = buf.slice(ptr, ptr + len)
                    var line = ''
                    if (this.messEncoding) {
                        try {
                            line = this.handleMessEncoding(lineBuf)
                        } catch (err) {
                            logger.error('process image failed. error: ' + err)
                        }
                    } else {
                        line = iconv.decode(lineBuf, config.iTrader.oms.encoding)
                    }
                    if (line.indexOf('error|') === 0) {
                        logger.warn('<=' + this.name + '|' + line)
                    } else if (this.name === 'DDS') {
                        logger.trace('<=' + this.name + '|' + line)
                    } else {
                        logger.debug('<=' + this.name + '|' + line, { mask: this.name === 'SSM' ? true : false })
                    }
                    this.event.emit('line', line)
                    ptr = idx
                    if (buf[idx - 1] == 13) ptr++
                    if (ptr >= buf.length) break
                    idx = buf.indexOf(10, ptr + 1)  // v1.3.5 ptr ==> ptr + 1, unexpected message xxx\nxxx will make heap out of memory.
                }
                if (ptr < buf.length) {
                    this.dataTail = new Buffer(buf.length - ptr)
                    buf.copy(this.dataTail, 0, ptr)
                } else {
                    this.dataTail = null
                }
            } catch (err) {
                logger.error(err)
            }
        }.bind(this))
    }

    send(message, callback) {
        if (!message || !this.socketClient || !this.socketClient.isConnected) return
        if (callback && typeof (callback) === 'function') {
            var done = false
            this.event.once('line', function (data) {
                if (!done) {
                    callback(null, data)
                    done = true
                }
            })
        }
        this.socketClient.write(message + '\r\n')
        if (message !== this.pingMsg) {
            logger.info('>' + this.name + '|' + message)
        }
    }

    isConnected() {
        return this.socketClient.isConnected
    }

    once(callback) {
        this.event.once('line', function (data) {
            callback('data', data)
        })
    }

    destroy() {
        if (this.socketClient) {
            this.socketClient.removeAllListeners()
            this.socketClient.destroy()
        }
    }

    reconnect() {
        if (this.reconnectInterval > 0 && this.socketClient && !this.socketClient.isConnected) {
            this.connect()
            logger.info(this.name + ' try to reconnect...')
        }
    }

    ping() {
        setInterval(function () {
            this.send(this.pingMsg)
        }.bind(this), 30 * 1000)
    }

    getSocketInfo(client) {
        var info = client.address()
        info.targetHost = this.clientHost
        info.targetPort = this.clientPort
        return JSON.stringify(info)
    }

    handleMessEncoding(data) {
        var line = ''
        var buffer = []
        var itemCount = 0
        var key = ''
        for (var i = 0; i < data.length; i++) {
            var b = data[i];
            if (this.isLeadingByte(b)) {
                buffer.push(b)
                buffer.push(data[i + 1])
                i++
                continue
            }
            if (b == 124) {
                itemCount++
                if ((itemCount % 2) == 0) {
                    line += key + '|' + this.getValue(key, buffer) + '|'
                    key = ''
                }
                else {
                    key = iconv.decode(buffer, 'ASCII')
                }
                buffer = []
            } else {
                buffer.push(b)
            }
        }
        return line
    }

    getValue(id, bytes) {
        var value = ''
        if (id == 36) {
            value = iconv.decode(bytes, 'Big5')
        } else if (id == 505 || id == 10) {
            value = iconv.decode(bytes, 'gb2312')
            if (bytes.Length > 1) {
                var testBytes = [bytes[0], bytes[1]]
                if (!this.isGB2312(testBytes)) {
                    value = iconv.decode(bytes, 'Big5')
                }
            }
        }
        else if (id == 21) {
            value = iconv.decode(bytes, 'gb2312')
        } else {
            value = iconv.decode(bytes, 'ASCII')
        }
        return value
    }

    isLeadingByte(b) {
        if (b > 175 && b < 248) return true;//GB2312 leading byte range
        if (b > 128 && b < 255) return true;//BIG5 leading byte range
        return false
    }

    isGB2312(testBytes) {
        if (testBytes.Length != 2) return false
        var leadingByteInRange = (testBytes[0] > 175 && testBytes[0] < 248)
        var nextByteinRange = (testBytes[1] > 160 && testBytes[1] < 255)
        return leadingByteInRange && nextByteinRange
    }
}