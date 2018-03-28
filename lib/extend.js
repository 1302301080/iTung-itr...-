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

{ $Id: extend.js,v 1.6 2017/12/26 03:14:34 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

exports.init = function () {
    String.prototype.startWith = function (str) {
        var reg = new RegExp("^" + str)
        return reg.test(this)
    }

    String.prototype.endWith = function (str) {
        var reg = new RegExp(str + "$")
        return reg.test(this)
    }

    String.prototype.format = function () {
        var str = this
        for (var i = 0; i < arguments.length; i++) {
            var re = new RegExp('\\{' + i + '\\}', 'gm')
            str = str.replace(re, arguments[i])
        }
        return str
    }

    String.prototype.zerofill = function (size) {
        var res = this
        while (res.length < size) {
            res = '0' + res
        }
        return res
    }

    global.IsArray = function (obj) {
        if (typeof (obj) === 'object' && obj.constructor === Array) {
            return true
        }
        return false
    }

    global.ToNumber = function (str) {
        if (!str || typeof str !== 'string') return 0
        return Number(str.replace(/,/g, ''))
    }
}