import util from './util'
exports.getSymbol = function (symbol) {
    if (!symbol) return
    return util.getSessionStorage('symbol-' + symbol, true)
}

exports.setSymbol = function (symbolObj) {
    if (!symbolObj || !symbolObj[0]) return
    var symbol = symbolObj[0]
    util.setSessionStorage('symbol-' + symbol, symbolObj)
}