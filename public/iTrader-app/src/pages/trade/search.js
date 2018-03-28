import React, { Component } from 'react'
import {
    SearchBar,
    PanelBody,
    MediaBox,
} from 'react-weui'
import {
    Link,
} from 'react-router'
import $ from 'jquery'
import oms from '../../lib/oms'
import util from '../../lib/util'
import SingleNav from '../../components/singleNav'
import LogoutModel from '../../components/logoutModel'

export default class OrderChild extends Component {
    constructor() {
        super();
        this.state = {
            searchInfo: messages.app_singleTitle_searchSingle.text,
            symbol: '00001',
            searchText: '',
            marketData: [],
            urls: localStorage.getItem("urls") || ''
        }
    }
    handleChange(e) {
        var that = this
        var queryString = e

        this.setState({
            searchText: e,
        });
        $.get('/iTrader/product/search', {
            action: 'search',
            count: 10,
            query: queryString,
            cols: '0,symbolName,20',
        }, function (data) {
            if (!data || !data.data) return
            data = data.data
            for (var i in data) {
                data[i].symbol = data[i][0]
                data[i].exchange = data[i][20]
                data[i].shortExchange = util.MapExchange(data[i].exchange)
            }
            that.setState({ marketData: data })
        })
    }

    linkBuySell(e) {
        if (this.state.urls == 'buy') {
            util.setSessionStorage('layout', { navIndex: 0 })
        }
        if (this.state.urls == 'sell') {
            util.setSessionStorage('layout', { navIndex: 1 })
        }
        var symbol = this.state.marketData[e].symbol
        util.setSessionStorage('trade-data', { symbol: symbol })
        location.href = "/#/trade/" + this.state.urls + "?"
    }

    render() {
        return (
            <div className="search-singlePage">
                <SingleNav single={this.state.searchInfo} />
                <SearchBar
                    onChange={this.handleChange.bind(this)}
                    defaultValue={this.state.searchText}
                    placeholder={messages.app_column_search_input.text}
                    lang={{
                        cancel: messages.app_btn_cancel.text,
                    }}
                />
                <div style={{ display: this.state.searchText ? null : 'none', marginTop: 0 }}>
                    <PanelBody>
                        {
                            this.state.marketData.length > 0 ?
                                this.state.marketData.map((item, i) => {
                                    return (
                                        <div className="search-cont border-bottom-1px" key={i} onClick={this.linkBuySell.bind(this, i)}>
                                            <div className="market-name">
                                                {item.symbolName}
                                            </div>
                                            <div className="market-symbol">
                                                <span className={'exchange-' + item.shortExchange}>{item.shortExchange}</span>
                                                <span>{item.symbol}</span>
                                            </div>
                                        </div>
                                    )
                                })
                                : <MediaBox>{messages.app_message_search_result.text}！</MediaBox>
                        }
                    </PanelBody>
                </div>
                <LogoutModel />
            </div>
        );
    }
}