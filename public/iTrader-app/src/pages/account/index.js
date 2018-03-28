import React, { Component } from 'react';
import {
    render,
    ReactDOM
} from 'react-dom';
import {
    Link,
} from 'react-router';
import $ from 'jquery'
import LayoutConfig from '../../config/layout.config';
import dataCenter from '../../lib/data'
export default class Index extends Component {
    constructor() {
        super();
        this.isMount
        this.allAccountData = {}
        this.state = {
            currentCurrency: null,
            currencyData: {},
            balanceCurrencyList: [],
            accountData: {},
            accountID: '',
            accountName: '',
        }
        this.schema = __setting.account_balance.schema
    }
    componentDidMount() {
        this.isMount = true
        this.initialize()
    }
    componentWillUnmount() {
        this.isMount = false
    }
    initialize() {
        var that = this
        dataCenter.subscribe('account', (data) => {
            if (!data) return
            that.allAccountData = data
            var currencyList = []
            for (var p in data) {
                var item = data[p]
                var currency = item[23]
                if (currency == that.state.currentCurrency) {  // currency = null
                    if (!that.isMount) return  // unmount, skip
                    that.setState({ accountData: item })
                }
                currency = currency || messages.app_column_all.text
                if (currencyList.indexOf(currency) < 0) {
                    currencyList.push(currency)
                }
            }
            var currencyList = currencyList.sort((a, b) => {
                if (b == messages.app_column_all.text) return 1
                if (b == 'HKD') return 1
            })
            that.setState({ balanceCurrencyList: currencyList })
        })
        $.get('/iTrader/account', function (data) {
            if (!data || !data.data) return
            data = data.data
            that.setState({
                accountID: data.id,
                accountName: data.name
            })
        })

        dataCenter.subscribe('currency', () => {
            var customCurrencyInfo = dataCenter.custom('currency')
            that.setState({ currencyData: { baseCurrency: customCurrencyInfo.baseCurrency, currencyMode: customCurrencyInfo.currencyMode } })
        })
    }

    accountHead() {
        return (
            <div className="act-head itrader-mgtop10">
                <Link to="/account/user" >
                    <div className="act-headl itrader-color">
                        <img style={{ width: 35 }} src='/javascripts/app/images/icon_broker.png' />
                        <span>{this.state.accountName + '(' + this.state.accountID + ')'}</span>
                    </div>
                    <div className="act-headr itrader-color">
                        <i className="fa fa-chevron-right" aria-hidden="true"></i>
                    </div>
                </Link>
            </div>
        )
    }

    handleCurrencySelect(e) {
        if (!this.allAccountData) return
        var currency = e.target.value
        if (currency === messages.app_column_all.text) currency = ''
        var data = this.allAccountData[this.state.accountID + '_' + currency]
        if (data) {
            this.setState({ accountData: data })
        }
    }

    getBalanceCurrencyList() {
        var that = this
        if (this.state.currencyData.currencyMode === 'multi') {
            return (
                <select className="itrader-color" onChange={this.handleCurrencySelect.bind(this)}>
                    {this.state.balanceCurrencyList.map((item, index) => {
                        return (
                            <option key={index} value={item}>{item}{item === messages.app_column_all.text ? '(' + that.state.currencyData.baseCurrency + ')' : ''}</option>
                        )
                    })}
                </select>
            )
        } else if (this.state.currencyData.currencyMode === 'single') {
            return (
                <button>{this.state.currencyData.baseCurrency}</button>
            )
        }
    }

    sortCurrency() {
        if (!this.state.currencyData || !this.state.balanceCurrencyList) return
        var baseCurrency = this.state.currencyData.baseCurrency
        var list = this.state.balanceCurrencyList.sort((a, b) => {
            if (b === null || b === 'ALL') return 1
            if (b == baseCurrency) return 1
        })
        this.setState({ balanceCurrencyList: list })
    }

    accountCont() {
        var accountAssets = { name: 'total portfolio value', key: 'totalPortfolioValue', format: 'amount', i18n: 'app_column_assets' }
        var accountValue = [
            { name: 'market value', key: 'marketValue', format: 'amount', class: 'text-right', i18n: 'column_market_value' },
            { name: 'Total Unrealized PL', key: 'unrealizedPL', format: 'amount', class: 'text-right', i18n: 'column_unrealizedPL' },
        ]
        var accountAlias = []
        var accountOther = []
        for (var row of this.schema) {
            if (row.key == 'marketValue' || row.key == 'unrealizedPL' || row.key === 'totalPortfolioValue') {
                continue
            } else if (row.alias == 'CB' || row.alias == 'TL') {
                accountAlias.push(row)
            } else {
                accountOther.push(row)
            }
        }
        return (
            <div className="itrader-color">
                <div className="assets-currency border-top-1px">
                    <div className="act-assets">
                        <span className="ass-spanup">{messages[accountAssets.i18n].text}</span>
                        <span className="ass-spandowm">{(this.state.accountData ? this.state.accountData[accountAssets.key] : '0') || '0'}</span>
                    </div>
                    <div className="act-currency">
                        {this.getBalanceCurrencyList()}
                    </div>
                </div>
                <div className="act-module">
                    {
                        accountValue.map((item, index) => {
                            return (
                                <div className="act-modCol" key={index}>
                                    <span className="mod-spanup">{messages[item.i18n].text}</span>
                                    <span className="mod-spandowm">{(this.state.accountData ? this.state.accountData[item.key] : '0') || '0'}</span>
                                </div>
                            )
                        })
                    }
                </div>
                <div className="act-cont">
                    {accountAlias.map((item, index) => {
                        return (
                            <div key={index} className="act-line border-bottom-1px">
                                <span className="act-spanl">{messages[item.i18n].text}</span>
                                <span className="act-spanr">{(this.state.accountData ? this.state.accountData[item.key] : '0') || '0'}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="act-cont">
                    {accountOther.map((item, index) => {
                        return (
                            <div key={index} className="act-line border-bottom-1px">
                                <span className="act-spanl">{messages[item.i18n].text}</span>
                                <span className="act-spanr">{(this.state.accountData ? this.state.accountData[item.key] : '0') || '0'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )

    }

    render() {
        return (
            <div className="">
                {this.accountHead()}
                {this.accountCont()}
            </div>
        );
    }
}

