'use strict';
// web page application bootstrap. It's injected in the webpage from the content script
// this part of the code is always loaded in all visited pages.
// let's try to keep it as simple, short and light as possible
var application_bootstrap = (function(app_name) {
    var self = {
        videofx: []
    };
    self.contentscript = function(fct_name) {
        var rpc = {
            fct_name: fct_name,
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
            document.dispatchEvent(new CustomEvent("web2cs", {
                detail: rpc
            }));
        });
    }
    self.definefx = function(deps, effect) {
        self.videofx_deps = self.videofx_deps || []
        let promises = []
        for (let dep of deps) {
            if (self.videofx_deps.indexOf(dep) === -1) {
                self.videofx_deps.push(dep);
                promises.push(self.contentscript('injectFile', dep))
            }
        }
        // TODO, nobody is waiting for this promise
        return Promise.all(promises).then(function() {
            self.videofx.push(effect());
        });
    }
    self.debug = function() {
        Array.prototype.unshift.call(arguments, app_name);
        console.log.apply(console, arguments);
    }
    self.installGetUserMediaLazyHook = function(app_name) {
        self.debug('installing GetUserMedia lazy hook');
        window.navigator.__getUserMedia = window.navigator.webkitGetUserMedia;
        window.navigator.webkitGetUserMedia = function(constraints, onSuccess, onFail) {
            if (self.getUserMediaHook === undefined) {
                self.contentscript('installGetUserMediaHook', app_name).then(function() {
                    self.getUserMediaHook(constraints, onSuccess, onFail);
                });
            } else {
                self.getUserMediaHook(constraints, onSuccess, onFail);
            }
        }
    }
    window[app_name] = self;
    self.installGetUserMediaLazyHook(app_name);
});
// web page application. It's injected in the webpage from the content script
// inject dummy app in case the user disabled the extension
var application_dummy = (function(app_name) {
    self = window[app_name];
    self.getUserMediaHook = function(constraints, onSuccess, onFail) {
        window.navigator.__getUserMedia(constraints, onSuccess, onFail);
    }
});
// inject real app otherwise
var application = (function(app_name, fx_index) {
    self = window[app_name];
    self.running = false;
    self.getUserMediaHook = function(constraints, onSuccess, onFail) {
        window.navigator.__getUserMedia(constraints, function(stream) {
            self.addPipelineEffect(stream).then(function(stream) {
                onSuccess(stream);
            });
        }, onFail);
    }
    self.installDomElements = function() {
        self.pipeline_video = document.createElement("video");
        self.pipeline_renderer = new THREE.WebGLRenderer();
        self.pipeline_renderer.setSize(640, 480);
        self.pipeline_renderer.domElement.setAttribute('style', 'width: 1px;height: 1px;');
        let target = document.body || document.getElementsByTagName('head')[0] || document.documentElement;
        target.appendChild(self.pipeline_renderer.domElement);
    };
    self.addPipelineEffect = function(stream) {
        window.MediaStream = window.MediaStream || window.webkitMediaStream;
        return new Promise(function(resolve, reject) {
            if (stream.getVideoTracks().length === 0) {
                resolve(stream);
            } else {
                var handler = function() {
                    self.debug('video canplay');
                    self.running = true;
                    self.pipeline_video.play();
                    self.updateEffectIndex(fx_index);
                    var stream_from_effect = self.pipeline_renderer.domElement.captureStream(25);
                    if (stream_from_effect.getTracks().length != 1) {
                        reject('too many tracks (>1) returned from captureStream(30)');
                    }
                    stream_from_effect.getVideoTracks()[0].addEventListener('ended', function(evt) {
                        console.assert(evt.target instanceof CanvasCaptureMediaStreamTrack)
                        stream_video_orign.stop();
                        self.running = false;
                    });
                    for (var audio_track of stream.getAudioTracks()) {
                        stream_from_effect.addTrack(audio_track);
                    }
                    self.debug('streams from effect', stream_from_effect.getTracks());
                    self.pipeline_video.removeEventListener('canplay', handler, false);
                    resolve(stream_from_effect);
                };
                self.pipeline_video.addEventListener('canplay', handler);
                // TODO: maybe taking the 1st video track is not optimal
                var stream_video_orign = stream.getVideoTracks()[0];
                var stream_to_effect = new MediaStream([stream_video_orign]);
                self.debug('streams to effect', stream_to_effect.getTracks());
                self.pipeline_video.src = window.URL.createObjectURL(stream_to_effect);
            }
        })
    };
    // called from the popup
    self.getAllEffectDetails = function() {
        var details = self.videofx.map(function(module) {
            return {
                name: module.name,
                icon_url: module.icon_url,
                description: module.description
            };
        });
        return Promise.resolve(details);
    };
    // called from the popup
    self.updateEffectIndex = function(fx_index) {
        self.videofx[fx_index].main(self.pipeline_video, self.pipeline_renderer);
        return Promise.resolve();
    };
    // install event handler in order to be called from content script
    document.addEventListener('cs2web', function(evt) {
        var rpc = evt.detail;
        window[app_name].debug('RPC called on webpage', rpc.fct_name, 'with args', rpc.args);
        self[rpc.fct_name].apply(null, rpc.args).then(function(response) {
            window[app_name].debug('RPC webpage returning', response);
            document.dispatchEvent(new CustomEvent(rpc.id, {
                detail: response
            }));
        });
    });
    self.installDomElements();
});