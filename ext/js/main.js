// https://cdn.rawgit.com/uysalere/js-demos/master/intro.html
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

function responseEvent(evt, data) {
    var ans = new CustomEvent(evt.detail._id, {
        detail: data
    });
    document.dispatchEvent(ans);
}
// handler to get message from web page
document.addEventListener('web2cs', function(evt) {
    if (evt.detail.video_effect_init === true) {
        // GetUserMedia got called.
        // need to load our code for the video effect
        inject_code("javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';document.head.appendChild(script);})()")
        inject_script(chrome.extension.getURL('lib/three.min.js')).then(function() {
            return inject_code('window[application_name].installDomElt()')
        }).then(function() {
            return new Promise(function(resolve, reject) {
                chrome.runtime.sendMessage({
                    get_plugin_scripts: true
                }, function(videofx) {
                    var fx_promises = []
                    for (var fx of videofx) {
                        fx_promises.push(inject_file(fx))
                    }
                    return Promise.all(fx_promises).then(function() {
                        resolve()
                    })
                })
            })
        }).then(function() {
            responseEvent(evt, {
                done: true
            });
        });
    }
});
// content script
function main() {
    if (check_browser_feature_support()) {
        inject_code('window.application_name="' + chrome.runtime.getManifest().short_name + '"');
        inject_fct(debug);
        // inserting the code directly from function source code, without passing message to background
        // otherwise, the web page might call getUserMedia before we install our hook
        inject_code('window[application_name] = ' + app_init.toString() + '()');
        inject_code('window[application_name].installGumLazyHook()');
    }
}
main()
    // function getMessage() {
    //     document.addEventListener('cs2web', function(evt) {
    //         console.log('evt', evt, evt.detail)
    //     })
    // }
    // inject_code(getMessage, true)
    // function sendMessage2Webpage(data) {
    //     var detail = data || {}
    //     var evt = new CustomEvent("cs2web", {
    //         detail: detail
    //     });
    //     document.dispatchEvent(evt);
    // }
    // sendMessage2Webpage([1, 3, 5])