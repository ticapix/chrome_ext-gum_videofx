'use strict';
webfx_defineAppModule('fx_null', function(app) {
    var self = {};
    // three.js cube drawing
    self.main = function(video) {
        var scene = new THREE.Scene();
        var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        var texture = new THREE.Texture(video);
        texture.minFilter = THREE.NearestFilter;
        var geometry = new THREE.PlaneGeometry(2, 2);
        var material = new THREE.MeshLambertMaterial({
            map: texture
        });
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        var light = new THREE.AmbientLight('rgb(255,255,255)'); // soft white light
        scene.add(light);
        //render the scene
        var render = function() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                texture.needsUpdate = true;
            }
            if (app.render(scene, camera)) {
                requestAnimationFrame(render);
            }
        };
        render();
    };
    return self;
});
//https: //www.airtightinteractive.com/2013/02/intro-to-pixel-shaders-in-three-js/