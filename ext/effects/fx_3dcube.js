'use strict';
app.definefx([], function() {
    // https://github.com/chrisdavidmills/threejs-video-cube
    var self = {
        name: '3D cube',
        icon_url: 'some url',
        description: 'Rotating 3D cube'
    };
    // three.js cube drawing
    self.main = function(video, renderer) {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
        // load a texture, set wrap mode to repeat
        var texture = new THREE.Texture(video);
        // texture.wrapS = THREE.ClampToEdgeWrapping;
        // texture.wrapT = THREE.ClampToEdgeWrapping;
        // texture.repeat.set(1, 1);
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
            renderer.render(scene, camera);
            if (app.running) {
                requestAnimationFrame(render);
            }
        };
        render();
    };
    return self;
});