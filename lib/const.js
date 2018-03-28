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

{ $Id: const.js,v 1.14 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var schema = require('common').Schema

var Const = {
    dummyLoginID: '#dummy-username#',
    dummyLoginPassword: '#dummy-password#',
    oms: {
        side_buy: '0',
        side_sell: '1'
    },
    DataAction: {
        order: 'ORDER',
        subOrder: 'SUBORDER',
        trade: 'TRADE',
        position: 'POSITION',
        calcOrder: 'CALCORDER',
        errorOrder: 'ERRORDER',
        balance: 'BALANCE',
        user: 'USER',
        product: 'PRODUCT',
        spread: 'SPREAD',
        account: 'ACCOUNT',
        currency: 'CURRENCY',
        margin: 'MARGIN',
        exchange: 'EXCHANGE',
        historyOrder: 'HISTORYORDER',
    },
    entitlement: {
        skipDisclaimer: 'SkipDisclaimer',
        skipTradingPassword: 'SkipTradingPassword',
    },
    customQuery: {
        getMoreAcctInfo: 'GetMoreAcctInfo',
        getLastLoginInfo: 'GetLastLoginInfo',
        loadCurrencyInfo: 'LoadCurrencyInfo',
        setDisclaimerENT: 'SetDisclaimerENT',
        loadHistoryOrders: 'LoadHistoryOrders',
        getCBBCAgreement: 'GetCBBCAgreementFlags',
        saveCBBCAgreement: 'SaveCBBCAgreementFlag',
        getMarginBySymbolAcct: 'GetMarginBySymbolAcct',
        queryMargPara: 'QueryMargPara',
        loadCurrencyBal: 'LoadCurrencyBal',
        loadCustomAccountInfo: 'LoadCustomAccountInfo',
        loadCustomTableDefine: 'LoadCustomTableDefine',
        loadInternalMessage: 'LoadInternalMessage',
        queryErrorOrder: 'QueryErrorOrder',
        queryHistoryErrorOrder: 'QueryHistoryErrorOrder',
        getAcctCurrencyBalance: 'GetAcctCurrencyBalance',
        queryAccountByOpenID: 'QueryAccountByOpenID',
        loadAccountBCAN: 'LoadAccountBCAN',
        loadUserInfo: 'LoadUserInfo',
        loadUserAccountID: 'LoadUserAccountID',
    },
    error: {
        ssm: {
            password_expire: 12
        },
        internal: { errorCode: 'I_10000' },
        parameter: { errorCode: 'I_10001' },
        requestTimeout: { errorCode: 'I_10002' },
        disconnectServer: { errorCode: 'I_10003' },
        unknowError: { errorCode: 'I_10004' },
        tokenCodeError: { errorCode: 'I_10005' },
        symbolNotExist: { errorCode: 'I_10006' },
        orderNotExist: { errorCode: 'I_10007' },
        spreadNotExist: { errorCode: 'I_10008' },
        tradingPwd: { errorCode: '123' }, // ITS error code for wrong trading password
        wx: {
            bindAccount: { errorCode: 'wx_10000' },
            loginFailed: { errorCode: 'wx_10001' },
            requestTokenCode: { errorCode: 'wx_10002' },
        }
    },
    tags: {},
    messages: {},
    languages: {
        zh_cn: 'zh-CN',
        zh_hk: 'zh-HK',
        en_us: 'en-US'
    }
}

for (var o in schema.OrderSchema.schema) {
    var item = schema.OrderSchema.schema[o]
    if (typeof (item.tag) === 'number') {
        Const.tags[o] = item.tag.toString()
    }
}

module.exports = Const