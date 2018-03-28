exports.default = function (value, options) {
    return this.handleOptions(value, options)
}

exports.zerofill = function (value, options) {
    if (value && options && typeof (options.size) === 'number') {
        if (!isNaN(value)) {
            value = value.toString()
            while (value.length < options.size) {
                value = '0' + value
            }
        }
    }
    // return this.handleOptions(value, options)
}

exports.suffix = function (value, options) {
    if (value && options) {
        if (options.suffix && !value.toUpperCase().endWith(options.suffix.toUpperCase())) {
            value += options.suffix
        }
    }
    return this.handleOptions(value, options)
}

function handleOptions(value, options) {
    if (options.case === 'upper') {
        value = value.toUpperCase()
    } else if (options.case === 'lower') {
        value = value.toLowerCase()
    }
    return value
}