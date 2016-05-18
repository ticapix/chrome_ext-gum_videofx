'use strict';

function inject_fct(fct, auto_run) {
    var elt = document.createElement("script");
    elt.setAttribute("type", "text/javascript");
    elt.appendChild(document.createTextNode(fct));
    if (auto_run === true) {
        elt.appendChild(document.createTextNode("(" + fct.name + ")()"));
    }
    var target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
    log.debug('injecting function', fct.name, 'in', target.nodeName);
    target.appendChild(elt);
    return Promise.resolve();
}

function inject_code(code) {
    var elt = document.createElement("script");
    elt.setAttribute("type", "text/javascript");
    elt.appendChild(document.createTextNode(code));
    var target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
    log.debug('injecting code', (code.substring(0, 40) + (code.length > 40 ? '...' : '')), 'in', target.nodeName);
    target.appendChild(elt);
    return Promise.resolve();
}

function inject_file(filename) {
    return new Promise(function(resolve, reject) {
        chrome.runtime.sendMessage({
            get_file: filename
        }, function(response) {
            log.debug('injecting', filename, 'code');
            return inject_code(response).then(function() {
                resolve();
            });
        });
    });
}

function inject_script(url) {
    return new Promise(function(resolve, reject) {
        var elt = document.createElement("script");
        elt.setAttribute("type", "text/javascript");
        elt.setAttribute("src", url);
        elt.onload = function() {
            resolve();
        };
        var target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
        log.debug('injecting url', url, 'in', target.nodeName);
        target.appendChild(elt);
    });
}