// https://github.com/chrisdavidmills/threejs-video-cube
// https://cdn.rawgit.com/uysalere/js-demos/master/intro.html
function install_dom_elt() {
    window.pipeline_renderer = new THREE.WebGLRenderer();
    window.pipeline_renderer.setSize(640, 480);
    window.pipeline_renderer.domElement.setAttribute('style', 'width: 1px;height: 1px;');
    var targ = document.body || document.getElementsByTagName('head')[0] || document.documentElement;
    targ.appendChild(window.pipeline_renderer.domElement);
    window.pipeline_video = document.createElement("video");
}

function create_new_stream(stream) {
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
// three.js cube drawing
function threeRender(video) {
    var scene = new THREE.Scene();
    // var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var camera = new THREE.PerspectiveCamera(75, 640 / 480, 0.1, 1000);
    // load a texture, set wrap mode to repeat
    var texture = new THREE.Texture(video);
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.NearestFilter;
    texture.repeat.set(1, 1);
    var geometry = new THREE.BoxGeometry(3, 3, 3);
    var material = new THREE.MeshLambertMaterial({
        map: texture
    });
    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 4;
    var light = new THREE.AmbientLight('rgb(255,255,255)'); // soft white light
    scene.add(light);
    // White directional light at half intensity shining from the top.
    //var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    //directionalLight.position.set( 0, 1, 0 );
    //scene.add( directionalLight );
    // white spotlight shining from the side, casting shadow
    var spotLight = new THREE.SpotLight('rgb(255,255,255)');
    spotLight.position.set(100, 1000, 1000);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;
    scene.add(spotLight);
    //render the scene
    function render() {
        requestAnimationFrame(render);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        texture.needsUpdate = true;
        window.pipeline_renderer.render(scene, camera);
    }
    render();
}

function install_gum_lazy_hook() {
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
                    create_new_stream(stream).then(function(stream) {
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
    debug('->', detail._id)
    var promise = new Promise(function(resolve, reject) {
        document.addEventListener(detail._id, function(evt) {
            debug('<-', detail._id)
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
        inject_script(chrome.extension.getURL('lib/three.min.js')).then(function() {
            return inject_code(install_dom_elt, true)
        }).then(function() {
            return inject_code(threeRender)
        }).then(function() {
            return inject_code(create_new_stream);
        }).
        then(function() {
            responseEvent(evt, {
                done: true
            })
        })
    }
})

function main() {
    if (check_browser_feature_support()) {
        // inject debug fct
        inject_code('var _ext_short_name = "' + chrome.runtime.getManifest().short_name + '(web)";').then(function() {
            return inject_code(debug)
        }).then(function() {
            return inject_code(sendMessage2ContentScript)
        }).then(function() {
            // inject hook that will do lazy loading
            // ie, it will load extra code in the page only if GetUserMedia is used
            return inject_code(install_gum_lazy_hook, true)
        })
    }
}
main()