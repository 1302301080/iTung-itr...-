import React, { Component } from 'react';
import { hashHistory } from 'react-router';

import Numbro from 'numbro';
import util from '../../lib/util'
import dataCenter from '../../lib/data'


export default class Order extends Component {
    constructor() {
        super();
        this.isMount
        this.state = {
            sortActive: 'active',
            orderData: [],
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
        dataCenter.subscribe('order', (data) => {
            that.state.orderData = []
            for (var p in data) {
                if (data[p]) {
                    if (data[p].voucherType === 'cash') continue
                    that.state.orderData.push(data[p])
                }
            }
            if (!that.isMount) return  // unmount, skip
            that.setState({
                lastUpdate: (new Date()).getTime()
            })
            this.initSort()
        })
    }

    initSort() {
        var list = this.state.orderData.sort(function (a, b) {
            if (a._id < b._id) {
                return 1
            } else {
                return 0
            }
        })
        this.setState({
            orderData: list,
        })
    }

    getSortName(e) {
        var that = this
        var thType = e.target.getAttribute('data-thType')
        if (thType == 'status') {
            if (this.state.sortActive == 'status') {
                var list = this.state.orderData.sort(function (a, b) {
                    var befor = Number(a[33].replace(/:/g, ''))
                    var after = Number(b[33].replace(/:/g, ''))
                    if (befor < after) {
                        return 1
                    } else if (befor > after) {
                        return -1
                    } else {
                        after - befor
                    }
                })
                this.setState({
                    orderData: list,
                    sortActive: thType + '_1'
                })
            } else {
                var list = this.state.orderData.sort(function (a, b) {
                    var befor = Number(a[33].replace(/:/g, ''))
                    var after = Number(b[33].replace(/:/g, ''))
                    if (befor > after) {
                        return 1
                    } else if (befor < after){
                        return -1
                    } else {
                        return befor - after
                    }
                })
                this.setState({
                    orderData: list,
                    sortActive: thType
                })
            }
        } else if (thType == '0') {
            if (this.state.sortActive == '0') {
                var list = this.state.orderData.sort(function (a, b) {
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
                    orderData: list,
                    sortActive: thType + '_1'
                })
            } else {
                var list = this.state.orderData.sort(function (a, b) {
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
                    orderData: list,
                    sortActive: thType
                })
            }
        } else {
            if (this.state.sortActive == thType) {
                var list = this.state.orderData.sort(function (a, b) {
                    return b[thType] - a[thType];
                })
                this.setState({
                    orderData: list,
                    sortActive: thType + '_1'
                })
            } else {
                var list = this.state.orderData.sort(function (a, b) {
                    return a[thType] - b[thType];
                })
                this.setState({
                    orderData: list,
                    sortActive: thType
                })
            }
        }
    }

    selectOrder(e) {
        var status = this.state.orderData[e].status
        if (status != undefined) {
            var orderNumber = this.state.orderData[e][6]
            hashHistory.push("/orderDetail?orderId=" + orderNumber)
        }
        // location.href = "/#/orderDetail?" + orderNumber
    }
    order() {
        if (!this.state.orderData) return ''
        return (
            this.state.orderData.map((item, index) => {
                return (
                    <tr key={index} className="table-trd" onClick={this.selectOrder.bind(this, index)} >
                        <td>
                            <div className="table-block">
                                <span className="table-name">{item.shortName}</span>
                                <span className={'exchange-' + item.shortExchange}>{item.shortExchange}</span>
                                <span className="table-symbol">{item[0]}</span>
                            </div>
                        </td>
                        <td className="text-right">{item.price}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td>
                            <div className="table=status">
                                <span className="table-name">{item.status}</span>
                                <span>{item[33]}</span>
                            </div>
                        </td>
                        <td className={item.buysell === '0' ? 'status-buy' : 'status-sell'}>{item[11]}</td>
                    </tr>
                );
            })
        )
    }
    render() {
        return (
            <div className="itrader-buysell">
                <div className="itrader-table">
                    <table className="table-cont">
                        <thead>
                            <tr className="table-trh">
                                <th data-thType="0" onClick={this.getSortName.bind(this)}>{messages.app_column_symbol.text}<i className={this.state.sortActive == 0 ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == '0_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th data-thType="3" onClick={this.getSortName.bind(this)} className="text-right">{messages.app_column_price.text}<i className={this.state.sortActive == 3 ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == '3_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th data-thType="4" style={{ width: '6rem' }} onClick={this.getSortName.bind(this)} className="text-right">{messages.app_column_quantity.text}<i className={this.state.sortActive == 4 ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == '4_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th data-thType="status" onClick={this.getSortName.bind(this)}>{messages.app_column_status.text}<i className={this.state.sortActive == 'status' ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == 'status_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th className="">{messages.app_column_side.text}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.order()}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}
