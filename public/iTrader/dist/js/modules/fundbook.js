define(function(require,exports,module){function a(){for(var a=-1,c=0,d=0;d<g.schema.length;d++)l&&0==g.schema[d].mobile&&c++,6==g.schema[d].key&&(a=d-c);i=h.CreateDatatable({columnSchema:g.schema,columnHeaderPrefix:"fundbook_header_",order:[2,"desc"],aoColumnDefs:[{bSortable:!1,aTargets:[0,1]},{className:"extra-row",targets:[a]},{className:"prevent-popup-detail",targets:[0,1,2]}],buttons:[{extend:"print",className:"btn-print"}],getExtraRow:e});var f=$(i.table().container()),k=i.buttons().container();k.addClass("pull-right"),k.find("a span").remove(),k.find("a").append($("<i class='fa fa-lg fa-print text-muted'></i>")),k.appendTo(f.find(".dataTables_filter label")),$(document).translate(),h.on("click",function(a){var c=$(a.target),d=c.attr("action"),e=c.parents("tr"),f=e.attr("id"),g=i.row(e);f&&f.length>12&&("change"===d?j.changeOrder(f.substring(11)):"cancel"===d&&(g.data().switchID?b(g):j.cancelOrder(f.substring(11))))})}function b(a){var b=[];showMessage({title:messages.ticket_order_cancel_confirmation_title.text+AccountMgr.current_account,buttonNameList:["submit","close"],message:d(a),callback:function(c,d){if("close"===c.name)d.close();else if("submit"===c.name){var e=a.data(),f=$("input[name=_csrf]").val();for(var g in e.FundSwitchOrderList)b.push(e.FundSwitchOrderList[g].orderNo);var h="_csrf="+f+"&orderNo="+e[6]+"&cmd=cancel";$.ajax({type:"post",url:"/iTrader/order/submit",data:h,success:function(a){a?alertMessage({title:messages.dialog_information_title.text,message:messages.order_confirmation_order_cancel_submitted_message.text}):handleError(a)},error:handleError}),d.close()}}})}function c(a){if("object"==typeof a&&a[tags.orderNo]){a.DT_RowId="fund-order-"+a._id;var b=1==a._raw[5]&&!a.switchID,c=1==a._raw[5];b?a.change="<a href='javascript:void(0);'><i class='fa fa-edit fa-lg text-success' title='{0}' action='change'></i></a>".format(messages.orderbook_change.text):a.change="<i class='fa fa-edit fa-lg text-muted' title='{0}'></i>".format(messages.orderbook_change.text),c?a.cancel="<a href='javascript:void(0);'><i class='fa fa-remove fa-lg text-danger' title='{0}' action='cancel'></i></a>".format(messages.orderbook_cancel.text):a.cancel="<i class='fa fa-remove fa-lg text-muted' title='{0}'></i>".format(messages.orderbook_cancel.text);var d=i.UpdateRowData(a);k.ApplyColor(d)}}function d(a){var b=$(e(a));return b.find("table").css("margin-bottom","20px"),b.attr("class","col-sm-12"),b.html()}function e(a,b,c){if(!a&&!b)return"";if(c=c||{},!b){var d=a.data();d&&(b=d.FundSwitchOrderList)}if(!b)return"";var e=[],f=$("<div>"),g=$("<div>",{"class":"col-sm-offset-2 col-sm-8"}).appendTo(f),h=$("<small>").appendTo(g),i=$("<table>",{"class":"table table-bordered table-condensed",style:"margin-bottom: 0"}).appendTo(h);i.append($("<tr>").append($("<th>",{"data-i18n":"fund_switch_out_symbol","class":"th-red"})).append($("<th>",{"data-i18n":"fund_redeem_unit","class":"th-red"})).append($("<th>",{"data-i18n":"column_currency","class":"th-red"})).append($("<th>",{"class":"table-division",style:"vertical-align: middle;text-align: center;padding: 0px; background-color:#ECF0F1;"}).append("<i class='fa fa-2x fa-arrow-circle-right text-success'></i>")).append($("<th>",{"data-i18n":"fund_switch_in_symbol","class":"th-green"})).append($("<th>",{"data-i18n":"fund_switch_in_allocation","class":"th-green"})).append($("<th>",{"data-i18n":"column_currency","class":"th-green"})));var j=1,k=[],l=[];for(var m in b){var n=b[m];0==n[11]?k.push(n):l.push(n),(n._isErrorOrder||n[5]==-1||4==n[5])&&(j=-1)}for(var o=k.length>l.length?k.length:l.length,p=0;p<o;p++)l.length>p?e.push(l[p]):e.push(!1),k.length>p?e.push(k[p]):e.push(!1);for(var p=0;p<e.length;p+=2){var q=e[p]||{},r=e[p+1]||{},s="",t="";"none"!==c.iconType&&(q._isErrorOrder?s="<i class='fa fa-times-circle text-danger' style='margin-right:5px;' title='{0}'></i>".format((getErrorMessage(q)||"").replace("<br />","")):q[0]&&(s=j==-1?"<i class='fa fa-check-circle text-muted' style='margin-right:5px;'></i>":"<i class='fa fa-check-circle text-success' style='margin-right:5px;'></i>"),r._isErrorOrder?t="<i class='fa fa-times-circle text-danger' style='margin-right:5px;' title='{0}'></i>".format((getErrorMessage(r)||"").replace("<br />","")):r[0]&&(t=j==-1?"<i class='fa fa-check-circle text-muted' style='margin-right:5px;'></i>":"<i class='fa fa-check-circle text-success' style='margin-right:5px;'></i>")),i.append($("<tr>").append($("<td>",{html:s+(q[0]||""),title:q.symbolName||""}).append($("<td>",{text:q[4]||"","data-format":"-"+initial_data.format.fund_unit,"class":"text-right"})).append($("<td>",{text:q[23]||""})).append($("<td>",{html:t+(r[0]||""),title:r.symbolName||""})).append($("<td>",{text:r.allocation||"","class":"text-right"})).append($("<td>",{text:r[23]||""}))))}return i.find(".table-division").attr("rowspan",o+1).css("padding","5px"),f.translate(),f.format(),f.html()}var f,g,h,i,j=require("ticket"),k=require("util"),l=require("mobile").GetIsMobile();exports.init=function(b,d){f=b,g=d,f&&f instanceof jQuery&&(!g||!g.schema||g.schema.length<=0||(h=f.find("#fund-book-table"),!h||h.length<=0||(a(),OrderMgr.on(function(a){if(!a||a.length>0){for(var b=0;b<a.length;b++){var d=a[b];IsOTCFund(d)&&c(d)}i.draw(!1)}}))))},exports.GetFundSwitchInfo=e});