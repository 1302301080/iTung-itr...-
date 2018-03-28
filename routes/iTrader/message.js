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

{ $Id: message.js,v 1.12 2017/11/29 10:42:28 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    request = require(__node_modules + 'request'),
    multer = require(__node_modules + 'multer'),
    control = require('../../control'),
    moment = require('moment'),
    logger = require('common').Logger.instance().getLogger(),
    schema = require('common').Schema,
    Const = require('../../lib/const'),
    router = express.Router(),
    uuid = require(__node_modules + 'node-uuid'),
    path = require('path'),
    fs = require('fs'),
    glob = require(__node_modules + 'glob')

var util = require('../../lib/utility')


var settlement = config.iTrader.views.settlement
var bankNameFilePath = settlement.bankNameFileURL || ''
var currency_array = settlement.cashCurrency || ''
var dataFileServerPath = settlement.dataFileServer || ''
var accountInfoList = {}
var settlementDetailList = []
var tempPath = 'uploads/'

if (dataFileServerPath) {
    if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath)
    }
    mkdirsSync(dataFileServerPath, '0777')
}

function mkdirsSync(dirpath, mode) {
    if (!fs.existsSync(dirpath)) {
        var pathtmp;
        dirpath.split(path.sep).forEach(function (dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            }
            else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true;
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempPath)
    },
    filename: function (req, file, cb) {
        cb(null, uuid.v1())
    }
})
var upload = multer({ storage: storage })
var uploadFile = upload.fields([{ name: 'Cheque', maxCount: 1 }, { name: 'BankSlip', maxCount: 1 }])

router.get('/settlement', control.isAuthenticated, function (req, res) {
    res.render(__views_path + 'iTrader/message/settlement', {
        layout: __views_path + 'layout',
        settlement: settlement,
        accounts: req.user.accounts,
        currency_list: currency_array,
        csrfToken: req.csrfToken(),
    })
})

router.post('/settlement', control.isAuthenticated, uploadFile, function (req, res) {
    var account = req.body.account
    try {
        if (dataFileServerPath && req.files) {
            var files = req.files
            for (var i in files) {
                if (files[i].length <= 0) continue
                var file = files[i][0]
                if (file.mimetype.indexOf('image/') < 0) {
                    return res.send({ error: Const.error.parameter })
                }
            }
        }
        var obj = schema.OrderSchema.makeFromObject({
            header: ['ITS', 'sendmessage'],
            messageSender: req.user.id,
            password: req.user.password,
        })
        if (preProcessSettlementParameters(req, obj)) {
            req.user.its.event.on('sendmessage', function (err, result) {
                req.user.its.event.removeAllListeners('sendmessage')
                if (dataFileServerPath) {
                    var files = req.files
                    for (var i in files) {
                        var file = files[i][0]
                        var fileName = file.filename
                        var fileType = file.mimetype.substring(6, 9)
                        var holePath = path.join('uploads', fileName)
                        var newFile = path.join(dataFileServerPath, account + '_' + file.fieldname + '_' + result.messageRefId + '.' + fileType)
                        fs.writeFileSync(newFile, fs.readFileSync(holePath))
                    }
                }
                res.send({ error: err, data: result })
            })
            req.user.its.send(obj.castImage())
        }
    } catch (err) {
        logger.error(err)
        res.send({ error: Const.error.internal })
    }
})

router.get('/settlement/detail', control.isAuthenticated, function (req, res) {
    var msgID = req.query.msgID
    var detailList = settlementDetailList[msgID]['detail']
    var subject = settlementDetailList[msgID][163]
    var textString = 'Message ID:' + msgID + '\r\n' + subject + '\r\n' + '******************************************************' + '\r\n'
    for (var key in detailList) {
        if (key == 'BankSlip' || key == 'Cheque') continue
        textString = textString + key + ':' + detailList[key] + '\r\n'
    }

    res.render(__views_path + 'iTrader/settlement_instruction/detail', {
        layout: __views_path + 'layout',
        detailList: detailList,
        subject: subject,
        textString: textString,
    })
})

router.get('/settlement/image', control.isAuthenticated, function (req, res, next) {
    var name = req.query.name
    var acct = req.query.account || req.user.id
    if (name.indexOf(acct) > -1) {
        var holePath = path.join(dataFileServerPath, name + '.*')
        glob(holePath, function (er, files) {
            if (files.length > 0) {
                res.sendFile(path.join(files[0], ''))
            } else {
                return next()
            }
        })
    } else {
        return next()
    }
})

