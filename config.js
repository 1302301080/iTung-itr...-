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

{ $Id: config.js,v 1.54 2017/12/26 03:17:35 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var global = {
    site: {
        protocol: 'http',
        host: '127.0.0.1',
        port: '3000',
        themes: ['lightblue', 'dark', 'light'],
        languages: ['zh-HK', 'en-US', 'zh-CN'],
        version: require("./package.json").version,
        timeout: 30,
        ssl: {
            cert: './cert/test.crt',
            key: './cert/test_nopass.key',
        }
    },
    log4js: {
        appenders: [
            // { type: 'console' },
            { type: 'dateFile', filename: 'D:\\oms\\log\\iTraderELiteReq', category: 'request', pattern: "_yyyyMMdd.log", alwaysIncludePattern: true },
            {
                type: "logLevelFilter",
                level: "DEBUG",
                category: 'elite',
                appender: {
                    type: "dateFile",
                    filename: "D:\\oms\\log\\iTraderELite",
                    pattern: "_yyyyMMdd.log",
                    alwaysIncludePattern: true
                }
            },
        ]
    },
    session: {
        secret: '369-*/789a',
        name: 'sid',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false },
        timeout: 60 * 60 * 4
    },
    web: {
        headers: []
    },
    message: {
        files: [{ path: 'Messages.xml' }]
    }
}

