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

{ $Id: logger.js,v 1.7 2017/02/17 09:08:25 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'

var config = require(__config_path)
var log4js = require(__node_modules + 'log4js')
var packageJson = require("./package.json")

class Logger {
    constructor() {
        log4js.configure(config.global.log4js)
        this.logger = log4js.getLogger('elite')
    }

    error(err) {
        if (err) {
            var t = typeof (err)
            if (t === 'string') {
                console.log(err)
                this.logger.error(this.maskPassword(err))
            } else if (t === 'object') {
                if (err.stack) {
                    console.log(err.stack)
                    this.logger.error(this.maskPassword(err.stack))
                }
            }
        }
    }

    info(message) {
        if (message) {
            this.logger.info(this.maskPassword(message))
        }
    }

    trace(message, options) {
        if (message) {
            if (options && options.mask) {
                message = this.maskPassword(message)
            }
            this.logger.trace(message)
        }
    }

    debug(message, options) {
        if (message) {
            if (options && options.mask) {
                message = this.maskPassword(message)
            }
            this.logger.debug(message)
        }
    }

    warn(message) {
        if (message) {
            this.logger.warn(this.maskPassword(message))
        }
    }

    maskPassword(message) {
        message = message
            .replace(/\|21\|.*?\|/, '|21|***|')    // password
            .replace(/\|117\|.*?\|/, '|117|***|')  // pin
            .replace(/\|510\|.*?\|/, '|510|***|')  // trading password

        if (message.indexOf('password|') >= 0) {
            message = message.replace(/\|25\|.*?\|/, '|25|***|')  // change password
        } else if (message.indexOf('verifytoken|') >= 0 || message.indexOf('error|') >= 0) {
            message = message.replace(/\|120\|.*?\|/, '|120|***|')   // verify token
        }
        return message
    }
}

var logger = new Logger()
logger.info(packageJson.name + ' ' + packageJson.version)
logger.info(packageJson.copyright)
module.exports = logger