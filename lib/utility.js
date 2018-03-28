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

{ $Id: utility.js,v 1.5 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var parse = require('./parser')
var Const = require('./const')

function copyObj(left, right, overwrite) {
    if (!left || !right) return
    for (var p in right) {
        var sub = right[p]
        if (typeof sub === 'object') {
            left[p] = left[p] || {}
            copyObj(left[p], sub, overwrite)
        } else {
            if (overwrite === false) {
                if (!left[p]) {
                    left[p] = sub
                }
            } else {
                left[p] = sub
            }
        }
    }
}

function clone(obj) {
    var copy

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date()
        copy.setTime(obj.getTime())
        return copy
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = []
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i])
        }
        return copy
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {}
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr])
        }
        return copy
    }

    throw new Error("Unable to copy obj! Its type isn't supported.")
}

// schemata object convert to oms tag object
function getOmsTagObj(schemataObj, keys) {
    if (!schemataObj) return
    var newObj = {}
    if (keys) {
        for (var key of keys) {
            if (!key) continue
            newObj[key] = typeof schemataObj[key] === 'undefined' ? null : schemataObj[key]
        }
        return newObj
    } else {
        if (typeof schemataObj.makeOmsTag === 'function') {
            newObj = schemataObj.makeOmsTag()
        } else {
            newObj = clone(schemataObj)
        }
    }
    if (newObj) {
        delete (newObj.imageObj)
        delete (newObj.header)
    }
    return newObj
}

exports.getParameterError = function (req) {
    return parse.error({ error: Const.error.parameter }, null, req)
}

exports.getKeyValuePairStr = function (str, key, value) {
    if (!key || !value) return str || ''
    str = str || ''
    if (str.indexOf(',') == 0) {
        str = str.substring(1)
    }
    var len = str.length
    if (str.indexOf(',') == str.length - 1) {
        str = str.substr(0, str.length - 1)
    }
    return (str ? str + ',' : '') + key + '=' + value
}

exports.CopyObj = copyObj
exports.clone = clone
exports.GetOmsTagObj = getOmsTagObj