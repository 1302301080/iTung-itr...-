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

{ $Id: users.js,v 1.4 2016/12/20 11:04:17 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

/*
  <sessionID, user>
*/
var logger = require('common').Logger.instance().getLogger()

function UserData() {
    this.users = new Map()
}

UserData.prototype.Set = function (sessionID, user) {
    if (sessionID && user) {
        this.users.set(sessionID, user)
    } else {
        logger.error('Invalid user: ' + JSON.stringify(user))
    }
}

UserData.prototype.Remove = function (sessionID) {
    if (sessionID && this.user.has(sessionID)) {
        this.users.delete(sessionID)
    }
}

UserData.prototype.Get = function (sessionID) {
    if (sessionID) {
        return this.users.get(sessionID)
    } else {
        return null
    }
}

var userData = new UserData()
exports.UserData = userData