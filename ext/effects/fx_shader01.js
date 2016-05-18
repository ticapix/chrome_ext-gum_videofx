'use strict';
//TODO: add plugin with option 
// for simple shader like https://www.airtightinteractive.com/2013/02/intro-to-pixel-shaders-in-three-js/
// https://cdn.rawgit.com/uysalere/js-demos/master/intro.html
// http://pixelshaders.com/sample/
// https://www.airtightinteractive.com/demos/js/shaders/preview/
app.definefx(['shader01/CopyShader.js', 'shader01/DotScreenShader.js', 'shader01/RGBShiftShader.js', 'shader01/EffectComposer.js', 'shader01/RenderPass.js', 'shader01/MaskPass.js', 'shader01/ShaderPass.js'], function() {
    var self = {
        name: 'shader 101',
        icon_url: 'some url',
        description: 'some shader'
    };
    // three.js cube drawing
    self.main = function(video, renderer) {
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
        // postprocessing
        var composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        var effect = new THREE.ShaderPass(THREE.DotScreenShader);
        effect.uniforms['scale'].value = 4;
        composer.addPass(effect);
        var effect = new THREE.ShaderPass(THREE.RGBShiftShader);
        effect.uniforms['amount'].value = 0.02;
        effect.renderToScreen = true;
        composer.addPass(effect);
        //
        //render the scene
        var render = function() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                texture.needsUpdate = true;
            }
            composer.render(scene, camera);
            if (app.running) {
                requestAnimationFrame(render);
            }
        };
        render();
    };
    return self;
})