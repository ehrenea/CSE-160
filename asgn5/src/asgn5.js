import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

function main() {
	const canvas = document.querySelector( '#c' );
	const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    logarithmicDepthBuffer: true,
    alpha: true,
  });

	const fov = 75;
	const aspect = 2; // the canvas default
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
  camera.position.set(0,10,20);
	
  class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
      this.obj = obj;
      this.minProp = minProp;
      this.maxProp = maxProp;
      this.minDif = minDif;
    }
    get min() {
      return this.obj[this.minProp];
    }
    set min(v) {
      this.obj[this.minProp] = v;
      this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }
    get max() {
      return this.obj[this.maxProp];
    }
    set max(v) {
      this.obj[this.maxProp] = v;
      this.min = this.min;  // this will call the min setter
    }
  }

  function updateCamera() {
		camera.updateProjectionMatrix();
	}

  const gui = new GUI();
	gui.add( camera, 'fov', 1, 180 );
	const minMaxGUIHelper = new MinMaxGUIHelper( camera, 'near', 'far', 0.1 );
	gui.add(minMaxGUIHelper, 'min', 0.00001, 50, 0.00001).name('near').onChange(updateCamera);
	gui.add( minMaxGUIHelper, 'max', 0.1, 50, 0.1 ).name( 'far' );

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0,5,0);
  controls.update();

	const scene = new THREE.Scene();
  scene.background = new THREE.Color('black');

  {
    const planeSize = 400;

		const grassLoader = new THREE.TextureLoader();
		const texture = grassLoader.load( 'resources/images/grass.jpg' );
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		const repeats = planeSize / 20;
		texture.repeat.set( repeats, repeats );

		const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
		const planeMat = new THREE.MeshPhongMaterial( {
			map: texture,
			side: THREE.DoubleSide,
		} );
		const mesh = new THREE.Mesh( planeGeo, planeMat );
		mesh.rotation.x = Math.PI * - .5;
		scene.add( mesh );
  }

  class ColorGUIHelper {
    constructor(object, prop) {
      this.object = object;
      this.prop = prop;
    }
    get value() {
      return '#' + this.object[this.prop].getHexString();
    }
    set value(hexString) {
      this.object[this.prop].set(hexString);
    }
  }

  function makeXYZGUI(gui, vector3, name, onChangeFn) {
    const folder = gui.addFolder(name);
    folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
    folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
    folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
    folder.open();
  }

  // Hemisphere Light
  {
    const skyColor = 0xB1E1FF; // light blue
		const groundColor = 0xB97A20; // brownish orange
		const intensity = 1;
		const light = new THREE.HemisphereLight( skyColor, groundColor, intensity );
		scene.add( light );

		const gui = new GUI();
		gui.addColor( new ColorGUIHelper( light, 'color' ), 'value' ).name( 'skyColor' );
		gui.addColor( new ColorGUIHelper( light, 'groundColor' ), 'value' ).name( 'groundColor' );
		gui.add( light, 'intensity', 0, 5, 0.01 );
	}

  // Directional Light
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    scene.add(light);
    scene.add(light.target);

    const helper = new THREE.DirectionalLightHelper(light);
    scene.add(helper);

    function updateLight() {
      light.target.updateMatrixWorld();
      helper.update();
    }
    updateLight();

    const gui = new GUI();
    gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
    gui.add(light, 'intensity', 0, 5, 0.01);
    gui.add(light.target.position, 'x', -10, 10);
    gui.add(light.target.position, 'z', -10, 10);
    gui.add(light.target.position, 'y', 0, 10);

    makeXYZGUI(gui, light.position, 'position', updateLight);
    makeXYZGUI(gui, light.target.position, 'target', updateLight);
  }

  // Ambient Light
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);
  }

  {
    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const numSpheres = 20;
    for (let i = 0; i < numSpheres; ++i) {
      const sphereMat = new THREE.MeshPhongMaterial();
      sphereMat.color.setHSL(i * .73, 1, 0.5);
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(-sphereRadius - 1, sphereRadius + 2, i * sphereRadius * -2.2);
      scene.add(mesh);
    }
  }

  {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('resources/models/crow.mtl', (mtl) => {
      mtl.preload();
      mtl.materials['Material.002'].side = THREE.DoubleSide;
      mtl.materials['Material.002'].color.set(0x333333); // body
      mtl.materials['Material.003'].side = THREE.DoubleSide;
      mtl.materials['Material.004'].side = THREE.DoubleSide;
      mtl.materials['Material.005'].side = THREE.DoubleSide;
      mtl.materials['Material.005'].color.set(0x050505); // pupil
      mtl.materials['Material.006'].side = THREE.DoubleSide;
      mtl.materials['Material.006'].color.set(0x4a2800); // eye color
      const objLoader = new OBJLoader();
      objLoader.setMaterials(mtl);
      objLoader.load('resources/models/crow.obj', (root) => {
        root.position.y = 1.5;
        scene.add(root);

        // compute the box that contains all the stuff
        // from root and below
        const box = new THREE.Box3().setFromObject(root);
    
        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());
    
        // set the camera to frame the box
        frameArea(boxSize * 1.2, boxSize, boxCenter, camera);
    
        // update the Trackball controls to handle the new size
        controls.maxDistance = boxSize * 10;
        controls.target.copy(boxCenter);
        controls.update();
      });
    });
  }

  {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      'resources/images/sky.jpg',
      'resources/images/sky.jpg',
      'resources/images/sky.jpg',
      'resources/images/sky.jpg',
      'resources/images/sky.jpg',
      'resources/images/sky.jpg',
    ]);
    scene.background = texture;
  }

  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
  
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    const direction = (new THREE.Vector3())
        .subVectors(camera.position, boxCenter)
        .multiply(new THREE.Vector3(1, 0, 1))
        .normalize();
  
    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
  
    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;
  
    camera.updateProjectionMatrix();
  
    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

	const boxWidth = 1;
	const boxHeight = 1;
	const boxDepth = 1;
	const geometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );

	const cubes = []; // just an array we can use to rotate the cubes
	const loadManager = new THREE.LoadingManager();
	const loader = new THREE.TextureLoader( loadManager );
  
	const materials = [
		new THREE.MeshBasicMaterial( { map: loadColorTexture( 'resources/images/dirt.jpg' ) } ),
		new THREE.MeshBasicMaterial( { map: loadColorTexture( 'resources/images/dirt.jpg' ) } ),
		new THREE.MeshBasicMaterial( { map: loadColorTexture( 'resources/images/dirt.jpg' ) } ),
		new THREE.MeshBasicMaterial( { map: loadColorTexture( 'resources/images/dirt.jpg' ) } ),
		new THREE.MeshBasicMaterial( { map: loadColorTexture( 'resources/images/dirt.jpg' ) } ),
		new THREE.MeshBasicMaterial( { map: loadColorTexture( 'resources/images/dirt.jpg' ) } ),
	];

	const loadingElem = document.querySelector( '#loading' );
	const progressBarElem = loadingElem.querySelector( '.progressbar' );

	loadManager.onLoad = () => {
		loadingElem.style.display = 'none';
		const cube = new THREE.Mesh( geometry, materials );
    cube.position.set(5, 1, 0);
		scene.add( cube );
		cubes.push( cube ); // add to our list of cubes to rotate
	};

	loadManager.onProgress = ( urlOfLastItemLoaded, itemsLoaded, itemsTotal ) => {

		const progress = itemsLoaded / itemsTotal;
		progressBarElem.style.transform = `scaleX(${progress})`;

	};

	function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

	}

	function loadColorTexture( path ) {

		const texture = loader.load( path );
		texture.colorSpace = THREE.SRGBColorSpace;
		return texture;

	}

	function render( time ) {

		time *= 0.001;

		if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

		cubes.forEach( ( cube, ndx ) => {

			const speed = .2 + ndx * .1;
			const rot = time * speed;
			cube.rotation.x = rot;
			cube.rotation.y = rot;

		} );
    renderer.render(scene, camera);

		requestAnimationFrame( render );

	}

	requestAnimationFrame( render );

}

main();