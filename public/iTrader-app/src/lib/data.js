import Numbro from 'numbro';
import Util from './util'
import Format from './format'

class Repository {
    constructor(options) {
        this.options = options || {}
        this.name = options.name
        this.rawData = {}
        this.viewData = {}
        this.customInfo = {}
        this.lastUpdate
    }
    set(data) {
        if (!data || data.name !== this.name || !data.data || data.data.length <= 0)
            return
        data = data.data
        this.getCustomInfo(data)
        var temp = this.preProcess(data)
        if (temp) {
            data = temp
        }
        for (var item of data) {
            var viewItem = this.parse(item)
            if (viewItem && viewItem._id) {
                this.viewData[item._id] = viewItem
            }
            if (item && item._id) {
                this.rawData[item._id] = item
            }
        }

        this.lastUpdate = (new Date()).getTime()
    }
    get(key) {
        if (key && this.rawData[key]) return this.rawData[key]
    }
    getCustomInfo() { }
    preProcess() { }
    parse() { }
    subscribe(callback) {
        var that = this
        var lastCallback
        callback(that.viewData)
        lastCallback = (new Date()).getTime()
        setInterval(function () {
            if (that.lastUpdate && lastCallback && lastCallback >= that.lastUpdate)
                return
            callback(that.viewData)
            lastCallback = (new Date()).getTime()
        }, 2000)
    }
}


