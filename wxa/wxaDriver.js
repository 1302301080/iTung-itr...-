/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2017 eBroker Systems Ltd.                 }
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

{ $Id: wxaDriver.js,v 1.3 2017/11/29 10:12:39 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

var ITS = require('../connection/its')
var SSM = require('../connection/ssm')
var uuid = require(__node_modules + 'node-uuid')
var Const = require('../lib/const')
var schema = require('common').Schema
var logger = require('common').Logger.instance().getLogger()
var dataEntry = require('../data/entry')

var ssm
var its
var user

var username
var password
if (configuration.wxa && configuration.wxa.oms) {
    username = configuration.wxa.oms.user
    password = configuration.wxa.oms.password
}

function initialize() {
    SSMLogin()
}

function SSMLogin() {
    ssm = new SSM({ reconnectInterval: configuration.iTrader.oms.reconnectInterval || 30 })
    ssm.event.on('connect', () => {
        ssm.login(username, password, {
            loginType: 0,
        }, (err, sessionObj) => {
            if (!err && sessionObj) {
                user = schema.UserSchema.makeFromObject({
                    id: username,
                    loginID: username,
                    uid: uuid.v1(),
                    status: 1,
                    password: password,
                    accounts: [],
                    type: sessionObj.loginType
                })
                user.ssm = ssm
                user.sessionObj = sessionObj
                dataEntry.set({ name: Const.DataAction.user }, user.uid, user)
                ITSVerify(user)
                logger.info('system user {0} login.'.format(username))
            } else {
                logger.error('system user {0} login failed. error: {1}'.format(username, JSON.stringify(err)))
            }
        })
    })
    ssm.event.on('error', (err) => {
        logger.error('SSM connection error: ' + err)
    })
    ssm.connect()
}

function ITSVerify() {
    if (!user) return
    its = new ITS({
        _isSystemUser: true,
        reconnectInterval: configuration.iTrader.oms.reconnectInterval
    })
    user.its = its
    its.sessionObj = user.sessionObj
    its.loginID = user.id
    its.uid = user.uid
    its.event.once('connect', () => {
        its.verify()
    })
    its.event.once('close', (had_error) => {
        logger.error('ITS connection closed. error: ' + had_error)
    })
    its.event.once('verified', (result) => {
        if (result) {
            its.initialize()
        }
    })
    its.event.on('line', function (line) {
        if (line) {
            var imageObj
            if (line.indexOf('image|ORD_') == 0) {
                imageObj = schema.OrderSchema.makeFromImage(line, 2)
                var subOrderObj = dataEntry.get({ name: Const.DataAction.subOrder }, username, imageObj.exchNo)
                dataEntry.set({ name: Const.DataAction.order }, username, imageObj.orderNo, imageObj, { subOrder: subOrderObj })
            }
        }
    })
    its.connect()
}

function getUserByOpenID(openid, callback) {
    if (typeof callback !== 'function') return
    if (its) {
        its.customQuery({ systemRef: Const.customQuery.queryAccountByOpenID, symbol: openid }, function (err, data) {
            if (err && err.length > 0) {
                return callback(false)
            } else if (data && data.length > 0) {
                initForAccount(data[0].account)
                return callback(null, data[0].account)
            }
            return callback(false)
        })
    } else {
        return callback(false)
    }
}

function initForAccount(account) {
    if (!its) return
    var boddata = 'ITS|boddata|10|' + account + '|'
    its.send(boddata)

    var queryAccount = 'ITS|queryaccount|10|' + account + '|'
    var querySubOrder = 'ITS|querysuborder|10|' + account + '|'
    var queryTrade = 'ITS|querytrade|10|' + account + '|'
    its.send(queryAccount)
    its.send(querySubOrder)
    its.send(queryTrade)

    //var openORDA = 'DDS|open|#ORDA_{0}|ORDA_{0}|mode|both|'.format(account)
    //its.send(openORDA)
}

exports.initialize = initialize
exports.getSystemUser = function () {
    return user
}
exports.getUserByOpenID = getUserByOpenID