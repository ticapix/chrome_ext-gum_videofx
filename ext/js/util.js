var _short_name = chrome.runtime.getManifest().short_name

function debug() {
    Array.prototype.unshift.call(arguments, _short_name || '-')
    console.log.apply(console, arguments)
}

function inject_code(fct, auto_run) {
    var elt = document.createElement("script");
    elt.setAttribute("type", "text/javascript");
    elt.appendChild(document.createTextNode(fct));
    if (auto_run === true) {
        elt.appendChild(document.createTextNode("(" + fct.name + ")()"));
    }
    var prom = new Promise(function(resolve, reject) {
        (document.getElementsByTagName('head')[0] || document.body || document.documentElement).appendChild(elt)
        debug('injecting function', fct.name, 'in', elt.parentNode.nodeName);
        resolve()
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
        (document.getElementsByTagName('head')[0] || document.body || document.documentElement).appendChild(elt)
        debug('injecting url', url, 'in', elt.parentNode.nodeName);
    })
    return prom;
}