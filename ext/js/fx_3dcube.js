// three.js cube drawing
function fx_3dcube(video) {
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