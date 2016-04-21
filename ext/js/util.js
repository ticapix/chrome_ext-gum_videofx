function debug() {
    Array.prototype.unshift.call(arguments, 'Video Effect:')
    console.log.apply(console, arguments)
}

function inject_code(fct, auto_run) {
    var inject = document.createElement("script");
    inject.setAttribute("type", "text/javascript");
    inject.appendChild(document.createTextNode(fct));
    if (auto_run === true) {
        inject.appendChild(document.createTextNode("(" + fct.name + ")()"));
    }
    var prom = new Promise(function(resolve, reject) {
        var targ = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
        debug('injecting function', fct.name, 'in', targ.nodeName);
        targ.appendChild(inject);
        resolve()
    })
    return prom;
}

function inject_script(url) {
    var inject = document.createElement("script");
    inject.setAttribute("type", "text/javascript");
    inject.setAttribute("src", url);
    var prom = new Promise(function(resolve, reject) {
        inject.onload = function() {
            resolve();
        }
        var targ = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
        debug('injecting url', url, 'in', targ.nodeName);
        targ.appendChild(inject);
    })
    return prom;
}
