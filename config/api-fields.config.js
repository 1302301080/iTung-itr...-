module.exports = {
    "v1": {},  // version 1 return all tags
    "v2": {
        "session": [
            { "key": "sessionID" },
            { "key": "user" },
            { "key": "loginType" },
            { "key": "freeText" },
            { "key": "passwordExpiryDatetime" },
            { "key": "errorCode" },
            { "key": "tokenType" },
            { "key": "resendInterval" },
            { "key": "notifyNumber" },
            { "key": "secondaryTokenType" },
            { "key": "availableTokenTypes" },
            { "key": "availableDeliveryMethods" },
            { "key": "tokenStatus" },
            { "key": "actCodeResendTimeout" },
            { "key": "appID" },
            { "key": "appVersion" },
            { "key": "clientIP" },
            { "key": "pinPos" },
            { "key": "pin" },
            { "key": "tokenType" },
            { "key": "tokenCode" },
            { "key": "deviceOS" },
            { "key": "location" },
            { "key": "browser" },
            { "key": "serverDatetime" },
            { "key": "countryCode" },
            { "key": "device" },
            { "key": "lastLoginTime" },
            { "key": "lastLoginApp" },
            { "key": "lastLoginLocation" },
            { "key": "entitlements" }
        ],
        "order": [
            { "key": "orderNo" },
            { "key": "symbol" },
            { "key": "symbolName" },
            { "key": "shortName" },
            { "key": "name" },
            { "key": "shortNameEx" },
            { "key": "CHTName" },
            { "key": "CHSName" },
            { "key": "price" },
            { "key": "quantity" },
            { "key": "status" },
            { "key": "account" },
            { "key": "side" },
            { "key": "type" },
            { "key": "tif" },
            { "key": "user" },
            { "key": "exchange" },
            { "key": "productType" },
            { "key": "currency" },
            { "key": "lotSize" },
            { "key": "freeText" },
            { "key": "time" },
            { "key": "datetime" },
            { "key": "price1" },
            { "key": "price2" },
            { "key": "filledQty" },
            { "key": "errorCode" },
            { "key": "minorCode" },
            { "key": "operatorFlag" },
            { "key": "compSystemRef" },
            // { "key": "instruct" },
            // { "key": "instruct1" },
            // { "key": "instruct2" },
            // { "key": "instruct3" },
            { "key": "options" },
            { "key": "expirationDate" },
            // { "key": "openClose" },
            // { "key": "principal" },
            // { "key": "AHFT" },
            { "key": "voucherType" }
        ],
        "trade": [
            { "key": "symbol" },
            { "key": "price" },
            { "key": "quantity" },
            { "key": "status" },
            { "key": "exchNo" },
            { "key": "tranNo" },
            { "key": "account" },
            { "key": "user" },
            { "key": "exchange" },
            { "key": "time" }
        ],
        "position": [
            { "key": "symbol" },
            { "key": "symbolName" },
            { "key": "shortName" },
            { "key": "shortNameEx" },
            { "key": "name" },
            { "key": "CHTName" },
            { "key": "CHSName" },
            { "key": "quantity" },
            { "key": "account" },
            { "key": "exchange" },
            { "key": "productType" },
            { "key": "currency" },
            { "key": "preClose" },
            { "key": "bodAmount" },
            { "key": "bodQuantity" },
            { "key": "bodShortQuantity" },
            { "key": "realizedPL" },
            { "key": "unrealizedPL" },
            { "key": "unrealizedPLRatio" },
            { "key": "bodPL" },
            { "key": "execPL" },
            { "key": "costPrice" },
            { "key": "totalQuantity" },
            { "key": "totalAmount" },
            { "key": "todayBuyAmount" },
            { "key": "todayBuyQuantity" },
            { "key": "todaySellAmount" },
            { "key": "todaySellQuantity" },
            { "key": "depositAmount" },
            { "key": "depositQuantity" },
            { "key": "withdrawAmount" },
            { "key": "withdrawQuantity" },
            { "key": "marketValue" },
            { "key": "marginRatio" },
            { "key": "acceptValue" },
            { "key": "queueQuantity" },
            { "key": "availableQuantity" }
        ],
        "account": [
            { "key": "account" },
            { "key": "currency" },
            { "key": "time" },
            { "key": "tradeLimit" },
            { "key": "cashBalance" },
            { "key": "bodTradeLimit" },
            { "key": "bodCashBalance" },
            { "key": "bodWebTradeLimit" },
            { "key": "webTradeLimit" },
            { "key": "acctAvailableb" },
            { "key": "marginCall" },
            { "key": "initialMargin" },
            { "key": "maintenanceMargin" }
        ],
        "product": [
            { "key": "symbol" },
            { "key": "bid" },
            { "key": "ask" },
            { "key": "price" },
            { "key": "status" },
            { "key": "symbolName" },
            { "key": "shortName" },
            { "key": "shortNameEx" },
            { "key": "name" },
            { "key": "CHTName" },
            { "key": "CHSName" },
            { "key": "exchange" },
            { "key": "productType" },
            { "key": "currency" },
            { "key": "lotSize" },
            { "key": "preClose" },
            { "key": "open" },
            { "key": "high" },
            { "key": "low" },
            { "key": "turnover" },
            { "key": "volume" },
            { "key": "time" },
            { "key": "spread" },
            // { "key": "contractSize" },
            // { "key": "maturity" },
            // { "key": "series" },
            // { "key": "strikePrice" },
            // { "key": "callPut" },
            { "key": "quoteUsage" },
            { "key": "quoteBalance" },
            // { "key": "bidPrice2" },
            // { "key": "bidPrice3" },
            // { "key": "bidPrice4" },
            // { "key": "bidPrice5" },
            // { "key": "askPrice2" },
            // { "key": "askPrice3" },
            // { "key": "askPrice4" },
            // { "key": "askPrice5" },
            // { "key": "bidSize2" },
            // { "key": "bidSize3" },
            // { "key": "bidSize4" },
            // { "key": "bidSize5" },
            // { "key": "bidQueue1" },
            // { "key": "bidQueue2" },
            // { "key": "bidQueue3" },
            // { "key": "bidQueue4" },
            // { "key": "bidQueue5" },
            // { "key": "askSize1" },
            // { "key": "askSize2" },
            // { "key": "askSize3" },
            // { "key": "askSize4" },
            // { "key": "askQueue1" },
            // { "key": "askQueue2" },
            // { "key": "askQueue3" },
            // { "key": "askQueue4" },
            // { "key": "askQueue5" },
        ],
        "exchange": [
            { "key": "exchange" },
            { "key": "status" }
        ],
        "spread": [
            { "key": "symbol" },
            { "key": "spread" }
        ],
        "currency": [
            { "key": "currency" },
            { "key": "currencyMode" },
            { "key": "ratio" },
            { "key": "isBase" },
            { "key": "isTradable" },
            { "key": "isConvertible" },
        ]
    }
}