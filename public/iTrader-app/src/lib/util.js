import MappingConfig from '../config/mapping.config'
import Format from './format'
import dataCenter from './data'
import $ from 'jquery'

if (!Number.MIN_SAFE_INTEGER) {
    Number.MIN_SAFE_INTEGER = -9007199254740991
}

exports.IsArray = function (obj) {
    if (typeof (obj) === 'object' && obj !== null && obj.constructor === Array) {
        return true
    }
    return false
}

function clone(obj) {
    var copy
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj
    // Handle Date
    if (obj instanceof Date) {
        copy = new Date()
        copy.setTime(obj.getTime())
        return copy
    }
    // Handle Array
    if (obj instanceof Array) {
        copy = []
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i])
        }
        return copy
    }
    // Handle Object
    if (obj instanceof Object) {
        copy = {}
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr])
        }
        return copy
    }
    throw new Error("Unable to copy obj! Its type isn't supported.")
}
exports.Clone = clone

exports.ToNumber = function (value) {
    if (isNaN(value) || value <= Number.MIN_SAFE_INTEGER) return 0
    return Number(value) || 0
}

exports.MapExchange = function (exchange) {
    if (exchange && MappingConfig.exchange[exchange]) {
        return MappingConfig.exchange[exchange]
    }
    return exchange
}

exports.MapSource = function (source) {
    if (source) {
        return messages.oms['source_' + source] || source
    }
    return ''
}

exports.GetSymbolName = function (symbolObj, options) {
    var name = ''
    if (symbolObj && options) {
        if (options.lang === 'zh-HK') {
            name = symbolObj[36] || (options.short ? symbolObj[10] : symbolObj[21])
        } else if (options.lang === 'zh-CN') {
            name = symbolObj[505] || (options.short ? symbolObj[10] : symbolObj[21])
        } else {
            if (options.short) {
                name = symbolObj[10] || symbolObj[21]
            } else {
                name = (symbolObj[21] || symbolObj[10])
            }
        }
        if (symbolObj.ISIN && !options.NoISIN && !options.short) {
            name += '(' + (symbolObj.ISIN || '') + ')'
        }
    }
    return name
}

exports.GetLanguage = function () {
    return document.getElementById("language").value || localStorage.getItem("language") || 'zh-CN'
}

exports.MapOrderSide = function (side) {
    if (side && messages && messages.oms && messages.oms['side_' + side]) {
        return messages.oms['side_' + side]
    }
}

exports.MapOrderStatus = function (status) {
    if (status && messages && messages.oms && messages.oms['status_' + status])
        return messages.oms['status_' + status]
}

exports.IsOutStandingStatus = function (status) {
    if (status == 1 || status == 2 || status == 100 || status == 8) {
        return true
    }
}

exports.zerofill = function (value, options) {
    if (value && options && typeof (options.size) === 'number') {
        if (!isNaN(value)) {
            value = value.toString()
            while (value.length < options.size) {
                value = '0' + value
            }
        }
    }
    return value
}

exports.spinner = function (value, spinnerValue, spinnerType) {
    if (spinnerType === 'price') {
        var precision = String(spinnerValue).length - String(spinnerValue).indexOf('.') - 1
        return (Number(value || 0) * 1000 + spinnerValue * 1000) / 1000
    } else if (spinnerType === 'quantity') {
        var qty = 0
        if (spinnerValue > 0) {
            if (value < spinnerValue) {
                qty = 0
            } else {
                qty = Math.ceil(value / spinnerValue) * spinnerValue
            }
        } else {
            qty = Math.floor(value / spinnerValue) * spinnerValue
        }
        return qty + spinnerValue
    }
    // this.setData({ trade: tradeData })
    // this.orderAmountHandler()
}
exports.getSpreadValue = function (spreadArray, price) {
    if (spreadArray) {
        var spreadValue
        for (var i = 0; i < spreadArray.length; i = i + 2) {
            if (Number(spreadArray[i]) > price) {
                spreadValue = spreadArray[i + 1]
                break
            }
        }
        spreadValue = spreadValue || spreadArray[spreadArray.length - 1] || 0.001
    }
    return Number(spreadValue).toString()
}

exports.maxBuySellHandler = function (value, type, symbolObj) {
    if (!symbolObj) return
    if (type === 'buy') {
        var maxBuy = this.calcMaxBuy(symbolObj, value)
        if (maxBuy || maxBuy == 0) {
            maxBuy = Format.quantity(maxBuy)
        }
        return maxBuy
    } else if (type === 'sell') {
        var maxSell = this.calcMaxSell(symbol['0'])
        if (maxSell || maxSell == 0) {
            maxSell = Format.quantity(maxSell)
        }
        return maxSell
    }
}

