define(function(require,exports,module){function a(){if(r){l.empty();for(var a={name:{i18n:"column_market"},data:[{key:m,value:b(m)}]},c=0;c<q.length;c++){var d=q[c];d!=m&&a.data.push({key:d,value:b(d)})}l.CreateDrowdownGroup(a),r=!1}}function b(a){return a?"ALL"===a?messages.ALL.text:$._map.exchange(a):""}function c(a){if(j&&!(j.length<=0)&&"object"==typeof a&&a[6]){var b=a[6],c=a[20];if("ALL"==m||m==c){q.indexOf(c)<0&&(q.push(c),r=!0),a.DT_RowId="order-"+b,h(a);var e=f(a),i=g(a);e?a.change="<a href='javascript:void(0);'><i class='fa fa-edit fa-lg text-success' title='{0}' action='change'></i></a>".format(messages.orderbook_change.text):a.change="<i class='fa fa-edit fa-lg text-muted' title='{0}'></i>".format(messages.orderbook_change.text),i?a.cancel="<a href='javascript:void(0);'><i class='fa fa-remove fa-lg text-danger' title='{0}' action='cancel'></i></a>".format(messages.orderbook_cancel.text):a.cancel="<i class='fa fa-remove fa-lg text-muted' title='{0}'></i>".format(messages.orderbook_cancel.text);var l=k.UpdateRowData(a);p.ApplyColor(l),initial_data.views.trade.order_book.trade_detail&&l&&l.isNewRow&&d(l)}}}function d(a){a&&a.data()&&$(a.node()).find(".pointer").click(function(){if(!o){var b=a.data();if(b&&b[6]){var c=0;b._raw&&1==b._raw[11]&&(c=1),showMessage({title:messages.order_detail_title.text+b[tags.account],type:"0"==c?BootstrapDialog.TYPE_SUCCESS:BootstrapDialog.TYPE_DANGER,load:{url:"/iTrader/order/get?orderNo="+b[6],callback:function(a){$("#order-detail-datetime").text(b.datetime),$("#order-detail-side").text(b[11]),$("#order-detail-status").text(b[5]),p.FormatOrderInfo(b[0],a.$modal,function(a){0==Number($("#order-detail-avgPrice").text())&&$("#order-detail-avgPrice").text(0),e(b,a)})}}})}}})}function e(a,b){if(a&&a.trades&&!$.isEmptyObject(a.trades)){var c=$("#order-detail-table"),d=c.CreateDatatable({columnSchema:initial_data.views.trade.order_book.trade_schema,columnHeaderPrefix:"trade_detail_header_",paging:!1,ordering:!1,info:!1,searching:!1,autoWidth:!0});for(var e in a.trades){var f=$.extend({},a.trades[e]);"undefined"==typeof f.originalTradePrice&&""===f.originalTradePrice||(f[3]=f.originalTradePrice),f[3]=getDisplayPrice(f[3],"order",a),d.UpdateRowData(f)}d.draw(),c.format(),c.translate(),c.removeClass("hidden")}}function f(a){if(a&&a._raw){if(a.isBulkChildOrder)return!1;if(p.IsPriceQuoteOrder(a))return!1;var b=initial_data.views.trade.order_book.change;if(b){var c=a._raw[5],d=a._raw[400];return b.status.indexOf(c)>=0&&(b.channel.indexOf(d)>=0||b.channel.indexOf("*")>=0)?b.changeable:!b.changeable}}}function g(a){if(a&&a._raw){if(a.isBulkChildOrder)return!1;var b=initial_data.views.trade.order_book.cancel;if(b){var c=a._raw[5],d=a._raw[400];return b.status.indexOf(c)>=0&&(b.channel.indexOf(d)>=0||b.channel.indexOf("*")>=0)?b.cancelable:!b.cancelable}}}function h(a){if(a&&a._raw){var b=a._raw;if(b[489]&&32768&b[489]){a.isBulkChildOrder=!0;var c=b[25]||"";c.indexOf(messages.remark_bulk_order.text)<0&&(c=messages.remark_bulk_order.text+c),a[25]=c}}}var i,j,k,l,m,n=require("ticket"),o=require("mobile").GetIsMobile(),p=require("util"),q=[],r=!0,s={};exports.init=function(b,d){if(i=b,d=d||{defaultMarket:"ALL"},m=d.defaultMarket,q.push(m),"ALL"!=m&&q.push("ALL"),!(i.length<=0||(j=$("#orderbook-table"),j.length<=0))){for(var e=initial_data.views.trade.order_book.schema,f=[],g=0;g<e.length;g++)f.push(e[g]);f.push({key:"hide_exchange"}),k=j.CreateDatatable({columnSchema:f,columnHeaderPrefix:"orderbook_header_",order:[3,"desc"],aoColumnDefs:[{bSortable:!1,aTargets:[0,1]},{className:"pointer",targets:[3]},{className:"prevent-popup-detail",targets:[0,1]}],buttons:[{extend:"print",exportOptions:{columns:function(a,b,c){return a>1}},className:"btn-print"}]});var h=k.columns()[0].length;k.column(h-1).visible(!1);var o=$(k.table().container()),r=k.buttons().container();r.addClass("pull-right"),r.find("a span").remove(),r.find("a").append($("<i class='fa fa-lg fa-print text-muted'></i>")),r.appendTo(o.find(".dataTables_filter label")),$("#orderbook-filter").appendTo($(".col-sm-6:eq(0)",o)),l=$("#orderbook-exchange-dropdown-group"),OrderMgr.on(function(b){if(b){for(var d=0;d<b.length;d++){var e=b[d];p.IsOrderInPriceQuoteStage(e)||"cash"===e.voucherType||IsOTCFund(e)||(s[e[6]]=e,c(e))}k.draw(!1),a()}});for(var t=$("#orderbook-status-dropdown-group"),u={name:{i18n:"history_order_filter_status"},data:[{key:"ALL",value:messages.ALL.text}]},v=initial_data.views.trade.order_book.filter.status,g=0;g<v.length;g++)u.data.push({key:v[g],value:$._map.status(v[g])});t.CreateDrowdownGroup(u),l.on("change",function(a,b){m=b,k.clear();for(var d in s)c(s[d]);k.draw()}),a();var w=k.columns().dataSrc();if(w.length>0){var x=w.indexOf("5");x>=0&&t.on("change",function(a,b){b="ALL"===b?"":$._map.status(b),k.column(x).search(b).draw()})}j.on("click",function(a){var b=$(a.target),c=b.attr("action"),d=b.parents("tr").attr("id");d&&d.length>6&&("change"===c?n.changeOrder(d.substring(6)):"cancel"===c&&n.cancelOrder(d.substring(6)))}),i.translate()}}});