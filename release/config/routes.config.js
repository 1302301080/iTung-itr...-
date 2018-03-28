/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2017 eBroker Systems Ltd.                 }
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

{ $Id: routes.config.js,v 1.7 2018/02/02 07:57:37 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

module.exports = {
    "index": { "elite": ["/", "/iTrader", "/iTrader/index"] },
    "account": { "elite": ["/iTrader/account"], "***": ["/api/v1/account", "/api/v2/account"] },
    "assets": { "elite": ["/iTrader/assets"] },
    "bond": { "elite": ["/iTrader/bond"] },
    "custom": { "elite": ["/iTrader/custom"] },
    "eipo": { "elite": ["/iTrader/eipo"] },
    "eStatement": { "elite": ["/iTrader/eStatement"] },
    "full_trade": { "elite": ["/iTrader/fullTrade"] },
    "fund": { "elite": ["/iTrader/fund"] },
    "initialize": { "elite": ["/iTrader/initialize"] },
    "message": { "elite": ["/iTrader/message"] },
    "order": { "***": ["/iTrader/order", "/api/v1/order", "/api/v2/order"] },
    "panel": { "elite": ["/iTrader/panel"] },
    "product": { "***": ["/iTrader/product"] },
    "risk": { "elite": ["/iTrader/risk"] },
    "security": { "***": ["/iTrader/security", "/api/v1/security", "/api/v2/security"] },
    "transaction": { "elite": ["/iTrader/transaction"] },
    "user": { "***": ["/iTrader/user", "/api/v1/user", "/api/v2/user"] },
    "setting": { "***": ["/setting", "/api/v1/setting", "/api/v2/setting"] },

    "api-product": { "***": ["/api/v1/product", "/api/v2/product"] },
    "api-market": { "***": ["/api/v1/market", "/api/v2/market"] },
    "api-generic": { "***": ["/api/generic"] },

    "eipo-index": { "eipo": ["/eipo", "/eipo/index"] },
    "eipo-data": { "eipo": ["/eipo/data"] },
    "eipo-message": { "eipo": ["/eipo/message"] },

    "wxa-index": { "wxa": ["/wxa", "/wxa/index"] },
    "wxa-security": { "wxa": ["/wxa/security"] },

    "admin-user": { "admin": ["/admin/user"] },
    "admin-product": { "admin": ["/admin/product"] },
    "admin-index": { "admin": ["/admin", "/admin/index"] },
    "admin-setting": { "admin": ["/admin/setting"] },
    "admin-html": { "admin": ["/admin/html"] },

    "collector": { "***": "/c" },
}