router.get('/settlemetTable', control.isAuthenticated, function (req, res) {
    var account = req.query.account
    var period = req.query.period
    var user = req.user.id
    var obj = []
    req.user.its.querySettlementHistory({ account: account, user: user }, function (data) {
        for (var i = 0; i < data.length; i++) {
            var date = moment().subtract(period, 'days').format('YYYY-MM-DD')
            data[i][501] = moment(data[i][501]).format('YYYY-MM-DD')
            var createTime = data[i][501]
            var msgID = data[i][160]
            if (createTime >= date) {
                obj.push(data[i])
                settlementDetailList[msgID] = data[i]
            }
        }
        res.send(obj)
    })
})

router.get('/detail', control.isAuthenticated, function (req, res) {
    var accountInfo = req.user.accountsInfo
    for (var a in accountInfo) {
        var customInfo = accountInfo[a]['customInfo']
        if (customInfo) {
            var BankAcctID = customInfo['BankAcctID'] || ''
            var BankAcctName = customInfo['BankAcctName'] || ''
            var acctID = BankAcctID.split('&#166;&#166;')
            var acctName = BankAcctName.split('&#166;&#166;')
            var obj = {}
            for (var i = 0; i < acctID.length; i++) {
                var array = []
                array.push(acctName[i], acctID[i])
                obj[acctName[i]] = array
            }
            accountInfoList[a] = obj
        }
    }
    getFiles(function (err, bankDetailList) {
        if (err) {
            logger.error('get bank files failed. error: ' + err)
            return res.send({ accountInfoList: accountInfoList, bankDetailList: [], imageFile: dataFileServerPath })
        }
        if (bankDetailList) {
            res.send({ accountInfoList: accountInfoList, bankDetailList: bankDetailList, imageFile: dataFileServerPath })
        }
    })
})

