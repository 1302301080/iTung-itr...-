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

{ $Id: message.js,v 1.4 2017/02/17 08:33:36 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    path = require('path'),
    fs = require("fs"),
    Const = require('../lib/const'),
    utility = require('../lib/utility'),
    logger = require('common').Logger.instance().getLogger(),
    glob = require(__node_modules + 'glob'),
    xml2js = require(__node_modules + 'xml2js')

function update() {
    combineMessages()
    if (config.global.message && config.global.message.files) {
        for (var f of config.global.message.files) {
            processMessagesFile(f)
        }
    }
}

function combineMessages() {
    var message_path = path.join(__root_path + '/public/i18n/dist/')
    try {
        for (var lang of config.global.site.languages) {
            eval(fs.readFileSync(message_path + lang + '.js', 'utf8'))
            Const.messages[lang] = messages
            var files = glob.sync(message_path.replace('/\\/g', '/') + '*_' + lang + '.js')
            if (files && files.length > 0) {
                for (var file of files) {
                    eval(fs.readFileSync(path.join(file), 'utf8'))
                    utility.CopyObj(Const.messages[lang], messages)
                }
            }
        }
    }
    catch (err) {
        logger.error(err)
    }
}

function processMessagesFile(file) {
    if (!file || !file.path) return
    var filepath = path.join(__root_path, file.path)
    var data = fs.readFileSync(filepath, file.encoding || "utf8")
    if (!data) return
    xml2js.parseString(data, function (err, result) {
        if (err) {
            logger.error(err)
        } else if (result) {
            try {
                var messagesSection = result.TradingPlatform.Messages
                if (messagesSection && messagesSection.length > 0) {
                    if (messagesSection[0].ErrorCode && messagesSection[0].ErrorCode.length > 0) {
                        handleOMSMapping(messagesSection[0].ErrorCode[0], 'error', '')
                    }
                    if (messagesSection[0].Currency && messagesSection[0].Currency.length > 0) {
                        handleOMSMapping(messagesSection[0].Currency[0], 'oms', 'currency_')
                    }
                    if (messagesSection[0].Exchange && messagesSection[0].Exchange.length > 0) {
                        handleOMSMapping(messagesSection[0].Exchange[0], 'oms', 'exchange_')
                    }
                    if (messagesSection[0].OperatorFlag && messagesSection[0].OperatorFlag.length > 0) {
                        handleOMSMapping(messagesSection[0].OperatorFlag[0], 'oms', 'source_')
                    }
                    if (messagesSection[0].ApplicationID && messagesSection[0].ApplicationID.length > 0) {
                        handleOMSMapping(messagesSection[0].ApplicationID[0], 'oms', 'app_')
                    }
                    if (messagesSection[0].ProductType && messagesSection[0].ProductType.length > 0) {
                        handleOMSMapping(messagesSection[0].ProductType[0], 'oms', 'product_type_')
                    }
                }
            } catch (err) {
                logger.error(err)
            }
        }
    })
}

function handleOMSMapping(section, name, prefix) {
    if (!section) return
    try {
        for (var errorCodeItem of section.Item) {
            var id = errorCodeItem.$['id']
            var eng = errorCodeItem.ENG ? errorCodeItem.ENG[0] : ''
            var chs = errorCodeItem.CHS ? errorCodeItem.CHS[0] : eng
            var cht = errorCodeItem.CHT ? errorCodeItem.CHT[0] : eng
            if (id) {
                Const.messages["en-US"][name][prefix + id] = eng.replace(/\\r\\n/g, '\r\n')
                Const.messages["zh-CN"][name][prefix + id] = chs.replace(/\\r\\n/g, '\r\n')
                Const.messages["zh-HK"][name][prefix + id] = cht.replace(/\\r\\n/g, '\r\n')
            }
        }
    } catch (err) {
        logger.error(err)
    }
}

exports.update = update