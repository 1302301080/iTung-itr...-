/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2017 eBroker Systems Ltd.                 }
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

{ $Id: market.js,v 1.3 2018/01/19 10:00:25 leowong Exp $ Copyright 2000-2017 eBroker Systems Ltd. }
*/

var request = require(__node_modules + 'request')
var express = require(__node_modules + 'express')
var router = express.Router()

var brokerData

router.get('/broker', function (req, res) {
    if (brokerData) {
        return res.send(brokerData)
    }
    request('http://www.ebsdata.com/MarketMon/ebroker.txt', function (err, response, body) {
        if (!err && response.statusCode == 200 && body) {
            brokerData = body
            return res.send(brokerData)
        }
    })
})

router.get('/', function (req, res) {
    if (configuration.__markets) {
        return res.send({ data: configuration.__markets })
    }
    res.send({ error: true })
})

module.exports = router