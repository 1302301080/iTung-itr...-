import React, { Component } from 'react';
import { Button, Dialog, Toast, Toptips } from 'react-weui'
import DatePicker from 'react-mobile-datepicker'
import Picker from '../../components/picker'
import PriceModule from '../../components/price'

import $ from 'jquery'
import moment from 'moment'
import oms from '../../lib/oms'
import util from '../../lib/util'
import sessionData from '../../lib/sessionData'
import format from '../../lib/format'
import dataCenter from '../../lib/data'

var defaultOrderTypeList = ['limit']
var defaultOrderTIFList = ['day']


window.onload = function () {
    window.onresize = function () {
        if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
            $(document).on('focusin', function () {
                $('.footer').css({
                    bottom: '-60px',
                })
            });
            $(document).on('focusout', function () {
                $('.footer').css({
                    bottom: '0px',
                })
            });
        } else {
            if (!util.getLocalStorage('localHeight', true)) {
                util.setLocalStorage('localHeight', $(window).height())
            } else {
                var winHeight = $(window).height();
                if (winHeight < util.getLocalStorage('localHeight', true)) {
                    $('.footer').css({
                        bottom: '-60px',
                    })
                } else {
                    $('.footer').css({
                        bottom: '0px',
                    })
                }
            }
        }

    }
}




