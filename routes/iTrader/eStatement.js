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

{ $Id: eStatement.js,v 1.9 2017/05/22 09:28:54 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    express = require(__node_modules + 'express'),
    passport = require(__node_modules + 'passport'),
    control = require('../../control'),
    moment = require('moment'),
    router = express.Router(),
    path = require('path'),
    fs = require('fs'),
    dir = require('node-dir'),
    logger = require('common').Logger.instance().getLogger(),
    uuid = require(__node_modules + 'node-uuid')

var fileDirectory = config.iTrader.views.eStatement.fileDirectory
var fileMapping = {}

router.get('/', control.isAuthenticated, function (req, res, next) {
    res.render(__views_path + 'iTrader/eStatement/index', {
        layout: __views_path + 'iTrader/eStatement/layout',
        userOptions: req.session.userOptions,
        eStatementPeriodsList: config.iTrader.views.eStatement.periods
    })
})

router.post('/', control.initPassport, function (req, res, next) {
    passport.authenticate('local', { failureFlash: false }, function (err, username) {
        if (!err && username) {
            req.logIn(username, function (err) {
                if (!err) {
                    res.render(__views_path + 'iTrader/eStatement/index', {
                        layout: __views_path + 'iTrader/eStatement/layout',
                        userOptions: req.session.userOptions,
                        eStatementPeriodsList: config.iTrader.views.eStatement.periods
                    })
                } else {
                    res.send('authenticate failed.')
                }
            })
        } else {
            res.send('authenticate failed.')
        }
    })(req, res, next)
})

router.get('/statement', function (req, res, next) {
    var fileId = req.query.id
    if (fileId) {
        for (var file in fileMapping) {
            var fileObj = fileMapping[file]
            if (fileObj && fileObj.id === fileId) {
                return res.sendFile(file)
            }
        }
    }
    return next()
})

router.get('/files', control.isAuthenticated, function (req, res, next) {
    var acct = req.query.account || req.user.id
    var period = req.query.period
    var selectType = req.query.selectType
    if (acct && period && selectType) {
        try {
            getFiles({ account: acct, period: period, type: selectType }, function (err, files) {
                if (!err && files) {
                    res.send(files)
                } else {
                    res.send()
                }
            })
        } catch (error) {
            logger.error(error)
        }
    }
})

function isMatchedFile(options) {
    if (!options) return
    var eStatementSection = config.iTrader.views.eStatement
    var birthDate
    var acct
    var fileNameFormat
    var nameLength
    if (options.type == '0') {
        fileNameFormat = eStatementSection.fileNameDailyFormat
    } else {
        fileNameFormat = eStatementSection.fileNameMonthlyFormat
    }
    var indexDate = fileNameFormat.indexOf('date')
    var indexAcc = fileNameFormat.indexOf('account')
    fileNameFormat = fileNameFormat.replace(/{date}/, '.*?')
    fileNameFormat = fileNameFormat.replace(/{account}/, '.*')
    var fileNameReg = new RegExp(fileNameFormat)
    var fileNameMatch = options.file.match(fileNameReg)
    if (fileNameMatch) {
        if (fileNameMatch.length > 0) {
            var date = moment().subtract(options.period, options.type == '0' ? 'days' : 'months')
            date = moment(options.type == '0' ? date.format(eStatementSection.dateFormat) : date.format(eStatementSection.dateFormat.toUpperCase().replace(/DD/, '01')), eStatementSection.dateFormat)
            if (indexDate < indexAcc) {
                nameLength = fileNameMatch[1].length
                birthDate = moment(fileNameMatch[1], eStatementSection.dateFormat)
                acct = fileNameMatch[2]
            } else {
                nameLength = fileNameMatch[2].length
                birthDate = moment(fileNameMatch[2], eStatementSection.dateFormat)
                acct = fileNameMatch[1]
            }
            if (acct == options.account) {
                options.fileDate = moment(birthDate).format(nameLength < 8 ? config.iTrader.format.shortDate : config.iTrader.format.date)
                if (options.period != '0') {
                    if (options.type == 1 && birthDate >= date) return true
                    if (options.type == 0 && birthDate > date) return true
                } else return true
            }
        }
    } else return false
}

function getFiles(options, callback) {
    if (!options) return
    if (fs.existsSync(fileDirectory)) {
        dir.files(fileDirectory, function (err, files) {
            if (err) {
                logger.error(err)
                callback(err)
                return
            } else {
                var arr = []
                try {
                    for (var file of files) {
                        if (file.length > 0) {
                            options.file = path.basename(file)
                            options.fullPath = file
                            if (isMatchedFile(options)) {
                                var id = ''
                                if (fileMapping[file]) {
                                    id = fileMapping[file].id
                                } else {
                                    id = uuid.v1()
                                    fileMapping[file] = { id: id, filePath: file, account: options.account }
                                }
                                logger.info('estatemment key mapping: id: ' + id + '  file: ' + file + '  account: ' + options.account)
                                arr.push({
                                    account: options.account,
                                    filename: options.file, link: '/itrader/estatement/Statement?id=' + id,
                                    date: options.fileDate
                                })
                            }
                        }
                    }
                    callback(null, arr)
                } catch (error) {
                    logger.error(error)
                    callback(error)
                }
            }
        })
    } else {
        var err = 'eStatement folder not found: ' + fileDirectory
        logger.error(err)
        callback(err)
    }
}

module.exports = router
