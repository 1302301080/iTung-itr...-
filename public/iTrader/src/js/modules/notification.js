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

{ $Id: notification.js,v 1.3 2017/08/03 04:15:44 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

define(function (require, exports, module) {
    ErrorOrderMgr.on(function (data) {
        if (!data || data.length <= 0) return
        for (var i = 0; i < data.length; i++) {
            var errorOrder = data[i]
            if (errorOrder && errorOrder[6]) {
                var order = OrderMgr.get(errorOrder[6])
                if (order) {
                    // handle omsTag#1116, based on FIX protocol, add/change/cancel order may follow with some pending messages, show submitted success for these orders.
                    // while error follow these order, show error notification message
                    // omsTag#1116 with 3,5,7,9
                    var reqStatus = order[1116]
                    if (['3', '5', '7', '9'].indexOf(reqStatus) >= 0) {
                        noticeError('[' + errorOrder[6] + ']', getErrorMessage(errorOrder))
                    }
                }
            }
        }
    })

    var stack_bottomright = { "dir1": "up", "dir2": "left" }
    function noticeError(title, text) {
        new PNotify({
            styling: 'bootstrap3',
            title: title || '',
            text: text || '',
            type: 'error',
            addclass: 'stack-bottomright',
            stack: stack_bottomright,
            delay: 1000 * 60 * 60 * 24,
            buttons: {
                closer: true,
                closer_hover: false,
                sticker: false
            }
        })
    }
})