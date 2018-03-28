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

{ $Id: accountExploer.js,v 1.1 2016/12/20 11:04:18 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/


define(function (require, exports, module) {
    var dialog = require('dialog')
    var configData
    var sourceName
    var loginID = $('#login-account').text()
    function init(cd) {
        configData = cd
    }

    function popup(options) {
        options = options || {}
        dialog.showMessage({
            title: messages.eipo["eipo-account-exploer"].text,
            message: "<div class='col-md-12' id='account-exploer'></div>",
            onshown: function (dialog) {
                options.dialog = dialog
                createTable($('#account-exploer'), options)
            }
        })
    }

    function createTable(container, options) {
        var table = $("<table>", { class: "table table-bordered table-hover table-condensed table-striped" })
        container.append(table)
        $.get('/eipo/data/accounts?user=' + loginID, function (data) {
            var dataTable = table.CreateDatatable({
                columnSchema: configData.schema.account,
                info: false,
                dom: "<'row'<'col-sm-12'f>>" + "<'row'<'col-sm-12'tr>>" + "<'row'<'col-sm-12'p>>",
                columnDefs: [
                    { className: "pointer", "targets": [0] }
                ],
                data: data
            })
            table.translate('eipo')
            table.click(function (e) {
                if ($(e.target).hasClass('pointer')) {
                    if (!options.callback) return
                    var account = $(e.target).text()
                    if (account) {
                        options.callback(account)
                        options.dialog.close()
                    }
                }
            })
        })
    }

    exports.init = init
    exports.popup = popup
})
