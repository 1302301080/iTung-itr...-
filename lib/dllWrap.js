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

{ $Id: dllWrap.js,v 1.6 2016/12/20 11:04:17 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var path = require('path'),
    ffi = require(__node_modules + 'ffi'),
    ref = require(__node_modules + 'ref'),
    logger = require('common').Logger.instance().getLogger()

var PassLib
var pointer
function EncryptPassword(key, length) {
    if (!key || !length) return
    try {
        if (!PassLib) {
            try {
                var dllPath = path.join(__root_path, '/dll/PassLib.dll')
                PassLib = ffi.Library(dllPath, {
                    'AutoPassword': ['void*', ['string', 'int', ref.refType(ref.types.CString)]]
                })
                var temp = ''
                for (var i = 0; i < length; i++) {
                    temp += '0'
                }
                pointer = ref.alloc(ref.types.CString, temp)
            } catch (err) {
                logger.error(err)
            }
        }
        if (PassLib) {
            try {
                PassLib.AutoPassword(key, length, pointer)
                var buf = ref.readPointer(pointer, 0, length)
                return buf.toString()
            } catch (error) {
                logger.error('PassLib dll encrypt password failed. Error: ' + error)
            }
        }
    } catch (err) {
        logger.error(err)
    }
}

exports.EncryptPassword = EncryptPassword