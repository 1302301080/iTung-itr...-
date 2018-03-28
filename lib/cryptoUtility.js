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

{ $Id: cryptoUtility.js,v 1.2 2016/10/27 08:40:54 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var crypto = require('crypto')

var data = "TR|EBROKER|20160519170000"
var algorithm = 'aes-128-ecb'
var key = 'DEMOCONNNECTKEYS'
var clearEncoding = 'utf8'
var cipherEncoding = 'base64'

exports.AESEncrypt = function (plainText, key) {
    var iv = ''
    var cipher = crypto.createCipheriv(algorithm, key, iv)

    var cipherChunks = []
    cipherChunks.push(cipher.update(plainText, clearEncoding, cipherEncoding))
    cipherChunks.push(cipher.final(cipherEncoding))
    return cipherChunks.join('')
}
exports.AESDecrypt = function (cipherText) {
    var iv = ''
    var decipher = crypto.createDecipheriv(algorithm, key, iv)
    var plainText = decipher.update(cipherText, cipherEncoding, clearEncoding)
    plainText += decipher.final(clearEncoding)
}

// AESDecrypt(AESEncrypt(data, key))