'use strict';
var log = (function() {
    var _prefix = function() {
        var prefix = typeof application_name !== 'undefined' ? application_name : '-';
        if (chrome.extension === undefined) {
            prefix += '(web)';
        } else {
            prefix = chrome.runtime.getManifest().short_name;
            if (location.protocol === 'chrome-extension:') {
                prefix += '(bg)';
            } else {
                prefix += '(cs)';
            }
        }
        return prefix;
    }
    var debug = function() {
        Array.prototype.unshift.call(arguments, _prefix());
        console.log.apply(console, arguments);
    }
    var error = function() {
        Array.prototype.unshift.call(arguments, _prefix());
        console.error.apply(console, arguments);
    }
    return {
        debug: debug,
        error: error
    }
})();