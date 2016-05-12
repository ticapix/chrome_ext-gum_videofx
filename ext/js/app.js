'use strict';
// valid state transition
// UNINSTALLED -> LAZY_INSTALLED
// LAZY_INSTALLED -> DISABLED
// LAZY_INSTALLED -> ENABLED
// ENABLED -> RUNNING
// RUNNING -> ENABLED
var app_init = (function() {
    debug('creating app ' + application_name);
    var StateEnum = {
        UNINSTALLED: 0,
        LAZY_INSTALLED: 1,
        ENABLED: 2,
        RUNNING: 3,
        DISABLED: 4
    };
    var _status = StateEnum.UNINSTALLED;
    var _videofx = {};
    var _pipeline_video = document.createElement("video");
    var _pipeline_renderer = null;
    var _sendMessage2ContentScript = function(data) {
        // https://gist.github.com/gordonbrander/2230317
        var ID = function() {
            // Math.random should be unique because of its seeding algorithm.
            // Convert it to base 36 (numbers + letters), and grab the first 9 characters
            // after the decimal.
            return '_' + Math.random().toString(36).substr(2, 9);
        };
        var detail = data || {};
        detail._id = ID();
        var promise = new Promise(function(resolve, reject) {
            var handler = function(evt) {
                document.removeEventListener(detail._id, handler, false);
                resolve(evt.detail);
            };
            document.addEventListener(detail._id, handler);
        });
        var evt = new CustomEvent("web2cs", {
            detail: detail
        });
        document.dispatchEvent(evt);
        return promise;
    };
    var _threeRender = function(video) {
        var fx = 'fx_null';
        fx = 'fx_3dcube';
        return _videofx[fx].main(video);
    };
    var _render = function(scene, camera) {
        _pipeline_renderer.render(scene, camera);
        return _status === StateEnum.RUNNING;
    };
    var _createNewStream = function(stream) {
        var prom = new Promise(function(resolve, reject) {
            resolve(stream);
        });
        if (_status === StateEnum.ENABLED && stream.getVideoTracks().length > 0) {
            debug('_pipeline_video', _pipeline_video);
            prom = new Promise(function(resolve, reject) {
                var handler = function() {
                    debug('video canplay');
                    _pipeline_video.play();
                    _status = StateEnum.RUNNING;
                    _threeRender(_pipeline_video);
                    var stream_from_effect = _pipeline_renderer.domElement.captureStream(30);
                    if (stream_from_effect.getTracks().length != 1) {
                        reject('too many tracks (>1) returned from captureStream(30)');
                    }
                    stream_from_effect.getVideoTracks()[0].addEventListener('ended', function(evt) {
                        if (evt.target instanceof CanvasCaptureMediaStreamTrack) {
                            debug('stopping video capture');
                            _status = StateEnum.ENABLED;
                            // if canvas ended, ends the original video stream too
                            stream_video_orign.stop();
                        }
                    });
                    for (var audio_track of stream.getAudioTracks()) {
                        stream_from_effect.addTrack(audio_track);
                    }
                    debug('stream from effect', stream_from_effect.getTracks());
                    _pipeline_video.removeEventListener('canplay', handler, false);
                    resolve(stream_from_effect);
                };
                _pipeline_video.addEventListener('canplay', handler);
                // TODO: maybe taking the 1st video track is not optimal
                var stream_video_orign = stream.getVideoTracks()[0];
                var stream_to_effect = new MediaStream([stream_video_orign]);
                debug('stream to effect', stream_to_effect.getTracks());
                _pipeline_video.src = window.URL.createObjectURL(stream_to_effect);
            });
        }
        return prom;
    };
    var _installGumLazyHook = function() {
        window.MediaStream = window.webkitMediaStream;
        window.navigator.__getUserMedia = Navigator.prototype.webkitGetUserMedia;
        Navigator.prototype.webkitGetUserMedia = function(constraints, onSuccess, onFail) {
            debug('GetUserMedia hook called');
            new Promise(function(resolve, reject) {
                switch (_status) {
                    case StateEnum.LAZY_INSTALLED:
                        _sendMessage2ContentScript({
                            video_effect_init: true
                        }).then(function(data) {
                            if (data.done === true) {
                                _status = StateEnum.ENABLED;
                                resolve();
                            } else {
                                _status = StateEnum.DISABLED;
                                resolve();
                            }
                        });
                        break;
                    case StateEnum.ENABLED:
                    case StateEnum.DISABLED: // it's valid to continue if we are disabled
                        resolve();
                        break;
                    default:
                        reject('application is not in valid state');
                }
            }).then(function() {
                navigator.__getUserMedia(constraints, function(stream) {
                    _createNewStream(stream).then(function(stream) {
                        onSuccess(stream);
                    });
                }, onFail);
            });
        };
        _status = StateEnum.LAZY_INSTALLED;
    };
    var _installDomElt = function() {
        _pipeline_renderer = new THREE.WebGLRenderer();
        _pipeline_renderer.setSize(640, 480);
        _pipeline_renderer.domElement.setAttribute('style', 'width: 1px;height: 1px;');
        (document.body || document.getElementsByTagName('head')[0] || document.documentElement).appendChild(_pipeline_renderer.domElement);
    };
    var self = {
        installGumLazyHook: _installGumLazyHook,
        installDomElt: _installDomElt,
        render: _render
    };
    Object.defineProperty(self, "videofx", {
        get: function() {
            return _videofx;
        }
    })
    return self;
});