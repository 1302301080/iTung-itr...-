import React, { Component } from 'react'
import Numbro from 'numbro';
import { hashHistory } from 'react-router'

import $ from 'jquery'
import format from '../lib/format'
import util from '../lib/util'
import oms from '../lib/oms'
import dataCenter from '../lib/data'

var priceInfoSchema = [
    [
        { name: 'high', i18n: 'app_column_high', id: '37', class: 'itrader-color-green', format: 'decimal' },
        { name: 'low', i18n: 'app_column_low', id: '32', class: 'itrader-color-red', format: 'decimal' }
    ],
    [
        { name: 'preClose', i18n: 'app_column_preClose', id: '31', class: '', format: 'decimal' },
        { name: 'open', i18n: 'app_column_open', id: '133', class: '', format: 'decimal' }
    ],
    [
        { name: 'volume', i18n: 'app_column_volume', id: '17', class: '', format: 'million' },
        { name: 'turnover', i18n: 'app_column_turnover', id: '38', class: '', format: 'million' }
    ],
]

export default class SymbolPrice extends Component {
    constructor(props) {
        super(props);
        this.isMount
        this.priceType = this.props.priceType
        this.symbolData = null
        this.state = {
            market: this.props.market,
            refreshFlag: false,
            viewData: {},
            exchgStatus: '--',
            slanguage: document.getElementById("language").value || localStorage.getItem("language") || 'zh-CN'
        }
        this.init()
    }
    init() {
    }

    componentWillUnmount() {
        this.isMount = false
    }
    componentDidMount() {
        this.isMount = true
        var that = this
        dataCenter.subscribe('exchange', (data) => {
            var exchange = that.state.viewData[20]
            if (!exchange) {
                var currentSymbol = (util.getSessionStorage("trade-data", true) || {}).symbol
                if (currentSymbol) {
                    exchange = (util.getSessionStorage("symbol-" + currentSymbol, true) || {})[20] || ''
                }
            }
            if (!that.isMount) return
            if (data[exchange]) {
                that.setState({
                    exchgStatus: data[exchange].status
                })
            }
        })
    }

    refresh(e) {
        var that = this
        // if (!that.isMount) return
        that.setState({ refreshFlag: true })
        var btntype = e.target.getAttribute('data-priceBtn-type')
        console.log(btntype)
        if (btntype && btntype == 0) {
            $('.lampDelay').attr('class', 'lamp lampDelay')
            $('.lampRealtime').attr('class', 'lampRealtime')
            $('.btnDelay').attr('class', 'symbolPrice-btn btnDelay btnDetail-ck')
            $('.btnRealTime').attr('class', 'symbolPrice-btn btnRealTime symbolPrice-btnRealTime')
        }
        if (btntype && btntype == 1) {
            $('.lampDelay').attr('class', 'lampDelay')
            $('.lampRealtime').attr('class', 'lamp lampRealtime')
            $('.btnRealTime').attr('class', 'symbolPrice-btn btnRealTime btnRealTime-ck')
            $('.btnDelay').attr('class', 'symbolPrice-btn btnDelay symbolPrice-btnDelay')
        }
        if (!this.symbolData) return
        var symbol = this.symbolData[0]

        if (symbol) {
            oms.getSymbol(symbol, btntype, function (data) {
                var vd = that.setSymbolPriceFormat(data)
                that.setState({
                    viewData: vd,
                    refreshFlag: false,
                })
            })
        }
    }
    setSymbolPriceFormat(symbolObj) {
        symbolObj = symbolObj || {}
        var vd = util.Clone(symbolObj)
        this.symbolData = symbolObj
        var change = Numbro(symbolObj['3'] - symbolObj['31']).format('0,0.0[000]')
        var changeP = Numbro((symbolObj['3'] - symbolObj['31']) / symbolObj['31']).format('0.00')
        var price = Numbro(symbolObj['3']).format('0.0[000]')
        vd[3] = isNaN(price) ? '--' : price
        vd[31] = Numbro(symbolObj['31']).format('0.0[000]')
        vd[32] = Numbro(symbolObj['32']).format('0.0[000]')
        vd[37] = Numbro(symbolObj['37']).format('0.0[000]')
        vd[133] = Numbro(symbolObj['133']).format('0.0[000]')
        vd.change = isNaN(change) ? '--' : change
        vd.chg = isNaN(changeP) ? '--' : changeP + '%'
        vd.chgNum = Number((symbolObj['3'] - symbolObj['31']) / symbolObj['31'])
        vd.shortExchange = util.MapExchange(symbolObj['20'])
        vd.shortName = util.GetSymbolName(symbolObj, { short: true, lang: this.state.slanguage })
        vd.dateTime = symbolObj.datetime
        vd.quoteUsage = symbolObj.quoteUsage || '--'
        vd.quoteBalance = symbolObj.quoteBalance || '--'
        this.state.viewData = vd
        return vd
    }
    linkSymbolPrice() {
        hashHistory.push("/symbolPrice?symbol=" + this.symbolData[0])
    }

