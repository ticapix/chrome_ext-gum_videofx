var app_init = (function() {
    debug('creating app ' + application_name)
    var self = {}
    self.StateEnum = {
        UNINSTALLED: 0,
        LAZY_INSTALLED: 1,
        INSTALLED: 2
    }
    self.status = self.StateEnum.UNINSTALLED;
    self.videofx = {}
    self.installGumLazyHook = function() {
        'use strict';
        window.MediaStream = window.webkitMediaStream;
        window.navigator.__getUserMedia = Navigator.prototype.webkitGetUserMedia;
        Navigator.prototype.webkitGetUserMedia = function(constraints, onSuccess, onFail) {
            debug('GetUserMedia hook called')
            var _onSuccess = null
            new Promise(function(resolve, reject) {
                switch (self.status) {
                    case self.StateEnum.LAZY_INSTALLED:
                        self.sendMessage2ContentScript({
                            video_effect_init: true
                        }).then(function(data) {
                            if (data.done === true) {
                                self.status = self.StateEnum.INSTALLED;
                                resolve();
                            }
                        })
                        break;
                    case self.StateEnum.INSTALLED:
                        resolve();
                        break;
                    default:
                        reject();
                }
            }).then(function() {
                navigator.__getUserMedia(constraints, function(stream) {
                    self.createNewStream(stream).then(function(stream) {
                        onSuccess(stream);
                    })
                }, onFail)
            });
        }
        self.status = self.StateEnum.LAZY_INSTALLED
    }
    self.installDomElt = function() {
        window.pipeline_renderer = new THREE.WebGLRenderer();
        window.pipeline_renderer.setSize(640, 480);
        window.pipeline_renderer.domElement.setAttribute('style', 'width: 1px;height: 1px;');
        (document.body || document.getElementsByTagName('head')[0] || document.documentElement).appendChild(window.pipeline_renderer.domElement);
        self.pipeline_video = document.createElement("video");
    }
    self.createNewStream = function(stream) {
        window.stream_orign = stream;
        if (window.stream_orign.getVideoTracks().length > 0) {
            debug('stream origin', window.stream_orign.getTracks())
            debug('self.pipeline_video', self.pipeline_video)
            return new Promise(function(resolve, reject) {
                var handler = function() {
                    debug('oncanplay')
                    self.pipeline_video.play();
                    threeRender(self.pipeline_video);
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
                    self.pipeline_video.removeEventListener('canplay', handler, false)
                    resolve(stream_from_effect);
                }
                self.pipeline_video.addEventListener('canplay', handler);
                // TODO: maybe taking the 1st video track is not optimal
                var stream_to_effect = new MediaStream([window.stream_orign.getVideoTracks()[0]]);
                debug('stream to effect', stream_to_effect.getTracks());
                self.pipeline_video.src = window.URL.createObjectURL(stream_to_effect);
            })
        } else {
            return new Promise(function(resolve, reject) {
                resolve(window.stream_orign);
            })
        }
    }
    self.sendMessage2ContentScript = function(data) {
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
            var handler = function(evt) {
                document.removeEventListener(detail._id, handler, false)
                resolve(evt.detail);
            }
            document.addEventListener(detail._id, handler)
        })
        var evt = new CustomEvent("web2cs", {
            detail: detail
        });
        document.dispatchEvent(evt);
        return promise;
    }
    self.defineModule = function(name, module) {
        debug('loading videofx', name)
        self.videofx[name] = module;
    }
    return self;
});