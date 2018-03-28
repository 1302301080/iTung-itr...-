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

{ $Id: assets.js,v 1.29 2017/12/15 10:08:45 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var account_summary_table
var account_summary_datatable
var position_summary_table
var position_summary_datatable
var accountListUpdateFlag = false
var util

$(function () {
    $(document).on('page', function (event, data) {
        if (data === 'shown' && account_summary_datatable) {
            account_summary_datatable.draw()
        }
    })
    initialize(function (err) {
        seajs.use(["format", "socket-v2", "datatables", "mobile", 'util'], function (f, s, d, mo, u) {
            if (!err) {
                util = u
                account_summary_table = $('#account-summary-table')
                position_summary_table = $('#position-summary-table')
                Assets_Initialize()
                $(document).translate()

                seajs.use("account-overall", function (ao) {
                    ao.init($('#account-summary-panel .panel-body'), initial_data.views.assets, AccountMgr)
                })

                seajs.use("cashview", function (cv) {
                    cv.init($('#account-summary-panel .panel-body'), initial_data.views.assets.cashview, AccountMgr, CurrencyMgr)
                })
                s.init()
                mo.init()

                setTimeout(function () {
                    if (CurrencyMgr.base_currency) {
                        var globalMarketValueElement = $('[data-i18n=position_summary_header_globalMarketValue]')
                        if (globalMarketValueElement.text().indexOf(CurrencyMgr.base_currency) < 0) {
                            globalMarketValueElement.text(globalMarketValueElement.text() + ' (' + CurrencyMgr.base_currency + ')')
                        }
                    }


                    position_summary_datatable.draw()
                }, 500)
                PositionMgr.on(function (positions) {
                    if (!positions || positions.length <= 0) return
                    var symbolList = []
                    for (var i = 0; i < positions.length; i++) {
                        var symbol = positions[i][0]
                        if (symbolList.indexOf(symbol) < 0) {
                            symbolList.push(symbol)
                        }
                    }
                    AssetsPositionTable_Draw(symbolList)
                    accountListUpdateFlag = true
                })

                AccountMgr.on(function () {
                    accountListUpdateFlag = true
                })
            }
        })
    })

    setInterval(function () {
        if (accountListUpdateFlag) {
            AssetsAccountTable_Add(AccountMgr)
            accountListUpdateFlag = false
        }
    }, 1000)
})

function Assets_Initialize() {
    if (initial_data.views.assets.account.enable != false) {
        account_summary_datatable = account_summary_table.CreateDatatable({
            columnSchema: initial_data.views.assets.account.schema,
            columnHeaderPrefix: 'account_summary_header_',
            searching: false,
            scrollCollapse: true,
            scrollX: true,
            paging: false,
            info: false,
        })
    } else {
        $('#account-summary-item').hide()
    }

    position_summary_datatable = position_summary_table.CreateDatatable({
        columnSchema: initial_data.views.assets.position.schema,
        columnHeaderPrefix: 'position_summary_header_',
        searching: false,
    })
}

function AssetsPositionTable_Draw(symbolList) {
    if (!symbolList || symbolList.length <= 0) return
    for (var i = 0; i < symbolList.length; i++) {
        AssetsPositionData_Process(symbolList[i])
    }
    position_summary_datatable.draw('full-hold')
    AssetsMarketValueChart_Draw()
}

function AssetsAccountTable_Add() {
    if (!initial_data) return
    if (initial_data.views.assets.account.enable == false) return
    var balanceObj
    AccountMgr.updateAcctInfo()
    if (AccountMgr.account_balance_list) {
        for (var i = 0; i < AccountMgr.account_balance_list.length; i++) {
            var accountbalance = AccountMgr.account_balance_list[i].data
            if (accountbalance && !accountbalance[23]) {
                var newBalanceObj = $.extend(true, {}, accountbalance)
                newBalanceObj.DT_RowId = 'assets-account-' + accountbalance[10]
                util.HandleZeroShowNA(newBalanceObj)
                account_summary_datatable.UpdateRowData(newBalanceObj)
            }
        }
        account_summary_datatable.draw()
    }
}

function AssetsMarketValue_Calculate() {
    var data = []
    for (var i = 0; i < position_summary_datatable.data().length; i++) {
        var obj = position_summary_datatable.data()[i]
        var exchange = $._map.exchange(obj[tags.exchange])
        var item = _.find(data, function (o) { return o.name === exchange })
        if (item) {
            item.value += obj.globalMarketValue
        } else if (obj.globalMarketValue != 0 && obj.globalMarketValue != Number.NaN) {
            item = { name: exchange, value: obj.globalMarketValue }
            data.push(item)
        }
    }
    return data
}

function AssetsMarketValueChart_Draw() {
    if ($('#assets-distribution-chart').length <= 0) return
    var data = AssetsMarketValue_Calculate()
    var legend_data = []
    var sum = 0
    for (var i = 0; i < data.length; i++) {
        legend_data.push(data[i].name)
    }
    var bodyFontColor = $('body').css('color')
    var option = {
        textStyle: {
            color: bodyFontColor
        },
        animation: false,
        title: {
            text: messages.assets_market_value_chart_title.text + '(' + CurrencyMgr.base_currency + ')',
            x: 'center',
            textStyle: {
                color: bodyFontColor
            },
        },
        tooltip: {
            trigger: 'item',
            formatter: function (params, ticket, callback) {
                return params.seriesName + ' <br />' + params.name + ' : ' + $._format.amount(params.value) + ' (' + params.percent + '%)'
            }
        },
        legend: {
            orient: 'vertical',
            left: 'right',
            top: 30,
            data: legend_data,
            textStyle: {
                color: bodyFontColor
            },
        },
        series: [
            {
                name: messages.assets_market_value_chart_title.text,
                type: 'pie',
                radius: '60%',
                center: ['50%', '60%'],
                data: data,
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    }
    var myChart = echarts.init(document.getElementById('assets-distribution-chart'))
    myChart.setOption(option)

    for (var i = 0; i < data.length; i++) {
        sum += data[i].value
    }
    var chart_panel = $('#assets-distribution-chart').parent('div')
    $('.assets-global-market-value').remove()
    chart_panel.append(($('<div>', { class: 'col-sm-offset-3 col-xs-offset-4 assets-global-market-value' })).append($('<span>', { text: messages.position_summary_header_globalMarketValue.text + '(' + CurrencyMgr.base_currency + ')' }))
        .append($('<b>', { text: $._format.amount(sum), style: 'margin-left: 10px' })))
    myChart.on('legendselectchanged', function (params) {
        var summary = 0
        for (var name in params.selected) {
            if (params.selected[name] == true) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].name == name) {
                        summary += data[i].value
                    }
                }
            }
        }
        chart_panel.find('.assets-global-market-value b:last').text($._format.amount(summary))
    })
}

