const crypto = require('crypto')
const loginTest = require('./OAPI_I_login.test')
const g = require('./global.test')

var request = g.request
var auth_info = g.auth_info
var urls = g.urls
var add_order = g.order_info.add_order


describe('POST /api/v2/order/submit add order', function () {
    it('add order successfully', function (done) {
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            // console.log(res.body.data)
                            if (res.body.error) {
                                return done(res.body.error)
                            } else if (res.body.data) {
                                var orderObj = res.body.data
                                if (!orderObj.orderNo) {
                                    return 'no order number found.'
                                } else {
                                    var errMsg = compareOrder(add_order, orderObj)
                                }
                                if (errMsg) {
                                    return done(errMsg)
                                } else {
                                    return done()
                                }
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order without symbol parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.symbol = ''
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                if (errorCode == 'I_10001') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order with invalid symbol parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.symbol = 'fds5f4s56'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                // console.log('errorCode===>' + errorCode)
                                if (errorCode == 'I_10006') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order with invalid price parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.price = 'abcd'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with ' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                console.log(errorCode)
                                if (errorCode == 'I_10001') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order with negative price parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.price = '-80'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with ' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                if (errorCode == 'I_10001') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order with invalid quantity parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.quantity = 'fds5f4s56'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                // console.log('errorCode===>' + errorCode)
                                if (errorCode == 'I_10001') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order with invalid quantity parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.quantity = '-1000'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                // console.log('errorCode===>' + errorCode)
                                if (errorCode == 'I_10001') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('without side parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.side = ''
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                // console.log('errorCode===>' + errorCode)
                                if (errorCode == 'I_10001') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order without type parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.type = 'auction'
        clone_add_order.tif = 'fak'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '-11') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order without stopPrice parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.type = 'stopLimit'
        clone_add_order.stopPrice = ''
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '-17') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order limit fak parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.type = 'limit'
        clone_add_order.tif = 'fak'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done()
                            } else if (res.body.error) {
                                console.log(res.body)
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '2') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order limit gtc parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.type = 'limit'
        clone_add_order.tif = 'gtc'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done()
                            } else if (res.body.error) {
                                console.log(res.body)
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '2') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order limit gtd parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.type = 'limit'
        clone_add_order.tif = 'gtd'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done()
                            } else if (res.body.error) {
                                console.log(res.body)
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '2') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order market parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.type = 'market'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done()
                            } else if (res.body.error) {
                                console.log(res.body)
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '2') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order auction parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.type = 'limit'
        clone_add_order.tif = 'gtd'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done()
                            } else if (res.body.error) {
                                console.log(res.body)
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '2') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })

    it('add order enhancedLimit fak parameter', function (done) {
        var clone_add_order = JSON.parse(JSON.stringify(add_order))
        clone_add_order.type = 'enhancedLimit'
        clone_add_order.tif = 'fak'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_add_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_add_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done()
                            } else if (res.body.error) {
                                console.log(res.body)
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '2') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })


})


describe('POST /iTrader/order/calculate', function () {
    it('add order successfully BCAN parameter', function (done) {
        var clone_BCAN_order = JSON.parse(JSON.stringify(add_order))
        clone_BCAN_order.BCAN = '11111'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_BCAN_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_BCAN_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.error) {
                                return done(res.body.eror)
                            } else if (res.body.data) {
                                var errMsg = compare_BCAN_order(clone_BCAN_order, orderObj)
                                if (errMsg) {
                                    return done(errMsg)
                                } else {
                                    return done()
                                }
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })
    it('add order without BCAN parameter', function (done) {
        var clone_BCAN_order = JSON.parse(JSON.stringify(add_order))
        clone_BCAN_order.BCAN = ''
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_BCAN_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_BCAN_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '-6') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })
    it('add order invalid BCAN parameter', function (done) {
        var clone_BCAN_order = JSON.parse(JSON.stringify(add_order))
        clone_BCAN_order.BCAN = 'dsadsd'
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(clone_BCAN_order)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                // console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(clone_BCAN_order)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.data) {
                                return done('unexpected result with' + JSON.stringify(res.body.data))
                            } else if (res.body.error) {
                                var errorCode = res.body.error.errorCode
                                console.log('errorCode===>' + errorCode)
                                if (errorCode == '-6') {
                                    return done()
                                }
                                return done(res.body.error)
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })
})

describe('GET /api/v2/order/get', function () {
    it('Get the order information successfully', function (done) {
        var order_info = { orderNo: '180307000455' }

        var timestamp = new Date().getTime()
        var message = timestamp + urls.orderInfo + JSON.stringify(order_info)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 5)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                console.log('auth:=========> ' + authorization)
                request
                    .get(urls.orderInfo)
                    .send(order_info)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            console.log(res.body)
                            if (res.body.error) {
                                return done(res.body.error)
                            } else if (res.body.data) {
                                var orderObj = res.body.data
                                if (orderObj) {
                                    if (!orderObj.orderNo) {
                                        return 'no order number found.'
                                    } else {
                                        return done()
                                    }
                                } else {
                                    return done('invalid order')
                                }
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })
})

