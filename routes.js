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

{ $Id: routes.js,v 1.17 2018/01/19 10:00:19 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var logger = require('common').Logger.instance().getLogger()

var routelist = {
    user: require('./routes/iTrader/user'),
    index: require('./routes/iTrader/index'),
    assets: require('./routes/iTrader/assets'),
    initialize: require('./routes/iTrader/initialize'),
    order: require('./routes/iTrader/order'),
    product: require('./routes/iTrader/product'),
    account: require('./routes/iTrader/account'),
    security: require('./routes/iTrader/security'),
    risk: require('./routes/iTrader/risk'),
    message: require('./routes/iTrader/message'),
    custom: require('./routes/iTrader/custom'),
    eipo: require('./routes/iTrader/eipo'),
    transaction: require('./routes/iTrader/transaction'),
    full_trade: require('./routes/iTrader/fullTrade'),
    fund: require('./routes/iTrader/fund'),
    bond: require('./routes/iTrader/bond'),
    panel: require('./routes/iTrader/panel'),
    eStatement: require('./routes/iTrader/eStatement'),
    setting: require('./routes/setting'),
    "eipo-index": require('./routes/eipo/index'),
    "eipo-message": require('./routes/eipo/message'),
    "eipo-data": require('./routes/eipo/data'),
    "wxa-index": require('./wxa/routes/index'),
    "wxa-security": require('./wxa/routes/security'),
    "api-product": require('./routes/api/product'),
    "api-market": require('./routes/api/market'),
    "api-generic": require('./routes/api/generic'),
    "admin-user": require('./admin/routes/user'),
    "admin-index": require('./admin/routes/index'),
    "admin-product": require('./admin/routes/product'),
    "admin-setting": require('./admin/routes/setting'),
    "admin-html": require('./admin/routes/html'),
    collector: require('./routes/collector'),
}

exports.route = function (app, isAdmin) {
    for (var p in configuration.__routes) {
        var item = configuration.__routes[p]
        for (var pp in item) {
            var subitem = item[pp]
            if (EntryList.indexOf(pp) >= 0 || pp === '***') {
                for (var r of subitem) {
                    if (routelist[p]) {
                        if (p.indexOf('admin-') === 0 && !isAdmin) {
                            continue
                        } else if (p.indexOf('admin-') !== 0 && isAdmin) {
                            continue
                        }
                        logger.info('open route ' + r)
                        app.use(r, routelist[p])
                    }
                }
            }
        }
    }
}