var iTrader = {
    oms: {
        applicationID: 'iTrader',
        operatorFlag: 'I',
        device: 'Internet',
        baseCurrency: 'HKD',
        products: ['1'],
        encoding: 'GB18030',
        reconnectInterval: 30,
        MarginRatioMode: 1,
        avgPriceMode: 2,
        autoVerifyInterval: 60 * 14,
        manualVerifyInterval: 0,
        fundSwitchIDPrefix: 'X',
        recoverFile: {
            fundSwitchIDSeq: 'D:/oms/recover/fund-switchID-seq.txt'
        },
        servers: {
            // SSM: { host: '192.168.201.29', port: 9090 },
            // ITS: { host: '192.168.201.29', port: 9099 },
            // PriceDDS: { host: '192.168.201.29', port: 9101 }
            SSM: { host: '115.160.142.248', port: 29090 },
            ITS: { host: '115.160.142.248', port: 29099 },
            PriceDDS: { host:'115.160.142.248', port: 29101 },
            // ADDS: { host: '115.160.142.248', port: 29102 }
        },
        // exchange subscribed from DDS and sort by this list. field support icon and enable(default true, means display in the UI)
        // also support order type & tif, type: 'LO,MO,AO,ALO,ELO,SLO,STPL', tif: 'FAK,FOK,GTC,GTD', default full list
        // all icons ref http://flag-icon-css.lip.is/
        // isDayTrade: for max sell calculation, default true.
        // isPriceQuote: for run in price quote flow, default false.
        // isPricing: for pricing license, default true.
        // { key: 'SEHK', icon: 'flag-icon-hk', type: 'LO,AO,ELO,SLO', tif: 'FAK,FOK,GTC,GTD', isDayTrade: true, isPriceQuote: false, isPricing: true },
        exchanges: [
            { key: 'SEHK', icon: 'flag-icon-hk', isDayTrade: true, isPricing: false, isAShare: true },
            { key: 'US', icon: 'flag-icon-us' },
            { key: 'SHSE', icon: 'flag-icon-cn', isDayTrade: false, isAShare: true },
            { key: 'SZSE', icon: 'flag-icon-cn', isDayTrade: false, isAShare: true },
            { key: 'HKFE', icon: 'flag-icon-hk' },
            { key: 'BOND', icon: 'flag-icon-hk', isPriceQuote: true },
            { key: 'FUND', icon: 'flag-icon-hk' },
            { key: 'MANU', enable: false }
        ],
        // China Connect Master-Sub Account Mode(mode 2)
        CNYAcctMapExchList: '',
        CNYAcctSuffix: '_CNY',
        // if no password pattern set, will use SSM testpwd function
        password: {
            // pattern: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,12}/,   // 6-12, upper, lower, number
        }
    },
    format: {   // global format
        // please noted that we seriously not recommended to open the amount/quantity/price/percentage format as we have build-in format solution, and this configuration just for special requirement.
        // amount: '#,##0.0000',
        // quantity: '#,##0.0',
        // price: '#,##0.00000',
        // percentage: '#,##0.000',
        date: 'YYYY-MM-DD',
        shortDate: 'YYYY-MM',  // date without day
        bond_unit: "#,##0.00",
        fund_unit: "#,##0.0000",
    },
    update_frequency: {
        account: 5,
        product: 5,
    },
    exchange_rule: {
        SEHK: { rule: 'zerofill', options: { size: 5 } },
        US: { rule: 'suffix', options: { suffix: '.US', case: 'upper' } },
        BOND: { options: { case: 'upper' } },
        FUND: { options: { case: 'upper' } }
    },
    views: {
        // popupRejectedOrder: true,
        login: {
            pin: 6,
            pwdExpiryPromptDays: 3,
            // forgetPasswordUrl: 'http://localhost:8080/ResetPassword/ResetPassword.aspx',password
            // riskDisclosureUrl: '/html/disclaimer.html'
            // advertisement: { url: '' }
            // captcha: true
        },
        trade: {
            rows: [
                {
                    type: 'panel', columns: [
                        { name: 'ticket', path: 'ticket.ejs', class: 'col-lg-3 col-md-4 col-sm-12' },
                        { name: 'account balance', path: 'account.ejs', class: 'col-lg-3 col-md-8 col-sm-12' },
                        { name: 'portfolio', path: 'portfolio.ejs', class: 'col-lg-6 col-md-12 col-sm-12' }
                    ]
                },
                {
                    type: 'tab', class: 'col-lg-12', columns: [
                        { name: 'order_book', path: 'orderbook.ejs' },
                        { name: 'fund_book', path: 'fundbook.ejs' },
                        // { name: 'price_quote_book', path: '../pricequote/index.ejs' },
                        { name: 'cash_book', path: 'cashbook.ejs' },
                        { name: 'order_history', path: 'order_history.ejs' },
                        { name: 'transaction_history', path: 'transaction_history.ejs' },
                        { name: 'price', path: 'price.ejs', entitlement: 'WebPrice' },
                        // { name: 'eStatement', path: '../eStatement/index.ejs' },
                        // { name: 'settlement_instruction', path: '../settlement_instruction/index.ejs', i18n: 'tabs_stockquote'  },
                        { name: 'AAStocks', path: '../product/aastocks.ejs', entitlement: 'AASTOCKS', i18n: 'tabs_stockquote'  },
                        // { name: 'MegaHub', path: '../product/megahub.ejs', entitlement: 'MegaHub', i18n: 'tabs_stockquote'  },
                        // { name: 'TSCI', path: '../product/tsci.ejs', entitlement: 'TSCIPRICE', i18n: 'tabs_stockquote'  },
                    ]
                }
            ],
            ticket: {
                max_buy: true,
                max_sell: true,
                tips: false,
                CBBCAgreement: false,
                allowZeroPrice: true,
                clearAfterSubmit: false,
                bondPriceInRate: true,
                disableFundTicket: true,
                disableBondTicket: true,
                shortcut: {
                    enable: false,
                    buy: 'Ctrl+B',
                    sell: 'Ctrl+S',
                    reset: 'Ctrl+R',
                    tabUp: 'Shift+Tab',
                    tabDown: 'Tab',
                    refresh: 'F9'
                }
            },
            order_book: {
                trade_detail: true,
                change: { changeable: true, status: [1, 2, 8, 100], channel: ['*'] },  // here 100 means queue order, * means all
                cancel: { cancelable: true, status: [1, 2, 5, 8, 100], channel: ['*'] },
                schema: [
                    { name: 'change action', key: 'change', 'class': 'text-center', i18n: 'column_amend' },
                    { name: 'cancel action', key: 'cancel', 'class': 'text-center', i18n: 'column_cancel' },
                    { name: 'date', key: 'datetime', mobile: false },
                    { name: 'order number', key: 6, mobile: false },
                    // { name: 'account', key: 10 },
                    { name: 'side', key: 11, mobile: false },
                    { name: 'symbol', key: 0, 'class': 'pointer' },
                    // { name: 'symbol name', key: 'shortName' },
                    { name: 'currency', key: 23, mobile: false },
                    { name: 'price', key: 3, 'class': 'text-right' },
                    { name: 'avg price', key: 42, 'class': 'text-right', default: 0, mobile: false },
                    { name: 'quantity', key: 4, format: 'quantity', 'class': 'text-right', },
                    { name: 'filled quantity', key: 34, format: 'quantity', 'class': 'text-right', default: 0, mobile: false },
                    { name: 'queue quantity', key: 122, format: 'quantity', 'class': 'text-right', default: 0, mobile: false },
                    { name: 'status', key: 5, },
                    { name: 'source', key: 400, mobile: false },
                    { name: 'options', key: 'options', mobile: false },
                    { name: 'remark', key: 25, mobile: false }
                ],
                trade_schema: [
                    { name: 'trade no', key: 8, i18n: 'column_trade_no' },
                    { name: 'price', key: 3, class: 'text-right', i18n: 'column_price' },
                    { name: 'quantity', key: 4, format: 'quantity', class: 'text-right', i18n: 'column_quantity' },
                    { name: 'execution time', key: 33, i18n: 'column_execution_time' },
                    // { name: 'broker id', key: 45, i18n: 'column_broker_id' },
                ],
                color_schema: [  // support side and status
                    { side: 0, color: '#008641' },
                    { side: 1, color: '#E24C41' },
                    { status: -1, color: '#E24C41' }
                    // { status: 3, color: '#000' },
                    // { side: 0, status: 3, color: '#008641' },
                    // { side: 1, status: 3, color: '#E24C41' },
                    // { status: 4, color: '#ccc' },
                    // { status: 100, color: '#20608E' },
                ]
            },
            cash_book: {
                schema: [
                    { name: 'date', key: 'datetime' },
                    { name: 'order number', key: 6, mobile: false },
                    { name: 'account', key: 10, mobile: false },
                    { name: 'side', key: 11, },
                    { name: 'currency', key: 23 },
                    { name: 'price', key: 3, format: 'amount', 'class': 'text-right' },
                    { name: 'status', key: 5, },
                ]
            },
            fund_book: {
                schema: [
                    { name: 'change action', key: 'change', 'class': 'text-center', },
                    { name: 'cancel action', key: 'cancel', 'class': 'text-center', },
                    { name: 'date', key: 'datetime', i18n: 'column_datetime', mobile: false },
                    { name: 'order number', key: 6, i18n: 'column_order_no', mobile: false },
                    // { name: 'account', key: 10, i18n: 'column_account' },
                    { name: 'symbol', key: 0, i18n: 'column_symbol' },
                    { name: 'side', key: 11, i18n: 'column_fund_side', mobile: false },
                    { name: 'currency', key: 23, i18n: 'column_currency', mobile: false },
                    { name: 'subscription amount', key: 3, format: 'amount', 'class': 'text-right', i18n: 'column_subscription_amount' },
                    { name: 'status', key: 5, i18n: 'column_status', mobile: false },
                    { name: 'unit', key: 4, 'class': 'text-right', i18n: 'column_unit' },
                    { name: 'transaction fee', key: 'transFee', format: 'percentage@2', i18n: 'column_transaction_fee', mobile: false },
                ]
            },
            price_quote_book: {
                schema: [
                    { name: 'agree action', key: 'agree', 'class': 'text-center', },
                    { name: 'cancel action', key: 'cancel', 'class': 'text-center', },
                    { name: 'date', key: 'datetime', i18n: 'column_datetime', mobile: false },
                    { name: 'order number', key: 6, i18n: 'column_order_no', mobile: false },
                    { name: 'side', key: 11, i18n: 'column_side', mobile: false },
                    { name: 'symbol', key: 0, i18n: 'column_symbol' },
                    { name: 'currency', key: 23, i18n: 'column_currency', mobile: false },
                    { name: 'price', key: 3, 'class': 'text-right', i18n: 'column_price' },
                    { name: 'quantity', key: 4, format: 'quantity', 'class': 'text-right', i18n: 'column_quantity' },
                    { name: 'status', key: 5, i18n: 'column_status' },
                    { name: 'source', key: 400, i18n: 'column_source', mobile: false },
                    { name: 'options', key: 'options', i18n: 'column_options', mobile: false },
                    { name: 'remark', key: 25, i18n: 'column_remark', mobile: false }
                ],
            },
            history_order: {
                schema: [
                    { name: 'date', key: 'datetime' },
                    { name: 'order number', key: 6, mobile: false },
                    { name: 'account', key: 10 },
                    { name: 'side', key: 11 },
                    { name: 'symbol', key: 0 },
                    { name: 'symbol name', key: 'shortName', mobile: false },
                    { name: 'currency', key: 23, mobile: false },
                    { name: 'price', key: 3, 'class': 'text-right' },
                    { name: 'avg price', key: 42, 'class': 'text-right', default: 0, mobile: false },
                    { name: 'quantity', key: 4, format: 'quantity', 'class': 'text-right' },
                    { name: 'filled quantity', key: 34, format: 'quantity', 'class': 'text-right', default: 0, mobile: false },
                    { name: 'status', key: 5 },
                ],
                fundSchema: [
                    { name: 'date', key: 'datetime', i18n: 'column_datetime' },
                    { name: 'order number', key: 6, i18n: 'column_order_no' },
                    { name: 'account', key: 10, i18n: 'column_account' },
                    { name: 'symbol', key: 0, i18n: 'column_symbol' },
                    { name: 'side', key: 11, i18n: 'column_fund_side' },
                    { name: 'currency', key: 23, i18n: 'column_currency' },
                    { name: 'subscription amount', key: 3, format: 'amount', 'class': 'text-right', i18n: 'column_subscription_amount' },
                    { name: 'investment amount', key: 'investAmount', format: 'amount', 'class': 'text-right', i18n: 'column_investment_amount' },
                    { name: 'status', key: 5, i18n: 'column_status' },
                    { name: 'unit', key: 4, 'class': 'text-right', i18n: 'column_unit' },
                    { name: 'transaction fee', key: 'transFee', format: 'percentage@2', i18n: 'column_transaction_fee' },
                ],
                filter: {
                    // type: ['order', 'fund', 'cash'],
                    days: [2, 7, 14]
                }
            },
            account_balance: {
                // consolidatedBalanceMode: true,
                // showMultiCurrencyCB: false,
                // showConsolidatedCB: true,
                // disableCurrencyConversion: true,
                // mainSchema: [
                //     { name: 'C.B.', key: 156 },
                //     { name: 'T.L.', key: 155 },
                // ],
                schema: [
                    { name: 'cash balance', key: 156, alias: 'CB', i18n: 'column_cash_balance' },
                    // { name: 'bank balance', key: 'bankBalance', i18n: 'column_bank_balance' },
                    { name: 'trading limit', key: 155, alias: 'TL', i18n: 'column_trading_limit' },
                    // { name: 'PSL Web', key: 467, i18n: 'column_PSL_web' },
                    // { name: 'purchasing power', key: 1202, i18n: 'column_purchasing_power' },
                    { name: 'Initial Trading Limit', key: 185, i18n: 'column_initial_trading_limit' },
                    { name: 'Initial Cash Balance', key: 186, i18n: 'column_initial_cash_balance' },
                    // { name: 'margin call', key: 996, i18n: 'column_margin_call' },
                    // { name: 'total portfolio value', key: 'totalPortfolioValue', i18n: 'column_total_portfolio_value' },
                    // { name: 'net asset value', key: 'netAssetValue', i18n: 'column_net_asset_value' },
                    { name: 'acceptable value', key: 'acceptValue', i18n: 'column_accept_value' },
                ]
            },
            portfolio: {
                schema: [
                    { name: 'symbol', key: 0 },
                    // { name: 'market', key: 'market', i18n: 'column_market' },
                    { name: 'quantity', key: 4, format: 'quantity', 'class': 'text-right', default: 0 },
                    // { name: 'queue quantity', key: 'queueQuantity', format: 'quantity', class: 'text-right', i18n: 'column_queue_quantity' },
                    // { name: 'available quantity', key: 'availableQuantity', format: 'quantity', class: 'text-right', i18n: 'column_available_quantity' },                   
                    // { name: 'unavailable quantity', key: 'unavailableQuantity', format: 'quantity', class: 'text-right', i18n: 'column_unavailable_quantity' },
                    { name: 'avg price', key: 'costPrice', 'class': 'text-right', default: 0 },
                    { name: 'market value', key: 'marketValue', format: 'amount', 'class': 'text-right', default: 0 },
                    { name: 'accept value', key: 'acceptValue', format: 'amount', 'class': 'text-right', default: 0, mobile: false },
                    { name: 'P&L', key: 'unrealizedPL', format: 'amount', 'class': 'text-right', default: 0, mobile: false },
                ],
                tooltip: [
                    { name: 'name', key: 'symbolName', i18n: 'column_symbol_name' },
                    { name: 'currency', key: 23, i18n: 'column_currency' },
                    { name: 'bod quantity', key: 'bodQuantity', format: 'quantity', i18n: 'column_bod_quantity' },
                    { name: 'pre close', key: 31, i18n: 'column_pre_close' },
                    { name: 'P&L', key: 'unrealizedPL', format: 'amount', i18n: 'column_unrealizedPL' },
                    { name: 'P&L ratio', key: 'unrealizedPLRatio', format: 'percentage@3', i18n: 'column_unrealizedPL_ratio' },
                    { name: 'margin ratio', key: 'marginRatio', format: 'percentage', i18n: 'column_margin_ratio' },
                    { name: 'accept value', key: 'acceptValue', format: 'amount', i18n: 'column_accept_value' },
                    { name: 'queue quantity', key: 'queueQuantity', format: 'quantity', i18n: 'column_queue_quantity' },
                ]
            },
            order_confirmation: {
                compulsoryPasswordConfirmation: false,
                warningMessageConfirmation: false,
                fee: { genericModel: false },
                // showSymbolCurrencyInTotalAmount: ['TW'],
                commNFee: [  // avaliable key: commision, ccass, stamp, levy, tradefee, inlevy, totalfee, tax, charge6 or any oms tag
                    { name: 'commision', key: 'commision', exchange: ['SEHK', 'US', 'SHSE'], i18n: 'order_confirmation_comm' },
                    { name: 'ccass', key: 'ccass', exchange: ['SEHK'], i18n: 'order_confirmation_ccass' },
                    { name: 'stamp', key: 'stamp', exchange: ['SEHK'], i18n: 'order_confirmation_stamp' },
                    { name: 'levy', key: 'levy', exchange: ['SEHK'], i18n: 'order_confirmation_levy' },
                    // { name: 'tax', key: 'tax', exchange: ['SEHK'], i18n: 'order_confirmation_tax' },
                    // { name: 'charge6', key: 'charge6', exchange: ['SEHK'], i18n: 'order_confirmation_charge6' },
                    // { name: 'inlevy', key: 'inlevy', exchange: ['SEHK'], i18n: 'order_confirmation_inlevy' },
                    { name: 'tradefee', key: 'tradefee', exchange: ['SEHK', 'SHSE'], i18n: 'order_confirmation_tradefee' },
                    { name: 'chargecomm', key: 'commision', exchange: [''], i18n: 'order_confirmation_chargecomm' },
                    { name: 'mktcharge', key: 'totalfee', exchange: [''], i18n: 'order_confirmation_mktcharge' },
                ],
                // below 4 settings support Boolean and Array value, true means show value while false don't show. Also can set exchange in Array to control which exchange show value.
                transactionCost: ['SEHK', 'US'],
                commission: true,
                orderAmount: true,
                totalAmount: true,
            },
            transaction_history: {
                daysBeforeToday: 20,
                dateFormat: 'YYYY/MM/DD',
                schema: [
                    { name: 'transaction date', key: '134', i18n: 'column_transaction_date', mobile: false },
                    { name: 'settlement date', key: '3005', i18n: 'column_settlement_date', mobile: false },
                    { name: 'action', key: '11', i18n: 'column_action' },
                    { name: 'exchange', key: '20', i18n: 'column_exchange', mobile: false },
                    { name: 'symbol', key: '0', i18n: 'column_symbol' },
                    { name: 'quantity', key: '4', i18n: 'column_quantity', format: 'quantity', class: 'text-right' },
                    { name: 'price', key: '3', i18n: 'column_price', format: 'price', class: 'text-right' },
                    { name: 'principal', key: '46', i18n: 'column_principal', format: 'amount', class: 'text-right', mobile: false },
                    { name: 'charges', key: '402', i18n: 'column_charges', format: 'amount', class: 'text-right', mobile: false },
                    { name: 'credit/debit', key: '406', i18n: 'column_credit_debit', format: 'amount', class: 'text-right', mobile: false },
                    { name: 'description', key: '25', i18n: 'column_description', mobile: false },
                ]
            },
            price: {
                exchanges: ['SHSE', 'SEHK', 'US']
            },
        },
        assets: {
            rows: [
                {
                    type: 'panel', columns: [
                        { name: 'account summary', path: 'account_summary.ejs', class: 'col-lg-12' },
                    ]
                },
                {
                    type: 'panel', columns: [
                        { name: 'position summary', path: 'position_summary.ejs', class: 'col-lg-12' },
                    ]
                }
            ],
            overall: {
                enable: true
            },
            account: {
                enable: true,
                schema: [
                    { name: 'account', key: 10 },
                    { name: 'initial trading limit', key: 185, format: 'amount', class: 'text-right', i18n: 'column_initial_trading_limit', mobile: false },
                    { name: 'trading limit', key: 155, format: 'amount', class: 'text-right', i18n: 'column_trading_limit' },
                    { name: 'initial cash balance', key: 186, format: 'amount', class: 'text-right', i18n: 'column_initial_cash_balance', mobile: false },
                    { name: 'cash balance', key: 156, format: 'amount', class: 'text-right', i18n: 'column_cash_balance' },
                    { name: 'total B. Value', key: 'totalBuy', format: 'amount', class: 'text-right', i18n: 'column_total_buy', mobile: false },
                    { name: 'total S. Value', key: 'totalSell', format: 'amount', class: 'text-right', i18n: 'column_total_sell', mobile: false },
                    { name: 'total Net Value', key: 'totalNet', format: 'amount', class: 'text-right', i18n: 'column_total_net', mobile: false },
                    { name: 'accept value', key: 'acceptValue', format: 'amount', class: 'text-right', i18n: 'column_accept_value', mobile: false },
                    { name: 'market value', key: 'marketValue', format: 'amount', class: 'text-right', i18n: 'column_market_value', mobile: false },
                    { name: 'Total Realized PL', key: 'realizedPL', format: 'amount', class: 'text-right', i18n: 'column_realizedPL', mobile: false },
                    { name: 'Total Unrealized PL', key: 'unrealizedPL', format: 'amount', class: 'text-right', i18n: 'column_unrealizedPL', mobile: false },
                    // { name: 'Int.Accrual(ddmm)', key: 'interestAccrualWithDate', class: 'text-right', i18n: 'column_int_accrual', mobile: false },
                    // { name: 'Net Withdrawable', key: '499', format: 'amount', class: 'text-right', i18n: 'column_net_withdrawable', mobile: false },
                    // { name: 'total portfolio value', key: 'totalPortfolioValue', format: 'amount', class: 'text-right', i18n: 'column_total_portfolio_value' },
                ]
            },
            cashview: {
                enable: false,
                schema: [
                    { name: 'currency', key: 23, i18n: 'column_currency' },
                    { name: 'exchange ratio', key: 'exchangeRatio', format: 'price@6', class: 'text-right', i18n: 'column_exchange_ratio', mobile: false },
                    { name: 'initial trading limit', key: 185, format: 'amount', class: 'text-right', i18n: 'column_initial_trading_limit' },
                    { name: 'trading limit', key: 155, format: 'amount', class: 'text-right', i18n: 'column_trading_limit' },
                    { name: 'initial cash balance', key: 186, format: 'amount', class: 'text-right', i18n: 'column_initial_cash_balance' },
                    { name: 'cash balance', key: 156, format: 'amount', class: 'text-right', i18n: 'column_cash_balance' },
                    { name: 'total B. Value', key: 'totalBuy', format: 'amount', class: 'text-right', i18n: 'column_total_buy', mobile: false },
                    { name: 'total S. Value', key: 'totalSell', format: 'amount', class: 'text-right', i18n: 'column_total_sell', mobile: false },
                    { name: 'total Net Value', key: 'totalNet', format: 'amount', class: 'text-right', i18n: 'column_total_net', mobile: false },
                    { name: 'accept value', key: 'acceptValue', format: 'amount', class: 'text-right', i18n: 'column_accept_value', mobile: false },
                    { name: 'market value', key: 'marketValue', format: 'amount', class: 'text-right', i18n: 'column_market_value', mobile: false },
                    { name: 'Total Realized PL', key: 'realizedPL', format: 'amount', class: 'text-right', i18n: 'column_realizedPL', mobile: false },
                    { name: 'Total Unrealized PL', key: 'unrealizedPL', format: 'amount', class: 'text-right', i18n: 'column_unrealizedPL', mobile: false },
                ]
            },
            position: {
                pieChart: true,
                schema: [
                    { name: 'symbol', key: 0 },
                    { name: 'symbol name', key: 'shortName', mobile: false },
                    { name: 'currency', key: 23, format: 'currency', mobile: false },
                    { name: 'quantity', key: 4, 'class': 'text-right', format: 'quantity', default: 0 },
                    { name: 'avg price', key: 'costPrice', 'class': 'text-right', default: 0 },
                    { name: 'market value', key: 'marketValue', format: 'amount', 'class': 'text-right', default: 0 },
                    { name: 'accept value', key: 'acceptValue', format: 'amount', 'class': 'text-right', default: 0, mobile: false },
                    { name: 'global market value', key: 'globalMarketValue', format: 'amount', 'class': 'text-right', default: 0, mobile: false },
                ]
            },
        },
        full_trade: {
            fund: {
                disclaimer: {
                    url: '/html/fund_disclaimer.html'
                },
                disclosure: {
                    url: '/html/fund_disclosure.html'
                },
                schema: [
                    { name: 'symbol', key: 0, i18n: 'column_symbol' },
                    { name: 'symbol name', key: 'symbolName', i18n: 'column_symbol_name' },
                    { name: 'currency', key: '23', i18n: 'column_currency' },
                    { name: 'available unit', key: 'availableQuantity', class: 'text-right', i18n: 'column_available_unit' },
                    { name: 'unit', key: 4, 'class': 'text-right', i18n: 'column_unit' },
                ],
                // advertisement: [
                //     { src: '/images/advertisement/Fund/test1.jpg', href: '' },
                //     { src: '/images/advertisement/Fund/test2.jpg', href: '' },
                //     { src: '/images/advertisement/Fund/test3.jpg', href: '' }],
            },
            bond: {
                disclaimer: {
                    url: '/html/bond_disclaimer.html'
                },
                disclosure: {
                    url: '/html/bond_disclosure.html'
                },
                schema: [
                    { name: 'symbol', key: 0, i18n: 'column_symbol' },
                    { name: 'symbol name', key: 'symbolName', i18n: 'column_symbol_name' },
                    { name: 'currency', key: '23', i18n: 'column_currency' },
                    { name: 'available quantity', key: 'availableQuantity', class: 'text-right', i18n: 'column_available_quantity' },
                    { name: 'quantity', key: 4, 'class': 'text-right', i18n: 'column_quantity' },
                ],
                // advertisement: [
                //     { src: '/images/advertisement/Bond/test1.jpg', href: '' },
                //     { src: '/images/advertisement/Bond/test2.jpg', href: '' },
                //     { src: '/images/advertisement/Bond/test3.jpg', href: '' }],
            }
        },
        search_product: {
            schema: [
                { name: 'symbol', key: 0 },
                { name: 'symbol name', key: 'symbolName' },
                { name: 'exchange', key: 20, format: 'exchange' },
                { name: 'product', key: 22, format: 'product_type' }
            ]
        },
        settlement: {
            instructions: [
                { name: 'CD', methods: ['CH', 'CQ', 'TF'] },
                { name: 'CW', methods: ['PB', 'PS', 'CH', 'TT', 'OB'] },
                { name: 'SD', methods: ['PD', 'TC'] },
                { name: 'SW', methods: ['PW', 'TC'] },
                // { name: 'CD', methods: ['CHE', 'CQE', 'TFE'] },       // CHE,CQE,TFE are an enhanced for CH,CQ,TF
                // { name: 'SD', methods: ['PD', 'TC', 'PDE'] },       // PDE is an enhanced for PD
                // { name: 'SW', methods: ['PW', 'TC', 'SI', 'PWE'] }  // PWE is an enhanced for PW
            ],
            schema: [
                { name: "message_id", key: 160, i18n: "settlement_message_id" },
                { name: "arrival_date", key: 501, i18n: "settlement_arrival_date" },
                { name: "sender", key: 161, i18n: "settlement_sender" },
                { name: "subject", key: 163, i18n: "settlement_subject" },
                { name: "message_type", key: 158, i18n: "settlement_message_type" },
                { name: "status", key: 'status', i18n: "settlement_status" },
                { name: "recipient", key: 162, i18n: "settlement_recipient" },
            ],
            periods: [7, 14, 30, 60, 90],
            banks: ['HSBC', 'SCBFF'],
            cashCurrency: ['HKD', 'USD', 'CNY', 'JPY'],
            bankNameFileURL: 'D:\\BankFile\\bank.txt',
            dataFileServer: 'D:\\MyDataFiles\\Images'
        },
        eStatement: {
            fileDirectory: 'D:\\DailyStatement',
            periods: {
                daily: [1, 7, 30, 90, 0],  // 0 means all
                monthly: [1, 3, 6, 12]
            },
            fileNameDailyFormat: "^Daily_Statement_({date})_({account}).pdf$",
            fileNameMonthlyFormat: "^Monthly_Statement_({date})_({account}).pdf$",
            dateFormat: 'YYYYMMDD',
        },
        nav_bar: {
            brand: { name: 'brand', href: '/' },
            left: [
                { name: 'trading', href: '/iTrader' },
                { name: 'fund_trading', href: '/iTrader/fullTrade/fund' },
                { name: 'bond_trading', href: '/iTrader/fullTrade/bond' },
                { name: 'assets', href: '/iTrader/account/summary' },
                { name: 'IPO', href: '/iTrader/eipo' },
                { name: 'eStatement', href: "javascript:void(PopupeStatementWindow())" },
                {
                    name: 'stock_information', items: [
                        { name: 'aastocks', entitlement: 'AASTOCKS', href: "javascript:void(PopupMarketDataWindow('aastocks', {width: 650, height: 400}))" },
                        { name: 'megahub', entitlement: 'MEGAHUB', href: "javascript:void(PopupMarketDataWindow('megahub'))" },
                        { name: 'etnet', entitlement: 'ETNeTPRICE', href: "javascript:void(PopupMarketDataWindow('etnet'))" },
                        { name: 'tsci', entitlement: 'TSCIPRICE', href: '#' },
                        { name: 'stock_search', href: "javascript:void(PopupMarketDataWindow('local'))" },
                    ]
                },
                // {
                //     name: 'other_information', items: [
                //     ]
                // },
            ],
            right: {
                account: true,
                languages: true,
                user: {
                    info: true,
                    change_password: true,
                    transfer_cash: true,
                    settlement: true,
                    user_setting: true,
                    user_2FA: true,
                    logout: true
                }
            }
        },
        footer: {
            rows: [
                [
                    { name: 'disclaimer', href: "javascript:void(popupWindow('/html/disclaimer.html', { multi_language: true }))" },
                    { name: 'privacy', href: "javascript:void(popupWindow('/html/privacy.html', { multi_language: true }))" },
                    { name: 'disclosure', href: "javascript:void(popupWindow('/html/disclosure.html', { multi_language: true }))" },
                ],
                [
                    { text: 'Copyright © 2000 - ' + (new Date).getFullYear() + ' eBroker Systems Ltd. All rights reserved.' }
                ]
            ]
        },
    },
    announcement: {
        items: [
            { name: 'announcement', url: '/html/announcement.html', multi_language: true }
        ]
    },
    market_data: {
        items: [
            // { name: 'megahub', method: 'GET', broker: '505', url: 'https://shield.megahubhk.com/Content/trade/eBroker/pages/TradeAppSwitcher.aspx' },
            { name: 'aastocks', method: 'POST', broker: 'EBROKER', url: 'https://secure.aastocks.com/pkages/broker/login_broker/auto_all.asp', compatible: 'IE=8', height: '350' },
            // { name: 'tsci', method: 'get', broker: 'CBI', useLogonName: false, url: 'https://smx.tsci.com.cn/Delay/De_Teletext.aspx' },
        ]
    },
    static_data: {
        // path: 'http://192.168.20.189/MKTData/MKTDataInfo.xml',
        file: 'MKTData.csv',
        encoding: 'utf8',
        columns: [
            { name: 'symbol', key: 0, index: 0 },  // must field as key
            { name: 'english name', key: 21, index: 1 },
            { name: 'currency', key: 23, index: 2 },
            { name: 'exchange', key: 20, index: 3 },
            { name: 'product type', key: 22, index: 4 },
            { name: 'series' },
            { name: 'expiry date' },
            { name: 'strategy id' },
            { name: 'strike price' },
            { name: 'call put' },
            { name: 'underlier' },
            { name: 'weight index' },
            { name: 'CHS name', key: 505, index: 12 },
            { name: 'CHT name', key: 36, index: 13 },
            { name: 'spread', key: 73, index: 14 },
            { name: 'lot size', key: 24, index: 15 },
            { name: 'OTC flag', key: 1508, index: 16 },
            { name: 'RPQ level', key: 3409, index: 17 },
            { name: 'CIES', key: 3602, index: 18 },
            { name: 'professional investor flag', key: 3603, index: 19 },
            { name: 'NAV date', key: 3608, index: 20 },
            { name: 'nationality', key: 3601, index: 21 },
            { name: 'display ratio', key: 1504, index: 22 },
            { name: 'ISIN', key: 30, index: 24 },
            { name: 'settlement date', key: 540, index: 25 },
            { name: 'min purchase amount', key: 3401, index: 27 },
            { name: 'incremental', key: 3402, index: 28 },
            { name: 'coupon rate', key: 3403, index: 29 },
            { name: 'pre coupon date', key: 3404, index: 30 },
            { name: 'day count', key: 3405, index: 31 },
            { name: 'Max Trans Fee rate', key: 3407, index: 32 },
            { name: 'Min trans fee amt', key: 3408, index: 33 },
            { name: 'sell max trans fee rate', key: 3606, index: 34 },
            { name: 'sell min trans fee amt', key: 3607, index: 35 },
        ]
    },
    GBSWebService: {
        // url: 'http://192.168.169.192/GBSDataInterface/GBSDataInterfaceService.svc?wsdl',
        // getFundInterval: 60,
    },
    client_ip_url: 'http://www.ebsdata.com/shares/application/GetClientIP/GetClientIP.aspx',
    quote: {
        sessionServerURL: 'https://xmluat.megahubhk.com/Xml/Secure/Login.ashx',
        quoteServerURL: 'https://quoteuat.megahubhk.com/MEG/Quote/GetQuote',
        name: 'megahub',
        broker: '511',
        type: 'L1',
        testAccount: {
            username: "test1",
            password: "1234"
        }
    }
}

