import React, { Component } from 'react'
import { Button, Dialog, Toast } from 'react-weui'

import $ from 'jquery'
import Numbro from 'numbro'
import oms from '../../lib/oms'
import util from '../../lib/util'
import format from '../../lib/format'
import dataCenter from '../../lib/data'


export default class Cancel extends Component {
    constructor() {
        super();
        this.isMount
        this.state = {
            sortActive: 'active',
            orderData: [],
            modalIsOpen: false,
            showToast: false,
            chgModalIsOpen: false,
            toastTimer: null,
            lastUpdate: null,
            orderNo: '',
            password: '',
            accountObj: {},
            slanguage: document.getElementById("language").value || localStorage.getItem("language") || 'zh-CN',
        }
        this.cancelModal = {
            title: messages.app_column_cancel.text,
            buttons: [
                {
                    type: 'default',
                    label: messages.app_btn_cancel.text,
                    onClick: this.cancelDialog.bind(this)
                },
                {
                    className: 'test',
                    type: 'primary',
                    label: messages.app_btn_sure.text,
                    onClick: this.okDialog.bind(this)
                }
            ]
        }
        this.chgModal = {
            buttons: [
                {
                    label: messages.app_btn_sure.text,
                    onClick: this.cancelDialog.bind(this)
                }
            ]
        }
        this.initialize()
    }

    componentWillMount() {
        var that = this
        oms.getAccountSetting(function (data) {
            that.setState({ accountObj: data || {} })
        })
    }
    componentDidMount() {
        this.isMount = true
        this.state.toastTimer && clearTimeout(this.state.toastTimer);
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
                    if (!util.IsOutStandingStatus(data[p][5])) continue
                    that.state.orderData.push(data[p])
                }
            }
            if (!that.isMount) return  // unmount, skip
            that.setState({ lastUpdate: (new Date()).getTime() })
        })
    }
    handleInpChange(e) {
        this.setState({ password: e.target.value })
    }
    cancelDialog() {
        this.setState({
            chgModalIsOpen: false,
            modalIsOpen: false,
            password: '',
        });
    }
    okDialog() {
        var that = this
        oms.cancelOrder(this.state, function (data) {
            if (data && data.error) {
                that.setState({
                    chgModalIsOpen: true,
                    errMsg: util.getErrorMessage(data.error)
                })
            } else {
                that.setState({
                    showToast: true,
                })
                that.state.toastTimer = setTimeout(() => {
                    that.setState({ showToast: false });
                }, 1000)
            }
        })
        this.setState({
            modalIsOpen: false,
            password: '',
        });
    }
    selectOrder(e, index) {
        // var number = e.target.getAttribute('key')
        this.setState({
            orderNo: this.state.orderData[e][6],
            symbol: this.state.orderData[e][0],
            price: this.state.orderData[e][3],
            quantity: this.state.orderData[e][4],
        })
        this.setState({ modalIsOpen: true })
    }
    getSortName(e) {
        var that = this
        var thType = e.target.getAttribute('data-thType')
        if (thType == 'status') {

            if (this.state.sortActive == 'status') {
                var list = this.state.orderData.sort(function (a, b) {
                    if (a.status < b.status) {
                        return 1
                    } else {
                        return 0
                    }
                })
                this.setState({
                    orderData: list,
                    sortActive: thType + '_1'
                })
            } else {
                var list = this.state.orderData.sort(function (a, b) {
                    if (a.status > b.status) {
                        return 1
                    } else {
                        return 0
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
                        <td className="text-right">{Numbro(item.price).format('0.0[000]')}</td>
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
                                <th data-thType="4" style={{width:'6rem'}} onClick={this.getSortName.bind(this)} className="text-right">{messages.app_column_quantity.text}<i className={this.state.sortActive == 4 ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == '4_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th data-thType="status" onClick={this.getSortName.bind(this)}>{messages.app_column_status.text}<i className={this.state.sortActive == 'status' ? 'fa fa-sort-amount-asc table-icon-right' : this.state.sortActive == 'status_1' ? 'fa fa-sort-amount-desc table-icon-right' : 'fa fa-arrows-v table-icon-right'}></i></th>
                                <th className="">{messages.app_column_side.text}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.order()}
                        </tbody>
                    </table>
                </div>
                <Dialog title={messages.app_column_cancel.text} buttons={this.cancelModal.buttons} show={this.state.modalIsOpen}>
                    <ul className="buysell-ul">
                        <li><span className="modal-label">{messages.app_column_symbol.text}</span><span className="modal-data">{this.state.symbol}</span></li>
                        <li><span className="modal-label">{messages.app_column_price.text}</span><span className="modal-data">{Numbro(this.state.price).format('0.0[000]')}</span></li>
                        <li><span className="modal-label">{messages.app_column_quantity.text}</span><span className="modal-data">{format.quantity(this.state.quantity)}</span></li>
                    </ul>
                    <div className="password-box" style={{ display: this.state.accountObj.skipTradingPassword === false ? 'block' : 'none' }}>
                        <p>{messages.app_trade_password.text}</p>
                        <input type="password" className="buysell-password" data-input-type="password" value={this.state.password} onChange={this.handleInpChange.bind(this)} />
                    </div>
                </Dialog>
                <Dialog title={messages.app_message_info_title.text} buttons={this.chgModal.buttons} show={this.state.chgModalIsOpen}>
                    {this.state.errMsg}
                </Dialog>
                <Toast icon="success-no-circle" show={this.state.showToast}>{messages.app_message_cancel_success.text}!</Toast>
            </div>
        )
    }
}
