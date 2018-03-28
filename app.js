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

{ $Id: app.js,v 1.20 2018/01/19 10:00:19 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    path = require('path'),                           // Node.JS modules    
    express = require(__node_modules + 'express'),    // third party modules
    favicon = require(__node_modules + 'serve-favicon'),
    log4js = require(__node_modules + 'log4js'),
    timeout = require(__node_modules + 'connect-timeout'),
    bodyParser = require(__node_modules + 'body-parser'),
    session = require(__node_modules + 'express-session'),
    LocalStore = require('session-local')(session),   // self modules
    expressLayouts = require(__node_modules + 'express-ejs-layouts'),
    passport = require(__node_modules + 'passport'),
    csrf = require(__node_modules + 'csurf'),
    accessControl = require('access-control'),
    apiControl = require('api-control'),
    control = require('./control'),
    routes = require('./routes'),
    handler = require('./handler'),
    app = express()

var quote = require('quote-interface')
var fundSwitchIDGenerator = require('switchID-generator')

var apiKeysConfig = require('./config/api-keys.config')
app.set('env', 'production')
app.use(favicon(path.join(__root_path, 'public', 'favicon.ico')))
app.use(express.static(path.join(__root_path, 'admin/public'), { setHeaders: handler.setHeaderForStaticFile }))
app.use(express.static(path.join(__root_path, 'public'), { setHeaders: handler.setHeaderForStaticFile }))
app.use(express.static(path.join(__root_path, 'public/favicons'), { setHeaders: handler.setHeaderForStaticFile }))

fundSwitchIDGenerator.init({ recoverFilePath: (configuration.iTrader.oms.recoverFile || {}).fundSwitchIDSeq })

// view engine setup
app.set('views', path.join(__root_path, 'views'))
//app.set('view cache', false)  // for dynamic include template
app.set('view engine', 'ejs')
app.use(log4js.connectLogger(log4js.getLogger('request')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(control.trimBody)

routes.route(app, true)   // handle route for admin

// security control
app.use(accessControl({ keys: apiKeysConfig.keys }))
app.all('/api/:version/*', apiControl)
app.use(passport.initialize())
app.use(passport.session())

config.global.session.store = new LocalStore({ timeout: config.global.session.timeout })
app.use(session(config.global.session))
app.use(control.Authenticate)
app.use(control.setup)

app.use(csrf())
app.use(function (err, req, res, next) {
    if (err.code === 'EBADCSRFTOKEN') {
        req.CSRFTOKENRequired = true
        return next()  // skip csrf chekcing here, make the checking happens in specified routes
    } else {
        return next(err)
    }
})

// connect quote interface
if (configuration.iTrader.quote && configuration.iTrader.quote.name) {
    quote.init(configuration.iTrader.quote)
}

app.use(expressLayouts)  //layout view

app.use(handler.handleHeaders)  // for custom headers
app.use(timeout(config.global.site.timeout ? config.global.site.timeout + 's' : '60s'))  // must more than 5s to prevent other settimeout issue
routes.route(app)
handler.handleError(app)
app.use(haltOnTimedout)

function haltOnTimedout(req, res, next) {
    if (!req.timedout) {
        next()
    }
}

handler.handleSession()

module.exports = app