function compareOrder(inOrder, outOrder) {
    if (!inOrder || !outOrder) return 'invalid order'
    if (inOrder.symbol != outOrder.symbol) {
        return 'invalid symbol ' + outOrder.symbol
    }
    if (inOrder.price != outOrder.price) {
        return 'invalid price ' + outOrder.price
    }
    if (inOrder.quantity != outOrder.quantity) {
        return 'invalid quantity ' + outOrder.quantity
    }
    if (inOrder.side != outOrder.side) {
        return 'invalid side ' + outOrder.side
    }
    if (inOrder.tif) {
        if (inOrder.tif != outOrder.tif) {
            return 'invalid tif ' + outOrder.tif
        }
    }
    if (inOrder.type) {
        if (inOrder.type != outOrder.type) {
            return 'invalid type ' + outOrder.type
        }
    }
    if (inOrder.stopPrice) {
        if (inOrder.stopPrice != outOrder.stopPrice) {
            return 'invalid stopPrice ' + outOrder.stopPrice
        }
    }
    // if (inOrder.date) {
    //     if (inOrder.date != outOrder.date) {
    //         return 'invalid date ' + outOrder.date
    //     }
    // }
    if (inOrder.password) {
        if (inOrder.password != outOrder.password) {
            return 'invalid password error'
        }
    }
}

function compareChgOrder(inOrder, outOrder) {
    if (!inOrder || !outOrder) return 'invalid order'
    if (inOrder.changPrice) {
        if (inOrder.changPrice != outOrder.changPrice) {
            return 'invalid changePrice' + outOrder.changPrice
        }
    }
    if (inOrder.changeQuantity) {
        if (inOrder.changeQuantity != outOrder.changeQuantity) {
            return 'invalid changeQuantity'
        }
    }
    if (inOrder.changeStopPrice) {
        if (inOrder.changeStopPrice != outOrder.changeStopPrice) {
            return 'invalid changeStopPrice'
        }
    }
    if (inOrder.changeDate) {
        if (inOrder.changeDate != outOrder.changeDate) {
            return 'invalid changeDate'
        }
    }
    if (inOrder.password) {
        return 'password error'
    }
}

function compareBOND_FUND(inOrder, outOrder) {
    if (!inOrder || !outOrder) return 'invalid order'
    if (inOrder.symbol != outOrder.symbol) {
        return 'invalid symbol' + outOrder.symbol
    }
    if (inOrder.fundAmountUnit != outOrder.price) {
        return 'invalid fundAmountUnit' + outOrder.price
    }
}

function compare_BCAN_order(inOrder, outOrder) {
    if (!inOrder || !outOrder) return 'invalid order'
    if (inOrder.BCAN) {
        if (inOrder.BCAN == outOrder.compSystemRef.BCAN) {
            return 'invalid BCAN   ' + outOrder.compSystemRef.BCAN
        }
    } else {
        if (inOrder.BCAN == outOrder.compSystemRef.BCAN) {
            return 'without BCAN   ' + outOrder.compSystemRef.BCAN
        }
    }
}

describe('POST /api/v2/order/submit add order', function () {
    it('change order successfully', function (done) {
        var order_chg = { orderNo: '180307000515', cmd: 'change' }

        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(order_chg)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(order_chg)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            console.log(res.body.data)
                            if (res.body.error) {
                                return done(res.body.error)
                            } else if (res.body.data) {
                                var orderObj = res.body.data
                                var errMsg = compareChgOrder(order_chg, orderObj)
                                if (errMsg) {
                                    return done(errMsg)
                                } else {
                                    return done()
                                }
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })
    it('cancel order successfully', function (done) {
        var order_canc = { orderNo: '180307000480', cmd: 'cancel' }
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(order_canc)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(order_canc)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.error) {
                                return done(res.body.error)
                            } else if (res.body.data) {
                                var orderObj = res.body.data
                                var errMsg = compareChgOrder(order_canc, orderObj)
                                if (errMsg) {
                                    return done(errMsg)
                                } else {
                                    return done()
                                }
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })
    it('FUND order successfully', function (done) {
        var order_fund = { symbol: 'F0AG01', fundAmountUnit: '80000', side: '0', cmd: 'add' }
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(order_fund)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 5)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                console.log('auth: ' + authorization)
                request
                    .post(urls.submitOrder)
                    .send(order_fund)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err)
                        } else {
                            if (res.body.error) {
                                return done(res.body.error)
                            } else if (res.body.data) {
                                var orderObj = res.body.data
                                var errMsg = compareBOND_FUND(order_fund, orderObj)
                                if (errMsg) {
                                    return done(errMsg)
                                } else {
                                    return done()
                                }
                            }
                            return done('unexpected result.')
                        }
                    })
            } else {
                return done('login failed.')
            }
        })
    })
    it('FUND switch successfully', function (done) {
        var order_fund_switch = { switchin: 'F0AG01', switchout: '', alloc: '100', type: 'switch' }
        var timestamp = new Date().getTime()
        var message = timestamp + urls.submitOrder + JSON.stringify(order_fund_switch)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 5)
        loginTest.login(function (err, authorization) {
            if (!err && authorization) {
                request
                    .post(urls.submitOrder)
                    .send(order_fund_switch)
                    .set('content-type', 'application/json')
                    .set('authorization', authorization)
                    .set('key', auth_info.api_key)
                    .set('signature', signature)
                    .set('timestamp', timestamp)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end((err, res) => {

                    })
            } else {
                return done('login failed.')
            }
        })
    })
})