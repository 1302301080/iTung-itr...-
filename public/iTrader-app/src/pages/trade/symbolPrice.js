import React, { Component } from 'react';
import {
    render,
    ReactDOM
} from 'react-dom';
import Numbro from 'numbro';
import { hashHistory } from 'react-router';
import { Button, Toast } from 'react-weui';

import $ from 'jquery';
import oms from '../../lib/oms'
import util from '../../lib/util'
import format from '../../lib/format'
import dataCenter from '../../lib/data'
import sessionData from '../../lib/sessionData'

import PriceModule from '../../components/price'
import SingleNav from '../../components/singleNav';
import LogoutModel from '../../components/logoutModel';


var quoteSchema = [
    { bid: 16, bidQueue: 55, ask: 19, askQueue: 65, level: '5' },
    { bid: 51, bidQueue: 56, ask: 61, askQueue: 66, level: '5' },
    { bid: 52, bidQueue: 57, ask: 62, askQueue: 67, level: '5' },
    { bid: 53, bidQueue: 58, ask: 63, askQueue: 68, level: '5' },
    { bid: 54, bidQueue: 59, ask: 64, askQueue: 69, level: '5' },
    // { bid: 3155, bidQueue: 3136, ask: 3165, askQueue: 3146, level: '10' },
    // { bid: 3156, bidQueue: 3137, ask: 3166, askQueue: 3147, level: '10' },
    // { bid: 3157, bidQueue: 3138, ask: 3167, askQueue: 3148, level: '10' },
    // { bid: 3158, bidQueue: 3139, ask: 3168, askQueue: 3149, level: '10' },
    // { bid: 3159, bidQueue: 3140, ask: 3169, askQueue: 3150, level: '10' },
]
export default class SymbolPrice extends Component {
    constructor() {
        super();
        this.isMount
        this.symbolObj = {}
        this.state = {
            showLoading: false,
            loadingTimer: null,
            priceInfo: messages.app_singleTitle_priceSingle.text,
            bidprice: '',
            askprice: '',
            quoteLevel: 5,
            brokerQueueLevel: 10,
            queueBrokers: [],
            viewData: {}
        }
        // this.setSymbolPriceFormat()

    }
    componentDidMount() {
        this.isMount = true
    }
    componentWillUnmount() {
        this.isMount = false
        this.state.loadingTimer && clearTimeout(this.state.loadingTimer);
    }
    componentWillMount() {
        var symbol = this.props.location.query.symbol
        if (symbol) {
            this.symbolObj = sessionData.getSymbol(symbol) || {}
        }
    }


    // refresh(e) {
    //     var that = this
    //     if (!that.isMount) return
    //     var btntype = e.target.getAttribute('data-priceBtn-type')
    //     this.setState({ showLoading: true });
    //     var symbol = this.props.location.query.symbol
    //     if (symbol) {
    //         oms.getSymbol(symbol, btntype, function (data) {
    //             that.symbolObj = data
    //             that.setState({ showLoading: false });
    //         })
    //     }
    //     this.state.loadingTimer = setTimeout(() => {
    //         that.setState({ showLoading: false });
    //     }, 10000);
    // }

    linkBuySell(e) {
        if (e == 'buy') {
            util.setSessionStorage('layout', { navIndex: 0 })
        }
        if (e == 'sell') {
            util.setSessionStorage('layout', { navIndex: 1 })
        }
        location.href = "/#/trade/" + e + "?"
    }