function AssetsPositionData_Process(symbol) {
    if (!symbol) return
    var quantity = 0
    var marketValue = 0
    var globalMarketValue = 0
    var acceptValue = 0
    var unrealizedPL = 0
    var realizedPL = 0
    var costPrice = 0
    var positions = PositionMgr.get({ symbol: symbol })
    if (!positions || positions.length <= 0) return
    var hasMarketValueFlag = false
    var hasAcceptValueFlag = false
    var onePositionObj = positions[0]
    for (var i = 0; i < positions.length; i++) {
        var positionObj = positions[i]
        quantity += ToNumber(positionObj[tags.quantity])
        marketValue += ToNumber(positionObj.marketValue)
        globalMarketValue += ToNumber(positionObj.globalMarketValue)
        acceptValue += ToNumber(positionObj.acceptValue)
        unrealizedPL += ToNumber(positionObj.unrealizedPL)
        realizedPL += ToNumber(positionObj.realizedPL)
        costPrice += ToNumber(positionObj.costPrice)
        if (!hasMarketValueFlag && !isNaN(positionObj.marketValue)) {
            hasMarketValueFlag = true
        }
        if (!hasAcceptValueFlag && !isNaN(positionObj.acceptValue)) {
            hasAcceptValueFlag = true
        }
    }
    var newPositionObj = $.extend(true, {}, onePositionObj) // copy object
    newPositionObj.DT_RowId = 'assets-position-' + symbol
    newPositionObj._id = symbol
    newPositionObj[tags.quantity] = quantity
    newPositionObj.marketValue = marketValue
    newPositionObj.globalMarketValue = globalMarketValue
    newPositionObj.acceptValue = acceptValue
    newPositionObj.costPrice = costPrice / positions.length
    newPositionObj.unrealizedPL = unrealizedPL
    newPositionObj.realizedPL = realizedPL

    newPositionObj[31] = getDisplayPrice(onePositionObj[31], 'market', onePositionObj)
    newPositionObj.costPrice = getDisplayPrice(onePositionObj.costPrice, 'avg', onePositionObj)

    if (!hasMarketValueFlag) {
        newPositionObj.marketValue = Number.NaN
        newPositionObj.globalMarketValue = Number.NaN
    }
    if (!hasAcceptValueFlag) {
        newPositionObj.acceptValue = Number.NaN
    }

    util.HandleZeroShowNA(newPositionObj)
    position_summary_datatable.UpdateRowData(newPositionObj, {
        IsRemove: function (data) {
            return Number(data[tags.quantity]) == 0
        }
    })
}