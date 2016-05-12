'use strict';

function debug() {
    function _prefix() {
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
    Array.prototype.unshift.call(arguments, _prefix());
    console.log.apply(console, arguments);
}

function error() {
    Array.prototype.unshift.call(arguments, 'EE ');
    debug(arguments);
}

function webfx_defineModule(name, module) {
    if (this.videofx === undefined) {
        debug('defining empty container for videofx on', this);
        this.videofx = {};
    }
    this.videofx[name] = module(this);
}