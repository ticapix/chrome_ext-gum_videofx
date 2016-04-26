define_module('fx_null', function() {
    var self = {}
        // three.js cube drawing
    self.main = function(video) {
        var scene = new THREE.Scene();
        debug('video', video)
        var aspect_ratio = window.innerWidth / window.innerHeight;
        var camera = new THREE.PerspectiveCamera(75, aspect_ratio, 0.1, 10);
        // var camera = new THREE.PerspectiveCamera(75, video.videoWidth / video.videoHeight, 0.1, 1000);
        // load a texture, set wrap mode to repeat
        var texture = new THREE.Texture(video);
        texture.minFilter = THREE.NearestFilter;
        var geometry = new THREE.PlaneGeometry(3 * aspect_ratio, 3);
        debug('geometry', geometry)
        var material = new THREE.MeshLambertMaterial({
            map: texture
        });
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        camera.position.z = 2;
        var light = new THREE.AmbientLight('rgb(255,255,255)'); // soft white light
        scene.add(light);
        //render the scene
        var render = function() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                texture.needsUpdate = true;
            }
            window.pipeline_renderer.render(scene, camera);
            requestAnimationFrame(render);
        }
        render();
    }
    return self;
}());
// // FUNCTIONS        
// function init() {
//     // SCENE
//     scene = new THREE.Scene();
//     // CAMERA
//     var SCREEN_WIDTH = window.innerWidth,
//         SCREEN_HEIGHT = window.innerHeight;
//     var VIEW_ANGLE = 45,
//         ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
//         NEAR = 0.1,
//         FAR = 20000;
//     camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
//     scene.add(camera);
//     camera.position.set(0, 150, 400);
//     camera.lookAt(scene.position);
//     renderer = new THREE.WebGLRenderer({
//         antialias: true
//     });
//     //effect = new THREE.StereoEffect(renderer);
//     renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
//     element = renderer.domElement;
//     //effect.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
//     container = document.getElementById('ThreeJS');
//     container.appendChild(element);
//     // CONTROLS
//     controls = new THREE.OrbitControls(camera, element);
//     element.addEventListener('click', fullscreen, false);
//     // LIGHT
//     var light = new THREE.PointLight(0xffffff);
//     light.position.set(0, 250, 0);
//     scene.add(light);
//     ///////////
//     // VIDEO //
//     ///////////
//     // create the video element
//     video = document.createElement('video');
//     //video.id = 'video';
//     video.type = ' video/mp4; codecs="theora, vorbis" ';
//     video.src = "video/sintel.ogv";
//     video.load(); // must call after setting/changing source
//     video.play();
//     videoImage = document.createElement('canvas');
//     videoImage.width = 320;
//     videoImage.height = 240;
//     videoImageContext = videoImage.getContext('2d');
//     // background color if no video present
//     videoImageContext.fillStyle = '#000000';
//     videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);
//     videoTexture = new THREE.Texture(videoImage);
//     videoTexture.minFilter = THREE.LinearFilter;
//     videoTexture.magFilter = THREE.LinearFilter;
//     var movieMaterial = new THREE.MeshBasicMaterial({
//         map: videoTexture,
//         overdraw: true,
//         side: THREE.DoubleSide
//     });
//     // the geometry on which the movie will be displayed;
//     //      movie image will be scaled to fit these dimensions.
//     var movieGeometry = new THREE.PlaneGeometry(240, 100, 4, 4);
//     var movieScreen = new THREE.Mesh(movieGeometry, movieMaterial);
//     movieScreen.position.set(0, 50, 00);
//     scene.add(movieScreen);
//     camera.position.set(0, 150, 300);
//     camera.lookAt(movieScreen.position);
//     window.addEventListener('resize', resize, false);
//     setTimeout(resize, 1);
// }