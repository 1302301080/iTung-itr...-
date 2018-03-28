/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2016 eBroker Systems Ltd.                 }
{       ALL RIGHTS RESERVED                                         }
{                                                                   }
{   RESTRICTIONS                                                    }
{                                                                   }
{   THIS SOURCE CODE AND ALL RESULTING INTERMEDIATE FILES           }
{   ARE CONFIDENTIAL AND PROPRIETARY TRADE                          }
{   SECRETS OF EBROKER SYSTEMS LTD.THE REGISTERED DEVELOPER IS      }
{   LICENSED TO DISTRIBUTE THE PRODUCT AND ALL ACCOMPANYING         }
{   JAVASCRIPT FUNCTIONS AS PART OF AN EXECUTABLE PROGRAM ONLY.     }
{                                                                   }
{   THE SOURCE CODE CONTAINED WITHIN THIS FILE AND ALL RELATED      }
{   FILES OR ANY PORTION OF ITS CONTENTS SHALL AT NO TIME BE        }
{   COPIED, TRANSFERRED, SOLD, DISTRIBUTED, OR OTHERWISE MADE       }
{   AVAILABLE TO OTHER INDIVIDUALS WITHOUT EXPRESS WRITTEN CONSENT  }
{   AND PERMISSION FROM EBROKER SYSTEMS LTD.                        }
{                                                                   }
{   CONSULT THE END USER LICENSE AGREEMENT FOR INFORMATION ON       }
{   ADDITIONAL RESTRICTIONS.                                        }
{                                                                   }
{*******************************************************************}

{ $Id: sea.js,v 1.13 2018/03/09 10:16:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

// var prefix = '/javascripts/iTrader/modules/'
// var prefix = '/javascripts/iTrader/modules/'
var prefix = '/iTrader/src/js/modules/'
// var eipoPrefix = 'javascripts/eipo/'
var eipoPrefix = '/eipo/src/js/'
// var sharedPrefix = 'javascripts/shared/'
var sharedPrefix = '/shared/src/js/'
seajs.config({
    base: "/",
    alias: {
        "format": sharedPrefix + "format.js",
        "socket": sharedPrefix + "socket.js",
        "socket-v2": sharedPrefix + "socket_v2.js",
        "datatables": sharedPrefix + "datatables.js",
        "dialog": sharedPrefix + "dialog.js",

        "ticket": prefix + "ticket.js",
        "fund-ticket": prefix + "fund_ticket.js",
        "bond-ticket": prefix + "bond_ticket.js",
        "account-balance": prefix + "account_balance.js",
        "account-balance2": prefix + "account_balance2.js",
        "password": prefix + "password.js",
        "cregistrationFA": prefix + "cregistration_2FA.js",
        "fundbook": prefix + "fundbook.js",
        "orderbook": prefix + "orderbook.js",
        "cashbook": prefix + "cashbook.js",
        "portfolio": prefix + "portfolio.js",
        "price": prefix + "price.js",
        "account-overall": prefix + "account_overall.js",
        "exchange-ratio": prefix + "exchange_ratio.js",
        "cashview": prefix + "cashview.js",
        "historybook": prefix + "historybook.js",
        "market-price": prefix + "market_price.js",
        "transaction-history": prefix + "transaction_history.js",
        "fund-trade": prefix + "fund_trade.js",
        "bond-trade": prefix + "bond_trade.js",
        "fund-position": prefix + "fund_position.js",
        "bond-position": prefix + "bond_position.js",
        "eStatement": prefix + "eStatement.js",
        "mobile": prefix + "mobile.js",
        "full-trade": prefix + "full_trade.js",
        "settlement": prefix + "settlement.js",
        "price-quote": prefix + "price_quote.js",
        "util": prefix + "util.js",
        "notification": prefix + "notification.js",
        "reject-order-notification": prefix + "reject_order_notification.js",
        "bond-trade-v2": prefix + "allInOneTrade/bond_trade.js",
        "fund-trade-v2": prefix + "allInOneTrade/fund_trade.js",

        "eipo": eipoPrefix + "eipo.js",
        "eipo-user": eipoPrefix + "user.js",
        "eipo-utility": eipoPrefix + "utility.js",
        "eipo-socket": eipoPrefix + "socket.js",
        "eipo-application": eipoPrefix + "application.js",
        "eipo-accountExploer": eipoPrefix + "accountExploer.js"
    }
})