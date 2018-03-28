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

{ $Id: mktData.js,v 1.12 2018/01/19 10:00:21 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var config = require(__config_path),
    fs = require('fs'),
    xml2js = require(__node_modules + 'xml2js'),
    request = require(__node_modules + 'request'),
    unzip = require(__node_modules + 'unzip'),
    glob = require(__node_modules + 'glob'),
    dataEntry = require('../data/entry'),
    schema = require('common').Schema,
    logger = require('common').Logger.instance().getLogger(),
    Const = require('../lib/const')

var lastDatetime
var lastDataFile
exports.CheckUpdate = function () {
    if (!config.iTrader.static_data.path) return
    request(config.iTrader.static_data.path, function (err, res, body) {
        if (err) {
            logger.error(err)
        } else if (res.statusCode === 200) {
            xml2js.parseString(body, function (err, result) {
                if (err) {
                    logger.error(err)
                } else if (result) {
                    try {
                        var date = result.MKTData.Date[0] + (result.MKTData.Time ? ' ' + result.MKTData.Time[0] : '')
                        var dataFile = result.MKTData.DataFile[0]
                        if (!dataFile) return
                        dataFile = dataFile.replace(/\r\n/g, '')
                        if (date !== lastDatetime || dataFile != lastDataFile) {
                            logger.info('static market data changed. date: {0}, file: {1}'.format(date, dataFile))
                            clearStaticData()
                            downloadStaticData(dataFile)
                        }
                        lastDatetime = date
                        lastDataFile = dataFile
                    } catch (err) {
                        logger.error(err)
                    }
                }
            })
        }
    })
}

function clearStaticData() {
    try {
        for (var productObj of dataEntry.get({ name: Const.DataAction.product })) {
            productObj.isStatic = false
        }
    } catch (err) {
        logger.error(err)
    }
}

function downloadStaticData(dataFilePath) {
    if (!dataFilePath) return
    var temp = './temp/'
    try {
        if (!fs.existsSync(temp)) {
            fs.mkdirSync(temp)
        }
        var zipFilename = temp + 'mktdata.zip'
        var stream = fs.createWriteStream(zipFilename)
        request(dataFilePath).pipe(stream).on('error', (err) => {
            logger.error('download static data file failed. error: ' + err)
        }).on('close', () => {
            logger.info('download static data file success.')
            if (fs.existsSync(zipFilename)) {
                fs.createReadStream(zipFilename).pipe(unzip.Extract({ path: temp })).on('error', (err) => {
                    logger.error('unzip static data file failed. error: ' + err)
                }).on('close', () => {
                logger.info('unzip static data file successed.')
                glob("./temp/**/" + config.iTrader.static_data.file, function (err_glob, files) {
                    if (err_glob) {
                        logger.error(err_glob)
                    }
                    if (files && files.length > 0) {
                        fs.readFile(files[0], config.iTrader.static_data.encoding, function (err, data) {
                            if (err) {
                                logger.error(err)
                            } else {
                                var columns = config.iTrader.static_data.columns
                                var lines = data.split('\r\n')
                                logger.info('read file {0}, lines: {1}'.format(files[0], lines.length))
                                for (var i = 1; i < lines.length; i++) {
                                    if (lines[i].length <= 0) continue
                                    var list = lines[i].split(',')
                                    if (list.length <= 0) continue
                                    var product = {}
                                    for (var j = 0; j < columns.length; j++) {
                                        if (typeof (columns[j].index) === 'number' && columns[j].index >= 0 && columns[j].index < list.length) {
                                            var value = list[columns[j].index]
                                            if (value) {
                                                    value = value.replace(/&#44;/g, ',')
                                            }
                                            product[columns[j].key] = value || columns[j].default
                                        }
                                    }
                                    var schemaProduct = schema.OrderSchema.makeFromObject(product)
                                    schemaProduct.isStatic = true
                                    if (schemaProduct.symbol) {
                                        dataEntry.set({ name: Const.DataAction.product }, schemaProduct.symbol, schemaProduct, { encoding: 'UTF-8' })
                                    } else {
                                        logger.error('Invalid Symbol: ' + lines[i])
                                    }

                                }
                                deleteFolderRecursive(temp)
                            }
                        })
                    } else {
                        logger.info('no static data files found.')
                    }
                })
            })
            } else {
                logger.error('cannot found /temp/mktdata.zip')
            }
        })
    } catch (error) {
        logger.error('process static data file failed. error: ' + error)
    }
}

function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath)
            } else {
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(path)
    }
}