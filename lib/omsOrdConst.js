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

{ $Id: omsOrdConst.js,v 1.6 2017/12/26 03:14:34 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

var OrdConst = {
    omsOrderMarket: 1,
    omsOrderManual: 32,
    omsOrderFAK: 128,
    omsOrderFOK: 256,
    omsOrderPreOpen: 512,
    omsOrderEnhancedLimit: 1024,
    omsOrderStopLimit: 2048,
    omsOrderNoComm: 8192,
    omsOrderSettle: 32768,
    omsOrderGTC: 1048576,
    omsOrderAutoFill: 2097152,
    omsOrderNotNull: 2147483648,

    /* instruction 1 */
    omsOrder1Bulk: 32768,
    omsOrder1Alert: 262144,

    /* instruction 2 */
    omsOrder2SI_CASH: 1,
    omsOrder2SI_SECURITY: 2,
    omsOrder2AHFT: 512,
    omsOrder2IgnoreCredit: 4194304,
    omsOrder2Switch: 67108864,

    /* instruction 3 */
    omsOrder3Quote: 262144,

    /* TXN Flag */
    PFLAG_TXNFEE_NONE: 1,
    PFLAG_TXNFEE_BUY: 2,
    PFLAG_TXNFEE_SELL: 4,
    PFLAG_TXNFEE_INCLUSIVE: 8,
    PFLAG_TXNFEE_FREE: 16,
    PFLAG_TXNFEE_CALC: 32,
    PFLAG_TXNFEE_BOFF: 64,
    PFLAG_TXNFEE_SOFF: 128,
    PFLAG_CONF_OFF: 256,
    PFLAG_AMT_CONF_ON: 512,
    PFLAG_D_KNOWLEDGE: 1024
}

module.exports = OrdConst