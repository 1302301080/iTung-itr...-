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

{ $Id: its.js,v 1.38 2018/01/19 10:00:20 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

var config = require(__config_path),
    moment = require('moment'),
    schema = require('common').Schema,
    dataEntry = require('../data/entry'),
    logger = require('common').Logger.instance().getLogger(),
    Const = require('../lib/const'),
    BaseSocket = require('./baseSocket'),
    priceDDS = require('./dds'),
    GBSWebService = require('./gbsWebService'),
    socketIO = require('./socket.io_v2'),
    customQueryParser = require('../lib/customqueryParser'),
    util = require('../lib/utility')

module.exports = class ITS extends BaseSocket {
    constructor(options) {
        options = options || {}
        super(options)
        this.name = 'ITS'
        this._isSystemUser = options._isSystemUser || false
        this.isInitialized = false
        this.isPositionInitialized = false
        this.clientHost = config.iTrader.oms.servers.ITS.host
        this.clientPort = config.iTrader.oms.servers.ITS.port
        this.sessionObj       // SSM session
        this.uid     // uuid
        this.loginID
        this.waittingQueryList = ['querysuborder', 'querytrade', 'getmoreacctinfo', 'exchange', 'currency']  // only all query return, will emit 'initialized' event
        this.currencyList = []
        this.queryMarginRatioList = []
        this.historyTransactions = []
        this.historySettlementList = []
        this.currencySettingList = [] // for store RiskMan_File OMSBaseCurrency, TradeAbleCur, UnConvertCur to define currency mode
        this.subscribedSubOrderTradeExchangeList = []
        this.currencyMode = 'single'
        this.customTableDefine = {}
        this.queryTradeList = []
        this.updateTradeList = []

        if (configuration._showMultiCurrencyCB()) {
            this.waittingQueryList.push('getacctcurrencybalance')
        }
    }

    on() {
        this.event.on('line', function (line) {
            if (line) {
                var imageObj
                if (line.indexOf('image|ORDA_') == 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    dataEntry.set({ name: Const.DataAction.order }, this.loginID, imageObj.orderNo, imageObj)
                    this.handleUpdateTrade()
                } else if (line.indexOf('image|ERRORD_') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    dataEntry.set({ name: Const.DataAction.errorOrder }, this.loginID, imageObj.orderNo, imageObj)
                } else if (line.indexOf('image|CALCD_') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    dataEntry.set({ name: Const.DataAction.calcOrder }, this.loginID, imageObj.userRef, imageObj)
                } else if (line.indexOf('queryaccount') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 1)
                    dataEntry.set({ name: Const.DataAction.account }, this.loginID, imageObj.account, imageObj)
                } else if (line.indexOf('querysuborder') === 0 || line.indexOf('image|SUBORDER_') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    if (!imageObj.account) return  // found case that ITS reply empty account v1.1.7
                    dataEntry.set({ name: Const.DataAction.subOrder }, this.loginID, imageObj.exchNo, imageObj, { trade: this.getTradeBySubOrder(imageObj) })
                    this.handleUpdateTrade()
                } else if (line.indexOf('querytrade') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    dataEntry.set({ name: Const.DataAction.trade }, this.loginID, imageObj.tranNo, imageObj)
                    this.queryTradeList.push(imageObj)
                } else if (line.indexOf('image|TRADE_') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    dataEntry.set({ name: Const.DataAction.trade }, this.loginID, imageObj.tranNo, imageObj)
                    this.updateTradeList.push(imageObj)
                    this.handleUpdateTrade()
                } else if (line.indexOf('image|ACCT_') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    dataEntry.set({ name: Const.DataAction.account }, this.loginID, imageObj.account, imageObj)
                } else if (line.indexOf('image|BankBalance') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    this.handleQueryBankBalanceMessage(imageObj)
                } else if (line.indexOf('customquery') === 0) {
                    this.handleCustomQueryMessage(line)
                } else if (line.indexOf('boddata') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    this.handlePositionMessage(imageObj, { type: 'bod' })
                } else if (line.indexOf('error') === 0) {
                    this.handleErrorMessage(line)
                } else if (line.indexOf('sendmessage') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 1)
                    this.event.emit('sendmessage', null, imageObj)
                } else if (line.indexOf('disconnect') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 1)
                    var errorCode = imageObj.errorCode || '50'
                    socketIO.emit(this.uid, { errorCode: errorCode, action: 'logout' })
                    this.logout()
                } else if (line.indexOf('image|') === 0) {
                    imageObj = schema.OrderSchema.makeFromImage(line, 2)
                    this.handleImageMessage(imageObj)
                } else if (line.indexOf('gettrade|') === 0) {
                    line += '457|gettrade|'
                    this.handleCustomQueryMessage(line)  // handle boapi as custom query
                } else if (line.indexOf('getmoneyvoucher|') === 0) {
                    line += '457|getmoneyvoucher|'
                    this.handleCustomQueryMessage(line)
                } else if (line.indexOf('getstockvoucher|') === 0) {
                    line += '457|getstockvoucher|'
                    this.handleCustomQueryMessage(line)
                }
                if (imageObj && imageObj.header && imageObj.header.length > 1) {
                    var array = imageObj.header[1].split('/')
                    if (array && array.length > 1 && array[0] === array[1]) {
                        this.event.emit('done', imageObj.header[0])
                    }
                }
                if (imageObj && imageObj.symbol) {
                    priceDDS.SubscribeSymbol(imageObj.symbol)
                    priceDDS.SubscribeSymbol(imageObj.symbol)
                }
            }
        }.bind(this))
    }

    connect() {
        this.on()
        super.connect()
        this.event.on('close', function () {
            socketIO.emit(this.uid, { errorCode: '-998', action: 'logout' })
            this.logout()
        }.bind(this))
    }

    initialize() {
        function queryBodData(sender, account) {
            var boddata = 'ITS|boddata|10|' + account + '|'
            sender.send(boddata)
        }
        // query account data, including account, order, suborder, trade, subscribe by exchange
        function queryAccountData(sender, user) {
            if (!sender || !user) return
            for (var account of user.accounts) {
                var queryAccount = 'ITS|queryaccount|10|' + account + '|'
                var querySubOrder = 'ITS|querysuborder|10|' + account + '|'
                var queryTrade = 'ITS|querytrade|10|' + account + '|'
                sender.send(queryAccount)
                sender.send(querySubOrder)
                sender.send(queryTrade)
            }
            sender.subscribeSubOrderTrade()

            //query bank balance
            if (config._needQueryBankBalance()) {
                sender.subscribeBankBalance()
                sender.queryBankBalance()
            }
        }
        var user = this.getUser()
        if (!user) return
        this.customQuery({ systemRef: Const.customQuery.loadCurrencyInfo }, function () {   // after know currency mode then subscribe currency
            this.send('DDS|list|#CURRENCY|CURRENCY|mode|both|')
            if (this.currencyMode != 'multi') return
            for (var account of user.accounts) {
                this.customQuery({ systemRef: Const.customQuery.loadCurrencyBal, account: account, 13: '' })
            }
        }.bind(this))
        this.send('DDS|list|#EXCHANGE|EXCHANGE|mode|both|')

        // query account info
        for (var account of user.accounts) {
            this.customQuery({ systemRef: Const.customQuery.getMoreAcctInfo, account: account })
            this.customQuery({ systemRef: Const.customQuery.queryErrorOrder, account: account, 13: '' })
            this.customQuery({ systemRef: Const.customQuery.loadAccountBCAN, account: account, 13: '' })
            if (config.iTrader.oms.CNYAcctSuffix) {
                this.customQuery({ systemRef: Const.customQuery.getMoreAcctInfo, account: account + config.iTrader.oms.CNYAcctSuffix })
                this.customQuery({ systemRef: Const.customQuery.getAcctCurrencyBalance, account: account + config.iTrader.oms.CNYAcctSuffix })
            }
            if (configuration._showMultiCurrencyCB()) {
                this.customQuery({ systemRef: Const.customQuery.getAcctCurrencyBalance, account: account })
                if (config.iTrader.oms.CNYAcctSuffix) {
                    this.customQuery({ systemRef: Const.customQuery.getAcctCurrencyBalance, account: account + config.iTrader.oms.CNYAcctSuffix })
                }
            }
            queryBodData(this, account)
        }
        this.customQuery({ systemRef: Const.customQuery.loadCustomTableDefine })   // load custom table define

        var bod_count = 0
        var querytrade_count = 0
        var loadcurrencybal_count = 0
        this.event.on('done', function (name) {
            name = name ? name.toLowerCase() : ''
            if (name === 'boddata') {
                bod_count++
            } else if (name === 'querytrade') {
                querytrade_count++
                if (this._isSystemUser) {
                    this.handleQueryTradeList()
                }
            } else if (name === Const.customQuery.loadCurrencyBal.toLowerCase()) {
                loadcurrencybal_count++
            } else if (name === Const.customQuery.loadCustomTableDefine.toLowerCase()) {
                for (var account of user.accounts) {
                    this.customQuery({ systemRef: Const.customQuery.loadCustomAccountInfo, 13: '', account: account })  // load custom account info
                }
            }
            if (!this._isSystemUser) {
                if (bod_count === user.accounts.length && (loadcurrencybal_count === user.accounts.length || this.currencyMode === 'single')) {  // received all bod data && load all currency balance
                    bod_count = 0
                    loadcurrencybal_count = 0
                    queryAccountData(this, user)
                }
                if (querytrade_count === user.accounts.length) {  // received all query trades
                    querytrade_count = 0
                    this.handleQueryTradeList()
                }
            }
            var index = this.waittingQueryList.indexOf(name)
            if (index >= 0) {
                this.waittingQueryList.splice(index, 1)
            }
            if (this.waittingQueryList.length === 0 && !this.isInitialized) {
                this.isInitialized = true
                this.event.emit('initialized')
            }
        }.bind(this))
        setTimeout(function () {
            if (!this.isInitialized) {
                logger.info('wait ITS initialize timeout.')
                this.isInitialized = true
                this.event.emit('initialized')
            }
        }.bind(this), 1000 * 5)
        this.licenseControl()
        this.autoVerifySession()
        this.getFundOrderFromGBS()
    }

    logout() {
        try {
            var cmd = {
                header: ['ITS', 'logout'],
                user: this.loginID,
                sessionID: this.sessionObj.sessionID
            }
            var image = schema.SessionSchema.makeFromObject(cmd).castImage()
            this.send(image)
            dataEntry.clearup(this.loginID)  // clear all data by login ID
            clearInterval(this.heartbeatTimer)
            clearInterval(this.autoVerifySessionTimer)
            clearInterval(this.GBSGetFundTimer)
            clearInterval(this.handleQueryTradeTimer)
            configuration.global.session.store.destroy(this.uid, function (err) {
                if (err) {
                    logger.error('destory session failed. error: ' + err)
                }
            })
            this.destroy()
        } catch (err) {
            logger.error(err)
        }
    }

    verify() {
        try {
            var cmd = {
                header: ['ITS', 'verify'],
                sessionID: this.sessionObj.sessionID,
                user: this.sessionObj.user
            }
            var image = schema.SessionSchema.makeFromObject(cmd).castImage()
            this.send(image, function (err, result) {
                if (err) {
                    this.event.emit('verified', false)
                } else if (result.indexOf('session') === 0) {
                    this.event.emit('verified', true)
                } else {
                    this.event.emit('verified', false)
                }
            }.bind(this))
        } catch (err) {
            this.event.emit('verified', false)
            logger.error(err)
        }
    }

    /* query & subscribe ============================================================ */
    customQuery(options, accounts, callback) {
        if (typeof accounts === 'function') callback = accounts  // in this case, the second parameter is the callback
        var name = options.systemRef
        if (!name) return callback(null, null)
        var count = 1
        var errorList = []
        var resultList = []
        try {
            var that = this
            var cmd = options || {}
            cmd.header = ['ITS', 'customquery']
            var image = schema.OrderSchema.makeFromObject(cmd).castImage()
            for (var p in options) {
                if (options[p] === '') {
                    image += p + '||'
                }
            }
            if (callback && typeof (callback) === 'function') {
                var cb = function (obj) {
                    if (!obj) return
                    if (obj._isCustonQueryError) {
                        errorList.push(obj)
                    } else {
                        resultList.push(obj)
                    }
                    if (obj._isCustonQueryDone) {   // last custom query result
                        count--
                    }
                    if (count <= 0) {
                        logger.trace('custom query [{0}] done, error: {1}, success: {2}'.format(name, errorList.length, resultList.length))
                        that.event.removeListener(name.toLowerCase(), cb)
                        return callback(errorList, resultList)
                    }
                }
                this.event.on(name.toLowerCase(), cb)
            }
            // send multiple command for every account
            if (IsArray(accounts) && accounts.length > 0) {
                for (var a of accounts) {
                    this.send(image + '10|{0}|'.format(a))
                }
                count = accounts.length
            } else {
                this.send(image)
            }
        } catch (err) {
            logger.error(err)
        }
    }

    subscribeCurrency(currency) {
        this.send('DDS|open|' + currency + '=|' + currency + '=|mode|both|')
    }

    subscribeSubOrderTrade() {
        for (var exchange of dataEntry.global.exchanges_full) {
            if (this.subscribedSubOrderTradeExchangeList.indexOf(exchange) >= 0) continue
            this.subscribedSubOrderTradeExchangeList.push(exchange)
            var exchOrder = 'DDS|open|' + exchange + '_SUBORDER|SUBORDER_' + exchange + '|mode|both|'
            var trade = 'DDS|open|' + exchange + '_TRADE|TRADE_' + exchange + '|mode|both|'
            this.send(exchOrder)
            this.send(trade)
        }
    }

    subscribeAccountBalance(currency) {
        if (this.currencyMode !== 'multi') return  // skip while run single currency mode
        var user = this.getUser()
        if (user) {
            if (user.accounts && user.accounts.length > 0) {
                for (var a of user.accounts) {
                    this.send('ADDS|open|ACCT_' + a + '_' + currency + '|ACCT_' + a + '_' + currency + '|mode|both|')
                }
            } else {
                this.send('ADDS|open|ACCT_' + user.id + '_' + currency + '|ACCT_' + user.id + '_' + currency + '|mode|both|')
            }
        }
    }

    subscribeBankBalance() {
        var image = 'DDS|open|BankBalance|BankBalance|mode|both|'
        this.send(image)

    }

    subscribeAcctCur(currency) {
        if (this.currencyList.indexOf(currency) >= 0) return
        this.currencyList.push(currency)
        this.subscribeCurrency(currency)
        this.subscribeAccountBalance(currency)
    }

    queryBankBalance() {
        var user = this.getUser()
        for (var account of user.accounts) {
            var cmd = {
                header: ['ORD', 'query', 'bBal'],
                user: user.AECode || account,
                password: user.password,
                account: account,
                operatorFlag: config.iTrader.oms.operatorFlag,
                sessionKey: this.sessionObj.sessionKey
            }
            var image = schema.OrderSchema.makeFromObject(cmd).castImage()
            this.send(image)
        }
    }

    queryMarginRatio(options) {
        options = options || {}
        var account = options.account || this.loginID
        var symbol = options.symbol
        var key = account + '#' + symbol
        if (account && symbol && this.queryMarginRatioList.indexOf(key) < 0) {
            this.queryMarginRatioList.push(key)
            if (config.iTrader.oms.MarginRatioMode == '1') {
                this.customQuery({ systemRef: Const.customQuery.getMarginBySymbolAcct, symbol: symbol, account: account, userRef: key })
            } else if (config.iTrader.oms.MarginRatioMode == '2') {
                this.customQuery({ systemRef: Const.customQuery.queryMargPara, symbol: symbol, account: account, userRef: key })
            }
        }
    }

    queryHistoryOrders(options, callback) {
        if (!options) return
        var that = this
        callback = callback || function () { }
        options = options || {}
        var user = this.getUser()
        this.customQuery({
            systemRef: Const.customQuery.loadHistoryOrders,
            13: '',
            time: options.startDate,
            createTime: options.endDate
        }, this.getAllAccounts(), function (err, data) {
            var resultData = data || []
            if (options.type === 'fund') {  // handle fund history orders, get from GBS web service
                GBSWebService.GetFundHistory({
                    account: user.id,
                    fromDate: moment(options.startDate, 'YYYYMMDD').format('YYYY-MM-DD'),
                    toDate: moment(options.endDate, 'YYYYMMDD').format('YYYY-MM-DD'),
                }, function (err, result) {
                    if (!err && result) {
                        for (var item of result) {
                            resultData.push(schema.OrderSchema.makeFromObject(item))
                        }
                    }
                    that.customQuery({
                        systemRef: Const.customQuery.queryHistoryErrorOrder,
                        13: '',
                        time: options.startDate,
                        createTime: options.endDate
                    }, that.getAllAccounts(), function (err, data) {
                        if (IsArray(data)) {
                            for (var item of data) {
                                resultData.push(item)
                            }
                        }
                        callback(resultData)
                    })
                })
            } else {
                callback(data)
            }
        })
    }

    queryTransactionHistory(options, callback) {
        options = options || {}
        var sendCount = 0
        this.historyTransactions = []
        var user = this.getUser()
        if (user && user.accounts) {
            for (var account of user.accounts) {
                for (var action of options.action) {
                    this.send('BOAPI|{0}|10|{1}|1|{2}|2|{3}|510|{4}|'.format(action, account, options.startDate, options.endDate, user.password))
                    sendCount++
                }
            }
        }
        var cb = (name) => {
            if (['gettrade', 'getstockvoucher', 'getmoneyvoucher'].indexOf(name >= 0)) {
                sendCount--
                if (sendCount == 0) {
                    callback(null, this.historyTransactions)
                }
            }
        }
        this.event.on('done', cb.bind(this))
    }

    querySettlementHistory(options, callback) {
        var that = this
        options = options || {}
        var user = options.user
        var account = options.account
        this.customQuery({ systemRef: Const.customQuery.loadInternalMessage, account: account, 13: user })
        this.historySettlementList = []
        var cb = function (name) {
            if (Const.customQuery.loadInternalMessage.toLowerCase() == name) {
                that.event.removeListener('done', cb)
                callback(that.historySettlementList)
            }
        }
        this.event.on('done', cb)
    }

    /* handle message ============================================================ */
    handleErrorMessage(message) {
        var error = schema.OrderSchema.makeFromImage(message, 1)
        this.event.emit('errImage', error)
        if (error && error.request) {
            switch (error.request.toLowerCase()) {
                case 'sendmessage':
                    this.event.emit('sendmessage', error)
                    break
                case 'calculate':
                    this.event.emit('calculate', error)
                    break
                default:
                    if (error.request.toLowerCase() === 'customquery' && error.systemRef) {
                        error._isCustonQueryDone = true
                        error._isCustonQueryError = true
                        this.event.emit('done', error.systemRef.toLowerCase())
                        this.event.emit(error.systemRef.toLowerCase(), error)
                    }
                    this.event.emit('done', error.request.toLowerCase())
                    break
            }
        }
    }

    handleImageMessage(imageObj) {
        if (typeof (imageObj) !== 'object') return
        try {
            var name = (imageObj.header && imageObj.header.length === 2) ? imageObj.header[1] : ''
            if (name === 'CURRENCY') {
                this.subscribeAcctCur(imageObj.symbol)
                dataEntry.set({ name: Const.DataAction.currency }, imageObj.symbol, {})
                this.event.emit('done', 'currency')
            } else if (name === 'EXCHANGE') {
                var exchange = imageObj.symbol
                if (!exchange) return
                if (dataEntry.global.exchanges.indexOf(exchange) < 0) {
                    var enable = true
                    var exchangeSection = config.iTrader.oms.exchanges
                    if (exchangeSection && exchangeSection.length > 0) {
                        for (var item of exchangeSection) {
                            if (item && item.key === exchange && item.enable === false) {
                                enable = false
                                break
                            }
                        }
                    }
                    if (enable) {
                        dataEntry.global.exchanges.push(exchange)
                        dataEntry.global.exchanges.sort((a, b) => {
                            var a_index = config.iTrader.oms.exchanges.findIndex((item) => { return item.key === a })
                            var b_index = config.iTrader.oms.exchanges.findIndex((item) => { return item.key === b })
                            if (a_index == b_index) return 0
                            if (a_index < 0) return 1
                            if (b_index < 0) return -1
                            if (a_index > b_index) return 1
                            else if (a_index < b_index) return -1
                        })
                    }
                }
                if (dataEntry.global.exchanges_full.indexOf(exchange) < 0) {
                    dataEntry.global.exchanges_full.push(exchange)
                }
                this.subscribeSubOrderTrade()
                this.event.emit('done', 'exchange')
            } else if (name === this.sessionObj.sessionSymbol) {
                this.heartbeat()
            } else if (name === 'testlicense_ssm') {
                this.handleTestLicenseMessage(imageObj)
            } else if (this.currencyList.indexOf(name.substr(0, name.length - 1)) >= 0) {
                dataEntry.set({ name: Const.DataAction.currency }, imageObj.symbol.substr(0, name.length - 1), { ratio: imageObj.price })
            }
        } catch (err) {
            logger.error(err)
        }
    }

    handlePositionMessage(imageObj, options) {
        if (!imageObj || !imageObj.account) return   // filter trades if without account tag  v1.1.7
        if (imageObj.voucherType === 'cash') return
        // save position object to a pending list for using
        var user = this.getUser()
        dataEntry.set({ name: Const.DataAction.trade }, user.loginID, imageObj.tranNo, imageObj)
        for (var p in user.accountsInfo) {
            if (imageObj.account !== p) continue
            var acctInfo = user.accountsInfo[p]
            if ((acctInfo && acctInfo.margin_type === '1') || configuration.iTrader.views.forceShowAcceptValue) {
                this.queryMarginRatio({ account: imageObj.account, symbol: imageObj.symbol })
            }
        }
        dataEntry.set({ name: Const.DataAction.position }, this.loginID, imageObj.symbol, imageObj, options)
    }

    /* process trades with "querytrade" header when meet below conditions (v1.3.8)
     * all querytrade received
     * all trade's order/suborder received
     * sort by time
     * if wait for a long time(30s), one trade on order received, mark it as an invalid trade and skip it, make the procedure go on
     */
    handleQueryTradeList() {
        var that = this
        var isWaitTimeout = false
        this.queryTradeList.sort(function (a, b) {
            if (a.time === b.time) return 0
            return a.time > b.time ? 1 : -1
        })
        var handler = function () {
            var count = 0
            if (that.queryTradeList && that.queryTradeList.length > 0) {
                for (var t of that.queryTradeList) {
                    var orderObj = that.getOrderByTrade(t)
                    if (!orderObj) {
                        if (isWaitTimeout) {
                            t._isInvalid = true
                            logger.warn('wait order for trade [{0}] timeout, skip it.'.format(t.tranNo))
                            continue
                        }
                        logger.warn('waiting order for trade [{0}]'.format(t.tranNo))
                        return
                    }
                    t.voucherType = orderObj.voucherType
                }
                for (var t of that.queryTradeList) {
                    if (t._isInvalid) continue
                    count++
                    that.handlePositionMessage(t)
                }
            }
            logger.info('processed {0} initial trades'.format(count))
            that.queryTradeList = []
            that.isPositionInitialized = true
            that.handleUpdateTrade()
            setInterval(function () {
                that.handleUpdateTrade()
            }, 1000)
            clearInterval(that.handleQueryTradeTimer)
        }
        this.handleQueryTradeTimer = setInterval(handler, 2000)
        setTimeout(function () {
            isWaitTimeout = true
        }, 20 * 1000)
    }

    /* process trades with "TRADE_XXX" header when meet below conditions (v1.3.8)
     * all querytrade processed
     * all trade's order/suborder received
     */
    handleUpdateTrade() {
        if (!this.isPositionInitialized) return
        var tradeList = []
        for (var t of this.updateTradeList) {
            var orderObj = this.getOrderByTrade(t)
            if (!orderObj) {
                t._tryCount = (t._tryCount || 0) + 1
                if (t._tryCount < 5) {  // try 5 times, if no order, maybe it's and orphan trade, process other trades, leave this orphan trade in the list.
                    logger.warn('waiting order for trade [{0}]'.format(t.tranNo))
                    break  // do not go on
                }
                tradeList.push(t)
            }
            t.voucherType = orderObj.voucherType
            this.handlePositionMessage(t)
        }
        this.updateTradeList = tradeList
    }

    handleQueryBankBalanceMessage(imageObj, options) {
        if (typeof (imageObj) !== 'object') return
        imageObj.account = imageObj.account || this.loginID
        if (imageObj.errorCode >= 0) {
            dataEntry.set({ name: Const.DataAction.account }, this.loginID, imageObj.account, imageObj)
        }
    }

    handleCustomQueryMessage(message) {
        function ProcessCurrencyInfo(sender, imageObj) {
            var attribute = imageObj.row1
            var value = imageObj.row2
            if (!value) return
            if (attribute === 'OMSBaseCurrency') {
                dataEntry.set({ name: Const.DataAction.currency }, value, { isBase: true })
            } else if (attribute === 'TradeAbleCur') {
                for (var c of value.split(',')) {
                    // sender.subscribeAcctCur(c)
                    dataEntry.set({ name: Const.DataAction.currency }, c, { isTradable: true })
                }
            } else if (attribute === 'UnConvertCur') {
                for (var c of value.split(',')) {
                    // sender.subscribeAcctCur(c)
                    dataEntry.set({ name: Const.DataAction.currency }, c, { isConvertible: false })
                }
            }
            sender.currencySettingList.push(attribute)
            if (sender.currencySettingList.indexOf('OMSBaseCurrency') >= 0 && (sender.currencySettingList.indexOf('TradeAbleCur') >= 0 ||
                sender.currencySettingList.indexOf('UnConvertCur') >= 0)) {
                sender.currencyMode = 'multi'
                dataEntry.custom({ name: Const.DataAction.currency }).currencyMode = 'multi'
            }
        }
        function ProcessGetMoreAcctInfo(sender, imageObj) {
            var user = dataEntry.get({ name: Const.DataAction.user }, sender.uid)
            if (user) {
                var account = imageObj.account
                if (account == user.id) {
                    user.info = user.info || {}
                    user.info.name = imageObj.row2
                    user.info.margin_type = imageObj.side
                }
                user.AECode = imageObj.user
                user.accountsInfo = user.accountsInfo || {}
                user.accountsInfo[account] = user.accountsInfo[account] || {}
                user.accountsInfo[account].margin_type = imageObj.side
            }
        }
        function ProcessGetMarginBySymbolAcct(sender, imageObj) {
            if (imageObj && imageObj.userRef) {
                imageObj.account = imageObj.userRef.substring(0, imageObj.userRef.indexOf('#'))
                dataEntry.set({ name: Const.DataAction.margin }, sender.loginID, imageObj.userRef, imageObj)
            }
        }
        function ProcessQueryMargPara(sender, imageObj) {
            if (imageObj && imageObj.userRef) {
                var key = imageObj.userRef
                imageObj.account = key.substring(0, key.indexOf('#'))
                imageObj.symbol = key.substring(key.indexOf('#') + 1, key.length)
                imageObj.longMR = imageObj.bid || 0
                imageObj.shortMR = imageObj.ask || 0
                dataEntry.set({ name: Const.DataAction.margin }, sender.loginID, imageObj.userRef, imageObj)
            }
        }
        function ProcessGetCBBCAgreement(sender, imageObj) {
            if (imageObj) {
                var user = sender.getUser(sender)
                if (imageObj.side == 1) {
                    user.cbbcAgreement = true
                } else {
                    user.cbbcAgreement = false
                }
            }
        }
        function ProcessLoadCurrencyBal(sender, imageObj) {
            if (imageObj) {
                var tlTag = config.iTrader.oms.tradingLimitTag
                var cbTag = config.iTrader.oms.cashBalanceTag
                var tl = tlTag == 468 && imageObj.row1 ? imageObj.row1 : imageObj.bodTradeLimit  // specisal handle for web trading limit
                var cb = imageObj.bodCashBalance
                var image = 'image|ACCT_{0}_{1}|10|{0}|23|{1}|{2}|{4}|{3}|{5}|185|{4}|186|{5}|'.format(imageObj.account, imageObj.currency, tlTag, cbTag, tl, cb)
                var o = schema.OrderSchema.makeFromImage(image, 2)
                dataEntry.set({ name: Const.DataAction.account }, sender.loginID, o.account, o, { initial: true })
            }
        }
        function ProcessLoadCustomTableDefine(sender, imageObj) {
            if (sender && imageObj) {
                var tableId = imageObj.symbol
                var fieldId = imageObj.account
                var fieldDef = imageObj.CHTName
                if (tableId && fieldId && fieldDef) {
                    sender.customTableDefine[tableId] = sender.customTableDefine[tableId] || {}
                    sender.customTableDefine[tableId][fieldId] = fieldDef
                }
            }
        }
        function ProcessLoadCustomAccountInfo(sender, imageObj) {
            if (sender && imageObj) {
                if (!sender.customTableDefine || !sender.customTableDefine.oms_CustomAccountInfo) return
                var CAITable = sender.customTableDefine.oms_CustomAccountInfo
                var user = sender.getUser()
                var account = imageObj.account
                user.accountsInfo = user.accountsInfo || {}
                user.accountsInfo[account] = user.accountsInfo[account] || {}
                if (user && account && user.accountsInfo && user.accountsInfo[account]) {
                    var customInfo = user.accountsInfo[account].customInfo || {}
                    for (var p in CAITable) {
                        if (p && p.length > 5) {
                            var index = Number(p.substring(5))
                            if (isNaN(index)) continue
                            customInfo[CAITable[p]] = imageObj['row' + index]
                        }
                    }
                    user.accountsInfo[account].customInfo = customInfo
                }
            }
        }
        function ProcessBOAPI(sender, imageObj) {
            if (sender && imageObj) {
                sender.historyTransactions.push(imageObj)
            }
        }
        function ProcessLoadAccountBCAN(sender, imageObj) {
            if (sender && imageObj && imageObj.row1) {
                var user = sender.getUser()
                if (user) {
                    user.BCAN = (imageObj.row1 || '').split(',')
                }
            }
        }

        function ProcessLoadInternalMessage(sender, imageObj) {
            if (sender && imageObj) {
                var detail = imageObj[200].split('#13#10')
                var detailArray = {}
                for (var i = 0; i < detail.length; i++) {
                    if (detail[i]) {
                        var tagValue = detail[i].split(':')
                        if (tagValue.length > 1) {
                            if (tagValue[0] == 'Remark') {
                                var remark = tagValue[1].split('#')
                                var buffer = new Buffer(remark.splice(1, remark.length))
                                tagValue[1] = buffer.toString()
                            }
                            detailArray[tagValue[0]] = tagValue[1]
                        }
                    }
                }
                imageObj.detail = detailArray
                sender.historySettlementList.push(imageObj)
            }
        }
        if (!message) return
        try {
            var imageObj = schema.OrderSchema.makeFromImage(message, 2)
            if (imageObj.isInvalid)
                return
            var name = imageObj.systemRef
            if (name) {
                name = name.toLowerCase()
                if (imageObj.header.length === 2) {
                    var array = imageObj.header[1].split('/')
                    if (array.length === 2) {
                        switch (name) {
                            case Const.customQuery.loadCurrencyInfo.toLowerCase():
                                ProcessCurrencyInfo(this, imageObj)
                                break
                            case Const.customQuery.getMoreAcctInfo.toLowerCase():
                                ProcessGetMoreAcctInfo(this, imageObj)
                                break
                            case Const.customQuery.getMarginBySymbolAcct.toLowerCase():
                                ProcessGetMarginBySymbolAcct(this, imageObj)
                                break
                            case Const.customQuery.getCBBCAgreement.toLowerCase():
                                ProcessGetCBBCAgreement(this, imageObj)
                                break
                            case Const.customQuery.queryMargPara.toLowerCase():
                                ProcessQueryMargPara(this, imageObj)
                                break
                            case Const.customQuery.loadCurrencyBal.toLowerCase():
                                ProcessLoadCurrencyBal(this, imageObj)
                                break
                            case Const.customQuery.loadCustomTableDefine.toLowerCase():
                                ProcessLoadCustomTableDefine(this, imageObj)
                                break
                            case Const.customQuery.loadAccountBCAN.toLowerCase():
                                ProcessLoadAccountBCAN(this, imageObj)
                                break
                            case Const.customQuery.loadCustomAccountInfo.toLowerCase():
                                ProcessLoadCustomAccountInfo(this, imageObj)
                                break
                            case 'gettrade':
                                ProcessBOAPI(this, imageObj)
                                imageObj.transType = 'trade'
                                break
                            case 'getmoneyvoucher':
                                ProcessBOAPI(this, imageObj)
                                imageObj.transType = 'money'
                                break
                            case 'getstockvoucher':
                                ProcessBOAPI(this, imageObj)
                                imageObj.transType = 'stock'
                                break
                            case Const.customQuery.loadInternalMessage.toLowerCase():
                                ProcessLoadInternalMessage(this, imageObj)
                                break
                            case Const.customQuery.queryErrorOrder.toLowerCase():
                                dataEntry.set({ name: Const.DataAction.errorOrder }, this.loginID, imageObj.orderNo, imageObj)
                                break
                            default:
                                break
                        }
                        if (array[0] === array[1]) {
                            this.event.emit('done', name)
                            imageObj._isCustonQueryDone = true
                        }
                        customQueryParser(imageObj, { user: this.getUser() })
                        this.event.emit(name, imageObj)
                    }
                }
            }
        } catch (err) {
            logger.error(err)
        }
    }

    /* license control ============================================================ */
    licenseControl() {
        if (this.sessionObj) {
            if (this.sessionObj.sessionSymbol) {
                var ss = this.sessionObj.sessionSymbol
                var ss_cmd = 'DDS|open|#LC_' + ss + '|' + ss + '|mode|both|'
                this.send(ss_cmd)
            }
            if (this.sessionObj.heartbeatInterval) {
                this.heartbeatTimer = setInterval(function () {
                    this.heartbeat()
                }.bind(this), Math.floor(this.sessionObj.heartbeatInterval * 1000 * 2 / 3))
                var tl_cmd = 'DDS|open|#LC_testlicense_ssm|testlicense_ssm|mode|both|'
                this.send(tl_cmd)
            }
        }
    }

    heartbeat() {
        var cmd = {
            header: ['DDS', 'image', 'heartbeat_ssm'],
            uniqueSessionID: this.sessionObj.sessionID,
            user: this.loginID,
            appID: config.iTrader.oms.applicationID,
            sessionHeartbeatInterval: this.sessionObj.heartbeatInterval,
        }
        var image = schema.SessionSchema.makeFromObject(cmd).castImage()
        this.send(image)
    }

    verifySession() {
        try {
            this.send('ITS|VerifySession|0|{0}|'.format(this.sessionObj.sessionID))
        } catch (error) {
            logger.error('verify session failed. error: ' + error)
        }
    }

    handleLicenseMessage(imageObj) {
        try {
            var status = imageObj.sessionStatus
            var code
            switch (status) {
                case -2:// session kill
                    code = '52'
                    break
                case -1:// session logout
                    code = '51'
                    break
                case 0: // session timeout
                    code = '51'
                    break
                case 2: // duplicate login
                    code = '50'
                    break
                default:
                    break
            }
            if (code) {
                this.logout()
                socketIO.emit(this.uid, { action: 'logout', errorCode: code })
            }
        } catch (err) {
            logger.error(err)
        }
    }

    /* Order ============================================================ */
    calculateOrder(symbol, side, price, quantity, extra, callback) {
        extra = this.preProcessSubmitOrder(extra)
        var user = this.getUser()
        if (symbol && quantity) {
            var cmd = {
                header: ['ORD', 'calculate'],
                symbol: symbol,
                side: side,
                price: price,
                quantity: quantity,
                account: extra.account || this.loginID,
                user: user.AECode || extra.account || this.loginID,
                operatorFlag: config.iTrader.oms.operatorFlag,
                sessionKey: this.sessionObj.sessionKey
            }
            if (extra) {
                for (var p in extra) {
                    cmd[p] = extra[p]
                }
            }
            var image = schema.OrderSchema.makeFromObject(cmd).castImage()
            if (typeof callback === 'function') {
                this.OnCalcOrder(extra.userRef, callback)
            }
            return this.send(image)
        } else {
            logger.info('Invalid order: ' + JSON.stringify({ Symbol: symbol, Price: price, Quantity: quantity }))
            return false
        }
    }

    calculateMultiOrder(orders, callback) {
        if (!orders || orders.length <= 0 || !callback) return
        var size = orders.length
        var errList = []
        var dataList = []
        for (var order of orders) {
            this.calculateOrder(order.symbol, order.side, order.price, order.quantity, order.extra, function (err, data) {
                size--
                if (err) {
                    errList.push(err)
                } else {
                    dataList.push(data)
                }
                if (size === 0) {
                    callback(errList.length > 0 ? errList : null, dataList)
                }
            })
        }
    }

    // reject order, support one or multi orders
    rejectOrder(orders) {
        if (!orders) return
        orders = IsArray(orders) ? orders : [orders]
        var user = this.getUser()
        for (var order of orders) {
            var orderNo = typeof order === 'object' ? order.orderNo : order
            if (orderNo) {
                var cmd = {
                    header: ['ORD', 'reject'],
                    orderNo: order.orderNo,
                    sessionKey: this.sessionObj.sessionKey,
                    account: this.loginID,
                    user: user.AECode || this.loginID,
                    command: 'force',
                    operatorFlag: config.iTrader.oms.operatorFlag,
                }
                var image = schema.OrderSchema.makeFromObject(cmd).castImage()
                this.send(image)
            }
        }
    }
    submitAddOrder(symbol, side, price, quantity, extra, callback) {
        extra = this.preProcessSubmitOrder(extra)
        if (symbol && quantity) {
            var cmd = {
                header: ['ORD', extra.cmd || 'add'],
                symbol: symbol,
                side: side,
                price: price,
                quantity: quantity,
                account: extra.account || this.loginID,
                operatorFlag: config.iTrader.oms.operatorFlag,
                sessionKey: this.sessionObj.sessionKey
            }
            if (extra) {
                for (var p in extra) {
                    cmd[p] = extra[p]
                }
                if (extra.transFee) {
                    cmd.compSystemRef = util.getKeyValuePairStr(cmd.compSystemRef, 'TRANSFEE', extra.transFee)
                }
            }
            var image = schema.OrderSchema.makeFromObject(cmd).castImage()
            if (typeof callback === 'function') {
                this.OnSubmitOrder(extra.userRef, callback)
            }
            return this.send(image)
        } else {
            logger.info('Invalid order: ' + JSON.stringify({ Symbol: symbol, Price: price, Quantity: quantity }))
            return false
        }
    }

    submitAddMultiOrder(orders, callback) {
        if (!orders || orders.length <= 0 || !callback) return
        var size = orders.length
        var errList = []
        var dataList = []
        for (var order of orders) {
            this.submitAddOrder(order.symbol, order.side, order.price, order.quantity, order.extra, function (err, data) {
                size--
                if (err) {
                    errList.push(err)
                } else {
                    dataList.push(data)

                }
                if (size === 0) {
                    callback(errList.length > 0 ? errList : null, dataList)
                }
            })
        }
    }

    submitFundSwitchOrder(key, orders, callback) {
        if (!orders || orders.length <= 0 || !callback) return
        var size = orders.length
        var errList = []
        var dataList = []

        var orderEvent = dataEntry.event({ name: Const.DataAction.order })
        var handler = function (order) {
            if (callback && order && order.FundSwitchOrderList && order.switchID === key) {
                var count = 0
                for (var i in order.FundSwitchOrderList) {
                    count++
                }
                if (size === count) {
                    orderEvent.removeListener(key, handler)
                    for (var p in order.FundSwitchOrderList) {
                        var fo = order.FundSwitchOrderList[p]
                        if (!fo) continue
                        if (fo._isErrorOrder) {
                            errList.push(fo)
                        } else {
                            dataList.push(fo)
                        }
                    }
                    callback(errList.length > 0 ? errList : null, dataList)
                    callback = null
                }
            }
        }
        orderEvent.on(key, handler)
        for (var order of orders) {
            this.submitAddOrder(order.symbol, order.side, order.price, order.quantity, order.extra)
        }
    }

    submitChangeOrder(orderNo, changePrice, changeQuantity, extra) {
        extra = this.preProcessSubmitOrder(extra)
        var user = this.getUser()
        if (orderNo) {
            var cmd = {
                header: ['ORD', 'change'],
                orderNo: orderNo,
                price: changePrice,
                quantity: changeQuantity,
                account: this.loginID,
                user: user.AECode || this.loginID,
                operatorFlag: config.iTrader.oms.operatorFlag,
                sessionKey: this.sessionObj.sessionKey
            }
            if (extra) {
                for (var p in extra) {
                    cmd[p] = extra[p]
                }
            }
            if (!changePrice && !changeQuantity) {
                // cmd.header[1] = 'schange'
                delete cmd.price
                delete cmd.quantity
            }
            var image = schema.OrderSchema.makeFromObject(cmd).castImage()
            return this.send(image)
        } else {
            logger.info('Invalid order: ' + JSON.stringify({ OrderNo: orderNo, ChangePrice: changePrice, ChangeQuantity: changeQuantity }))
            return false
        }
    }

    submitCancelOrder(orderNo, extra, callback) {
        extra = this.preProcessSubmitOrder(extra)
        var user = this.getUser()
        if (orderNo) {
            var cmd = {
                header: ['ORD', 'cancel'],
                orderNo: orderNo,
                account: this.loginID,
                user: user.AECode || this.loginID,
                operatorFlag: config.iTrader.oms.operatorFlag,
                sessionKey: this.sessionObj.sessionKey
            }
            if (extra) {
                for (var p in extra) {
                    cmd[p] = extra[p]
                }
            }
            var image = schema.OrderSchema.makeFromObject(cmd).castImage()
            if (typeof callback === 'function') {
                this.OnSubmitOrder(extra.userRef, callback)
            }
            return this.send(image)
        } else {
            logger.info('Invalid order: ' + JSON.stringify({ OrderNo: orderNo }))
            return false
        }
    }

    cancelMultiOrder(orders, callback) {
        if (!orders || orders.length <= 0 || !callback) return
        var size = orders.length
        var errList = []
        var dataList = []
        for (var order of orders) {
            this.submitCancelOrder(order.orderNo, order.extra, function (err, data) {
                size--
                if (err) {
                    errList.push(err)
                } else {
                    dataList.push(data)

                }
                if (size === 0) {
                    callback(errList.length > 0 ? errList : null, dataList)
                }
            })
        }
    }

    preProcessSubmitOrder(extra) {
        extra = extra || {}
        if (!extra.password) {
            var user = this.getUser()
            if (user) {
                extra.password = user.password
            }
        }
        return extra
    }

    OnSubmitOrder(key, callback) {
        var orderEvent = dataEntry.event({ name: Const.DataAction.order })
        var errEvent = dataEntry.event({ name: Const.DataAction.errorOrder })
        orderEvent.once(key, (order) => {
            if (callback && order && (order.userRef === key || order.orderNo === key)) {
                callback(null, order)
                callback = null
            }
        })
        errEvent.once(key, (error) => {
            if (callback && error && (error.userRef === key || error.orderNo === key)) {
                callback(error)
                callback = null
            }
        })
        this.event.once('errImage', (error) => {
            if (callback && error) {
                callback(error)
                callback = null
            }
        })
    }

    OnCalcOrder(userRef, callback) {
        var calcEvent = dataEntry.event({ name: Const.DataAction.calcOrder })
        var errEvent = dataEntry.event({ name: Const.DataAction.errorOrder })
        calcEvent.once(userRef, (order) => {
            if (callback && order && order.userRef === userRef) {
                callback(null, order)
                callback = null
            }
        })
        errEvent.once(userRef, (error) => {
            if (callback && error && error.userRef === userRef) {
                callback(error)
                callback = null
            }
        })
        this.event.once('errImage', (error) => {
            if (callback && error) {
                callback(error)
                callback = null
            }
        })
        this.event.once('calculate', (error) => {
            if (callback && error && error.userRef === userRef) {
                callback(error)
                callback = null
            }
        })
    }

    setSkipDisclaimer(side, callback) {
        this.customQuery({ systemRef: Const.customQuery.setDisclaimerENT, userRef: side, account: this.loginID, side: side }, function (err, data) {
            if (!err && data) {
                data = IsArray(data) ? data[0] : data
                var user = this.getUser()
                user.skipDisclaimer = data.userRef == 1 ? true : false
            }
            if (typeof callback === 'function') {
                callback(err, data)
            }
        }.bind(this))
    }

    autoVerifySession() {
        if (config.iTrader.oms.autoVerifyInterval > 0) {
            this.autoVerifySessionTimer = setInterval(function () {
                this.verifySession()
            }.bind(this), 1000 * config.iTrader.oms.autoVerifyInterval)
        }
    }

    manualVerifySession() {
        if (config.iTrader.oms.manualVerifyInterval > 0) {
            this.verifySession()
        } else {
            logger.info('skip verify session as setting manualVerifyInterval < 0.')
        }
    }

    getUser() {
        return dataEntry.get({ name: Const.DataAction.user }, this.uid)
    }

    getAllAccounts() {
        var accounts = []
        var user = this.getUser()
        if (user && user.accounts) {
            accounts = user.accounts
            if (config.iTrader.oms.CNYAcctSuffix) {
                var cnyAccount = user.id + config.iTrader.oms.CNYAcctSuffix
                if (accounts.indexOf(cnyAccount) < 0) {
                    accounts.push(cnyAccount)
                }
            }
        }
        return accounts
    }

    getOrderByTrade(tradeObj) {
        if (typeof (tradeObj) === 'object') {
            if (tradeObj.exchNo) {
                var subOrderObj = dataEntry.get({ name: Const.DataAction.subOrder }, this.loginID, tradeObj.exchNo)
                if (subOrderObj && subOrderObj.orderNo) {
                    return dataEntry.get({ name: Const.DataAction.order }, this.loginID, subOrderObj.orderNo)
                }
            }
        }
    }

    getTradeBySubOrder(suborder) {
        if (typeof suborder === 'object') {
            if (suborder.exchNo) {
                var tradeList = []
                var trades = dataEntry.get({ name: Const.DataAction.trade }, this.loginID)
                if (trades && trades.length > 0) {
                    for (var t of trades) {
                        if (t && t.exchNo === suborder.exchNo) {
                            tradeList.push(t)
                        }
                    }
                    return tradeList
                }
            }
        }
    }

    getFundOrderFromGBS() {
        if (!config.iTrader.GBSWebService || !config.iTrader.GBSWebService.url) return
        var user = this.getUser()
        var fn = function () {
            GBSWebService.GetFund({ account: user.id, fromDate: '2015-01-01', toDate: '2017-01-01' }, function (err, result) {
                if (result) {
                    for (var item of result) {
                        var imageObj = schema.OrderSchema.makeFromObject(item)
                        dataEntry.set({ name: Const.DataAction.order }, this.loginID, imageObj.orderNo, imageObj, {})
                    }
                }
            }.bind(this))
        }
        fn.bind(this)()
        this.GBSGetFundTimer = setInterval(fn.bind(this), (config.iTrader.GBSWebService.getFundInterval || 60) * 1000)
    }
}