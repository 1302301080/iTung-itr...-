function MarketPrice_Copy(){var a=window.status||window.defaultStatus||window.title;if(a){window.status="",window.defaultStatus="";var b=a.split(";");if(b.length>=3){var c=0;if(0===b[0].indexOf("T#"))d=b[0].substring(2,b[0].length),c=b[1];else{var d=b[0].substring(b[0].indexOf(":")+1,b[0].length);c=b[2]}MarketPrice_SymbolInput({symbol:d,price:c})}}}function receiveMessage(a){if(a&&a.data){for(var b=a.data.split("&"),c={},d=0;d<b.length;d++){var e=b[d].split("=");2===e.length&&("stock"===e[0]?c.symbol=e[1]:"price"===e[0]&&(c.price=e[1]))}MarketPrice_SymbolInput(c)}}function MarketPrice_SymbolInput(a){a&&a.symbol&&a.price&&(window.opener?"function"==typeof window.opener.TicketSymbol_Input&&window.opener.TicketSymbol_Input(a):window.parent?window.parent.TicketSymbol_Input(a):"function"==typeof TicketSymbol_Input&&TicketSymbol_Input(a))}window.onload=function(){setInterval(function(){MarketPrice_Copy()},300);var a=document.getElementById("market-price-form");a&&a.submit()},window.addEventListener("message",receiveMessage,!1);