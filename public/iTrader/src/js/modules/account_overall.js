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

{ $Id: account_overall.js,v 1.9 2018/01/11 00:58:07 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    var name = 'account_overall'
    var container
    var inner
    var setting
    var schema = []
    var acctMgr
    var filterFields = ['10', '23', 'exchangeRatio']
    var updateFlag = true
    exports.init = function (c, s, aMgr) {
        container = c
        setting = s
        acctMgr = aMgr
        if (!container || !(container instanceof jQuery)) return
        if (!setting || (setting.overall && setting.overall.enable === false)) return
        if (!aMgr) return
        if (setting.overall && setting.overall.schema) {
            schema = setting.overall.schema
        } else {
            if (setting.account.enable == false && setting.cashview.enable == true) {
                schema = setting.cashview.schema
            } else {
                schema = setting.account.schema
            }
        }
        draw()
        AccountMgr.on(function () {
            updateFlag = true
        })
        PositionMgr.on(function () {
            updateFlag = true
        })
        setInterval(function () {
            if (updateFlag) {
                update()
                updateFlag = false
            }
        }, 1000)
    }

    function draw() {
        if (inner) return
        inner = $("<div>", { "class": "row" })
        var form = $("<form>", { "class": "form-horizontal has-success", "id": "account-summary-overall" })
        for (var i = 0; i < schema.length; i++) {
            var item = schema[i]
            var key = item.key.toString()
            if (filterFields.indexOf(key) >= 0) continue
            var i18n = item.i18n || ('account_summary_header_' + key)
            var div = $("<div>", { "class": "col-md-4 form-group form-group-sm" })
                .append($("<label>", { "class": "col-sm-5 control-label", "data-i18n": i18n }))
                .append($("<div>", { "class": "col-sm-7" })
                    .append($("<input>", {
                        "class": "form-control text-right", "id": "account-summary-overall-" + key,
                        "readonly": true,
                        "data-format": item.format
                    })))
            form.append(div)
        }
        inner.append(form)
        container.prepend($("<legend>"))
        container.prepend(inner)
        container.translate()
    }

    function update() {
        acctMgr.updateAcctInfo()
        var obj = getObj()
        var hasMarketValueFlag = false
        var hasAcceptValueFlag = false
        for (var i = 0; i < acctMgr.account_balance_list.length; i++) {
            var accountObj = acctMgr.account_balance_list[i]
            if (!accountObj.account || !accountObj.data) continue
            if (accountObj.currency) continue  // only keep the item currency==null
            if (!hasMarketValueFlag && !isNaN(accountObj.data.marketValue)) {
                hasMarketValueFlag = true
            }
            if (!hasAcceptValueFlag && !isNaN(accountObj.data.acceptValue)) {
                hasAcceptValueFlag = true
            }
            for (var p in obj) {
                obj[p] += (accountObj.data[p] || 0)
            }
        }
        if (!hasMarketValueFlag) {
            obj.marketValue = Number.NaN
        }
        if (!hasAcceptValueFlag) {
            obj.acceptValue = Number.NaN
        }
        for (var p in obj) {
            var element = $('#account-summary-overall-' + p)
            if (element.length > 0) {
                $(element[0]).val(obj[p])
            }
        }
        inner.format()
    }

    function getObj() {
        if (!schema || schema.length <= 0) return
        var obj = {}
        for (var i = 0; i < schema.length; i++) {
            var key = schema[i].key.toString()
            if (key !== 'interestAccrualWithDate') {  // not number
                obj[key] = 0
            } else {
                obj[key] = ''
            }
        }
        return obj
    }
})