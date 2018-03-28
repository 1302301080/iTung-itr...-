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

{ $Id: handler.js,v 1.12 2018/01/19 10:00:19 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    logger = require('common').Logger.instance().getLogger(),
    dataEntry = require('./data/entry'),
    Const = require('./lib/const'),
    socketIO = require('./connection/socket.io_v2')

const util = require('util')

exports.handleError = function (app) {
    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found')
        err.status = 404
        next(err)
    })

    if (app.get('env').indexOf('development') >= 0) {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500)
            res.render(__views_path + 'errors/error', {
                message: err.message,
                error: err
            })
        })
    }

    app.use(function (err, req, res, next) {
        if (!req.session) {
            return res.status(err.status || 500).send(err.message)
        }
        res.status(err.status || 500)
        if (err.status === 404) {
            res.render(__views_path + 'errors/error_404', {
                userOptions: req.session.userOptions,
                config: config.iTrader,
                user: req.user
            })
        } else {
            logger.error(err.message)
            res.render(__views_path + 'errors/error_500', {
                userOptions: req.session.userOptions,
                config: config.iTrader,
                user: req.user
            })
        }
    })
}

exports.handleSession = function () {
    config.global.session.store.on('timeout', function (data) {
        try {
            var user = dataEntry.get({ name: Const.DataAction.user }, data)
            if (user) {
                socketIO.emit(user.uid, { errorCode: '51', action: 'logout' })
                user.its.logout()
            }
        } catch (err) {
            logger.error(err)
        }
    })
}

exports.handleHeaders = function (req, res, next) {
    if (config.global.web && config.global.web.headers) {
        for (var header of config.global.web.headers) {
            if (header.name && header.value) {
                res.setHeader(header.name, header.value)
            }
        }
    }
    if (configuration.__headers && util.isArray(configuration.__headers)) {
        for (var header of configuration.__headers) {
            if (header.name && header.value) {
                res.setHeader(header.name, header.value)
            }
        }
    }
    next()
}

exports.setHeaderForStaticFile = function (res, path, stat) {
    var headers = []
    if (config.global.web && config.global.web.headers) {
        for (var header of config.global.web.headers) {
            if (header.name && header.value) {
                headers.push(header)
            }
        }
    }
    if (configuration.__headers && util.isArray(configuration.__headers)) {
        for (var header of configuration.__headers) {
            if (header.name && header.value) {
                headers.push(header)
            }
        }
    }

    for (var header of headers) {
        if (header.name === 'X-Content-Type-Options') {
            if (path.endsWith('.js') || path.endsWith('.css')) {
                res.set(header.name, header.value)
            }
        } else {
            res.set(header.name, header.value)
        }
    }
}