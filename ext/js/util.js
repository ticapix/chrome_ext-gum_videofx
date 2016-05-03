'use strict';

function debug() {
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
    Array.prototype.unshift.call(arguments, prefix);
    console.log.apply(console, arguments);
}