define(function(require,exports,module){function a(){for(var a=$(".tab-pane.active").find(".pending-submit-table"),b=$(a).clone(),c=$(b).attr("side"),d=$(b).find("tr"),e=1;e<d.length;e++){var f=$(d[e]).find("input");f.each(function(){$(this).parent().addClass("text-right"),$(this).parent().removeClass("full-trade-input"),$(this).parent().html("<span >{0}</span>".format($(this).val()))})}$(b).find("tr").each(function(){$($(this).find("td,th")[0]).remove();var a=$($(this).find("td,th")[1]).text();j||$($(this).find("td,th")[1]).remove(),$($(this).find("td,th")[0]).attr("title",a).removeClass("pointer"),1==c&&$(this).find("td:last,th:last").remove()});var g=$("<small>").append($("<div>"));g.append(b);var h=$("<div>").append(g);return h.html()}function b(a,b,c){if(b){for(var d=(c?c.side:0)||0,e=$("<table>",{"class":"table table-bordered table-condensed "+(0==d?"table-green":"table-red")}),f=$("<tr>"),g=0;g<b.length;g++)f.append($("<th>",{html:b[g].text||"","data-key":b[g].key||""}));if(e.append($("<thead>").append(f)),a&&a.length>0)for(var g=0;g<a.length;g++){var h=a[g];if(h[0]){for(var f=$("<tr>",{"data-symbol":h[0]}),i=0;i<b.length;i++){var j=b[i];if("input"===j.type)f.append($("<td>",{"class":j["class"]||""}).append($("<input>",{"data-key":j.key,"class":"form-control input-sm text-right",value:h[j.key]||""})));else if("icon"===j.type)f.append($("<td>",{style:"text-align:center;"}).append(k)),f.find(".fa-remove").click(function(){$(this).parents("tr").remove()});else{var l="";"symbolName"!==j.key&&"25"!==j.key||(l=h[j.key]),f.append($("<td>",{"data-key":j.key,"class":j["class"],html:h[j.key]||"",title:l}))}}e.append(f)}}return $("<div>").append($("<small>").append(e))}}function c(a,b,c){if(b){c=c||{};var d=$(".tab-pane.active").find(".pending-submit-table");if(d.find("thead").length<=0){for(var e=$("<tr>"),f=0;f<b.length;f++)e.append($("<th>",{html:b[f].text||"","data-key":b[f].key||""}));d.append($("<thead>").append(e))}if(c.clear&&d.find("tbody tr").remove(),a)for(var f=0;f<a.length;f++){var g=a[f];if(g[0]){var e,h=d.find("tr[data-symbol={0}]".format(g[0]));if(h.length>0){e=$(h[0]);for(var i=e.find("[data-key]"),j=0;j<i.length;j++){var l=g[$(i[j]).attr("data-key")]||"";$(i[j]).html(l).val(l)}}else{e=$("<tr>",{"data-symbol":g[0]});for(var m=0;m<b.length;m++){var n=b[m];if("input"===n.type){var o=!1;3==n.key&&"0.00"===g[n.key]&&(o=!0),e.append($("<td>",{"class":n["class"]||""}).append($("<input>",{"data-key":n.key,"class":"form-control input-sm text-right",value:g[n.key]||"",disabled:o})))}else if("icon"===n.type)e.append($("<td>",{style:"text-align:center;"}).append(k)),e.find(".fa-remove").click(function(){$(this).parents("tr").remove()});else{var p="";"symbolName"!==n.key&&"25"!==n.key||(p=$(g[n.key]).text()),e.append($("<td>",{"data-key":n.key,"class":n["class"],html:g[n.key]||"",title:p}))}}"function"==typeof c.newRowHandler&&c.newRowHandler(e),d.append(e)}}}}}function d(a){if(!a)return"";var b;if("10"==a&&initial_data.views.full_trade.fund.disclosure)b="order_confirmation_fund_disclosure";else{if("6"!=a||!initial_data.views.full_trade.bond.disclosure)return"";b="order_confirmation_bond_disclosure"}var c=$("<label>").append($("<input>",{type:"checkbox","required-accept-disclosure":!1})).append($("<span>",{"data-i18n":b})),d=$("<div>",{"class":"checkbox fullTrade_checkbox"});d.append(c);var e=$("<div>").append(d);return $(d).translate(),e.html()}function e(){var a=$("[required-accept-disclosure]").parents(".modal-content").find("#btn-submit");a.attr("disabled",!0),$("[required-accept-disclosure]").click(function(){var b=$(this).get(0).checked;a.attr("disabled",!b)})}function f(a){j&&(a.removeClass("form-control"),a.width="100px")}function g(a){if(a){for(var b=[$("<tr>")],c=0;c<a.length;c++){var d=$(b[b.length-1]);if(d.find("td").length<3)a[c].text()&&d.append(a[c]);else{var e=$("<tr>");a[c].text()&&e.append(a[c]),b.push(e)}}return b}}function h(a){if(!a)return"";var b=$("<p>").append($("<i>",{text:a[23],"class":"highlight-tag highlight-tag-sm",style:"cursor: help;",title:messages.column_currency.text}));return a[3409]&&b.append($("<i>",{text:"Risk "+a[3409],"class":"highlight-tag highlight-tag-sm",style:"cursor: help;margin-left: 10px;","data-i18n":"tag_RPQ",title:messages.tag_RPQ.title})),"Y"==a[3602]&&b.append($("<i>",{text:"CIES","class":"highlight-tag highlight-tag-sm",style:"cursor: help;margin-left: 10px;","data-i18n":"tag_CIES",title:messages.tag_CIES.title})),1==a[3603]&&b.append($("<i>",{text:"PI","class":"highlight-tag highlight-tag-sm",style:"cursor: help;margin-left: 10px;","data-i18n":"tag_professional_investor",title:messages.tag_professional_investor.title})),1024&a[3605]&&b.append($("<i>",{text:"D","class":"highlight-tag highlight-tag-sm",style:"cursor: help;margin-left: 10px;","data-i18n":"tag_derivative_product",title:messages.tag_derivative_product.title})),b}function i(a){if(a){var b=$("<div>").append($("<div>",{text:a.symbolName||""}));return b.append(h(a)),b.html()}}var j=require("mobile").GetIsMobile(),k="<a href='javascript:void(0)'><i class='fa fa-lg fa-remove text-danger table-row-remove'></i></a>";exports.addNewPendSymbol=c,exports.createTable=b,exports.getSelectComfirmation=a,exports.getDiscolsureCheckBox=d,exports.checkboxAction=e,exports.setInputSizeInMobile=f,exports.getInfo=g,exports.getFullSymbolName=i,exports.getProductProperties=h});