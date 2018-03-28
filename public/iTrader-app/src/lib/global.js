import $ from 'jquery'
/* Javascript entension ======================================================= */
String.prototype.startWith = function (str) {
    var reg = new RegExp("^" + str);
    return reg.test(this);
}

String.prototype.endWith = function (str) {
    var reg = new RegExp(str + "$");
    return reg.test(this);
}

// format {0}, start as 0
String.prototype.format = function () {
    var str = this
    if (arguments.length > 0) {
        var array
        if (arguments[0] instanceof Array) {
            array = arguments[0]
        } else {
            array = arguments
        }
        for (var i = 0; i < array.length; i++) {
            var re = new RegExp('\\{' + i + '\\}', 'gm')
            str = str.replace(re, array[i])
        }
    }
    return str
}

// format %s1, start as 1
String.prototype.cformat = function () {
    var str = this
    if (arguments.length > 0) {
        var array
        if (arguments[0] instanceof Array) {
            array = arguments[0]
        } else {
            array = arguments
        }
        for (var i = 0; i < array.length; i++) {
            var re = new RegExp('%' + (i + 1) + '[s,d,n]', 'gm')
            str = str.replace(re, array[i])
        }
    }
    return str
}

window.onerror = function (msg, url, lineNo, columnNo, error) {
    $.post('/c', {
        msg: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error,
        ua: navigator.userAgent
    })
    return false
}