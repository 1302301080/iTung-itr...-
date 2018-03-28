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

{ $Id: customQueryParser.js,v 1.2 2017/08/14 07:18:14 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

var OmsUtility = require('./omsUtility')

var parser = {
    loadhistoryorders: function (imageObj) {
        if (!imageObj) return
        var account = imageObj.account
        var cnySuffixIndex = account.indexOf(configuration.iTrader.oms.CNYAcctSuffix)
        if (cnySuffixIndex > 0) {
            imageObj.account = account.substr(0, cnySuffixIndex)
        }
        imageObj.setValue('status', OmsUtility.ConvertStatusToNumber(imageObj[5]))  // string ==> number
        imageObj.setValue('userRef', imageObj.row1 || '')
        imageObj.setValue('compSystemRef', imageObj.row67, { type: 'object' })   // load history orders custom query use 266 as the 487 field.
    },
    getacctcurrencybalance: function (imageObj, options) {
        if (!imageObj || !options || !options.user) return
        var user = options.user
        user._accountMultiCurrencyCB = user._accountMultiCurrencyCB || {}
        if (imageObj.currency) {
            user._accountMultiCurrencyCB[imageObj.currency] = imageObj.cashBalance || 0
        }
    },
    queryhistoryerrororder: function (imageObj) {
        if (!imageObj) return
        imageObj._isErrorOrder = true  // indicate this is an error order
        imageObj.setValue('userRef', imageObj.row2 || '')
        imageObj.setValue('time', imageObj.createTime)  // make it the same as query history order.  501 ==> 33
    },
    loadUserInfo: function(imageObj) {
        if(!imageObj) return
        imageObj.setValue('account', '')  // return account is just a dummy account
    }
}

function parse(obj, options) {
    if (!obj) return
    var name = obj.systemRef
    if (name) {
        name = name.toLowerCase()
        if (parser[name]) {
            parser[name](obj, options)
        }
    }
}

module.exports = parse