exports.calcMaxBuy = function (productObj, price) {
    if (!productObj || !price) return
    var accountID = (dataCenter.custom('account') || {}).id || ''
    var max_buy = 0
    var balanceObj = {}
    var currency = productObj[23]
    var currencyMode = dataCenter.custom('currency').currencyMode
    var ratio = 1
    if (currencyMode === 'multi') {
        var balanceObj = dataCenter.get('account', accountID + '_' + currency)
    } else {
        balanceObj = dataCenter.get('account', accountID + '_')  // currency = null
    }
    var lotSize = productObj[24]
    var tradeLimit = (balanceObj ? balanceObj[156] : 0) || 0
    if (lotSize) {
        tradeLimit = tradeLimit / ratio
        max_buy = Math.floor(tradeLimit / price / lotSize) * lotSize
    }
    return max_buy >= 0 ? max_buy : 0
}

exports.calcMaxSell = function (symbolCode) {
    var accountID = (dataCenter.custom('account') || {}).id || ''
    var max_sell = 0
    var positionObj = dataCenter.get('position', symbolCode + '_' + accountID)
    if (positionObj) {
        max_sell = positionObj.availableQuantity
        // max_sell = positionObj[4] - positionObj.queueQuantity
    }
    return max_sell >= 0 ? max_sell : 0
}

exports.getErrorMessage = function (err) {
    var errMsg
    if (err) {
        if (typeof (err) === 'string') {
            errMsg = messages.error[err] || err
        } else if (typeof (err) === 'object') {
            var minorCode = err.minorCode || err[464]
            var errorCode = err.errorCode || err[464]
            var errorMsg = err.errorMsg || err.freeText || err[25]
            errMsg = errorMsgMapping(err) || messages.error[minorCode] || messages.error[errorCode] || errorMsg
            if (!errMsg) {
                if (err.status) {
                    if (err.status == 401) {
                        navigate()
                    } else if (err.status == 403) {
                        if (err.responseJSON && err.responseJSON.errorCode) {
                            errMsg = messages.error[err.responseJSON.errorCode]
                        }
                        errMsg = errMsg || err.statusText
                    } else if (err.status == 503) {
                        errMsg = messages.error.I_10002
                    } else if (err.statusText) {
                        errMsg = err.statusText
                    } else {
                        errMsg = messages.error.I_10004
                    }
                }
            }
            if (errMsg && err.parameters && err.parameters.length > 0) {
                errMsg = errMsg.cformat(err.parameters)
            }
        }
    }
    return errMsg || messages.error.I_10004
}

// new error mode
function errorMsgMapping(temp1) {
    function converot(type, value) {
        if (!type || !value) return
        if (type === 'd') {
            return Format.amount(value)
        } else if (type === 'n') {
            return Format.quantity(value)
        } else {
            return value
        }
    }
    if (!temp1 || !temp1[487] || !temp1[487][464]) return
    var errorMsg = ''
    var minorCodeArray = temp1[487][464].split(':')
    for (var i = 0; i < minorCodeArray.length; i++) {
        var minorCode = minorCodeArray[i]
        var errorMsgTemplate = messages.error[minorCode]
        if (errorMsgTemplate) {
            var minorCodeValue = temp1[487][minorCode]
            if (!minorCodeValue) continue
            var minorCodeValueArray = minorCodeValue.split(':')
            var minorCodeValueFormatArray = []
            for (var j = 0; j < minorCodeValueArray.length; j++) {
                if (minorCodeValueArray[j].length > 1) {
                    minorCodeValueFormatArray.push(converot(minorCodeValueArray[j].substr(0, 1), minorCodeValueArray[j].substring(1, minorCodeValueArray[j].length)))
                }
            }
            errorMsg += errorMsgTemplate.cformat(minorCodeValueFormatArray)
        }
    }
    return errorMsg
}

exports.setSessionStorage = function (key, value, options) {
    if (!key || !value) return
    options = options || {}
    if (typeof value === 'object') {
        if (options.type === 'update') {
            var item = sessionStorage.getItem(key)
            if (item) {
                item = JSON.parse(item)
            }
            item = item || {}
            for (var p in value) {
                item[p] = value[p]
            }
            sessionStorage.setItem(key, JSON.stringify(value))
        } else {
            sessionStorage.setItem(key, JSON.stringify(value))
        }
    } else {
        sessionStorage.setItem(key, String(value))
    }
}

