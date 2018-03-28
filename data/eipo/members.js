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

{ $Id: members.js,v 1.1 2016/12/20 11:04:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


'use strict'

// var db = require('common').DB.instance()
var DB = require('common').DB

var queryUser = "select [user_No] from Customer_File where account = '{0}'"
var queryMember = "select Member from User_File where User_No = '{0}'"
var queryAccount = "select * from Customer_Info where User_No in({0})"
// var queryAccountDetail = "select * from Customer_Info where User_No in({0})"

var accountSchema = [
    { name: 'account', key: '10', i18n: 'column-account' },
    { name: 'name', key: '21', i18n: 'column-account-name' },
    { name: 'email', key: 'email', i18n: 'column-email' },
    { name: 'user', key: '13', i18n: 'column-user' },
]


class Member {
    constructor(options) {
        this.schema = accountSchema
        this.memberList = new Map()
        this.accountList = new Map()
        this.accountDetailList = new Map()   // user id as key
    }

    getMembers(loginID, type, callback) {
        if (!loginID) {
            callback('invalid login id.')
        } else {
            var db = DB.instance()
            callback = callback || function () { }
            var keyID = type == 0 ? loginID + '_user' : loginID + '_acct'
            if (this.memberList.has(keyID)) {
                callback(null, this.memberList.get(keyID))
            } else {
                if (type == 0) {
                    db.query(queryMember.format(loginID), function (err, data) {
                        var members = [loginID]
                        if (data && data.length > 0) {
                            for (var m of data) {
                                if (m.Member) {
                                    for (var m of m.Member.split('\r\n')) {
                                        members.push(m.trim())
                                    }
                                }
                            }
                        }
                        this.memberList.set(keyID, members)
                        callback(err, members)
                    }.bind(this))
                } else {
                    db.query(queryUser.format(loginID), function (err, data) {
                        var members = []
                        if (data && data.length > 0) {
                            members.push(data[0].user_No.trim())
                            this.memberList.set(keyID, members)
                        }
                        callback(err, members)
                    }.bind(this))
                }
            }
        }
    }

    getAccounts(userID, callback) {
        if (!userID) {
            callback('invalid login id: ' + userID)
            return
        }
        var db = DB.instance()
        callback = callback || function () { }
        if (this.accountList.has(userID)) {
            callback(null, this.accountList.get(userID))
        } else {
            this.getMembers(userID, '0', function (err, data) {
                if (!err && data) {
                    db.query(queryAccount.format(this.getQuotedString(data)), function (err, data) {
                        var accounts = []
                        if (data && data.length > 0) {
                            for (var m of data) {
                                var a = {
                                    '10': (m.Account || '').trim(),
                                    '21': (m.Eng_Name || '').trim(),
                                    'email': (m.Email_Address || '').trim(),
                                    '13': (m.User_No || '').trim()
                                }
                                accounts.push(a)
                            }
                        }
                        this.accountList.set(userID, accounts)
                        callback(err, accounts)
                    }.bind(this))
                }
            }.bind(this))
        }
    }

    // getAccountDetail(userID, callback) {
    //     if (!userID) return
    //     if (this.accountDetailList.has(userID)) {
    //         callback(this.accountDetailList.get(userID))
    //     } else {
    //         this.getMembers(userID, '0', function (err, data) {
    //             if (!err && data) {
    //                 db.query(queryAccount.format(getQuotedString(this.members.get(userID))), function (err, data) {
    //                     var accounts = []
    //                     if (data && data.length > 0) {
    //                         for (var m of data) {
    //                             accounts.push(m.Account.trim())
    //                         }
    //                     }
    //                     this.accountList.set(userID, accounts)
    //                     callback(err, accounts)
    //                 }.bind(this))
    //             }
    //         })
    //     }
    // }

    getQuotedString(array) {
        var str = ""
        if (array && IsArray(array)) {
            for (var item of array) {
                str += "'" + item + "',"
            }
        }
        if (str) {
            str = str.substring(0, str.length - 1)
        }
        return str
    }
}

var instance = new Member()
module.exports = instance
