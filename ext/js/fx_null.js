window[application_name].defineModule('fx_null', function() {
    var self = {}
        // three.js cube drawing
    self.main = function(video) {
        var scene = new THREE.Scene();
        var aspect_ratio = window.innerWidth / window.innerHeight;
        var camera = new THREE.PerspectiveCamera(75, aspect_ratio, 0.1, 10);
        // var camera = new THREE.PerspectiveCamera(75, video.videoWidth / video.videoHeight, 0.1, 1000);
        // load a texture, set wrap mode to repeat
        var texture = new THREE.Texture(video);
        texture.minFilter = THREE.NearestFilter;
        var geometry = new THREE.PlaneGeometry(3 * aspect_ratio, 3);
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
            if (window[application_name].render(scene, camera)) {
                requestAnimationFrame(render);
            }
        }
        render();
    }
    return self;
}());