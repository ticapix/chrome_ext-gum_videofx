function inject_fct(fct, auto_run) {
    return new Promise(function(resolve, reject) {
        var elt = document.createElement("script");
        elt.setAttribute("type", "text/javascript");
        elt.appendChild(document.createTextNode(fct));
        if (auto_run === true) {
            elt.appendChild(document.createTextNode("(" + fct.name + ")()"));
        }
        (document.getElementsByTagName('head')[0] || document.body || document.documentElement).appendChild(elt);
        debug('injecting function', fct.name, 'in', elt.parentNode.nodeName);
        resolve();
    })
}

function inject_code(code) {
    return new Promise(function(resolve, reject) {
        var elt = document.createElement("script");
        elt.setAttribute("type", "text/javascript");
        elt.appendChild(document.createTextNode(code));
        (document.getElementsByTagName('head')[0] || document.body || document.documentElement).appendChild(elt);
        debug('injecting code', (code.substring(0, 40) + (code.length > 40 ? '...' : '')), 'in', elt.parentNode.nodeName);
        resolve();
    })
}

function inject_file(filename) {
    return new Promise(function(resolve, reject) {
        chrome.runtime.sendMessage({
            get_script: filename
        }, function(response) {
            debug('injecting', filename, 'code');
            return inject_code(response).then(function() {
                resolve();
            })
        })
    })
}

function inject_script(url) {
    return new Promise(function(resolve, reject) {
        var elt = document.createElement("script");
        elt.setAttribute("type", "text/javascript");
        elt.setAttribute("src", url);
        elt.onload = function() {
            resolve();
        };
        (document.getElementsByTagName('head')[0] || document.body || document.documentElement).appendChild(elt);
        debug('injecting url', url, 'in', elt.parentNode.nodeName);
    })
}