    processBrokerQueueData(obj, tag, brokerNameInfo) {
        var that = this
        var array = []
        if (!obj || !tag || !obj[tag]) return array
        var queueBroker = obj[tag].split(',', that.state.brokerQueueLevel)
        for (var id of queueBroker) {
            var name = ''
            var temp = id
            if (id.indexOf('s') < 0) {
                if (Number(id) <= 9000) {
                    temp = id.padStart(4)
                    if (brokerNameInfo[temp]) {
                        name = brokerNameInfo[temp]
                    } else {
                        temp = parseInt((Number(id) / 10)) * 10
                        if (brokerNameInfo[temp]) {
                            name = brokerNameInfo[temp]
                        }
                    }
                } else {
                    name = brokerNameInfo[id]
                }
                array.push({ id: id, name: name || '' })
            } else {
                array.push({ id: id, name: '' })
            }
        }
        return array
    }
    initializeBrokerInfo(callback) {
        var that = this
        // if (!that.isMount) return
        if (typeof callback !== 'function') return
        var brokerNameInfo = util.getLocalStorage('broker-info', true)
        if (brokerNameInfo) return callback(brokerNameInfo)
        $.get('http://www.ebsdata.com/MarketMon/ebroker.txt', function (data) {
            var brokerNameInfo = {}
            if (data) {
                var lines = data.split('\r\n')
                for (var line of lines) {
                    var keyValue = line.split('|')
                    if (keyValue.length > 1) {
                        brokerNameInfo[keyValue[0]] = keyValue[1]
                    }
                }
                util.setLocalStorage('broker-info', brokerNameInfo)
                return callback(brokerNameInfo)
            }
        })
    }
    getSpread() {
        if (this.symbolObj && this.symbolObj[73] && this.symbolObj[23]) {
            var spreadObj = dataCenter.get('spread', this.symbolObj[73])
            if (!spreadObj) {
                spreadObj = util.getSessionStorage('spread-' + this.symbolObj[73], true)
            }
            if (spreadObj && spreadObj[73]) {
                util.setSessionStorage('spread-' + this.symbolObj[73], spreadObj)
                var spreadArr = spreadObj[73].split(',')
                this.state.bidprice = Number(util.getSpreadValue(spreadArr, this.symbolObj[1]))
                this.state.askprice = Number(util.getSpreadValue(spreadArr, this.symbolObj[2]))
            }
        }
    }
    getSymbolData() {
        return this.symbolObj
    }
    getAMSprice() {
        var that = this
        // if (!that.isMount) return
        this.getSpread()
        var bid = this.symbolObj['1']
        var ask = this.symbolObj['2']
        return (
            <div>
                <div className="symbol-amsprice">
                    <div className="amsprice-bid amsprice-bidHead">
                        {messages.app_column_price_bid.text}
                    </div>
                    <div className="amsprice-ask amsprice-askHead">
                        {messages.app_column_price_ask.text}
                    </div>
                </div>
                {quoteSchema.map((item, index) => {
                    bid = bid - this.state.bidprice
                    ask = ask + this.state.askprice
                    var amsQtyAsk = this.symbolObj[item.ask]
                    return (
                        <div key={index} className="symbol-amsprice">
                            <div className="amsprice-bid amsprice-bidItem">
                                <span>{Numbro(bid).format('0.0[000]') ? Numbro(bid).format('0.0[000]') : ''}</span>
                                <div className="amsQty-buysell">
                                    <span>{this.symbolObj[item.bid] ? Numbro(this.symbolObj[item.bid]).format('0a.00') : ''}</span>
                                    <span className="amsQty-r">({this.symbolObj[item.bidQueue]})</span>
                                </div>
                            </div>
                            <div className="amsprice-ask amsprice-askItem">
                                <span>{Numbro(ask).format('0.0[000]') ? Numbro(ask).format('0.0[000]') : '--'}</span>
                                <div className="amsQty-buysell">
                                    <span>{this.symbolObj[item.ask] ? Numbro(this.symbolObj[item.ask]).format('0a.00') : ''}</span>
                                    <span className="amsQty-r">({this.symbolObj[item.askQueue]})</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
    getBrokerInfo() {
        var that = this
        // if (!that.isMount) return
        var queueBrokerArr = []
        that.initializeBrokerInfo(function (brokerNameInfo) {
            if (brokerNameInfo) {
                var queueBidBrokers = that.processBrokerQueueData(that.symbolObj, '120', brokerNameInfo)
                var queueAskBrokers = that.processBrokerQueueData(that.symbolObj, '121', brokerNameInfo)
                for (var i = 0; i < that.state.brokerQueueLevel; i++) {
                    var item = { bid_id: '', bid_name: '', ask_id: '', ask_name: '' }
                    if (queueBidBrokers.length > i) {
                        item.bid_id = queueBidBrokers[i].id
                        item.bid_name = queueBidBrokers[i].name
                    }
                    if (queueAskBrokers.length > i) {
                        item.ask_id = queueAskBrokers[i].id
                        item.ask_name = queueAskBrokers[i].name
                    }
                    queueBrokerArr.push(item)
                }
            }
        })
        return (
            <div>
                <div className="symbol-amsprice">
                    <div className="amsprice-bid amsprice-bidHead">
                        {messages.app_column_bid_queue.text}
                    </div>
                    <div className="amsprice-ask amsprice-askHead">
                        {messages.app_column_ask_queue.text}
                    </div>
                </div>
                {queueBrokerArr.map((item, index) => {
                    return (
                        <div key={index} className="symbol-amsprice">
                            <div className="amsprice-bid amsprice-bidItem">
                                <span className={item.bid_id.indexOf('s') < 0 ? "queueId" : "queueId queueId-bid"}>{item.bid_id}</span>
                                <span className="queueName">{item.bid_name}</span>
                            </div>
                            <div className="amsprice-ask amsprice-askItem">
                                <span className={item.ask_id.indexOf('s') < 0 ? "queueId" : "queueId queueId-ask"}>{item.ask_id}</span>
                                <span className="queueName">{item.ask_name}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    render() {
        return (
            <div className="singlePage">
                <SingleNav single={this.state.priceInfo} />
                <PriceModule priceType="symbolPrice" getSymbolData={this.getSymbolData.bind(this)} />
                <div className="itrader-mgtop10">
                    {this.getAMSprice()}
                </div>
                <div className="itrader-mgtop10">
                    {this.getBrokerInfo()}
                </div>
                <div className="itrader-colLine">
                    <div className="colLine-btn" onClick={this.linkBuySell.bind(this, 'buy')} >
                        <img src="./javascripts/app/images/Buy.png" />
                        <span className="colLine-btnBuy">{messages.app_column_buy.text}</span>
                    </div>
                    <div className="colLine-btn" onClick={this.linkBuySell.bind(this, 'sell')} >
                        <img src="/javascripts/app/images/Sell.png" />
                        <span className="colLine-btnSell">{messages.app_column_sell.text}</span>
                    </div>
                    {/* <div className="colLine-btn" onClick={this.refresh.bind(this)}>
                        <img src="javascripts/app/images/Refresh.png" />
                        <span className="colLine-btnRef">{messages.app_btn_refresh.text}</span>
                    </div> */}
                </div>
                <Toast icon="loading" show={this.state.showLoading}>Loading...</Toast>
                <LogoutModel />
            </div>
        )
    }
}




