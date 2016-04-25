var _ext_short_name = chrome.runtime.getManifest().short_name + '(cs)'

function debug() {
    Array.prototype.unshift.call(arguments, _ext_short_name || '-');
    console.log.apply(console, arguments);
}

function inject_code(fct, auto_run) {
    var elt = document.createElement("script");
    elt.setAttribute("type", "text/javascript");
    elt.appendChild(document.createTextNode(fct));
    if (auto_run === true) {
        elt.appendChild(document.createTextNode("(" + fct.name + ")()"));
    }
    var prom = new Promise(function(resolve, reject) {
        (document.getElementsByTagName('head')[0] || document.body || document.documentElement).appendChild(elt);
        debug('injecting function', fct.name || '<inline>', 'in', elt.parentNode.nodeName);
        resolve();
    })
    return prom;
}

function inject_script(url) {
    var elt = document.createElement("script");
    elt.setAttribute("type", "text/javascript");
    elt.setAttribute("src", url);
    var prom = new Promise(function(resolve, reject) {
        elt.onload = function() {
            resolve();
        };
        (document.getElementsByTagName('head')[0] || document.body || document.documentElement).appendChild(elt);
        debug('injecting url', url, 'in', elt.parentNode.nodeName);
    })
    return prom;
}

function check_browser_feature_support() {
    if (window.webkitMediaStream === undefined) {
        debug('MediaStream not supported')
        return false;
    }
    if (Navigator.prototype.webkitGetUserMedia === undefined) {
        debug('GetUserMedia not supported')
        return false;
    }
    if (document.createElement('canvas').captureStream === undefined) {
        debug('HTMLCanvasElement.captureStream not supported. Try enabling flag #enable-experimental-web-platform-features in chrome://flags/')
        return false;
    }
    return true;
}