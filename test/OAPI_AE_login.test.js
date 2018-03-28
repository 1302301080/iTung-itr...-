var login_info = {
    username: 'DANIEL',
    password: 'abc123',
    loginType: '0'
}

const supertest = require('supertest')
const assert = require('assert')

request = supertest('http://localhost:3000')

describe('POST /api/v2/user/login AE Mode', function () {
    it('login successfully', function (done) {
        request
            .post('/api/v2/user/login')
            .send(login_info)
            .set('content-type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                if (res.body.data) {
                    return done()
                }
                if (res.body.error) {
                    var errorCode = res.body.error.errorCode
                    if (errorCode == 13) {
                        return done('user locked')
                    }
                    return done(res.body.error)
                }
                return done('unexpected result.')
            })
    })

    it('login failed with invalid username', function (done) {
        var clone_login_info = JSON.parse(JSON.stringify(login_info))
        clone_login_info.username = 'xxxxxx'
        request
            .post('/api/v2/user/login')
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

    it('login failed with wrong password', function (done) {
        var clone_login_info = JSON.parse(JSON.stringify(login_info))
        clone_login_info.password = 'xxxxxx'
        request
            .post('/api/v2/user/login')
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
})



