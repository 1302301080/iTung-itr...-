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

{ $Id: cryptotest.js,v 1.2 2016/10/27 08:40:54 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var crypto = require('crypto');

var data = "TR|EBROKER|20160519170000";
console.log('Original cleartext: ' + data);
var algorithm = 'aes-128-ecb';
var key = 'DEMOCONNNECTKEYS';
var clearEncoding = 'utf8';
//var cipherEncoding = 'hex';
//If the next line is uncommented, the final cleartext is wrong.
var cipherEncoding = 'base64';
/*加密*/
var cipher = crypto.createCipher(algorithm, key);

var cipherChunks = [];
cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
cipherChunks.push(cipher.final(cipherEncoding));
console.log(cipherEncoding + ' ciphertext: ' + cipherChunks.join(''));
/*解密*/
var decipher = crypto.createDecipher(algorithm, key);
var plainChunks = [];
for (var i = 0; i < cipherChunks.length; i++) {
    plainChunks.push(decipher.update(cipherChunks[i], cipherEncoding, clearEncoding));

}
plainChunks.push(decipher.final(clearEncoding));
console.log("UTF8 plaintext deciphered: " + plainChunks.join(''));


// CkSFtKnxPEQO67sc3cOtX9+J0dtJhOlXaUmFy43r85I=    

// 8d0o271TAzRtaJhMOlEEPtRbHxjicCSgDil26brj5X4=


const cipher = crypto.createCipher(algorithm, key);

var encrypted = '';
cipher.on('readable', () => {
    var data = cipher.read();
    if (data)
        encrypted += data.toString('hex');
});
cipher.on('end', () => {
    console.log(encrypted);
    // Prints: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
});