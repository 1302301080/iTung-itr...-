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

{ $Id: risk.js,v 1.6 2017/12/26 03:14:35 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

$(function () {
    LoadDisclosurePage()
    $(document).keypress(function (e) {
        if (e.which == 13) {
            window.location.href = $('#disclosure-accept-btn').attr('href')
        }
    })
    $('.btn-disclosure').click(function () {
        if (document.getElementById("disclaimer-options").checked) {
            $(this).attr('href', $(this).attr('href') + '&skipDisclaimer=1')
        }
    })
    seajs.use('mobile', function (mo) {
        mo.init()
    })
})

function LoadDisclosurePage() {
    var lang = ($('html').attr('lang') || 'en-US')
    var url = '/html/disclosure.html'
    if($('#risk-disclosure-url').val()) {
        url = $('#risk-disclosure-url').val()
    }
    var index = url.lastIndexOf('.')
    if (index >= 0) {
        url = url.substring(0, index) + '_' + lang + url.substring(index)
    }
    $.get(url, function (data) {
        $('#disclosure-content-div').html(data)
    })
    $(document).translate()
}