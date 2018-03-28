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

{ $Id: user.js,v 1.2 2016/10/27 08:40:54 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

'use strict'
/*
  <sessionID, user>
*/
class User {
    constructor() {
        this.maps = new Map()
    }

    get(key) {
        if (key) {
            return this.maps.get(key)
        }
        var array = []
        for (var value of this.maps.values()) {
            array.push(value)
        }
        return array
    }

    set(key, value) {
        if (!key || !value) return
        this.maps.set(key, value)
    }
    
    delete(key) {
        if(key) {
            this.maps.delete(key)
        }
    }
    
    findUserById(loginID) {
        for(var u of this.maps.values()) {
            if(u.id === loginID) {
                return u
            }
        }
    }
}

module.exports = new User()