function preProcessSettlementParameters(req, obj) {
    var isValid = true
    var instruction = req.body.instruction
    var method = req.body.method
    var transfer_method = req.body.transfer_method
    var datetime = req.body.datetime
    var symbol = req.body.symbol
    var productCode = req.body.productCode
    var productName = req.body.productName
    var amount = req.body.amount
    var currency = req.body.currency
    var bank_name = req.body.bank_name
    var bank_address = req.body.bank_address
    var bank_account_name = req.body.bank_account_name
    var bank_account_no = req.body.bank_account_no
    var party_name = req.body.party_name
    var party_contact_name = req.body.party_contact_name
    var party_contact_no = req.body.party_contact_no
    var party_AC_no = req.body.party_AC_no
    var scrip = req.body.scrip
    var quantity = req.body.quantity
    var remark = ''
    var files = req.files
    if (files) {
        var bankSlip = files['BankSlip'] ? 1 : 0
        var cheque = files['Cheque'] ? 1 : 0
    }
    if (req.body.remark) {
        var remarkByte = new Buffer(req.body.remark)
        for (var i = 0; i < remarkByte.length; i++) {
            remark = remark + '#' + remarkByte[i]
        }
    }
    switch (instruction) {
        case 'CD':
            obj.messageSubject = 'Settlement (CASH DEPOSIT)'
            switch (method) {
                case 'CH':
                case 'CHE':
                    obj.row1 = 'Means of Deposit: Cash'
                    break
                case 'CQ':
                case 'CQE':
                    obj.row1 = 'Means of Deposit: Cheque'
                    break
                case 'TF':
                    obj.row1 = 'Means of Deposit: Transfer - ' + transfer_method
                    break
                case 'TFE':
                    obj.row1 = 'Means of Deposit: Transfer'
                    break
                default:
                    isValid = false
                    break
            }
            if (method == 'CH' || method == 'CQ' || method == 'TF') {
                obj.row2 = 'Date(dd/MM/yyyy): ' + datetime
                obj.row3 = 'Amount: ' + amount
                obj.row4 = 'Currency: ' + currency
                obj.row5 = 'Reference no.: ' + bank_account_no
                obj.row6 = 'Deposit Bank: ' + bank_name
            } else {
                obj.row2 = 'Date(dd/MM/yyyy): ' + datetime
                obj.row3 = 'Amount: ' + amount
                obj.row4 = 'Currency: ' + currency
                obj.row5 = 'Deposit Bank: ' + bank_name
                obj.row6 = 'Remark:' + remark
                obj.row7 = 'BankSlip:' + bankSlip
                obj.row8 = 'Cheque:' + cheque
            }
            break;
        case 'CW':
            obj.messageSubject = 'Settlement (CASH WITHDRAWAL)'
            switch (method) {
                case 'PB':
                    obj.row1 = 'Means of Withdrawal:Cheque deposit to pre-register bank account'
                    obj.row2 = 'Bank Name: ' + bank_name
                    obj.row3 = 'A/C Number: ' + bank_account_no
                    obj.row4 = 'Amount: ' + amount
                    obj.row5 = 'Currency: ' + currency
                    obj.row6 = 'Remark:' + remark
                    break;
                case 'PS':
                    obj.row1 = 'Means of Withdrawal:Cheque collect in person'
                    obj.row2 = 'Bank Name: ' + bank_name
                    obj.row3 = 'A/C Number: ' + bank_account_no
                    obj.row4 = 'Amount: ' + amount
                    obj.row5 = 'Currency: ' + currency
                    obj.row6 = 'Remark:' + remark
                    break;
                case 'CH':
                    obj.row1 = 'Means of Withdrawal:CHATS (service charge required)'
                    obj.row2 = 'Bank Name: ' + bank_name
                    obj.row3 = 'A/C Number: ' + bank_account_no
                    obj.row4 = 'Amount: ' + amount
                    obj.row5 = 'Currency: ' + currency
                    obj.row6 = 'Remark:' + remark
                    break;
                case 'TT':
                    obj.row1 = 'Means of Withdrawal:Telegraphic Transfer (service charge required)'
                    obj.row2 = 'Amount: ' + amount
                    obj.row3 = 'Currency: ' + currency
                    obj.row4 = 'Bank Name: ' + bank_name
                    obj.row5 = 'Bank Address: ' + bank_address
                    obj.row6 = 'A/C Holder Name: ' + bank_account_name
                    obj.row7 = 'A/C Number: ' + bank_account_no
                    obj.row8 = 'Remark: ' + remark
                    break;
                case 'OB':
                    obj.row1 = 'Means of Withdrawal:Cheque deposit to other bank account'
                    obj.row2 = 'Amount: ' + amount
                    obj.row3 = 'Currency: ' + currency
                    obj.row4 = 'Bank Name: ' + bank_name
                    obj.row5 = 'A/C Holder Name: ' + bank_account_name
                    obj.row6 = 'A/C Number: ' + bank_account_no
                    obj.row7 = 'Remark:' + remark
                    break;
                default:
                    isValid = false
                    break;
            }
            break;
        case 'SD':
            obj.messageSubject = 'Settlement (STOCK DEPOSIT)'
            switch (method) {
                case 'PDE':
                    obj.row1 = 'Physical Delivery'
                    obj.row2 = 'ProductCode: ' + productCode
                    obj.row3 = 'Amount: ' + amount
                    obj.row4 = 'Date(dd/MM/yyyy): ' + datetime
                    obj.row5 = 'Counterparty Name:' + party_name
                    obj.row6 = 'Counterparty Contact Person:' + party_contact_name
                    obj.row7 = 'Counterparty Contact Number:' + party_contact_no
                    obj.row8 = 'Counterparty A/C Number:' + party_AC_no
                    obj.row9 = 'Remark:' + remark
                    obj.row10 = 'Payment Instruction: ' + req.body.payment_type
                    obj.row11 = 'Payment Value: ' + (req.body.payment_input || '')
                    break;
                case 'PD':
                    obj.row1 = 'Physical Delivery'
                    obj.row2 = 'Symbol: ' + symbol
                    obj.row3 = 'Amount: ' + amount
                    break;
                case 'TC':
                    obj.row1 = 'Delivery through CCASS (Deposit)'
                    obj.row2 = 'Symbol: ' + symbol
                    obj.row3 = 'Amount: ' + amount
                    obj.row4 = 'HKSCC ID of Counter Party: ' + req.body.hkscc_no
                    obj.row5 = 'Name of Counter Party: ' + req.body.party_name
                    obj.row6 = 'Contact Person of Counter: ' + req.body.party_contact_name
                    obj.row7 = 'Contact Number of Counter: ' + req.body.party_contact_no
                    obj.row8 = 'Client Code: ' + req.body.client_no
                    obj.row9 = 'Client Name: ' + req.body.client_name
                    obj.row10 = 'Client Contact Number: ' + req.body.client_contact_no
                    obj.row11 = 'Payment Instruction: ' + req.body.payment_type
                    break
                default:
                    isValid = false
                    break;
            }
            break
        case 'SW':
            obj.messageSubject = 'Settlement (STOCK WITHDRAWAL)'
            switch (method) {
                case 'PW':
                    obj.row1 = 'Physical Delivery'
                    obj.row2 = 'Symbol: ' + symbol
                    obj.row3 = 'Amount: ' + amount
                    break;
                case 'TC':
                    obj.row1 = 'Delivery through CCASS (Withdraw)'
                    obj.row2 = 'Symbol: ' + symbol
                    obj.row3 = 'Amount: ' + amount
                    obj.row4 = 'HKSCC ID of Counter Party: ' + req.body.hkscc_no
                    obj.row5 = 'Name of Counter Party: ' + req.body.party_name
                    obj.row6 = 'Contact Person of Counter: ' + req.body.party_contact_name
                    obj.row7 = 'Contact Number of Counter: ' + req.body.party_contact_no
                    obj.row8 = 'Client Code: ' + req.body.client_no
                    obj.row9 = 'Client Name: ' + req.body.client_name
                    obj.row10 = 'Client Contact Number: ' + req.body.client_contact_no
                    obj.row11 = 'Payment Instruction: ' + req.body.payment_type
                    obj.row12 = 'Payment Value: ' + (req.body.payment_input || '')
                    break
                case 'SI':
                    obj.row1 = 'Settlement Instruction'
                    obj.row2 = 'ProductCode: ' + productCode
                    obj.row3 = 'Amount: ' + amount
                    obj.row4 = 'Date(dd/MM/yyyy): ' + datetime
                    obj.row5 = 'Counterparty Name:' + party_name
                    obj.row6 = 'Counterparty Contact Person:' + party_contact_name
                    obj.row7 = 'Counterparty Contact Number:' + party_contact_no
                    obj.row8 = 'Counterparty A/C Number:' + party_AC_no
                    obj.row9 = 'Remark:' + remark
                    obj.row10 = 'Payment Instruction: ' + req.body.payment_type
                    obj.row11 = 'Payment Value: ' + (req.body.payment_input || '')
                    break;
                case 'PWE':
                    obj.row1 = 'Physical Delivery'
                    obj.row2 = 'ProductCode: ' + productCode
                    obj.row3 = 'Amount: ' + amount
                    obj.row4 = 'Number of scrip:' + scrip
                    obj.row5 = 'Quantity:' + req.body.x_quantity
                    obj.row6 = 'Remark:' + remark
                    break
                default:
                    isValid = false
                    break;
            }
            break
        default:
            isValid = false
            break;
    }
    obj.settlementType = instruction
    return isValid
}

