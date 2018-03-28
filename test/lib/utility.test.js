require('../global.test')
const assert = require('chai').assert
// const utility = require('../../lib/utility')
const utility = ''

describe('/lib/utility.js getKeyValuePairStr', function () {
    it('null', function (done) {
        assert.equal('key1=val1', utility.getKeyValuePairStr(null, 'key1', 'val1'))
        done()
    })

    it('empty', function (done) {
        assert.equal('key1=val1', utility.getKeyValuePairStr(null, 'key1', 'val1'))
        done()
    })
    it('key1=val1', function (done) {
        assert.equal('key1=val1,key2=val2', utility.getKeyValuePairStr('key1=val1', 'key2', 'val2'))
        done()
    })
})