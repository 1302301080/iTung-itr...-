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

{ $Id: dialog.js,v 1.11 2016/11/22 10:25:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

function showMessage(options) {
    if (typeof (options) !== 'object') return
    BootstrapDialog.show({
        title: options.title,
        message: options.message || (options.load ? messages.Loading.text : ''),
        closable: typeof (options.closable) === 'undefined' ? true : options.closable,
        closeByBackdrop: typeof (options.closeByBackdrop) === 'undefined' ? true : options.closeByBackdrop,
        closeByKeyboard: typeof (options.closeByKeyboard) === 'undefined' ? true : options.closeByKeyboard,
        type: options.type || BootstrapDialog.TYPE_INFO,
        buttons: getDialogButton(options.buttonNameList, options.callback),
        onshow: options.onshow,
        onshown: onshown,
        onhide: options.onhide,
        onhidden: options.onhidden
    })

    function onshown(dialog) {
        if (options.load) {
            dialog.getModalBody().load(options.load.url, options.load.data, function () {
                if (typeof options.load.callback === 'function') {
                    options.load.callback(dialog)
                }
            })
        }
        if (options.onshown) {
            options.onshown(dialog)
        }
        var inputs = dialog.$modal.find('input[type=text], input[type=password]')
        if (inputs.length > 0) {
            $(inputs[0]).focus().select()
        }
        if (options.callback) {
            dialog.$modal.keypress(function (event) {
                if (event.keyCode == 13) {
                    event.cancelBubble = true
                    event.returnValue = false
                    var focusElements = $(":focus")
                    if (focusElements && focusElements.length > 0 && focusElements[0].tagName == 'DIV') {
                        dialog.$modal.off('keypress')  // trigger submit one time when focus on the dialog
                        options.callback({ name: 'submit' }, dialog)
                    } else {
                        options.callback({ name: 'submit' }, dialog)
                    }
                    return false
                }
            })
        }
    }
}

function alertMessage(options) {
    BootstrapDialog.show({
        title: options.title || messages.dialog_information_title.text,
        message: options.message,
        type: options.type || BootstrapDialog.TYPE_INFO,
        buttons: [{
            label: messages.btn_close.text,
            cssClass: 'btn-info btn-sm',
            action: function (dialog) {
                if (options && options.onclose) {
                    options.onclose(dialog)
                } else {
                    dialog.close()
                }
            }
        }],
        onshow: options.onshow,
        onshow: function (dialog) {
            dialog.getModalBody().css('max-height', '450px')
            if (options.onshown) {
                options.onshown(dialog)
            }
        },
        onhide: options.onhide,
        onhidden: options.onhidden
    })
}

function alertError(options) {
    options = options || {}
    BootstrapDialog.show({
        title: options.title || messages.dialog_error_title.text,
        message: options.message,
        type: options.type || BootstrapDialog.TYPE_DANGER,
        buttons: options.buttons || [{
            label: messages.btn_close.text,
            cssClass: 'btn-danger btn-sm',
            action: function (dialog) {
                dialog.close()
            }
        }],
        onhide: options.onhide,
        onhidden: options.onhidden
    })
}

function getDialogButton(array, callback) {
    if (!array) return
    var buttons = []
    for (var i = 0; i < array.length; i++) {
        var button = {}
        switch (array[i]) {
            case 'submit':
                button.id = 'btn-submit'
                button.label = messages.btn_submit.text
                button.cssClass = 'btn-info btn-sm'
                button.action = function (dialog) {
                    this.name = 'submit'
                    callback(this, dialog)
                }
                break
            case 'cancel':
                button.id = 'btn-cancel'
                button.label = messages.btn_cancel.text
                button.cssClass = 'btn-default btn-sm'
                button.action = function (dialog) {
                    this.name = 'cancel'
                    callback(this, dialog)
                }
                break
            case 'close':
                button.id = 'btn-close'
                button.label = messages.btn_close.text
                button.cssClass = 'btn-default btn-sm'
                button.action = function (dialog) {
                    this.name = 'close'
                    callback(this, dialog)
                }
                break
            case 'sure':
                button.id = 'btn-sure'
                button.label = messages.btn_sure.text
                button.cssClass = 'btn-info btn-sm'
                button.action = function (dialog) {
                    this.name = 'sure'
                    callback(this, dialog)
                }
                break
            case 'reset':
                button.id = 'btn-reset'
                button.label = messages.btn_reset.text
                button.cssClass = 'btn-default btn-sm'
                button.action = function (dialog) {
                    this.name = 'reset'
                    callback(this, dialog)
                }
                break
            case 'agree':
                button.id = 'btn-agree'
                button.label = messages.btn_agree.text
                button.cssClass = 'btn-info btn-sm'
                button.action = function (dialog) {
                    this.name = 'agree'
                    callback(this, dialog)
                }
                break
            case 'reject':
                button.id = 'btn-reject'
                button.label = messages.btn_reject.text
                button.cssClass = 'btn-danger btn-sm'
                button.action = function (dialog) {
                    this.name = 'reject'
                    callback(this, dialog)
                }
                break
            default:
                break
        }
        if (button.id) {
            buttons.push(button)
        }
    }
    return buttons
}