router.post('/agreement', control.isAuthenticated, function (req, res) {
    var name = req.body.name
    var value = req.body.value
    if (name && value == 1) {
        req.user.its.customQuery({
            systemRef: name, account: req.user.id, side: value, freeText: 'Field01'
        }, function (err, data) {
            if (IsArray(err) && err.length > 0) {
                err = err[0]
            }
            err = util.GetOmsTagObj(err)
            if (!err || err.length <= 0) err = null
            return res.send({ error: null, data: util.GetOmsTagObj(data) })
        }
        )
    }
})

function getFiles(callback) {
    var bankDetailList = {}
    if (!bankNameFilePath) {
        return callback('invalid bank file path', bankDetailList)
    }
    var handler = function (err, data) {
        if (err) {
            logger.error(err)
            return callback(err)
        } else {
            data = data || ''
            var line = data.split('\r\n')
            for (var i = 0; i < line.length; i++) {
                var bankData = line[i].split(',')
                if (bankData.length > 0) {
                    bankDetailList[bankData[0]] = bankData
                }
            }
            return callback(null, bankDetailList)
        }
    }
    if (bankNameFilePath.indexOf('http') === 0) {
        request.get(bankNameFilePath, function (err, res, data) {
            handler(err, data)
        })
    } else {
        fs.readFile(bankNameFilePath, 'utf-8', function (err, data) {
            handler(err, data)
        })
    }
}

module.exports = router