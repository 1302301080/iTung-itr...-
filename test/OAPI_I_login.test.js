const g = require('./global.test.js')

var login_info = g.login_info
var auth_info = g.auth_info
var urls = g.urls

const crypto = require('crypto')
var request = g.request

describe('POST /api/v2/user/login', function () {
    it('login successfully', function (done) {
        var timestamp = new Date().getTime()
        var message = timestamp + urls.login + JSON.stringify(login_info)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        request
            .post(urls.login)
            .send(login_info)
            .set('content-type', 'application/json')
            .set('key', auth_info.api_key)
            .set('signature', signature)
            .set('timestamp', timestamp)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(res.body)
                if (err) return done(err)
                if (res.body.data) {
                    return done()
                }
                if (res.body.error) {
                    return done(res.body.error)
                }
                return done('unexpected result.')
            })
    })

    it('login failed with invalid username', function (done) {
        var clone_login_info = JSON.parse(JSON.stringify(login_info))
        clone_login_info.username = 'xxxxxx'
        request
            .post(urls.login)
            .send(clone_login_info)
            .set('content-type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                if (res.body.data) {
                    return done('unexpected result with data object.')
                }
                if (res.body.error) {
                    var errorCode = res.body.error.errorCode
                    if (errorCode == 10 || errorCode == 87) {  //  > 87: Account not found by mobile or email
                        return done()
                    } else if (errorCode == 13) {
                        return done('user locked.')
                    }
                    return done(res.body.error)
                }
                return done('unexpected result.')
            })
    })

    it('login failed with wrong password', function (done) {
        var clone_login_info = JSON.parse(JSON.stringify(login_info))
        clone_login_info.password = 'xxxxxx'
        request
            .post(urls.login)
            .send(clone_login_info)
            .set('content-type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                if (res.body.data) {
                    return done('unexpected result with data object.')
                }
                if (res.body.error) {
                    var errorCode = res.body.error.errorCode
                    if (errorCode == 10) {
                        return done()
                    } else if (errorCode == 13) {
                        return done('user locked.')
                    }
                }
                return done('unexpected result.')
            })
    })

    it('login successfully with api key', function (done) {
        var timestamp = new Date().getTime()
        var message = timestamp + urls.login + JSON.stringify(login_info)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        request
            .post(urls.login)
            .send(login_info)
            .set('content-type', 'application/json')
            .set('key', auth_info.api_key)
            .set('signature', signature)
            .set('timestamp', timestamp)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                if (res.body.data) {
                    return done()
                }
                if (res.body.error) {
                    return done(res.body.error)
                }
                return done('unexpected result.')
            })
    })

    it('login feedback with token status', function (done) {
        var timestamp = new Date().getTime()
        var message = timestamp + urls.login + JSON.stringify(login_info)
        var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
        this.timeout(1000 * 6)
        request
            .post(urls.login)
            .send(login_info)
            .set('content-type', 'application/json')
            .set('key', auth_info.api_key)
            .set('signature', signature)
            .set('timestamp', timestamp)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(res.body)
                if (err) return done(err)
                if (res.body.data) {
                    if (res.body.data.tokenStatus) {
                        return done()
                    } else {
                        return done('cannot found token status, please make sure this account using ebroker key (token type = 5)')
                    }
                }
                if (res.body.error) {
                    return done(res.body.error)
                }
                return done('unexpected result.')
            })
    })
})

var authorization
function login(callback) {
    var timestamp = new Date().getTime()
    var message = timestamp + urls.login + JSON.stringify(login_info)
    var signature = crypto.createHmac('sha256', auth_info.secret).update(message).digest('hex')
    if (authorization) {
        return callback(null, authorization)
    }
    request
        .post(urls.login)
        .send(login_info)
        .set('content-type', 'application/json')
        .set('key', auth_info.api_key)
        .set('signature', signature)
        .set('timestamp', timestamp)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            authorization = res.header['authorization']
            callback(err, authorization)
        })
}

exports.login = login