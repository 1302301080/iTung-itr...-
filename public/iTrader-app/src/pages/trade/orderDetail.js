import React, { Component } from 'react'
import { Button, Dialog, Toast } from 'react-weui'

import $ from 'jquery'
import moment from 'moment'
import DatePicker from 'react-mobile-datepicker'
import oms from '../../lib/oms'
import util from '../../lib/util'
import dataCenter from '../../lib/data'
import SingleNav from '../../components/singleNav'
import LogoutModel from '../../components/logoutModel'



export default class OrderChild extends Component {
    constructor() {
        super();
        this.state = {
            orderInfo: messages.app_singleTitle_orderSingle.text,
            date: moment().format('YYYY/MM/DD'),
            minDate: new Date(new Date(new Date().toLocaleDateString()).getTime()),
            timeIsOpen: false,
            dateFormat: ['YYYY', 'MM', 'DD'],
            showLoading: false,
            modalIsOpen: false,
            changemodalIsOpen: false,
            msgModalIsOpen: false,
            chgModalIsOpen: false,
            showToast: false,
            lastUpdate: null,
            orderNo: '',
            changePrice: '',
            changeQuantity: '',
            password: '',
            sprice: '',
            squantity: '',
            accountObj: {},
        }
        this.orderData = {}
        this.cancelModal = {
            title: messages.app_column_cancel.text,
            buttons: [
                {
                    type: 'default',
                    label: messages.app_btn_cancel.text,
                    onClick: this.cancelDialog.bind(this)
                },
                {
                    type: 'primary',
                    label: messages.app_btn_sure.text,
                    onClick: this.cancelokDialog.bind(this)
                }
            ]
        }
        this.changeModal = {
            title: messages.app_column_change.text,
            buttons: [
                {
                    type: 'default',
                    label: messages.app_btn_cancel.text,
                    onClick: this.changecancelDialog.bind(this)
                },
                {
                    type: 'primary',
                    label: messages.app_btn_sure.text,
                    onClick: this.changeokDialog.bind(this)
                }
            ]
        }
        this.msgModal = {
            buttons: [
                {
                    label: messages.app_btn_sure.text,
                    onClick: this.cancelDialog.bind(this)
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
    }

    componentWillMount() {
        var that = this
        oms.getAccountSetting(function (data) {
            that.setState({ accountObj: data || {} })
        })
        this.state.orderNo = this.props.location.query.orderId
        this.refresh()
    }

    updateOrder(orderObj) {
        this.orderData = dataCenter.parse('order', orderObj)
        this.setState({
            lastUpdate: (new Date()).getTime(),
            orderNo: this.orderData[6],
            squantity: this.orderData[4],
            changePrice: this.orderData[3],
            changeQuantity: this.orderData[4],
            date: this.orderData.orderDate
        })
    }
    refresh() {
        var that = this
        this.setState({ showLoading: true });
        oms.getOrder(this.state.orderNo, function (data) {
            if (data.error) {
                that.setState({
                    chgModalIsOpen: true,
                    errMsg: util.getErrorMessage(data.error),
                    showLoading: false
                })
            }
            if (!data || !data.data) return
            data = data.data
            that.updateOrder(data)
            that.setState({ showLoading: false });
        })
    }
    cancelDialog() {
        this.setState({
            modalIsOpen: false,
            msgModalIsOpen: false,
            chgModalIsOpen: false,
        });
    }
    cancelokDialog() {
        var that = this
        oms.cancelOrder(that.state, function (data) {
            if (!data || !data.data) return
            data = data.data
            if (data && data.error) {
                that.setState({
                    chgModalIsOpen: true,
                    errMsg: util.getErrorMessage(data.error)
                })
            } else {
                oms.getOrder(that.state.orderNo, function (data) {
                    if (!data || !data.data) return
                    data = data.data
                    that.updateOrder(data)
                })
                // that.setState({
                //     showToast: true,
                // })
                // that.state.toastTimer = setTimeout(() => {
                //     that.setState({ showToast: false });
                // }, 1000)
            }
        })
        this.setState({
            modalIsOpen: false,
            password: '',
        });
    }
    handleInpChange(e) {
        this.setState({ password: e.target.value })
    }
    changecancelDialog() {
        this.setState({
            showLoading: false,
            squantity: this.orderData[4],
            changePrice: this.orderData[3],
            changeQuantity: this.orderData[4],
            changemodalIsOpen: false,
            password: '',
        });
    }
    changeokDialog() {
        var that = this
        oms.changeOrder(this.state, function (data) {
            if (!data || !data.data) return
            data = data.data
            if (data && data.error) {
                that.setState({
                    chgModalIsOpen: true,
                    errMsg: util.getErrorMessage(data.error)
                })
            } else {
                oms.getOrder(that.state.orderNo, function (data) {
                    if (!data || !data.data) return
                    data = data.data
                    that.updateOrder(data)
                })
                that.setState({
                    showToast: true,
                })
                setTimeout(() => {
                    that.setState({ showToast: false });
                }, 1000)
            }
        })
        this.setState({
            changemodalIsOpen: false,
            password: '',
        });
    }
    cancelOrder(e) {
        var that = this
        if (util.IsOutStandingStatus(that.orderData[5])) {
            this.setState({ modalIsOpen: true })
        } else {
            this.setState({ msgModalIsOpen: true })
        }
    }
    chageOrder(e) {
        var type = this.orderData[20]
        if (type == 'FUND' || type == 'BOND') {
            this.orderData.statusView = this.orderData[20]
            this.setState({ msgModalIsOpen: true })
        } else {
            this.orderData.statusView = this.orderData.status
            if (util.IsOutStandingStatus(this.orderData[5])) {
                var sprice = ''
                var squantity = ''
                var changePrice = ''
                var changeQuantity = ''
                if (this.orderData) {
                    squantity = this.orderData[4]
                    changePrice = this.orderData[3]
                    changeQuantity = this.orderData[4]

                    if (this.orderData[73] && this.orderData[23]) {
                        var spreadObj = dataCenter.get('spread', this.orderData[73])
                        if (spreadObj && spreadObj[73]) {
                            var spreadArr = spreadObj[73].split(',')
                            sprice = util.getSpreadValue(spreadArr, this.orderData[3])
                        }
                    }
                }
                this.setState({
                    changemodalIsOpen: true,
                    sprice: sprice,
                    squantity: squantity,
                    changePrice: changePrice,
                    changeQuantity: changeQuantity
                })
            } else {
                this.setState({ msgModalIsOpen: true })
            }
        }
    }
    handlePrice(e) {
        var value = e.target.value
        this.setState({ changePrice: value })
        if (this.orderData && this.orderData[73] && this.orderData[23]) {
            var spreadObj = dataCenter.get('spread', this.orderData[73])
            if (spreadObj && spreadObj[73]) {
                var spreadArr = spreadObj[73].split(',')
                this.setState({ sprice: util.getSpreadValue(spreadArr, value) })
            }
        }
    }
    handleQuantity(e) {
        var value = e.target.value
        this.setState({ changeQuantity: value })
    }
    btnspinner(e) {
        var spinnerType = e.target.getAttribute('data-spinner-type')
        if (spinnerType == 'quantity') {
            var quantity = util.spinner(this.state.changeQuantity, Number(e.target.value), spinnerType)
            this.setState({ changeQuantity: quantity })
        }
        if (spinnerType == 'price') {
            var price = util.spinner(this.state.changePrice, Number(e.target.value), spinnerType)
            this.setState({ changePrice: price })
        }
    }

    handleClick() {
        this.setState({ timeIsOpen: true});
    }
    handleCancel() {
        this.setState({ timeIsOpen: false });
    }
    handleSelect(time) {
        this.setState({ date: moment(time).format('YYYY/MM/DD'), timeIsOpen: false });
    }
    ordertable() {
        return (
            <table className="table-detail">
                <tbody>
                    <tr className="table-trd">
                        <td>{messages.app_column_order_number.text}</td>
                        <td className="table-detailtd">{this.orderData[6]}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_side.text}</td>
                        <td className="table-detailtd">{this.orderData[11]}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_shortName.text}</td>
                        <td className="table-detailtd"><span className="table-detail-right">{this.orderData.shortName}</span></td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_symbol.text}</td>
                        <td className="table-detailtd">{this.orderData[0]}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_price.text}</td>
                        <td className="table-detailtd">{this.orderData.price}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_quantity.text}</td>
                        <td className="table-detailtd">{this.orderData.quantity}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_status.text}</td>
                        <td className="table-detailtd">{this.orderData.status}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_filled_price.text}</td>
                        <td className="table-detailtd">{this.orderData.filed_price}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_filled_quantity.text}</td>
                        <td className="table-detailtd">{this.orderData.filed_quantity === '0' ? '--' : this.orderData.filed_quantity}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_options.text}</td>
                        <td className="table-detailtd">{this.orderData.options}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_source.text}</td>
                        <td className="table-detailtd">{this.orderData.source}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_datetime.text}</td>
                        <td className="table-detailtd">{this.orderData[33]}</td>
                    </tr>
                    <tr className="table-trd">
                        <td>{messages.app_column_remark.text}</td>
                        <td className="table-detailtd">{this.orderData.order_remark}</td>
                    </tr>
                </tbody>
            </table>
        )
    }
    render() {
        return (
            <div className="singlePage">
                <SingleNav single={this.state.orderInfo} />
                <div className="order-detail">
                    {this.ordertable()}
                </div>
                <div className="itrader-colLine">
                    <div className="colLine-btn" onClick={this.cancelOrder.bind(this)} >
                        <img src="./javascripts/app/images/Cancel.png" />
                        <span className="colLine-btnCan">{messages.app_btn_cancel.text}</span>
                    </div>
                    <div className="colLine-btn" onClick={this.chageOrder.bind(this)} >
                        <img src="/javascripts/app/images/Change.png" />
                        <span className="colLine-btnChg">{messages.app_btn_change.text}</span>
                    </div>
                    <div className="colLine-btn" onClick={this.refresh.bind(this)}>
                        <img src="javascripts/app/images/Refresh.png" />
                        <span className="colLine-btnRef">{messages.app_btn_refresh.text}</span>
                    </div>
                </div>

                <Dialog title={this.changeModal.title} buttons={this.changeModal.buttons} show={this.state.changemodalIsOpen}>
                    <div className="from-item">
                        <label>{messages.app_column_price.text}</label>
                        <div className="from-itemInp">
                            <button type="button" className="itrader-btn" data-spinner-type="price" onClick={this.btnspinner.bind(this)} value={'-' + this.state.sprice}>{'-' + this.state.sprice}</button>
                            <input name="price" value={this.state.changePrice} onChange={this.handlePrice.bind(this)} />
                            <button type="button" className="itrader-btn" data-spinner-type="price" onClick={this.btnspinner.bind(this)} value={'+' + this.state.sprice}>{'+' + this.state.sprice}</button>
                        </div>
                    </div>
                    <div className="from-item">
                        <label>{messages.app_column_quantity.text}</label>
                        <div className="from-itemInp">{/**/}
                            <button type="button" className="itrader-btn" data-spinner-type="quantity" onClick={this.btnspinner.bind(this)} value={'-' + this.orderData[24]}>{'-' + this.orderData[24]}</button>
                            <input name="quantity" value={this.state.changeQuantity} onChange={this.handleQuantity.bind(this)} />
                            <button type="button" className="itrader-btn" data-spinner-type="quantity" onClick={this.btnspinner.bind(this)} value={'+' + this.orderData[24]}>{'+' + this.orderData[24]}</button>
                        </div>
                    </div>
                    <div className="from-item">
                        <label>{messages.app_column_specify_date.text}</label>
                        <div className={this.orderData.orderDate ? 'from-searchInp' : 'none'}>
                            <a
                                className="select-dateTIF"
                                onClick={this.handleClick.bind(this)}>
                                {this.state.date || moment().format('YYYY/MM/DD')}
                            </a>
                            <DatePicker
                                dateFormat={this.state.dateFormat}
                                isOpen={this.state.timeIsOpen}
                                min={this.state.minDate}
                                onSelect={this.handleSelect.bind(this)}
                                onCancel={this.handleCancel.bind(this)} />
                        </div>
                    </div>
                    <div className="password-box" style={{ display: this.state.accountObj.skipTradingPassword === false ? 'block' : 'none' }}>
                        <p>{messages.app_trade_password.text}</p>
                        <input type="password" className="buysell-password" data-input-type="password" value={this.state.password} onChange={this.handleInpChange.bind(this)} />
                    </div>
                </Dialog>
                <Dialog title={messages.app_column_cancel.text} buttons={this.cancelModal.buttons} show={this.state.modalIsOpen}>
                    <div className="password-box" style={{ display: this.state.accountObj.skipTradingPassword === false ? 'block' : 'none' }}>
                        <p>{messages.app_trade_password.text}</p>
                        <input type="password" className="buysell-password" data-input-type="password" value={this.state.password} onChange={this.handleInpChange.bind(this)} />
                    </div>
                </Dialog>
                <Dialog buttons={this.msgModal.buttons} show={this.state.msgModalIsOpen}>
                    {messages.app_message_information.text + "< " + this.orderData.statusView + " > " + messages.app_message_current_Nochanged.text}
                </Dialog>
                <Toast icon="loading" show={this.state.showLoading}>Loading...</Toast>
                <Toast icon="success-no-circle" show={this.state.showToast}>{messages.app_message_change_success.text}!</Toast>
                <Dialog title={messages.app_message_info_title.text} buttons={this.chgModal.buttons} show={this.state.chgModalIsOpen}>
                    {this.state.errMsg}
                </Dialog>
                <LogoutModel />
            </div>
        );
    }
}