import $ from 'jquery'
import sessionData from './sessionData'
import util from './util'
import moment from 'moment'

var symbolObjList = {}
exports.calcOrder = function (order, callback) {
    if (typeof order !== 'object' || typeof callback !== 'function') return
    if (!order.symbol || !order.price || !order.quantity || !order.side) return callback({ errorCode: 'I_10001' })
    submitOrder({
        symbol: order.symbol,
        price: order.price,
        quantity: order.quantity,
        side: order.side,
        type: order.type || '',
        tif: order.tif || ''
    }, callback)
}


exports.addOrder = function (order, callback) {
    if (typeof order !== 'object' || typeof callback !== 'function') return
    if (!order.symbol || !String(order.price) || !order.quantity || typeof order.side === 'undefined') return callback({ errorCode: 'I_10001' })
    submitOrder({
        cmd: 'add',
        symbol: order.symbol,
        price: order.price,
        quantity: order.quantity,
        side: order.side,
        type: order.type || '',
        tif: order.tif || '',
        password: order.password || '',
        date: order.date,
        stopPrice: order.stopPrice,
    }, callback)
}

exports.changeOrder = function (order, callback) {
    if (typeof order !== 'object' || typeof callback !== 'function') return
    if (!order.orderNo || !order.changePrice || !order.changeQuantity) return callback({ errorCode: 'I_10001' })
    submitOrder({
        cmd: 'change',
        orderNo: order.orderNo,
        changePrice: order.changePrice,
        changeQuantity: order.changeQuantity,
        password: order.password,
    }, callback)
}

exports.cancelOrder = function (order, callback) {
    if (typeof order !== 'object' || typeof callback !== 'function') return
    if (!order.orderNo) return callback({ errorCode: 'I_10001' })
    submitOrder({
        cmd: 'cancel',
        orderNo: order.orderNo,
        password: order.password,
    }, callback)
}

function submitOrder(order, callback) {
    if (typeof order !== 'object' || typeof callback !== 'function') return
    order._csrf = $('input[name=_csrf]').val()
    $.ajax({
        type: 'post',
        url: '/iTrader/order/submit',
        data: order,
        success: callback,
        error: function (err) {
            console.log(err)
        }
    })
}

exports.getSymbol = function (symbol, realtime, callback) {
    if (!symbol || typeof callback !== 'function') return
    if(!realtime){
        realtime = ''
    }
    var url = '/iTrader/product?symbol=' + symbol + '&temp=' + (new Date()).getTime()
    if (String(realtime)) {
        url += '&type=' + realtime
    }
    $.get(url, function (data) {
        if (!data || !data.data) return
        data = data.data
        if (!symbolObjList[data[0]]){
            symbolObjList[data[0]] = data
        }else{
            if(data.time >= symbolObjList[data[0]].time){
                symbolObjList[data[0]] = data
            }
        }
        // data.datetime = moment().format('MM-DD HH:mm:ss')
        sessionData.setSymbol(symbolObjList[data[0]])
        if (typeof callback === 'function') {
            callback(symbolObjList[data[0]])
        }
    })
}

exports.getOrder = function (orderNo, callback) {
    if (!orderNo || typeof callback !== 'function') return
    $.ajax({
        type: 'get',
        headers: {
            "content-type": "application/json"
        },
        url: '/iTrader/order/get?orderNo=' + orderNo,
        success: callback,
        error: function (err) {
            console.log(err)
        }
    })
}

exports.getAccountSetting = function (callback) {
    callback = callback || function () { }
    var accountSetting = util.getSessionStorage("accountObj", true)
    if (accountSetting) {
        return callback(accountSetting)
    } else {
        $.get('/iTrader/account', function (data) {
            if (!data || !data.data) return
            data = data.data
            util.setSessionStorage('accountObj', data)
            return callback(data)
        })
    }
}