exports.getSessionStorage = function (key, isObject) {
    if (!key) return
    var value = sessionStorage.getItem(key)
    if (isObject && value) {
        return JSON.parse(value)
    }
    return value
}

exports.setLocalStorage = function (key, value, options) {
    if (!key || !value) return
    options = options || {}
    if (typeof value === 'object') {
        if (options.type === 'update') {
            var item = localStorage.getItem(key)
            if (item) {
                item = JSON.parse(item)
            }
            item = item || {}
            for (var p in value) {
                item[p] = value[p]
            }
            localStorage.setItem(key, JSON.stringify(value))
        } else {
            localStorage.setItem(key, JSON.stringify(value))
        }
    } else {
        localStorage.setItem(key, String(value))
    }
}

exports.getLocalStorage = function (key, isObject) {
    if (!key) return
    var value = localStorage.getItem(key)
    if (isObject && value) {
        return JSON.parse(value)
    }
    return value
}
exports.GetOptions = function (orderObj) {
    var options = ''
    if (orderObj) {
        var instruction = orderObj[40]
        var instruction1 = orderObj[489]
        var instruction2 = orderObj[490]
        var instruction3 = orderObj[491]
        var instruction4 = orderObj[492]

        if ((instruction & 1) !== 0) {
            options += messages.oms.order_type_market + ';'
        }
        if ((instruction & 512) !== 0) {
            if (Number(orderObj['3']) == 0) {
                options += messages.oms.order_type_auction + ';'
            } else {
                options += messages.oms.order_type_auctionLimit + ';'
            }
        }
        if ((instruction & 1024) !== 0) {
            options += messages.oms.order_type_enhancedLimit + ';'
        }
        if ((instruction & 2048) !== 0) {
            var stopPriceStr = getDisplayPrice(orderObj[41], 'order', orderObj)
            options += '{0} [{1}:{2}];'.format(messages.oms.order_type_stopLimit, messages.ticket_stop_price.text, stopPriceStr)
        }
        if ((instruction & 128) !== 0) {
            options += messages.oms.order_tif_fak + ';'
        }
        if ((instruction & 256) !== 0) {
            options += messages.oms.order_tif_fok + ';'
        }
        if ((instruction & 1048576) !== 0) {
            if (orderObj[495]) {
                options += '{0} [{1}];'.format(messages.oms.order_tif_gtd, orderObj[495])
            } else {
                options += messages.oms.order_tif_gtc + ';'
            }
        }

        if (orderObj.transFee) {
            options += '{0}{1};'.format('TRANSFEE: ', Format.amount(orderObj.transFee))//$._format.percentage(orderObj.transFee, 2)
        }
    }
    return options
}

function getDisplayPrice(price, type, options) {
    if (isNaN(price)) return price
    if (Number(price) === 0) return 0
    var type = type || 'market'
    var displayRatio = options.displayRatio || options[1504] || 1
    price = displayRatio * price
    var ticksize = getSpreadPrecision(options, price)
    var patternsuffix = ''
    if (type == 'market') {
        price = Format.price(price, ticksize)
    } else if (type == 'order') {
        for (var i = 0; i < 8; i++) {
            if (i < ticksize) patternsuffix += '0'
            else patternsuffix += '#'
        }
        price = Format.price(price, '#,##0.' + patternsuffix)
    } else if (type === 'avg') {
        for (var i = 0; i < 8; i++) {
            if (i <= ticksize) patternsuffix += '0'
            else patternsuffix += '#'
        }
        price = Format.price(price, '#,##0.' + patternsuffix)
    }
    return price
}
function getSpreadPrecision (name, price) {
    var spreadValue = getSpreadValue(name, price)
    if (spreadValue) {
        spreadValue = Number(spreadValue).toString()
        return spreadValue.length - spreadValue.indexOf('.') - 1
    }
    return 3
}

function getSpreadValue (options, price) {
    var spreadList = {}
    var spreadValue = ''
    var displayRatio = 1
    var name = ''
    if (typeof options === 'object') {
        name = options[73] || options.spread
        displayRatio = options[1504] || options.displayRatio || 1
    } else if (typeof options === 'string') {
        name = options
    }
    price = price / displayRatio
    var spreadArray = spreadList[name]
    if (spreadArray) {
        for (var i = 0; i < spreadArray.length; i = i + 2) {
            if (Number(spreadArray[i]) > price) {
                spreadValue = spreadArray[i + 1]
                break
            }
        }
        spreadValue = spreadValue || spreadArray[spreadArray.length - 1] || 0.001
    }
    return Number(spreadValue * displayRatio).toString()
}

