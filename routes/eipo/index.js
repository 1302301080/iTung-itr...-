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

{ $Id: index.js,v 1.3 2017/04/26 08:52:15 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


var config = require(__config_path),
    express = require(__node_modules + 'express'),
    passport = require(__node_modules + 'passport'),
    control = require('../../control'),
    Const = require('../../lib/const'),
    memberData = require('../../data/eipo/members'),
    ipoData = require('../../data/eipo/ipos'),
    appData = require('../../data/eipo/applications'),
    aServer = require('../../connection/as'),
    router = express.Router()

router.get('/', control.isAuthenticated, function (req, res) {
    var user = req.user
    res.render(__views_path + 'eipo/index', {
        layout: __views_path + 'eipo/layout.ejs',
        user: req.user,
        userOptions: req.session.userOptions
    })
})

router.post('/', control.initPassport, function (req, res) {
    passport.authenticate('local', { failureFlash: false }, function (err, username) {
        if (!err && username) {
            var userInfo = req.user
            req.logIn(username, function (err) {
                if (!err) {
                    res.render(__views_path + 'eipo/index', {
                        layout: __views_path + 'eipo/layout.ejs',
                        user: userInfo,
                        userOptions: req.session.userOptions
                    })
                } else {
                    res.send('authenticate failed.')
                }
            })
        } else {
            res.send('authenticate failed.')
        }
    })(req, res)
})

router.get('/apply', control.isAuthenticated, function (req, res) {
    res.render(__views_path + 'eipo/application', {
        layout: __views_path + 'layout.ejs',
        user: req.user,
        userOptions: req.session.userOptions,
        ipo: ipoData.getByKey(req.query.symbol, req.query.announce) || {},
        csrfToken: req.csrfToken()
    })
})

router.post('/apply', control.isAuthenticated, function (req, res) {
    if (req.body.symbol && req.body.announceCode && req.body.account && req.body.quantity) {
        req.body.user = req.user.AECode || req.user.id
        aServer.submit(req.body, function (err, data) {
            res.send({ err: err, data: data })
        })
    } else {
        res.send({ err: 'invalid parameters.' })
    }
})

router.get('/change', control.isAuthenticated, function (req, res) {
    var orderObj = appData.getByKey(req.query.orderNo)
    if (orderObj) {
        var ipoObj = ipoData.getByKey(orderObj.symbol, orderObj.announceCode)
        if (ipoObj) {
            ipoObj = ipoObj.makeOmsTag()
        }
        res.render(__views_path + 'eipo/changeOrder', {
            layout: false,
            user: req.user,
            userOptions: req.session.userOptions,
            format: config.eipo.format,
            ipo: ipoObj,
            order: orderObj.makeOmsTag(),
            csrfToken: req.csrfToken()
        })
    } else {
        res.send('')
    }
})

router.post('/change', control.isAuthenticated, function (req, res) {
    if (req.body.orderNo && req.body.newQuantity) {
        var orderObj = appData.getByKey(req.body.orderNo)
        if (orderObj) {
            aServer.change({
                orderNo: req.body.orderNo,
                newQuantity: req.body.newQuantity,
                user: orderObj.user
            }, function (err, data) {
                res.send({ err: err, data: data })
            })
        }
    }
})

router.get('/cancel', control.isAuthenticated, function (req, res) {
    var orderObj = appData.getByKey(req.query.orderNo)
    if (orderObj) {
        res.render(__views_path + 'eipo/cancelOrder', {
            layout: false,
            user: req.user,
            userOptions: req.session.userOptions,
            format: config.eipo.format,
            order: orderObj.makeOmsTag(),
            csrfToken: req.csrfToken()
        })
    } else {
        res.send('')
    }
})

router.post('/cancel', control.isAuthenticated, function (req, res) {
    if (req.body.orderNo) {
        var orderObj = appData.getByKey(req.body.orderNo)
        if (orderObj) {
            aServer.cancel({
                orderNo: req.body.orderNo,
                user: orderObj.user
            }, function (err, data) {
                res.send({ err: err, data: data })
            })
        }
    }
})

router.post('/calc', control.isAuthenticated, function (req, res) {
    if (req.body.orderNo && req.body.newQuantity) {
        var orderObj = appData.getByKey(req.body.orderNo)
        if (orderObj) {
            aServer.calc({
                symbol: orderObj.symbol,
                announceCode: orderObj.announceCode,
                quantity: req.body.newQuantity,
                marginRate: orderObj.loanAmount / orderObj.price * 100,
                user: orderObj.user,
                account: orderObj.account
            }, function (err, data) {
                res.send({ err: err, data: data })
            })
        } else {
            res.send({ err: 'cannot find this order number.' })
        }
    } else if (req.body.symbol && req.body.announceCode && req.body.account && req.body.quantity) {
        req.body.user = req.user.AECode || req.user.id
        aServer.calc(req.body, function (err, data) {
            res.send({ err: err, data: data })
        })
    } else {
        res.send({ err: 'invalid parameters.' })
    }
})


module.exports = router
