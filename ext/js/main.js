var _ext_short_name = chrome.runtime.getManifest().short_name + '(cs)';
// https://cdn.rawgit.com/uysalere/js-demos/master/intro.html
var videofx = ["js/fx_3dcube.js", "js/fx_null.js"]

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

function installDomElt() {
    window.pipeline_renderer = new THREE.WebGLRenderer();
    window.pipeline_renderer.setSize(640, 480);
    window.pipeline_renderer.domElement.setAttribute('style', 'width: 1px;height: 1px;');
    var targ = document.body || document.getElementsByTagName('head')[0] || document.documentElement;
    targ.appendChild(window.pipeline_renderer.domElement);
    window.pipeline_video = document.createElement("video");
}

function createNewStream(stream) {
    window.stream_orign = stream;
    if (window.stream_orign.getVideoTracks().length > 0) {
        debug('stream origin', window.stream_orign.getTracks())
        debug('window.pipeline_video', window.pipeline_video)
        return new Promise(function(resolve, reject) {
            window.pipeline_video.addEventListener('canplay', function() {
                debug('oncanplay')
                window.pipeline_video.play();
                threeRender(window.pipeline_video);
                var stream_from_effect = window.pipeline_renderer.domElement.captureStream(30);
                for (var audio_track of window.stream_orign.getAudioTracks()) {
                    stream_from_effect.addTrack(audio_track);
                }
                stream_from_effect.getTracks().forEach(function(track) {
                    track.addEventListener('stop', function() {
                        debug('stop', this, this, window.stream_orign.getTracks())
                    })
                });
                debug('stream from effect', stream_from_effect.getTracks())
                resolve(stream_from_effect);
            });
            // TODO: maybe taking the 1st video track is not optimal
            var stream_to_effect = new MediaStream([window.stream_orign.getVideoTracks()[0]]);
            debug('stream to effect', stream_to_effect.getTracks());
            window.pipeline_video.src = window.URL.createObjectURL(stream_to_effect);
        })
    } else {
        return new Promise(function(resolve, reject) {
            resolve(window.stream_orign);
        })
    }
}

function installGumLazyHook() {
    'use strict';
    window.MediaStream = window.webkitMediaStream;
    window.navigator.__getUserMedia = Navigator.prototype.webkitGetUserMedia;
    Navigator.prototype.webkitGetUserMedia = function(constraints, onSuccess, onFail) {
        debug('GetUserMedia hook called')
        navigator.__getUserMedia(constraints, function(stream) {
            sendMessage2ContentScript({
                video_effect_init: true
            }).then(function(data) {
                if (data.done === true) {
                    createNewStream(stream).then(function(stream) {
                        onSuccess(stream);
                    })
                }
            })
        }, onFail)
    }
}

function sendMessage2ContentScript(data) {
    // https://gist.github.com/gordonbrander/2230317
    var ID = function() {
        // Math.random should be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        return '_' + Math.random().toString(36).substr(2, 9);
    };
    var detail = data || {}
    detail._id = ID()
    var promise = new Promise(function(resolve, reject) {
        document.addEventListener(detail._id, function(evt) {
            document.removeEventListener(detail._id, this, false)
            resolve(evt.detail);
        })
    })
    var evt = new CustomEvent("web2cs", {
        detail: detail
    });
    document.dispatchEvent(evt);
    return promise;
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
            return inject_code(installDomElt, true)
        }).then(function() {
            return inject_code(define_module)
        }).then(function() {
            for (var fx of videofx) {
                chrome.runtime.sendMessage({
                    get_script: fx
                }, function(response) {
                    inject_code(response)
                })
            }

            function threeRender(video) {
                var fx = 'fx_null'
                fx = 'fx_3dcube'
                return window.modules[fx].main(video);
            }
            return inject_code(threeRender);
        }).then(function() {
            return inject_code(createNewStream);
        }).
        then(function() {
            responseEvent(evt, {
                done: true
            });
        });
    }
});
// content script
function main() {
    if (check_browser_feature_support()) {
        inject_code('var _ext_short_name = "' + chrome.runtime.getManifest().short_name + '(web)";').then(function() {
            return inject_code(debug)
        }).then(function() {
            return inject_code(sendMessage2ContentScript)
        }).then(function() {
            return inject_code(installGumLazyHook, true)
        })
    }
}
main()

function getMessage() {
    document.addEventListener('cs2web', function(evt) {
        console.log('evt', evt, evt.detail)
    })
}
inject_code(getMessage, true)

function sendMessage2Webpage(data) {
    var detail = data || {}
    var evt = new CustomEvent("cs2web", {
        detail: detail
    });
    document.dispatchEvent(evt);
}
sendMessage2Webpage([1, 3, 5])