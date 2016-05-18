'use strict';

function check_browser_feature_support() {
    if (window.webkitMediaStream === undefined) {
        log.debug('MediaStream not supported');
        return false;
    }
    if (Navigator.prototype.webkitGetUserMedia === undefined) {
        log.debug('GetUserMedia not supported');
        return false;
    }
    if (document.createElement('canvas').captureStream === undefined) {
        log.debug('HTMLCanvasElement.captureStream not supported. Try enabling flag #enable-experimental-web-platform-features in chrome://flags/');
        return false;
    }
    return true;
}
var contentscript_handler = (function() {
    return {
        installGetUserMediaHook: function(app_name) {
            log.debug('installGetUserMediaHook called for app_name', app_name);
            return background('setPageActionIconActive').then(function() {
                return background('isExtensionEnableForCurrentTab');
            }).then(function(enabled) {
                if (enabled === false) { // if user diabled the extension, insert dummy passthrough fct
                    return inject_code('(' + application_dummy.toString() + ')("' + app_name + '")');
                }
                background('getDebugFlag').then(function(flag) {
                    if (flag) {
                        inject_code("javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';document.head.appendChild(script);})()");
                    }
                })
                return inject_script(chrome.extension.getURL('lib/three.min.js')).then(function() {
                    return background('getAllEffectsAsStringArray');
                }).then(function(effects) {
                    for (let effect_code of effects) {
                        inject_code('(function(app) {' + effect_code + ';})(window["' + app_name + '"]);');
                    }
                    return background('getSelectedPluginIndex').then(function(fx_index) {
                        return inject_code('(' + application.toString() + ')("' + app_name + '", ' + fx_index + ')');
                    });
                });
            });
        },
        webpage: function() {
            var rpc = {
                fct_name: arguments[0],
                args: Array.prototype.slice.call(arguments),
                id: '_' + Math.random().toString(36).substr(2, 9)
            };
            rpc.args.shift();
            return new Promise(function(resolve, reject) {
                var handler = function(evt) {
                    document.removeEventListener(rpc.id, handler, false);
                    resolve(evt.detail);
                };
                document.addEventListener(rpc.id, handler);
                document.dispatchEvent(new CustomEvent("cs2web", {
                    detail: rpc
                }));
            });
        },
        injectFile: function(filename) {
            return background('loadFileAsString', filename).then(function(code) {
                return inject_code(code);
            })
        }
    }
})();
document.addEventListener('web2cs', function(evt) {
    var rpc = evt.detail;
    log.debug('RPC called on contentscript', rpc.fct_name, 'with args', rpc.args);
    contentscript_handler[rpc.fct_name].apply(null, rpc.args).then(function(response) {
        log.debug('RPC contentscript returning', response);
        document.dispatchEvent(new CustomEvent(rpc.id, {
            detail: response
        }));
    });
});
chrome.runtime.onMessage.addListener(function(rpc, sender, sendResponse) {
    log.debug('RPC calling on contentscript', rpc.fct_name, 'with args', rpc.args);
    contentscript_handler[rpc.fct_name].apply(null, rpc.args).then(function(response) {
        log.debug('RPC contentscript returning', response);
        sendResponse(response)
    });
    return true; // needed to keep sendResponse valid after the fct ends
});
// content script
function main() {
    if (check_browser_feature_support()) {
        // inserting the code directly from function source code, without passing message to background
        // otherwise, the web page might call getUserMedia before we install our hook
        var app_name = chrome.runtime.getManifest().short_name;
        inject_code('(' + application_bootstrap.toString() + ')("' + app_name + '")');
    }
}
main();
