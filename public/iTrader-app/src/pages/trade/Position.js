import React, { Component } from 'react';
import { hashHistory } from 'react-router';

import util from '../../lib/util'
import oms from '../../lib/oms';
import dataCenter from '../../lib/data'


export default class Position extends Component {
    constructor() {
        super();
        this.isMount
        setTimeout(function () { util.getSessionStorage("layout", true) || {} }, 200)
        this.state = {
            sortActive: 'active',
            positionData: [],
            lastUpdate: null,
            slanguage: document.getElementById("language").value || localStorage.getItem("language") || 'zh-CN',

        }
        this.initialize()
    }
    componentDidMount() {
        this.isMount = true
        this.setState({
            lastUpdate: (new Date()).getTime()
        })
    }
    componentWillUnmount() {
        this.isMount = false
    }
    initialize() {
        var that = this
        dataCenter.subscribe('position', (data) => {
            that.state.positionData = []
            for (var p in data) {
                if (data[p]) {
                    that.state.positionData.push(data[p])
                }
            }
            if (!that.isMount) return  // unmount, skip
            that.setState({
                lastUpdate: (new Date()).getTime()
            })
        })
    }

    getSortName(e) {
        var that = this
        var thType = e.target.getAttribute('data-thType')
        if (thType == '0') {
            if (this.state.sortActive == '0') {
                var list = this.state.positionData.sort(function (a, b) {
                    if (!a[thType].length || !b[thType].length) return
                    var befor = a[thType].length
                    var after = b[thType].length
                    if (befor < after) {
                        return 1;
                    } else if (befor > after) {
                        return -1
                    } else {
                        return b[thType] - a[thType];
                    }
                })
                this.setState({
                    positionData: list,
                    sortActive: thType + '_1'
                })
            } else {
                var list = this.state.positionData.sort(function (a, b) {
                    if (!a[thType].length || !b[thType].length) return
                    var befor = a[thType].length
                    var after = b[thType].length
                    if (befor > after) {
                        return 1;
                    } else if (befor < after) {
                        return -1
                    } else {
                        return a[thType] - b[thType];
                    }
                })
                this.setState({
                    positionData: list,
                    sortActive: thType
                })
            }
        } else {
            if (this.state.sortActive == thType) {
                var list = this.state.positionData.sort(function (a, b) {
                    if (a[thType] == '--' || b[thType] == '--')return 1
                    return b[thType] - a[thType];
                })
                this.setState({
                    positionData: list,
                    sortActive: thType + '_1'
                })
            } else {
                var list = this.state.positionData.sort(function (a, b) {
                    if (a[thType] == '--' || b[thType] == '--')return 1
                    return a[thType] - b[thType];
                })
                this.setState({
                    positionData: list,
                    sortActive: thType
                })
            }
        }
    }



    selectPosition(e) {
        var symbolObj = this.state.positionData[e]
        if(symbolObj[20] == 'BOND' || symbolObj[20] == 'FUND') return
        util.setSessionStorage('trade-data', { symbol: symbolObj[0], quantity: symbolObj[4] })
        util.setSessionStorage('layout', { navIndex: 1 })
        hashHistory.push("/trade/sell")
    }



    getPositionUI() {
        return (this.state.positionData.map((item, index) => {
            return (
                <tr key={index} className="table-trd" onClick={this.selectPosition.bind(this, index)} >
                    <td>
                        <div className="table-block">
                            <span className="table-name">{item.shortName}</span>
                            <span className={'exchange-' + item.shortExchange}>
                                {item.shortExchange}
                            </span>
                            <span className="table-symbol">{item[0]}</span>
                        </div>
                    </td>
                    <td className="text-right">{item[115]}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className={item.unrealizedPL < 0 ? 'text-right itrader-color-red' : item.unrealizedPL == 0 ? 'text-right' : 'text-right itrader-color-green'}>{item.unrealizedPLView}</td>
                </tr>
            );
        }))
    }

    render() {
        return (
            <div className="itrader-buysell">
                <div className="itrader-table">
                    <table className="table-cont">
                        <thead>
                            <tr className="table-trh">
                                <th data-thType="0" onClick={this.getSortName.bind(this)}>{messages.app_column_symbol.text}<i className={this.state.sortActive == 0 ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == '0_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th style={{ width: '6rem' }} data-thType="115" onClick={this.getSortName.bind(this)} className="text-right">{messages.app_column_avg_price.text}<i className={this.state.sortActive == 115 ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == '115_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th style={{ width: '6rem' }} data-thType="4" onClick={this.getSortName.bind(this)} className="text-right">{messages.app_column_quantity.text}<i className={this.state.sortActive == 4 ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == '4_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th style={{ width: '8rem' }} data-thType="unrealizedPL" onClick={this.getSortName.bind(this)} className="text-right">{messages.app_column_unrealizedPL.text}<i className={this.state.sortActive == 'unrealizedPL' ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == 'unrealizedPL_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.getPositionUI()}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}
