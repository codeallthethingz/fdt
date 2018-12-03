var require;
if (!require) {
    require = function() {};
}
else {
    var moment = require('moment');
}


if (!module) {
    var module = {};
    module.exports = {};
}

var POSITIVE = 1;
var NEGATIVE = 2;

function parseFilters(filterText) {
    if (!filterText || filterText.trim() == '') {
        return [];
    }
    var tokens = filterText.trim().split(/\s+/);
    var filters = [];
    var phraseToken = '';
    var phraseTokenType = null;
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i].trim().toLowerCase();
        if (phraseTokenType != null || token.startsWith('"') || token.startsWith('-"') || token.endsWith('"')) {
            if (token.startsWith('"')) {
                phraseToken += token.substr(1);
                phraseTokenType = POSITIVE;
                continue;
            }
            else if (token.startsWith('-"')) {
                phraseToken += token.substring(2);
                phraseTokenType = NEGATIVE;
                continue;
            }
            else if (token.endsWith('"')) {
                phraseToken = phraseToken + ' ' + token.substr(0, token.length - 1);
                token = (phraseTokenType == NEGATIVE ? '-' : '') + phraseToken;
                phraseToken = '';
                phraseTokenType = null;
            }
            else {
                phraseToken += ' ' + token;
                continue;
            }
        }
        if (token.startsWith('-')) {
            filters.push({ token: token.substring(1), type: NEGATIVE });
        }
        else {
            filters.push({ token: token, type: POSITIVE });
        }
    }
    return filters;
}

function matchesFilter(filters, haystack) {
    if (filters.length == 0) {
        return true;
    }
    for (var i = 0; i < filters.length; i++) {
        if (haystack.includes(filters[i].token) && filters[i].type == NEGATIVE) {
            return false;
        }
    }
    for (var i = 0; i < filters.length; i++) {
        if (!haystack.includes(filters[i].token) && filters[i].type == POSITIVE) {
            return false;
        }
    }
    return true;
}


function iso(someDate) {
    var value = moment(someDate).format('YYYY-MM-DD HH:mm');
    return value;
}

module.exports.parseFilters = parseFilters;
module.exports.NEGATIVE = NEGATIVE;
module.exports.POSITIVE = POSITIVE;
module.exports.matchesFilter = matchesFilter;
module.exports.iso = iso;
