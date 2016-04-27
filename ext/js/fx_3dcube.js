// https://github.com/chrisdavidmills/threejs-video-cube
define_module('fx_3dcube', function() {
    var self = {}
        // three.js cube drawing
    self.main = function(video) {
        var scene = new THREE.Scene();
        debug('video', video)
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
        // var camera = new THREE.PerspectiveCamera(75, video.videoWidth / video.videoHeight, 0.1, 1000);
        // load a texture, set wrap mode to repeat
        var texture = new THREE.Texture(video);
        texture.minFilter = THREE.NearestFilter;
        var geometry = new THREE.BoxGeometry(3, 3, 3);
        var material = new THREE.MeshLambertMaterial({
            map: texture
        });
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        camera.position.z = 4;
        var light = new THREE.AmbientLight('rgb(255,255,255)'); // soft white light
        scene.add(light);
        //render the scene
        var render = function() {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
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