    copyPrice(e) {
        if (this.props.typeClick == 'market') return
        if (this.props.typeClick == 'auction') return
        if (isNaN(e)) return
        if (typeof this.props.onPriceClick === 'function') {
            this.props.onPriceClick(e)
        }
    }
    symbolPriceTable() {
        return (
            <table className="symbolPrice-table">
                < tbody >
                    {priceInfoSchema.map((itemList, trKey) => {
                        return (
                            <tr key={trKey}>
                                {itemList.map((item, tdKey) => {
                                    return (
                                        <td className="" key={tdKey}>
                                            <div>
                                                <span><span className="symbolPrice-label">{messages[item.i18n].text}</span></span>
                                                <span className={item.class} onClick={item.format === 'million' ? '' : this.copyPrice.bind(this, this.state.viewData[item.id])}>
                                                    {item.format === 'million' ? isNaN(this.state.viewData[item.id]) ? '--' : Numbro(this.state.viewData[item.id]).format('0.00a').toUpperCase() : isNaN(this.state.viewData[item.id]) ? '--' : this.state.viewData[item.id]}
                                                </span>
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        )
    }

    render() {
        var symbolObj = {}
        if (typeof this.props.getSymbolData === 'function') {
            symbolObj = this.props.getSymbolData()
            this.setSymbolPriceFormat(symbolObj)
        }
        return (
            <div className="symbolPrice itrader-mgtop10" style={{ display: this.props.getSymbolData() === undefined ? 'none' : this.symbolData[0] ? 'block' : 'none' }}>
                <div className="symbolPrice-dateUsage">
                    <div className="symbolPrice-date">
                        <span className={this.state.exchgStatus == '--' ? 'none' : this.state.exchgStatus == 1 ? 'symbolPriceMarket symbolPrice-marketOpen' : 'symbolPriceMarket symbolPrice-marketClosed'}></span>
                        <span className="symbolPrice-dataLabel">{this.state.exchgStatus == '--' ? '' : this.state.exchgStatus == 1 ? messages.market_status_open.text : messages.market_status_closed.text}</span>
                        <span className="">{this.state.viewData[33]}</span>
                    </div>
                    <div className={this.state.viewData.quoteUsage && this.state.viewData.quoteBalance == '--' ? "symbolPrice-usageNone" : 'symbolPrice-usage'}>
                        <span className="symbolPrice-dataLabel">{messages.app_column_usage.text}</span>
                        <span className="">{this.state.viewData.quoteUsage + '/' + this.state.viewData.quoteBalance}</span>
                    </div>
                </div>
                <div className="symbolPrice-up">
                    <div className="symbolPrice-upl">
                        <span className="symbolPrice-upShortName">{this.state.viewData.shortName}</span>
                    </div>
                    <div className="symbolPrice-upr">
                        <button style={{ display: this.priceType === 'trade' ? '' : 'none' }} className="symbolPrice-btn symbolPrice-btnDetail" onClick={this.linkSymbolPrice.bind(this)}>{messages.app_btn_detail.text} <i className="fa fa-link"></i></button>
                        <button className="symbolPrice-btn btnDelay symbolPrice-btnDelay" data-priceBtn-type='0' onClick={this.refresh.bind(this)}>{messages.app_btn_delay.text} <i className="fa fa-clock-o"></i><i className="lampDelay"></i></button>
                        <button className="symbolPrice-btn btnRealTime symbolPrice-btnRealTime" data-priceBtn-type='1' onClick={this.refresh.bind(this)}>{messages.app_btn_realtime.text}{this.state.refreshFlag} <i className={this.state.refreshFlag == true ? 'fa fa-refresh icon-Refresh' : 'fa fa-refresh'}></i><i className="lampRealtime"></i></button>
                    </div>
                </div>

                <div className="symbolPrice-down">
                    <div className="symbolPrice-downl">
                        <div className="symbolPrice-center">
                            <div className="symbolPrice-upSymbol">
                                <span className={'exchange-' + this.state.viewData.shortExchange}>
                                    {this.state.viewData.shortExchange}
                                </span>
                                {this.state.viewData[0]}
                            </div>
                        </div>
                        <div className={Number(this.symbolData['3']) > Number(this.symbolData['31']) ? 'symbolPrice-downl-price itrader-color-green' : (Number(this.symbolData['3']) === Number(this.symbolData['31']) ? 'symbolPrice-downl-price' : 'symbolPrice-downl-price itrader-color-red')} onClick={this.copyPrice.bind(this, this.state.viewData[3])}>{this.state.viewData[3]}</div>
                        <div className="change-chg">
                            <span className={this.state.viewData.change > 0 ? 'itrader-color-green symbolPrice-downl-chg' : 'itrader-color-red symbolPrice-downl-chg'}>{this.state.viewData.change > 0 ? '+' + this.state.viewData.change : this.state.viewData.change}</span>
                            <span className={this.state.viewData.chgNum > 0 ? 'itrader-color-green' : 'itrader-color-red'}>{this.symbolData.chg > 0 ? '+' + this.state.viewData.chg : this.state.viewData.chg}</span>
                        </div>
                    </div>
                    {this.symbolPriceTable()}
                </div>
            </div>
        )
    }
}
