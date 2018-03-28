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

{ $Id: socket_v2.js,v 1.4 2018/01/19 10:00:25 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var g_socket
define(function (require, exports, module) {
    var lastMessageTime
    var isPageLoaded = false
    var pendingMessages = []
    function init() {
        var connectionString = window.location.protocol + '//' + window.location.host
        g_socket = io.connect(connectionString, { secure: _.startsWith(connectionString, 'https') ? true : false })
        g_socket.on('auth', function (result) {
            if (result) {
                g_socket.emit('data', ['order', 'position', 'account', 'currency', 'spread'])
            }
        })
        g_socket.on('data', function (data) {
            if (!data || !data.name || !data.data) return
            processData(data)
        })
        g_socket.on('message', function (messageObj) {
            if (messageObj) {
                if (messageObj.action === 'logout') {
                    $('.index-row').remove()
                } else if (messageObj.action === 'announce') {
                    pendingMessages.push(messageObj.announcement)
                }
                if (messageObj.errorCode) {
                    if (messageObj.errorCode && messages.error['SSMITSERR_' + messageObj.errorCode]) {
                        messageObj.errorCode = 'SSMITSERR_' + messageObj.errorCode
                    }
                    handleError(messageObj, function () {
                        if (messageObj.action === 'logout') {
                            Logout()
                        }
                    })
                }
            }
        })
        g_socket.emit('auth')

        var t = setInterval(function () {
            lastMessageTime = lastMessageTime || (new Date()).getTime()
            if (!isPageLoaded && ((new Date()).getTime() - lastMessageTime > 1000)) {
                $(document).trigger('page', 'show')
                isPageLoaded = true
                clearInterval(t)
            }
        }, 500)
    }

    function processData(data) {
        lastMessageTime = (new Date()).getTime()
        if (!data || !data.name || !data.data) return
        for (var i = 0; i < data.data.length; i++) {
            var item = data.data[i]
            if (item) {
                item._raw = $.extend(true, {}, item)  // keep the raw data
            }
        }
        if (data.name === 'order') {
            OrderMgr.set(data.data)
        } else if (data.name === 'position') {
            PositionMgr.set(data.data)
        } else if (data.name === 'account') {
            AccountMgr.set(data.data)
        } else if (data.name === 'currency') {
            CurrencyMgr.set(data.data)
        } else if (data.name === 'spread') {
            SpreadMgr.set(data.data)
        } else if (data.name === 'errororder') {
            ErrorOrderMgr.set(data.data)
        }
    }


    $('[data-update]').click(function () {
        var name = $(this).attr('data-update')
        if (name) {
            g_socket.emit('update', name)
        }
    })

    $(document).on('page', function (event, data) {
        if (data === 'shown') {
            if (pendingMessages && pendingMessages.length > 0) {
                for (var i = 0; i < pendingMessages.length; i++) {
                    PopupAnnouncement(pendingMessages[i])
                }
            }
            pendingMessages = []
        }
    })

    exports.init = init
})