class BuySell extends Component {
    constructor(props) {
        super(props);
        this.isMount
        var sessionTradeData = util.getSessionStorage("trade-data", true) || {}
        this.state = {
            /*----------TIF  TYPE-------------*/
            date: moment().format('YYYY/MM/DD'),
            stopPrice: '',
            minDate: new Date(new Date(new Date().toLocaleDateString()).getTime()),
            timeIsOpen: false,
            dateFormat: ['YYYY', 'MM', 'DD'],
            disableTIFDate: false,
            stopLimitFlag: false,
            disablePrice: 'all',
            disableTIF: 'all',
            disabled: 'disabled',
            /*----------TIF  TYPE-------------*/
            modalIsOpen: false,
            msgModalIsOpen: false,
            showToast: false,
            toastTimer: null,
            showWarn: false,
            warnTimer: null,
            side: props.type,
            mobileSystem: '',
            symbol: sessionTradeData.symbol || '',
            price: sessionTradeData.price || '',
            priceView: sessionTradeData.price || '',
            quantity: sessionTradeData.quantity || '',
            type: 'limit',
            tif: 'day',
            password: '',
            sprice: '0.01',
            squantity: sessionTradeData.squantity || '1000',
            maxSell: '',
            maxBuy: '',
            orderTypeListorder: {
                title: messages.app_column_orderTypeListorder.text,
                optionList: defaultOrderTypeList,
                valueList: this.getValueList(defaultOrderTypeList, 'order_type_')
            },
            orderTypeListtif: {
                title: messages.app_column_orderTypeListtif.text,
                optionList: defaultOrderTIFList,
                valueList: this.getValueList(defaultOrderTIFList, 'order_tif_')
            },
            accountObj: {}
        };
        this.symbolObj
        this.posData = undefined
        this.formModal = {
            title: props.type === '0' ? messages.app_column_buy.text : messages.app_column_sell.text,
            buttons: [
                {
                    type: 'default',
                    label: messages.app_btn_cancel.text,
                    onClick: this.cancelDialog.bind(this)
                },
                {
                    type: 'primary',
                    label: messages.app_btn_sure.text,
                    onClick: this.okDialog.bind(this)
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
        if (sessionTradeData.symbol) {
            this.setTradeData(sessionTradeData.symbol)
        }
        this.handleMaxBuySell()
    }
    componentWillMount() {
        var that = this
        oms.getAccountSetting(function (data) {
            that.setState({ accountObj: data || {} })
        })
        this.initializeGetsymbol()
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
    componentDidMount() {
        this.isMount = true
        this.state.toastTimer && clearTimeout(this.state.toastTimer);
    }
    componentWillUnmount() {
        this.state.warnTimer && clearTimeout(this.state.warnTimer);
        this.isMount = false
    }
    getValueList(keys, prefix) {
        var values = []
        for (var k of keys) {
            if (k == 'enhancedLimit') {
                k = 'enhanced_limit'
                values.push(messages.oms[prefix + k])
            } else if (k == 'stopLimit') {
                k = 'stop_limit'
                values.push(messages.oms[prefix + k])
            } else if (k == 'auctionLimit') {
                k = 'auction_limit'
                values.push(messages.oms[prefix + k])
            } else if (k == 'specialLimit') {
                k = 'special_limit'
                values.push(messages.oms[prefix + k])
            } else {
                values.push(messages.oms[prefix + k])
            }
        }
        return values
    }

    getSearch() {
        var urls = this.props.type === '0' ? 'buy' : 'sell'
        if (typeof (localStorage.Items) == "undefined") {
            localStorage.setItem("urls", urls);
        } else {
            localStorage.removeItem("urls");
            localStorage.setItem("urls", urls);
        }
        location.href = "/#/search?"
    }
    cancelDialog() {
        var that = this
        if (!that.isMount) return
        this.setState({
            modalIsOpen: false,
            msgModalIsOpen: false,
            password: '',
        });
    }
    okDialog() {
        var that = this
        var dataObj = {}
        dataObj.symbol = this.state.symbol
        dataObj.price = this.state.price
        dataObj.quantity = this.state.quantity
        dataObj.side = this.state.side
        dataObj.tif = this.state.tif
        dataObj.type = this.state.type
        dataObj.stopPrice = this.state.stopPrice
        dataObj.date = this.state.date
        dataObj.password = this.state.password
        oms.addOrder(dataObj, function (data) {
            if (!that.isMount) return
            if (data.error || data.errorCode) {
                if (data.error) {
                    that.setState({
                        msgModalIsOpen: true,
                        errMsg: util.getErrorMessage(data.error)
                    })
                }
                if (data.errorCode) {
                    that.setState({
                        msgModalIsOpen: true,
                        errMsg: util.getErrorMessage(data.errorCode)
                    })
                }
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

    buysellModalIsOpen() {
        console.log(this.state)
        $('.weui-dialog__title').addClass(this.props.type === '0' ? 'itrader-color-green' : 'itrader-color-red')
        if (this.state.disablePrice === 'all' && !this.state.price) {
            this.setState({ showWarn: true });
            this.state.warnTimer = setTimeout(() => {
                this.setState({ showWarn: false });
            }, 2000);
            return
        }
        if (!this.state.symbol) {
            this.setState({ showWarn: true });
            this.state.warnTimer = setTimeout(() => {
                this.setState({ showWarn: false });
            }, 2000);
            return
        }
        if (!this.state.quantity) {
            this.setState({ showWarn: true });
            this.state.warnTimer = setTimeout(() => {
                this.setState({ showWarn: false });
            }, 2000);
            return
        }
        if(this.state.type == 'stopLimit'){
            if(this.state.stopPrice == ''){
                this.setState({ showWarn: true });
                this.state.warnTimer = setTimeout(() => {
                    this.setState({ showWarn: false });
                }, 2000);
                return
            }
        }
        this.setState({ modalIsOpen: true })
    }
    initializeGetsymbol() {
        var that = this
        var sessionTradeData = util.getSessionStorage('trade-data', true) || {}
        if (sessionTradeData && sessionTradeData.symbol) {
            if (sessionTradeData.symbol == null) return
            var symbol = sessionTradeData.symbol
            this.getsymbol(symbol, function (data) {
                that.setTradeData(symbol)
                that.handleMaxBuySell()
                if (data && data[73] && data[23] && sessionTradeData.price) {
                    var spreadObj = dataCenter.get('spread', data[73])
                    if (spreadObj && spreadObj[73]) {
                        var spreadArr = spreadObj[73].split(',')
                        that.setState({ sprice: util.getSpreadValue(spreadArr, sessionTradeData.price) })
                    }
                }
            })

        }
    }
    getsymbol(symbol, callback) {
        var that = this
        oms.getSymbol(symbol, '', function (data) {
            if (!that.isMount) return
            if (!data) return
            that.symbolObj = data
            var tradeExchange = that.state.accountObj
            var exg = that.symbolObj[20]
            if (tradeExchange.tradeExchange[exg]) {
                that.setState({
                    orderTypeListorder: {
                        optionList: tradeExchange.tradeExchange[exg].type,
                        valueList: that.getValueList(tradeExchange.tradeExchange[exg].type, 'order_type_')
                    },
                    orderTypeListtif: {
                        optionList: tradeExchange.tradeExchange[exg].tif,
                        valueList: that.getValueList(tradeExchange.tradeExchange[exg].tif, 'order_tif_')
                    }
                })
            } else {
                that.setState({
                    orderTypeListorder: {
                        optionList: defaultOrderTypeList,
                        valueList: that.getValueList(defaultOrderTypeList, 'order_type_')
                    },
                    orderTypeListtif: {
                        optionList: defaultOrderTIFList,
                        valueList: that.getValueList(defaultOrderTIFList, 'order_tif_')
                    }
                })
            }
            if (typeof callback === 'function') {
                callback(data)
            }
        })
    }
    onPickerSelect(e, name, item) {
        if (!this.isMount) return
        if (name == 'order-type') {
            this.setState({ type: item.key })
            if (item.key == 'market') {
                this.setState({
                    disablePrice: 'market',
                    tif: 'day',
                    // date: '',
                    priceView: item.value,
                    price: 0,
                    stopPrice: '',
                    stopLimitFlag: false,
                    disableTIFDate: false,
                })
            } else if (item.key == 'auction') {
                this.setState({
                    disablePrice: 'auction',
                    tif: 'day',
                    // date: '',
                    priceView: item.value,
                    price: 0,
                    stopPrice: '',
                    stopLimitFlag: false,
                    disableTIFDate: false,
                })
            } else if (item.key == 'stopLimit') {
                this.setState({
                    disablePrice: 'all',
                    disableTIF: 'all',
                    tif: 'day',
                    stopLimitFlag: true,
                })
            } else if (item.key == 'auctionLimit') {
                this.setState({
                    disablePrice: 'all',
                    disableTIF: 'auctionLimit',
                    tif: 'day',
                    // date: '',
                    stopPrice: '',
                    stopLimitFlag: false,
                })
            } else {
                this.setState({
                    // date: '',
                    stopPrice: '',
                    disablePrice: 'all',
                    disableTIF: 'all',
                    stopLimitFlag: false,
                })
            }
        }
        if (name == 'order-tif') {
            this.setState({ tif: item.key })
            if (item.key == 'gtd') {
                this.setState({
                    disableTIFDate: true,
                })
            } else {
                this.setState({
                    disableTIFDate: false,
                    stopPrice: '',
                    // date: '',
                })
            }
        }
    }
    handleSymbol(e) {
        if (!this.isMount) return
        var value = e.target.value
        var getInpType = e.target.getAttribute('data-inpType')
        if (getInpType == 'inpsymbol') {
            this.setState({ symbol: value })
        }
    }
    handleInpChangeTypeTIF(e) {
        if (!this.isMount) return
        var priceV = e.target.value
        this.setState({ stopPrice: e.target.value })
        util.setSessionStorage('trade-stopPrice', { stopPrice: priceV })
        if (this.symbolObj && this.symbolObj[73] && this.symbolObj[23]) {
            var spreadObj = dataCenter.get('spread', this.symbolObj[73])
            if (spreadObj && spreadObj[73]) {
                var spreadArr = spreadObj[73].split(',')
                this.setState({ sprice: util.getSpreadValue(spreadArr, e.target.value) })
            }
        }
    }
    handleInpChange(e) {
        if (!this.isMount) return
        var spinnerType = e.target.getAttribute('data-input-type')
        var priceV
        var quantityV
        if (spinnerType == 'price') {
            var priceV = e.target.value
            this.setState({ price: e.target.value, priceView: e.target.value })
            util.setSessionStorage('trade-data', { symbol: this.state.symbol, price: priceV, priceView: priceV, quantity: this.state.quantity })
            if (this.symbolObj && this.symbolObj[73] && this.symbolObj[23]) {
                var spreadObj = dataCenter.get('spread', this.symbolObj[73])
                if (spreadObj && spreadObj[73]) {
                    var spreadArr = spreadObj[73].split(',')
                    this.setState({ sprice: util.getSpreadValue(spreadArr, e.target.value) })
                }
            }
        }
        if (spinnerType == 'quantity') {
            var quantityV = e.target.value
            util.setSessionStorage('trade-data', { symbol: this.state.symbol, price: this.state.price, priceView: this.state.price, quantity: quantityV })
            this.setState({ quantity: e.target.value })
        }
        if (spinnerType == 'password') {
            var password = e.target.value
            this.setState({ password: password })
        }
        // this.setTradeDataSessionStorage()
        this.handleMaxBuySell()
    }
    handleSymbolBlur(e) {
        var that = this
        var value = e.target.value
        var getInpType = e.target.getAttribute('data-inpType')
        if (getInpType == 'inpsymbol') {
            if (!isNaN(value)) {
                value = util.zerofill(value, { size: 5 })
            }
            this.setTradeData(value)
            util.setSessionStorage('trade-data', { symbol: value, price: that.state.price, quantity: that.state.quantity })
            this.handleMaxBuySell()
        }
    }
    handleMaxBuySell() {
        var that = this
        setTimeout(function () {
            if (!that.isMount) return
            if (that.props.type == 0) {  // buy
                that.setState({ maxBuy: util.calcMaxBuy(that.symbolObj, that.state.price) })
            } else {  // sell
                that.setState({ maxSell: util.calcMaxSell(that.state.symbol) })
            }
        }, 0)
    }
    handleCopyPrice(price) {
        this.setState({
            price: price,
            priceView: price
        })
        if (this.symbolObj && this.symbolObj[73] && this.symbolObj[23]) {
            var spreadObj = dataCenter.get('spread', this.symbolObj[73])
            if (spreadObj && spreadObj[73]) {
                var spreadArr = spreadObj[73].split(',')
                this.setState({ sprice: util.getSpreadValue(spreadArr, price) })
            }
        }
    }

    btnspinnerTypeTIF(e) {
        if (!this.isMount) return
        var spinnerType = e.target.getAttribute('data-inpTypeTIF-type')
        var price = util.spinner(this.state.stopPrice, Number(e.target.value), spinnerType)
        this.setState({ stopPrice: price })
    }

    keydown13(e) {
        if (e.keyCode == '13') {
            this.handleSymbolBlur(e)
        }
    }
    btnspinner(e) {
        if (!this.isMount) return
        var spinnerType = e.target.getAttribute('data-spinner-type')
        var spinnerAns = e.target.getAttribute('data-spinner-num')
        // var price = this.state.price
        if (spinnerType == 'quantity') {
            var quantity = util.spinner(this.state.quantity, Number(e.target.value), spinnerType)
            this.setState({ quantity: quantity })
            util.setSessionStorage('trade-data', { symbol: this.state.symbol, price: this.state.price, priceView: this.state.price, quantity: quantity })
        }
        if (spinnerType == 'price') {
            if (this.state.disablePrice != 'all') return
            var price = util.spinner(this.state.price, Number(e.target.value), spinnerType)
            this.setState({ price: price, priceView: price })
            util.setSessionStorage('trade-data', { symbol: this.state.symbol, price: price, priceView: price, quantity: this.state.quantity })
        }
        // this.setTradeDataSessionStorage()
        this.handleMaxBuySell()
    }
    getSymbolData() {
        // this.setTradeData(this.state.symbol)
        return sessionData.getSymbol(this.state.symbol)
    }
    setTradeData(symbol) {
        var that = this
        if (!that.isMount) return
        this.setState({ symbol: symbol })
        this.getsymbol(symbol, function (data) {
            if (data && data[24]) {
                that.setState({ squantity: data[24] })
            }
        })
    }
    render() {
        var fromItem = (
            <div className="itrader-from">
                <form autoComplete="off">
                    <div className="from-item border-bottom-1px">
                        <label className="itrader-color">{messages.app_column_symbol.text}</label>
                        <div className="from-searchInp">
                            <input name="symbol" value={this.state.symbol} data-inpType="inpsymbol" onKeyDown={this.keydown13.bind(this)} onBlur={this.handleSymbolBlur.bind(this)} onChange={this.handleSymbol.bind(this)} />
                            <button type="button" className="itrader-search" onClick={this.getSearch.bind(this)}>
                                <i className="fa fa-search" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <div className="from-item border-bottom-1px">
                        <label className={this.state.disablePrice === 'all' ? 'itrader-color' : 'disabled-color'}>{messages.app_column_price.text}</label>
                        <div className="from-itemInp">
                            <button type="button" className={this.state.disablePrice === 'all' ? 'itrader-btn itrader-color-green' : 'itrader-btn disabled-color'} data-spinner-type="price" onClick={this.btnspinner.bind(this)} value={'-' + this.state.sprice}><span className="itrader-btn-icon"><i className="fa fa-minus"></i></span>{this.state.sprice}</button>
                            <input style={{ display: this.state.disablePrice === 'all' ? 'block' : 'none' }} name="price" data-input-type="price" value={this.state.price} onChange={this.handleInpChange.bind(this)} />
                            <input style={{ display: this.state.disablePrice === 'all' ? 'none' : 'block' }} name="price" disabled='disabled' placeholder={this.state.priceView} />
                            <button type="button" className={this.state.disablePrice === 'all' ? 'itrader-btn itrader-color-green' : 'itrader-btn disabled-color'} data-spinner-type="price" onClick={this.btnspinner.bind(this)} value={'+' + this.state.sprice}><span className="itrader-btn-icon"><i className="fa fa-plus"></i></span>{this.state.sprice}</button>
                        </div>
                    </div>
                    <div className="from-item border-bottom-1px">
                        <label className="itrader-color">{messages.app_column_quantity.text}</label>
                        <div className="from-itemInp">{/**/}
                            <button type="button" className="itrader-btn itrader-color-green" data-spinner-type="quantity" onClick={this.btnspinner.bind(this)} value={'-' + this.state.squantity}><span className="itrader-btn-icon"><i className="fa fa-minus"></i></span>{this.state.squantity}</button>
                            <input name="quantity" data-input-type="quantity" value={this.state.quantity} onChange={this.handleInpChange.bind(this)} />
                            <button type="button" className="itrader-btn itrader-color-green" data-spinner-type="quantity" onClick={this.btnspinner.bind(this)} value={'+' + this.state.squantity}><span className="itrader-btn-icon"><i className="fa fa-plus"></i></span>{this.state.squantity}</button>
                        </div>
                    </div>
                </form>
            </div>
        );

        return (
            <div className="itrader-buysell">
                <PriceModule priceType="trade" typeClick={this.state.type} getSymbolData={this.getSymbolData.bind(this)} onPriceClick={this.handleCopyPrice.bind(this)} />
                <div className="itrader-mgtop10">
                    {fromItem}
                </div>
                <div className="itrader-line">
                    <div className="itrader-color">{messages.app_column_order_amount.text}：<span className="itrader-color-red">{this.state.price * this.state.quantity == 0 ? '--' : format.amount(this.state.price * this.state.quantity)}</span></div>
                    <div className="itrader-color">{this.props.type === '0' ? messages.app_column_max_buy.text : messages.app_column_max_sell.text}: <span className="itrader-color-red">{this.props.type === '0' ? this.state.maxBuy == 'Infinity' ?  '--' : format.quantity(this.state.maxBuy) || '--' : format.quantity(this.state.maxSell) || '--'}</span></div>
                </div>

                <div className="itrader-buysellModule itrader-mgtop10">
                    <div className="disOrderType">
                        <Picker name="order-type" source={this.state.orderTypeListorder} onSelect={this.onPickerSelect.bind(this)} />
                        {/* <div className="stoplimit" style={{ display: this.state.stopLimitFlag === true ? 'block' : 'none' }}>
                            <input data-stop-limit="stopLimit" data-inpType="stoplimit" value={this.state.stopPrice} onBlur={this.handleSymbolBlur.bind(this)} onChange={this.handleSymbol.bind(this)} placeholder='0.0001' />
                        </div> */}
                    </div>
                    <div className="disOrderType" style={{ display: this.state.disablePrice === 'all' ? this.state.disableTIF === 'all' ? 'block' : 'none' : 'none' }}>
                        <Picker name="order-tif" source={this.state.orderTypeListtif} onSelect={this.onPickerSelect.bind(this)} />
                    </div>
                    <div className="example-container" style={{ display: this.state.stopLimitFlag === true ? 'block' : 'none' }}>
                        <div className="from-type-item border-bottom-1px">
                            <label className='itrader-color'>{messages.app_column_stop_price.text}</label>
                            <div className="from-itemInp">
                                <button type="button" className={this.state.disablePrice === 'all' ? 'itrader-btn itrader-color-green' : 'itrader-btn disabled-color'} data-inpTypeTIF-type="price" onClick={this.btnspinnerTypeTIF.bind(this)} value={'-' + this.state.sprice}><span className="itrader-btn-icon"><i className="fa fa-minus"></i></span>{this.state.sprice}</button>
                                <input data-spinnerTypeTIF="stopPrice" value={this.state.stopPrice} onChange={this.handleInpChangeTypeTIF.bind(this)} />
                                <button type="button" className={this.state.disablePrice === 'all' ? 'itrader-btn itrader-color-green' : 'itrader-btn disabled-color'} data-inpTypeTIF-type="price" onClick={this.btnspinnerTypeTIF.bind(this)} value={'+' + this.state.sprice}><span className="itrader-btn-icon"><i className="fa fa-plus"></i></span>{this.state.sprice}</button>
                            </div>
                        </div>
                    </div>
                    <div className="example-container" style={{ display: this.state.disableTIFDate === true ? 'block' : 'none' }}>
                        <div className="from-type-item border-bottom-1px">
                            <label className="itrader-color">{messages.app_column_specify_date.text}</label>
                            <div className="from-searchInp">
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
                    </div>
                    <div className="example-container" style={{ display: this.state.disablePrice === 'all' ? this.state.disableTIF === 'all' ? 'none' : 'block' : 'block' }}>
                        <div className="from-item border-bottom-1px">
                            <label className={this.state.disablePrice === 'all' ? this.state.disableTIF === 'all' ? 'itrader-color' : 'disabled-color' : 'disabled-color'}>{messages.app_column_orderTypeListtif.text}</label>
                            <div className="from-searchInp">
                                <input disabled="disabled" />
                                <div className="act-headr">
                                    <i className={this.state.disablePrice === 'all' ? this.state.disableTIF === 'all' ? 'itrader-color fa fa-chevron-right' : 'disabled-color fa fa-chevron-right' : 'disabled-color fa fa-chevron-right'} aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="itrader-btnbg itrader-mgtop50">
                    <button id="buysell" className={this.props.type === '0' ? 'itrader-button bg-buy' : 'itrader-button bg-sell'} onClick={this.buysellModalIsOpen.bind(this)}>{this.props.type === '0' ? messages.app_column_buy.text : messages.app_column_sell.text}</button>
                </div>

                <Dialog title={this.formModal.title} buttons={this.formModal.buttons} show={this.state.modalIsOpen}>
                    <ul className="buysell-ul">
                        <li><span className="modal-label">{messages.app_column_symbol.text}:</span><span className="modal-data">{this.state.symbol}</span></li>
                        <li><span className="modal-label">{messages.app_column_price.text}:</span><span className="modal-data">{this.state.priceView}</span></li>
                        <li><span className="modal-label">{messages.app_column_quantity.text}:</span><span className="modal-data">{format.quantity(this.state.quantity)}</span></li>
                        <li><span className="modal-label">{messages.app_column_orderTypeListorder.text}:</span><span className="modal-data">{this.state.type}</span></li>
                        <li><span className="modal-label">{messages.app_column_orderTypeListtif.text}:</span><span className="modal-data">{this.state.tif}</span></li>
                        <li className={this.state.tif == 'gtd' ? 'modal-label' : 'none'}><span className="modal-label">{messages.app_column_specify_date.text}:</span><span className="modal-data">{this.state.date}</span></li>
                        <li className={this.state.type == 'stopLimit' ? 'modal-label' : 'none'}><span className="modal-label">{messages.app_column_stop_price.text}:</span><span className="modal-data">{this.state.stopPrice}</span></li>
                        <div className="password-box" style={{ display: this.state.accountObj.skipTradingPassword === false ? 'block' : 'none' }}>
                            <p>{messages.app_trade_password.text}</p>
                            <input type="password" className="buysell-password" data-input-type="password" value={this.state.password} onChange={this.handleInpChange.bind(this)} />
                        </div>
                    </ul>
                </Dialog>
                <Toast icon="success-no-circle" show={this.state.showToast}>{messages.app_message_apply_success.text}</Toast>
                <Toptips type="warn" show={this.state.showWarn}>{messages.app_message_check_information.text}!</Toptips>
                <Dialog title={messages.app_message_error_title.text} buttons={this.msgModal.buttons} show={this.state.msgModalIsOpen}>
                    {this.state.errMsg}
                </Dialog>
            </div >
        );
    }
}



exports.TradeBuy = class Buy extends Component {
    render() {
        return (
            <BuySell type={'0'} />
        )
    }
}

exports.TradeSell = class Sell extends Component {
    render() {
        return (
            <BuySell type={'1'} />
        )
    }
}