var eipo = {
    oms: {
        encoding: "Big5",
        servers: {
            // AS: { host: "192.168.201.29", port: 9015 },
            // TFDDS: { host: "192.168.201.29", port: 9002 }
        },
    },
    format: {
        date: "YYYY/MM/DD",
        decimal: "#,##0.##",
        price: "#,##0.00"
    },
    db: {
        user: "ebs",
        password: "ebroker",
        server: "192.168.201.2",
        database: "omsdata_daniel",
    },
    allowClientChange: true,
    allowClientCancel: true,
    deadlineClosing: "23:59:59",
    disclaimer: {
        url: "/html/disclaimer.html",
        multi_language: true
    },
    views: {
        ipo: {
            schema: [
                { name: "apply", key: "applyAction" },
                { name: "stock code", key: "0", i18n: "column-symbol" },
                { name: "stock name", key: "symbolName", i18n: "column-symbol-name" },
                { name: "offer size", key: "4", i18n: "column-offer-size", class: "text-right", tooltip: true },
                { name: "lot size", key: "24", i18n: "column-lot-size", class: "text-right" },
                { name: "offer price", key: "offerPrice", i18n: "column-offer-price", class: "text-right" },
                { name: "currency", key: "23", i18n: "column-currency" },
                { name: "min apply shares", key: "1511", i18n: "column-min-apply-shares", class: "text-right" },
                { name: "min pay amount", key: "1512", i18n: "column-min-pay-amount", class: "text-right", tooltip: true },
                { name: "subscription date", key: "1500", i18n: "column-subscription-date", tooltip: true },
                { name: "internal deadline date", key: "1502", i18n: "column-internal-deadline-date", tooltip: true },
                { name: "deadline date", key: "1501", i18n: "column-deadline-date", tooltip: true },
                { name: "allotment date", key: "1503", i18n: "column-allotment-date", tooltip: true },
                { name: "refund date", key: "1513", i18n: "column-refund-date", tooltip: true },
                { name: "listing date", key: "1504", i18n: "column-listing-date" },
                { name: "enable", key: "5", i18n: "column-enable", tooltip: false },
                { name: "remain loan amount", key: "1514", i18n: "column-remain-loan-amount", tooltip: true },
                { name: "interest ratio", key: "1507", i18n: "column-interest-ratio", tooltip: true },
            ]
        },
        app: {
            schema: [
                { name: "change", key: "changeAction" },
                { name: "cancel", key: "cancelAction" },
                { name: "application ID", key: "6", i18n: "column-application-id" },
                { name: "socket code", key: "0", i18n: "column-symbol" },
                { name: "account", key: "10", i18n: "column-account" },
                { name: "user", key: "13", i18n: "column-user" },
                { name: "apply qty", key: "4", i18n: "column-apply-qty", class: "text-right" },
                { name: "apply date", key: "1600", i18n: "column-apply-date", tooltip: true },
                { name: "apply amount", key: "3", i18n: "column-apply-amount", class: "text-right" },
                { name: "loan amount", key: "1601", i18n: "column-loan-amount", class: "text-right", tooltip: true },
                { name: "interest", key: "1602", i18n: "column-interest", class: "text-right" },
                { name: "charges", key: "1603", i18n: "column-charges", class: "text-right" },
                { name: "currency", key: "23", i18n: "column-currency", tooltip: true },
                { name: "status", key: "5", i18n: "column-status" },
                { name: "allotted qty", key: "34", i18n: "column-allotted-qty", class: "text-right" },
                { name: "remarks", key: "25", i18n: "column-remarks" },
            ]
        }
    }
}

var wxa = {
    oms: {
        user: '8888',
        password: '1234',
    },
    "appid": "wxa698cd7ba7ce9f6e",
    "secret": "98e770a0f4567c3ab4f68b79c19933a8",
    "url": "https://api.weixin.qq.com/sns/jscode2session",
}

exports.global = global
exports.iTrader = iTrader
exports.eipo = eipo
exports.wxa = wxa
