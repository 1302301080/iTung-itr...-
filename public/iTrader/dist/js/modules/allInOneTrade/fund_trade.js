define(function(require,exports,module){function a(a,c){s=a,H.init($("#tab-fund-position"),c),v=$("#fund-switch-out-table"),u=$("#fund-switch-in-table"),y=$("#fund-subscribe-form"),z=$("#fund-redeem-form"),A=$("#fund-buy-btn"),B=$("#fund-sell-btn"),C=$("#fund-select-submit"),t=$("#switch-panel"),$("#fund-switch-panel").perfectScrollbar(),j(),b();var f=$(".switch-dropdown");f.parent().addClass("redeem-unit overflow-visible"),window.addEventListener("message",function(a){a.data&&"copy-symbol"===a.data.name&&("sell"===a.data.type&&(2==P?$("[href='#tab-fund-switch']").tab("show"):$("[href='#tab-fund-redeem']").tab("show")),E&&E.length>0?E.val(a.data.symbol).trigger("blur"):2==P?"sell"===a.data.type?$("#fund-switch-out-table .symbol-code").val(a.data.symbol).trigger("blur"):(k(w),$("#fund-switch-in-table .symbol-code:last").val(a.data.symbol).trigger("blur")):$(".tab-pane.active .symbol-code").val(a.data.symbol).trigger("blur"))},!1),S.InputFormat({format:function(a){return $._format.pattern(a,M)}}),$("#fund-switch-out-input").InputFormat({format:function(a){return $._format.pattern(a,N)}}),$("#fund-switch-out-input").InputPercentage({data:[10,20,50,100,0],total:0}),$("#input-unit").InputFormat({format:function(a){return $._format.pattern(a,N)}}),$("#input-unit").InputPercentage({data:[10,20,50,100,0],total:0}),z.find("#input-unit").click(function(){var a=z.find(".symbol-code").val();if(a&&D)for(var b in D){var c=D[b][0],d=c.indexOf("</i>");d>=0&&(c=c.substring(d+4,c.length)),c==a&&$(this).attr("data-total",D[b].availableQuantity||0)}}),T.on("input",function(){$(this).val($(this).val().toUpperCase())}),T.blur(function(){var a=$(this).val();e(a)}),s.find('a[data-toggle="tab"]').on("shown.bs.tab",function(a){var b=$(a.target).attr("href");"#tab-fund-switch"==b?(D=H.getAllPositions(),$("#fund-switch-out-table .symbol-code").PositionDrawdownList(D),P=2):"#tab-fund-redeem"==b?(D=H.getAllPositions(),$("#fund-reddem-input").PositionDrawdownList(D),P=1):"#tab-fund-subscribe"==b&&(P=0)}),T.keypress(function(a){13==a.keyCode&&$(this).trigger("blur")}),A.click(function(a){var b=a.target.attributes["data-typeside"].nodeValue,c=y.find(".symbol-code").val(),e=y.find("#input-amount").val();return c?e?void d(b):void y.find("#input-amount").focus():void y.find(".symbol-code").focus()}),B.click(function(a){var b=a.target.attributes["data-typeside"].nodeValue,c=z.find(".symbol-code").val(),e=z.find("#input-unit").val();return c?e?void d(b):void z.find("#input-unit").focus():void z.find(".symbol-code").focus()}),C.click(function(){for(var a=$("#fund-switch-in-table"),b=a.find("input"),c=0,d=0;d<b.length;d++){var e;$(b[d]).hasClass("fund-allocation")&&(e=$(b[d]).val(),c+=Number(e))}if(100==c)l();else{var f={};f.message=messages.fund_msg_allocation.text,J.alertError(f)}}),OrderMgr.on(function(){var a=$("#tab-fund-redeem").find(".symbol-code");a.focus()}),$(document).translate()}function b(){var a=$("#fund-market-table"),b=a.CreateDatatable({columnSchema:U,searching:!0,order:[0,"asc"],buttons:[{extend:"print",exportOptions:{columns:function(a,b,c){return a>1}},className:"btn-print"}],columnDefs:[{className:"copyprice",targets:[0]}]}),c=$(b.table().container()),d=b.buttons().container();d.addClass("pull-right"),d.find("a span").remove(),d.find("a").append($("<i class='fa fa-lg fa-print text-muted'></i>")),d.appendTo(c.find(".dataTables_filter label")),$("#fund-market-filter").appendTo($(".col-sm-6:eq(0)",c)),setTimeout(function(){$.get("/iTrader/fund",function(a){if(a){for(var c=0;c<a.length;c++){var d=a[c];if(d&&d[0]){d.DT_RowId="fund-"+d[0],d[30]&&(d.symbolName+=" ("+d[30]+")"),d[20]&&ExchangeMgr.exchange_flag[d[20]]&&(d[0]="<i class='flag-icon {0}' style='margin-right:5px;'></i>{1}".format(ExchangeMgr.exchange_flag[d[20]],d[0]));var e="";if(d.offeringDocLink){for(var f in d.offeringDocLink)e+="<a href='{0}' target='_blank'><i class='fa fa-link'></i>{1}</a>".format(d.offeringDocLink[f],messages.column_offering_document_link.text);d.offeringDocLink=e}b.UpdateRowData(a[c])}}b.draw()}})},1e3),a.click(function(a){var b=$(a.target),c=b.attr("class");if(c&&c.indexOf("copyprice")>=0)var d=b.text();d&&window.postMessage({name:"copy-symbol",exchange:"FUND",symbol:d,act:P},"/")})}function c(){initial_data.ticket.clearAfterSubmit}function d(a){var b=a,d="";if("0"==b){var e=y.find(".symbol-code").val(),f=y.find("#input-amount").val();d="symbol="+e+"&fundAmountUnit="+f+"&_csrf={0}&side={1}".format(R,b)}if("1"==b){var e=z.find(".symbol-code").val(),g=z.find("#input-unit").val();d="symbol="+e+"&fundAmountUnit="+g+"&_csrf={0}&side={1}".format(R,b)}G.popupFundDisclaimer(function(a){a?F.submitCalcorder(d,{confirmBoxTitle:messages.order_confirmation_fund_title.text}):c()})}function e(a){a&&q(a,function(a){IsOTCFund(a)||(a=null);var b=$(".tab-pane.active").find(".fund-info");if(b.empty(),!a)return void b.append($("<h4>",{text:messages.ticket_message_invalid_symbol.text}));var c=$("<h4>",{text:a.symbolName+(a[30]?"("+a[30]+")":"")});if(b.append(c).append(K.getProductProperties(a)),a){for(var d=$(".active [href=#tab-fund-redeem]").length>0?1:0,e=G.getFundInfo(a,{side:d}),g=$("<td>").append($("<small>",{html:e.nav?e.nav.name+"<b>"+e.nav.value+"</b>":""})),h=$("<td>").append($("<small>",{html:e.minAmt?e.minAmt.name+"<b>"+e.minAmt.value+"</b>":""})),i=$("<td>").append($("<small>",{html:e.txn?e.txn.name+"<b>"+e.txn.value+"</b>":""})),j=$("<td>").append($("<small>",{html:e.minTxnAmt?e.minTxnAmt.name+"<b>"+e.minTxnAmt.value+"</b>":""})),k=$("<td>").append($("<small>",{html:e.availableQuantity?e.availableQuantity.name+"<b>"+e.availableQuantity.value+"</b>":""})),l=$("<td>").append($("<small>",{html:e.minHoldingUnit?e.minHoldingUnit.name+"<b>"+e.minHoldingUnit.value+"</b>":""})),m=f([g,h,i,j,l,k]),n=$("<table>",{"class":"table table-condensed"}),o=0;o<m.length;o++)n.append(m[o]);b.append(n),b.translate()}})}function f(a){if(a){for(var b=[$("<tr>")],c=0;c<a.length;c++){var d=$(b[b.length-1]);if(d.find("td").length<3)a[c].text()&&d.append(a[c]);else{var e=$("<tr>");a[c].text()&&e.append(a[c]),b.push(e)}}if(e&&a.length%3!==0)for(var c=0;c<3-a.length%3;c++)e.append("<td></td>");return b}}function g(){var a={DT_RowId:"switch-out-row",0:"<div class='switch-dropdown'style='position:relative;'><input type='text' name='switchout' class='form-control input-sm symbol-code' autocomplete='off'></div>",symbolName:"",4:"<input type='text' name='switchout' id='fund-switch-out-input' class='form-control input-sm fund-unit' autocomplete='off'>"};x.UpdateRowData(a).draw()}function h(a){a=a||"x1";var b={DT_RowId:a,DT_RowClass:"switc-in-row",0:"<div class='input-group input-group-sm'><input type='text' name='switchin' class='form-control input-sm symbol-code' autocomplete='off'><span class='input-group-addon'><a href='javascript:SearchProduct_Search(\"FUND\",\"0\")'><i class='fa fa-search text-muted'></i></span></div>",symbolName:"",allocation:"<input type='text' name='switchin' class='form-control input-sm fund-allocation' autocomplete='off'>",removeIcon:Q};w.UpdateRowData(b).draw()}function i(){var a="<a href='javascript:void(0)'><i class='fa fa-lg fa-plus-circle text-info table-row-add'></i></a>";$(".fund-switch-tableGroup").after(a)}function j(){var a;a=!L&&[{width:"25%",targets:0},{width:"45%",targets:1},{width:"25%",targets:2},{width:"5%",targets:3}],x=v.CreateDatatable({columnSchema:V,info:!1,searching:!1,ordering:!1,paging:!1,columnDefs:a}),w=u.CreateDatatable({columnSchema:W,info:!1,searching:!1,ordering:!1,paging:!1,columnDefs:a}),h(),g(),i(),u.click(function(a){k(w),$(a.target).hasClass("table-row-remove")&&w.row($(a.target).parents("tr")).remove().draw()}),$(".table-row-add").click(function(){var a=(new Date).getMilliseconds();h(a)}),k(x),k(w)}function k(a){if(a){var b=$(a.table().container()),c=b.find(".symbol-code");c.keypress(function(a){13==a.keyCode&&p($(a.target).parents("tr"))}),c.on("input",function(){$(this).val($(this).val().toUpperCase())}),c.blur(function(a){p($(a.target).parents("tr"))}),c.parent().find(".input-group-addon").click(function(){E=null,E=$($(this).parent().find(".symbol-code"))}),b.find("input").each(function(){K.setInputSizeInMobile($(this))})}}function l(){$("#fund-switch-message").text("");var a=$("#fund-switch-form").serialize();a=a.replace(/%2C/g,"");var b;G.popupFundDisclaimer(function(d){d?F.submitCalcorder(a,{confirmBoxTitle:messages.order_confirmation_fund_title.text,addOrder:function(){showMessage({title:messages.order_confirmation_fund_title.text,buttonNameList:["submit","close"],message:m(a)+r(),onshown:function(){K.checkboxAction()},callback:function(d,e){var f=d.attr("id");"btn-submit"===f&&$.ajax({type:"post",url:"/iTrader/order/submit",data:a,success:function(a){var c=messages.order_confirmation_order_submitted_message.text,d=!0;a.error&&(c=messages.fund_switch_failed.text,d=!1),b=o(a.error,a.data),alertMessage({title:messages.dialog_information_title.text+" - "+c,message:b,type:d?BootstrapDialog.TYPE_SUCCESS:BootstrapDialog.TYPE_DANGER})}}),e.close(),c()}})}}):c()})}function m(){var a=$("<div>"),b=$("#fund-switch-form .symbol-code").serialize();b=b.replace(/%2C/g,"");for(var c=b.split("&"),d=[],e={},f=0;f<c.length;f++){var g=c[f].indexOf("=");if(g>0){var h=c[f].substr(g+1),i=c[f].substring(0,g);"switchout"==i&&(e[h]=i),d[h]=i}}for(var j=$("#fund-switch-out-table").find(".fund-unit").val(),k=$("#fund-switch-in-table"),l=k.find("input"),m={},o=0;o<l.length;o++){var h,i;$(l[o]).hasClass("symbol-code")&&(h=$(l[o]).val(),i=$(l[o]).parents("td").siblings(".subscription-amount").find(".fund-allocation").val(),m[h]?m[h]+=Number(i):m[h]=Number(i))}for(var p in d){var q={};if(q.switchType=d[p],q.symbol=O[p][0]+"("+O[p][30]+")",q.symbolName=O[p].symbolName,q.switchIn=m[O[p][0]]||"",q.txn=n(O[p],0),"switchout"==e[p]){for(var r=$("<tr>").append('<td style="width:150px;" class="text-danger"><b>'+messages.fund_switchout_confirm.text+"</b></td><td></td>"),s=$("<tr>").append("<td>"+messages.fund_switch_out_symbol.text+'</td><td style="font-weight: bold;">'+O[p][0]+"("+O[p][30]+")</td>"),t=$("<tr>").append("<td>"+messages.fund_name.text+'</td><td style="font-weight: bold;">'+O[p].symbolName+"</td>"),u=$("<tr>").append("<td>"+messages.order_confirmation_redemption_unit.text+'</td><td style="font-weight: bold;">'+$._format.pattern(j,N)+"</td>"),v=[r,s,t,u],w=$("<table>",{"class":"table table-condensed",style:"border:1px solid #dddddd"}),f=0;f<v.length;f++)w.append(v[f]);a.append(w)}if("switchin"==q.switchType){var r=$("<tr>").append('<td style="width:150px;" class="text-success"><b>'+messages.fund_switchin_confirm.text+'</b></td><td style="font-weight: bold;color: green;">'+m[O[p][0]]+"%</td>"),s=$("<tr>").append("<td>"+messages.fund_switch_in_symbol.text+'</td><td style="font-weight: bold;">'+q.symbol+"</td>"),t=$("<tr>").append("<td>"+messages.fund_name.text+'</td><td style="font-weight: bold;">'+q.symbolName+"</td>"),x=$("<tr>").append("<td>"+messages.ticket_fund_transaction_fee.text+'</td><td style="font-weight: bold;" class="text-success">'+q.txn+"</td>"),v=[r,s,t];q.txn&&v.push(x);for(var w=$("<table>",{"class":"table table-condensed",style:"border:1px solid #dddddd"}),f=0;f<v.length;f++)w.append(v[f]);a.append(w)}}return a.html()}function n(a,b){if(!a)return null;var c=a[3605],d=a[3407]||0;return 16&c?messages.FreeTransactionFee.text:32&c?0==b&&2&c?$._format.percentage(d,2):1==b&&4&c?$._format.percentage(a[3606]||d,2):"":0==b?$._format.percentage(d,2):1==b?$._format.percentage(a[3606]||d,2):""}function o(a,b){var c=(a?a:[]).concat(b?b:[]),d=$(I.GetFundSwitchInfo(null,c,{iconType:"enhance"}));return d.html()}function p(a){if(a){var b=$("<tr>",{"class":"switchOutTr"}),c=$(a).find(".symbol-code").val(),d=$(a).find(".symbol-name");if(c){var e={};if(D)for(var f in D){var g=D[f][0],h=g.indexOf("</i>");h>=0&&(g=g.substring(h+4,g.length)),e[g]=D[f].availableQuantity}if(O[c]){var i=O[c],j=G.getFundInfo(i,{side:1}),k=$("<td>").append($("<small>",{html:j.nav?j.nav.name+"<b>"+j.nav.value+"</b>":""}));if("switch-out-row"===$(a).attr("id")){var l=0;e[c]&&(l=e[c]),$("#fund-switch-out-input").attr("data-total",l),$(".switchOutTr").remove();var m=$("<td>").append($("<small>",{html:j.availableQuantity?j.availableQuantity.name+"<b>"+j.availableQuantity.value+"</b>":""})),n=$("<td>").append($("<small>",{html:j.minHoldingUnit?j.minHoldingUnit.name+"<b>"+j.minHoldingUnit.value+"</b>":""}));b.append(k),b.append(n),b.append(m),v.append(b),d.html(K.getFullSymbolName(i))}else{var o=j.nav.name+"<b>"+j.nav.value+"</b>";d.html(K.getFullSymbolName(i)+o)}}else q(c,function(f){if(f){var g=G.getFundInfo(f,{side:1}),h=$("<td>").append($("<small>",{html:g.nav?g.nav.name+"<b>"+g.nav.value+"</b>":""}));if("switch-out-row"===$(a).attr("id")){$(".switchOutTr").remove();var i=0;e[c]&&(i=e[c]),$("#fund-switch-out-input").attr("data-total",i);var j=$("<td>").append($("<small>",{html:g.availableQuantity?g.availableQuantity.name+"<b>"+g.availableQuantity.value+"</b>":""})),k=$("<td>").append($("<small>",{html:g.minHoldingUnit?g.minHoldingUnit.name+"<b>"+g.minHoldingUnit.value+"</b>":""}));b.append(h),b.append(k),b.append(j),v.append(b),d.html(K.getFullSymbolName(f))}else{var l=g.nav.name+"<b>"+g.nav.value+"</b>";d.html(K.getFullSymbolName(f)+l)}O[c]=f}else d.text(messages.ticket_message_invalid_symbol.text)})}}}function q(a,b){a?O[a]?b(O[a]):$.get("/iTrader/product?symbol="+a,function(c){var d=c.data;d?(O[a]=d,b(d)):b()}):b()}function r(){var a=$("<div>"),b=$("<div>",{"data-i18n":"order_confirmation_fund_disclosure"});return a.append(b),a.translate(),a.html()}var s,t,u,v,w,x,y,z,A,B,C,D,E,F=require("ticket"),G=require("fund-ticket"),H=require("fund-position"),I=require("fundbook"),J=require("dialog"),K=require("full-trade"),L=require("mobile").GetIsMobile(),M="#,##0.00######",N=initial_data.format.fund_unit,O={},P=0,Q="<a href='javascript:void(0)'><i class='fa fa-lg fa-remove text-danger table-row-remove'></i></a>",R=$("input[name=_csrf]").val(),S=$("#input-amount"),T=$(".symbol-code"),U=[{name:"symbol",key:"0",i18n:"fund_symbol_code"},{name:"symbol name",key:"symbolName",i18n:"fund_name"},{name:"nav",key:"nav",i18n:"column_fund_nav","class":"text-right"},{name:"currency",key:"23",i18n:"column_currency"},{name:"risk",key:"RPQLevel",i18n:"column_risk_level","class":"text-right"},{name:"cies",key:"CIESFlag",i18n:"column_CIES"},{name:"professional investor",key:"PIFlag",i18n:"column_professional_investor"},{name:"derivative product",key:"DerivativeFalg",i18n:"column_derivative_product"},{name:"offering document",key:"offeringDocLink",i18n:"column_offering_document_link"}],V=[{name:"symbol",key:"0",i18n:"fund_switch_out_symbol"},{name:"symbol name",key:"symbolName",i18n:"fund_name","class":"symbol-name",mobile:!1},{name:"unit",key:"4",i18n:"fund_redeem_unit","class":"redeem-unit overflow-visible"},{name:"remove",key:"removeIcon"}],W=[{name:"symbol",key:"0",i18n:"fund_switch_in_symbol"},{name:"symbol name",key:"symbolName",i18n:"fund_name","class":"symbol-name",mobile:!1},{name:"allocation",key:"allocation",i18n:"fund_switch_in_allocation","class":"subscription-amount",headClass:"bubble-title",headTitle:messages.fund_msg_allocation.text},{name:"remove",key:"removeIcon"}];initial_data.views.full_trade&&initial_data.views.full_trade.fund&&initial_data.views.full_trade.fund.listSchema&&(U=initial_data.views.full_trade.fund.listSchema),$.fn.PositionDrawdownList=function(a){function b(){var b,c=$("<div>",{"class":"dropdown-menu fund-dropdownDiv",style:"max-height:180px;overflow-x: hidden;padding:0; min-width:300px;"}),d=$("<table>",{"class":"table table-hover table-condensed",style:"margin:0"}),e=[];if(a)for(var f in a)if(!(a[f].availableQuantity<=0)){var g={},h=a[f][0];g.symbol=h,g.symbolName=a[f].symbolName,g.availableQuantity=a[f].availableQuantity,e.push(g)}if(e.length>0)for(var i in e){var j=$("<td>",{html:e[i].symbol,"data-symbol":e[i].symbol}),k=$("<td>"+e[i].symbolName+"</td>"),l=$("<td data-value="+e[i].availableQuantity+">"+$._format.pattern(e[i].availableQuantity,N)+"</td>"),m=$("<tr>",{style:"cursor:pointer"});m.append(j),m.append(k),m.append(l),b=d.append(m)}else b=messages.ticket_fund_msg_symbolTable.text;return c.append(b),c}if(!$(this).attr("data-apply-popup")){$(this).attr("data-apply-popup",!0);var c,d=$(this);$(document).click(function(){c&&c.length>0&&(c.remove(),c.css({border:"0"}))}),$(this).mouseover(function(){$(".redeem-unit").removeAttr("title")}),$("#switch-out-row").mouseover(function(){$(".redeem-unit").removeAttr("title")}),$(this).on("click",function(a){if(!(d.nextAll().length>0)){var e=b();c=$("<div>",{"class":"position-popup-div"}),c.append(e),e.perfectScrollbar(),e.css({display:"block"}),e.css({border:"1px solid #dddddd"}),d.after(c),c.find("table tr").click(function(a){a.stopPropagation();var b=$(this).find("td").first().text();c.remove(),e.css({border:"0"}),b&&d.val(b).trigger("blur")}),a.stopPropagation()}}.bind(this))}},exports.init=a});