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

{ $Id: rules.js,v 1.4 2017/11/06 09:34:03 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

if (jQuery && jQuery.validator) {
    jQuery.validator.addMethod('notEqualTo', function (value, element, param) {
        return value != $(param).val()
    }, $.validator.format('cannot be the same'))
}

var rules = {
    name: "required",
    username: {
        required: true
    },
    password: {
        required: true
    },
    pin: {
        required: true,
        maxlength: 1
    },
    new_password: {
        required: true,
        remote: {
            url: '/iTrader/security/password/validate',
            type: 'post',
            data: {
                _csrf: function () {
                    return $('[name=new_password]').closest('form').find('[name=_csrf]').val()
                },
                sessionID: function () {
                    return $('[name=new_password]').closest('form').find('[name=sessionID]').val()
                },
                mode: 1
            }
        }
    },
    confirm_password: {
        required: true,
        equalTo: '[name=new_password]'
    },
    email: {
        required: true,
        email: true
    },
    amount: {
        required: true,
        number: true
    },
    account_in: {
        required: true,
        notEqualTo: '#cash-transfer-account-out'
    },
    account_out: {
        required: true,
        notEqualTo: '#cash-transfer-account-in'
    }
}

var exchangeRules = {
    default: function (value, options) {
        return this.handleOptions(value, options)
    },
    zerofill: function (value, options) {
        if (value && options && typeof (options.size) === 'number') {
            if (!isNaN(value)) {
                value = value.toString()
                while (value.length < options.size) {
                    value = '0' + value
                }
            }
        }
        return this.handleOptions(value, options)
    },

    suffix: function (value, options) {
        if (value && options) {
            if (options.suffix && !value.toUpperCase().endWith(options.suffix.toUpperCase())) {
                value += options.suffix
            }
        }
        return this.handleOptions(value, options)
    },

    handleOptions: function (value, options) {
        if (options.case === 'upper') {
            value = value.toUpperCase()
        } else if (options.case === 'lower') {
            value = value.toLowerCase()
        }
        return value
    }
}