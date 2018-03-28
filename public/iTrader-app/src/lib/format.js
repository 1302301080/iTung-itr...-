var NA = '--'

function formatWithPattern(number, pattern) {
    var num
    if (typeof number === 'string') {
        num = number.replace(/,/g, '')
    } else num = number
    if (num == Number.MIN_VALUE || isNaN(num)) return NA
    var fmtarr = pattern ? pattern.split('.') : [''];
    var precisionLength = 0
    if (fmtarr.length > 0) {
        precisionLength = fmtarr[fmtarr.length - 1].length
    }
    var strarr = num ? Number(Number(num).toFixed(precisionLength)).toString().split('.') : ['0'];
    var retstr = '';

    var str = strarr[0];
    var fmt = fmtarr[0];
    var i = str.length - 1;
    var comma = false;
    for (var f = fmt.length - 1; f >= 0; f--) {
        switch (fmt.substr(f, 1)) {
            case '#':
                if (i >= 0) retstr = str.substr(i--, 1) + retstr;
                break;
            case '0':
                if (i >= 0) retstr = str.substr(i--, 1) + retstr;
                else retstr = '0' + retstr;
                break;
            case ',':
                comma = true;
                retstr = ',' + retstr;
                break;
        }
    }
    if (i >= 0) {
        if (comma) {
            var l = str.length;
            for (; i >= 0; i--) {
                retstr = str.substr(i, 1) + retstr;
                if (i > 0 && ((l - i) % 3) == 0) retstr = ',' + retstr;
            }
        }
        else retstr = str.substr(0, i + 1) + retstr;
    }

    retstr = retstr + '.';
    str = strarr.length > 1 ? strarr[1] : '';
    fmt = fmtarr.length > 1 ? fmtarr[1] : '';
    i = 0;
    for (var f = 0; f < fmt.length; f++) {
        switch (fmt.substr(f, 1)) {
            case '#':
                if (i < str.length) retstr += str.substr(i++, 1);
                break;
            case '0':
                if (i < str.length) retstr += str.substr(i++, 1);
                else retstr += '0';
                break;
        }
    }
    return retstr.replace(/^,+/, '').replace(/\.$/, '');
}


exports.amount = function (value) {
    return formatWithPattern(value, '#,###.00')
}

exports.price = function (value) {
    return formatWithPattern(value, '#,###.000')
}

exports.quantity = function (value) {
    return formatWithPattern(value, '#,###')
}


