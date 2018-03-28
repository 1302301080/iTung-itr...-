const supertest = require('supertest')

var path = require('path')
var fs = require('fs')

var login_info = {
    username: 'AT2017',//ATON
    password: 'Abc963',//abc123
    // username: 'DX2017',
    // password: 'Abc123',
    loginType: '1'//user: 0, account : 1
}

var order_info = {
    add_order: {
        symbol: '00001',
        price: '1',
        quantity: '1000',
        side: '0',
        tif: '',
        type: '',
        stopPrice: '',
        date: '',
        password: '',
        BCAN: '',
        cmd: 'add',
    },
}

var auth_info = {
    api_key: '00d81030-8884-11e7-bf9d-9fbe026d9b42',
    secret: 'RkQcBTxUSSoQujG7Fr470L6uolxVq0P8GlJcUtS1jeA='
}
var urls = {
    login: '/api/v2/user/login',
    submitOrder: '/api/v2/order/submit',
    orderInfo: '/api/v2/order/get',
    orderCalc: '/api/v2/order/calculate',
}



// global.__node_modules = path.join(process.cwd(), '..', '/node_modules/')
// global.__root_path = process.cwd()
// global.__views_path = path.join(process.cwd(), '/views/')
// global.__config_path = path.join(process.cwd(), 'config.js')

// var config = require(__config_path)
// config.__routes = loadCustomConfig('routes')
// config.__headers = loadCustomConfig('headers')
// config.__layout = loadCustomConfig('layout')
// config.__apiFields = loadCustomConfig('api-fields')
// config.__markets = loadCustomConfig('markets')
// global.configuration = config
// var packageJson = require(path.join(process.cwd(), 'package.json'))
// var log4js = require(__node_modules + 'log4js')
// require('common').Logger.instance({ log4js: config.global.log4js, loggerName: 'elite', name: packageJson.name, version: packageJson.version, message: packageJson.copyright })
// var logger = require('common').Logger.instance().getLogger()
// global.__logger = logger

// function loadCustomConfig(name) {
//     var filepath = path.join(process.cwd(), '/config/' + name + '.config.js')
//     if (fs.existsSync(filepath)) {
//         return require(filepath)
//     }
// }

exports.order_info = order_info
exports.login_info = login_info
exports.auth_info = auth_info
exports.urls = urls
exports.request = supertest('http://localhost:3000')
// exports.request = supertest('http://115.160.142.248:8080')