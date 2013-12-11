var orreryDrawer = function() {

	var siteURL = "http://star.shakura.ru/";
	var ajaxURL = siteURL + "particle_loader.php";

	var camera, scene, renderer;
	var cubeSize = 5000;
	var speed = 2; 
	var SPHERE_COUNT = 2000;
	var segment_count = 20;

	var mesh;
	var  particles, geometry, material, i, h, color, sprite, size;	

	var texture_placeholder,
	isUserInteracting = false,
	onMouseDownMouseX = 0, onMouseDownMouseY = 0, lastScrollPos = 0,
	lon = 90, onMouseDownLon = 0,
	lat = 0, onMouseDownLat = 0,
	phi = 0, theta = 0,
	target = new THREE.Vector3();

	$(document).ready(function() {
		init();
	});

	function init() {

		var container = document.getElementById( 'scene' );

		var swidth = $(container).width();
		var sheight = $(container).height();

		camera = new THREE.PerspectiveCamera( 75, swidth / sheight, 1, cubeSize );
		//camera.position.z = cubeSize / 2;

		scene = new THREE.Scene();

		texture_placeholder = document.createElement( 'canvas' );
		texture_placeholder.width = 128;
		texture_placeholder.height = 128;

		var context = texture_placeholder.getContext( '2d' );
		context.fillStyle = 'rgb( 200, 200, 200 )';
		context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );

		var materials = [

			loadTexture( siteURL + 'pics/px.png' ), // right
			loadTexture( siteURL + 'pics/nx.png' ), // left
			loadTexture( siteURL + 'pics/py.png' ), // top
			loadTexture( siteURL + 'pics/ny.png' ), // bottom
			loadTexture( siteURL + 'pics/pz.png' ), // back
			loadTexture( siteURL + 'pics/nz.png' )  // front

		];


		mesh = new THREE.Mesh( new THREE.CubeGeometry( cubeSize, cubeSize, cubeSize, segment_count, segment_count, segment_count ), new THREE.MeshFaceMaterial( materials ) );
		mesh.scale.x = - 1;
		scene.add( mesh );

		scene.fog = new THREE.FogExp2( 0x000010, 0.00025 );

		renderer = new THREE.WebGLRenderer();
		renderer.setClearColor(1, 1);
		renderer.setSize( swidth , sheight );

		container.appendChild( renderer.domElement );

		container.addEventListener( 'mousedown', onDocumentMouseDown, false );
		container.addEventListener( 'mousemove', onDocumentMouseMove, false );
		container.addEventListener( 'mouseup', onDocumentMouseUp, false );
		//scroll, obviously; requires jQuery plugin
		$(container).mousewheel( function(event) {
			(event.deltaY > 0) ? moveForward() : moveBackward();
		});

		$(document).keydown(function(){
			if (event.which == 38 || event.which == 87)
				moveForward();
			else if (event.which == 40 || event.which == 83)
				moveBackward();
		});

		resetParticles();

		window.addEventListener( 'resize', onWindowResize, false );
		window.setTimeout(function() {
			container.click();
			//initial update needs to be set
		}, 1000);
	}

	function resetParticles() {


		// --- ajax needed here --- //

		$.post(ajaxURL, { viewSize: cubeSize, delta: camera.position.toArray().toString() }, function(resp) {
			if (!resp.error) {

				geometry = new THREE.Geometry();
				sprite = THREE.ImageUtils.loadTexture( "textures/sprites/disc.png" );

				var starData = resp.data.stars;
				//console.log(starData);

				for(var i = 0; i < starData.length; ++i)
				{
					var vertex = new THREE.Vector3().fromArray(starData[i].split(',')) ;
					geometry.vertices.push( vertex );
				}

				material = new THREE.ParticleBasicMaterial( { size: 35, sizeAttenuation: false, map: sprite, transparent: true } );
				material.color.setHSL( 1.0, 0.3, 0.7 );

				scene.remove( particles );

				particles = new THREE.ParticleSystem( geometry, material );
				particles.sortParticles = true;

				scene.add( particles );

				render();

			} 
			else
				console.log('ajax error');
		}, 'json'); 

		// ------- //

	}

	function cameraInBox() {

		var delta = 0.3 * cubeSize;
		return (camera.position.x - delta > - cubeSize / 2) && (camera.position.x + delta < cubeSize / 2) &&
		(camera.position.y - delta > - cubeSize / 2) && (camera.position.y + delta < cubeSize / 2) &&
		(camera.position.z - delta > - cubeSize / 2) && (camera.position.z + delta < cubeSize / 2);
	}

	function resetCamera()
	{
		resetParticles();

		camera.position.x = 0;
		camera.position.y = 0;
		camera.position.z = 0;
	}

	function moveForward() {

		if (!cameraInBox()) {
			resetCamera();
			return;
		}

		setAngles();

		dx = speed * Math.sin( phi ) * Math.cos( theta );
		dy = speed * Math.cos( phi );
		dz = speed * Math.sin( phi ) * Math.sin( theta );
		
		camera.position.x += dx;
		camera.position.y += dy;
		camera.position.z += dz;
		moveSpacebox(dz,dy,dz);

		render();
	}

	function moveBackward() {

		if (!cameraInBox()) {
			resetCamera();
			return;
		}

		setAngles();
		
		dx = speed * Math.sin( phi ) * Math.cos( theta );
		dy = speed * Math.cos( phi );
		dz = speed * Math.sin( phi ) * Math.sin( theta );

		camera.position.x -= dx;
		camera.position.y -= dy;
		camera.position.z -= dz;
		moveSpacebox(dz,dy,dz);

		render();
	}

	function onWindowResize() {

		var container = document.getElementById( 'scene' );
		var swidth = $(container).width();
		var sheight = $(container).height();

		camera.aspect = swidth / sheight;
		camera.updateProjectionMatrix();

		renderer.setSize( swidth, sheight );

		render();

	}

	function loadTexture( path ) {

		var texture = new THREE.Texture( texture_placeholder );
		var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: true } );

		var image = new Image();
		image.onload = function () {

			texture.needsUpdate = true;
			material.map.image = this;

			render();

		};
		image.src = path;

		return material;

	}
	
	function onDocumentMouseDown( event ) {

		event.preventDefault();

		isUserInteracting = true;

		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;

		onPointerDownLon = lon;
		onPointerDownLat = lat;

	}

	function onDocumentMouseMove( event ) {

		if ( isUserInteracting ) {

			lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
			lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
			render();

		}

	}

	function onDocumentMouseUp( event ) {
		isUserInteracting = false;
		render();
	}

	function setAngles() {
		lat = Math.max( - 85, Math.min( 85, lat ) );
		phi = THREE.Math.degToRad( 90 - lat );
		theta = THREE.Math.degToRad( lon );
	}
	
	function moveSpacebox(dx,dy,dz) {
		mesh.position.x += dx;
		mesh.position.y += dy;
		mesh.position.z += dz;
	}


	function render() {

		setAngles();

		target.x = 0.5 * cubeSize * Math.sin( phi ) * Math.cos( theta );
		target.y = 0.5 * cubeSize * Math.cos( phi );
		target.z = 0.5 * cubeSize * Math.sin( phi ) * Math.sin( theta );

		camera.lookAt( target );

		renderer.render( scene, camera );

	}

}