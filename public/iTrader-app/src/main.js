import global from './lib/global'
import React, { Component } from 'react';
import {
    render,
    ReactDOM
} from 'react-dom';
import {
    Router,
    Route,
    IndexRoute,
    hashHistory,
} from 'react-router';

import Header from './components/header';
import Footer from './components/footer/footer';
import LogoutModel from './components/logoutModel';
import Socket from './lib/socket'

class Main extends Component {
    componentWillMount() {
        if (typeof window.sessionStorage == 'undefined') {
            alert(messages.app_message_storage.text)
        }
    }
    render() {
        return (
            <div className="itrader">
                <Header />
                <main className="itrader-main itrader-page">
                    {this.props.children}
                </main>
                <Footer />
                <LogoutModel />
            </div>
        );
    }
}



// Pages
import Market from './pages/market';
import Account from './pages/account';

import AccountIndex from './pages/account/index'
import AccountUser from './pages/account/user'
import TradeIndex from './pages/trade/index'
import { TradeBuy, TradeSell } from './pages/trade/buysell'


import TradeOrderDetail from './pages/trade/orderDetail'
import TradeSearch from './pages/trade/search'
import SymbolPrice from './pages/trade/symbolPrice'
// import { TradeOrder, TradeCancel } from './pages/trade/order'
import TradeOrder from './pages/trade/order'
import TradeCancel from './pages/trade/cancel'
import TradePosition from './pages/trade/position'


const routes = (
    <Router history={hashHistory}>
        <Route path="/" component={Main}>
            <IndexRoute component={TradeIndex} />
            <Route path="market" component={Market} />
            <Route path="account">
                <IndexRoute component={AccountIndex} />
                <Route path="user" component={AccountUser} />
            </Route>
            <Route path="trade" component={TradeIndex}>
                <IndexRoute component={TradeBuy} />
                <Route path="buy" component={TradeBuy} />
                <Route path="sell" component={TradeSell} />
                <Route path="order" component={TradeOrder} />
                <Route path="cancel" component={TradeCancel} />
                <Route path="position" component={TradePosition} />
            </Route>
        </Route>
        <Route path="orderDetail" component={TradeOrderDetail} />
        <Route path="search" component={TradeSearch} />
        <Route path="symbolPrice" component={SymbolPrice} />
    </Router>
);

document.addEventListener('DOMContentLoaded', () => {
    Socket.initialize()
    render(routes, document.getElementById('content'));

});