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

{ $Id: socket.js,v 1.3 2017/06/14 04:23:42 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


define(function (require, exports, module) {
    var socket
    var ipoList = {}
    var ipoSymbolList = []
    var ipoAppList = []
    var ipoSymbolCallbackList = []
    var ipoAppCallbackList = []
    var connectionString = window.location.protocol + '//' + window.location.host
    socket = io.connect(connectionString, { secure: connectionString.indexOf('https') == 0 ? true : false })
    socket.on('auth', function (result) {
        if (result) {
            socket.on('data', function (resData) {
                if (!resData || !resData.data) return
                if (resData.name === 'ipo-symbol') {
                    for (var i = 0; i < resData.data.length; i++) {
                        var obj = resData.data[i]
                        var key = obj[0] + obj[1599]
                        obj._raw = $.extend(true, {}, obj)  // keep the raw data
                        ipoSymbolList[key] = obj
                    }
                    for (var i = 0; i < ipoSymbolCallbackList.length; i++) {
                        ipoSymbolCallbackList[i](resData.data)
                    }
                } else if (resData.name === 'ipo-app') {
                    for (var i = 0; i < resData.data.length; i++) {
                        var obj = resData.data[i]
                        var key = obj[6]
                        obj._raw = $.extend(true, {}, obj)  // keep the raw data
                        ipoAppList[key] = obj
                    }
                    for (var i = 0; i < ipoAppCallbackList.length; i++) {
                        ipoAppCallbackList[i](resData.data)
                    }
                }
            })
            socket.emit('data', ['ipo-symbol', 'ipo-app'])
        }
    })

    function subscribeIPOS(callback) {
        if (typeof callback !== 'function') return
        var array = []
        for (var p in ipoSymbolList) {
            array.push(ipoSymbolList[p])
        }
        if (array.length > 0) {
            callback(array)
        }
        ipoSymbolCallbackList.push(callback)
    }

    function subscribeApplications(callback) {
        if (typeof callback !== 'function') return
        var array = []
        for (var p in ipoAppList) {
            array.push(ipoAppList[p])
        }
        if (array.length > 0) {
            callback(array)
        }
        ipoAppCallbackList.push(callback)
    }

    function getIPOInfo(key) {
        return ipoList[key]
    }

    exports.subscribeIPOS = subscribeIPOS
    exports.subscribeApplications = subscribeApplications
    exports.getIPOInfo = getIPOInfo
})
