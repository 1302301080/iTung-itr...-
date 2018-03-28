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

{ $Id: .eslintrc.js,v 1.8 2018/01/19 10:00:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": true,
        "jquery": true,
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-console": 0,
        "no-redeclare": 0,
        "indent": ["error", 4, { 'SwitchCase': 1 }],
        "semi": [2, "never"],
        "comma-dangle": "off"
    },
    "globals": {
        global: true,
        tags: true,
        messages: true,
        current: true,
        moment: true,
        _: true,
        BootstrapDialog: true,
        layer: true,
        shortcut: true,
        __node_modules: true,
        __root_path: true,
        __views_path: true,
        __config_path: true,
        IsArray: true,
        ToNumber: true,
        initial_data: true,
        EntryList: true,
        configuration: true,
        showMessage: true,
        handleError: true,
        alertMessage: true,
        seajs: true,
        io: true,
        define: true,
        OrderMgr: true,
        PositionMgr: true,
        AccountMgr: true,
        ExchangeMgr: true,
        CurrencyMgr: true,
        SpreadMgr: true,
        ProductMgr: true,
        getDisplayPrice: true,
        GetMaxSellSync: true,
        getErrorMessage: true,
        IsMarginAccount: true,
        ReplaceComma: true,
        __logger: true,
        maskEmailPhone: true,
        describe: true,
        it: true
    }
};