var orders = new Repository({ name: 'order' })
orders.parse = function (item) {
    if (!item || !item[6]) return
    item._id = item[6]
    var view = {
        _id: item[6],
        0: item[0],
        3: item[3],
        4: item[4],
        5: item[5],
        6: item[6],
        11: Util.MapOrderSide(item[11]),
        20: item[20],
        21: item[21],
        23: item[23],
        24: item[24],
        33: item[33],
        36: item[36],
        73: item[73],
        505: item[505],
        orderDate: item[495],
        options: Util.GetOptions(item),
        shortName: item.shortName,
        buysell: item[11],
        order_remark: item[25] || '',
        filed_quantity: Format.quantity(item[34]),
        filed_price: item[42] || '--',
        price: Format.price(item[3]),
        quantity: Format.quantity(item[4]),
        status: Util.MapOrderStatus(item[5]),
        shortExchange: Util.MapExchange(item[20]),
        source: Util.MapSource(item[400]),
        voucherType: item.voucherType
    }
    return view
}
var positions = new Repository({ name: 'position' })
positions.parse = function (item) {
    if (!item || !item[0])
        return
    if (item[4] == 0) return
    item._id = item[0] + '_' + item[10]
    var view = {
        _id: item[0] + '_' + item[10],
        0: item[0],
        4: item[4],
        20: item[20],
        21: item[21],
        36: item[36],
        505: item[505],
        115: Format.price(item[115]),
        shortName: item.shortName,
        quantity: Format.quantity(item[4]),
        unrealizedPLView: Numbro(item.unrealizedPL).format('0,0.00'),
        unrealizedPL: item.unrealizedPL,
        shortExchange: Util.MapExchange(item[20])
    }
    // console.log(item[0] + '_' + item[23])
    // console.log((accounts.get(item[10] + '_' + item[23]) || []).concat(accounts.get(item[10] + '_')))
    // position update trigger account update
    accounts.set({
        name: 'account',
        data: ([accounts.get(item[10] + '_' + item[23])]).concat(accounts.get(item[10] + '_'))  // sprecified currnecy and null currency
    })
    return view
}
var accounts = new Repository({ name: 'account' })
accounts.parse = function (item) {
    if (!item || item.account_list) return
    var _id = item[10] + '_' + (item[23] || '')
    item._id = _id
    var view = {
        _id: _id
    }
    for (var i in item) {
        if (!isNaN(item[i]) && item[i] !== null && item[i] !== '') {
            view[i] = Format.amount(item[i])
        } else {
            view[i] = item[i]
        }
    }
    var unrealizedPL = 0
    var realizedPL = 0
    var totalBuy = 0
    var totalSell = 0
    var marketValue = 0
    var acceptValue = 0
    for (var p in positions.rawData) {
        var positionObj = positions.rawData[p]
        if (positionObj[10] !== item[10]) continue
        var ratio = 1
        unrealizedPL += Util.ToNumber(positionObj.unrealizedPL) * ratio
        realizedPL += Util.ToNumber(positionObj.realizedPL) * ratio
        marketValue += Util.ToNumber(positionObj.marketValue) * ratio
        acceptValue += Util.ToNumber(positionObj.acceptValue) * ratio
        if (positionObj.trades) {
            for (var p in positionObj.trades) {
                var trade = positionObj.trades[p]
                if (trade.voucherType === 'security') continue
                if (trade[11] == 0) {
                    totalBuy += trade[3] * trade[4] * ratio
                } else if (trade[11] == 1) {
                    totalSell += trade[3] * trade[4] * ratio
                }
            }
        }
    }
    view.marketValue = Format.amount(marketValue)
    view.acceptValue = Format.amount(acceptValue)
    view.unrealizedPL = Format.amount(unrealizedPL)
    view.realizedPL = Format.amount(realizedPL)
    view.totalBuy = Format.amount(totalBuy)
    view.totalSell = Format.amount(totalSell)
    view.totalNet = Format.amount(totalBuy - totalBuy)
    view['-totalNet'] = Format.amount(totalBuy - totalBuy)
    view.totalBuySell = Format.amount(Math.abs(totalBuy) + Math.abs(totalSell))
    view.totalPortfolioValue = Format.amount(item[156] + marketValue)
    view.netAssetValue = Format.amount(item[156] + marketValue)
    return view
}
accounts.getCustomInfo = function (data) {
    if (!data) return
    for (var item of data) {
        if (item) {
            this.customInfo.id = item[10]
        }
    }
}
var spreads = new Repository({ name: 'spread' })
spreads.parse = function (item) {
    item._id = item[0]
}
var currencys = new Repository({ name: 'currency' })
currencys.getCustomInfo = function (data) {
    if (!data) return
    for (var item of data) {
        if (item) {
            this.customInfo.baseCurrency = item.baseCurrency || this.customInfo.baseCurrency
            this.customInfo.currencyMode = item.currencyMode || this.customInfo.currencyMode
        }
    }
}
currencys.preProcess = function (data) {
    var list = []
    if (data && data.length && data[0].currency_list) {
        for (var item of data[0].currency_list) {
            list.push(item)
        }
    }
    return list
}
currencys.parse = function (item) {
    item._id = item.currency
    return item
}

var messages = new Repository({ name: 'message' })
messages.parse = function (item) {
    if (!item) return
    item._id = item.action + 'User'
    var msg = {
        _id: item.action,
        action: item.action,
        error: Util.getErrorMessage(item.errorCode)
    }
    return msg
}
var exchanges = new Repository({ name: 'exchange' })
exchanges.parse = function (item) {
    if (!item) return
    item._id = item[20]
    var view = {
        _id: item[20],
        exchange: item[20],
        status: item[5],
    }
    return view
}

var list = {
    order: orders,
    position: positions,
    account: accounts,
    spread: spreads,
    currency: currencys,
    message: messages,
    exchange: exchanges,
}

exports.set = function (data) {
    if (!data || !data.name || !list[data.name])
        return
    list[data.name].set(data)
}
exports.get = function (name, key) {
    if (!name || !list[name])
        return
    return list[name].get(key)
}
exports.parse = function (name, item) {
    if (!name || !list[name])
        return
    return list[name].parse(item)
}
exports.custom = function (name) {
    if (!name || !list[name])
        return
    return list[name].customInfo
}
exports.subscribe = function (name, callback) {
    if (!name || !list[name] || typeof callback !== 'function')
        return
    list[name].subscribe(callback)
}