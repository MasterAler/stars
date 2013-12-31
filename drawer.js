var orreryDrawer = function() {

	var siteURL = document.location.href;
	var ajaxURL = siteURL + "particle_loader.php";

	var camera, scene, renderer;
	var cubeSize = 5000;
	var cubeDeadAreaPercent = 0.3;
	var speed = 2; 
	var SPHERE_COUNT = 2000;
	var segment_count = 20;
	var dx = 0, dy = 0, dz = 0;
	// var scale = 10;

	var mesh;
	var tparticles, particles, geometry, material, i, h, color, sprite, size;	
	
	var curpos = [1,1,1];
	var cubeId = 44; // Example

	var texture_placeholder,
	isUserInteracting = false,
	onMouseDownMouseX = 0, onMouseDownMouseY = 0, lastScrollPos = 0,
	lon = 90, onMouseDownLon = 0,
	lat = 0, onMouseDownLat = 0,
	phi = 0, theta = 0,
	target = new THREE.Vector3();
	
	var projector, ray;


	THREE.Ray.prototype.distanceFromIntersection = function( origin, direction, position ) {

		var v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
		var dot, intersect, distance;
		
		v0.subVectors( position, origin );
		dot = v0.dot( direction );

		if ( dot <= 0 ) return null; // check if position behind origin.

		intersect = v1.addVectors( origin, v2.copy( direction ).multiplyScalar( dot ) );
		distance = position.distanceTo( intersect );

		return distance;
	}
	
	THREE.Ray.prototype.intersectParticleSystem = function ( object, intersects ) {
	
		if (!object) return;
		var vertices = object.geometry.vertices;
		var point, distance, intersect;

		var localOrigin = this.origin.clone();
		var localDirection = this.direction.clone();

		this.localMatrix = new THREE.Matrix4();
		this.localMatrix.getInverse( object.matrixWorld );
		localOrigin.applyMatrix4(this.localMatrix);
		localDirection.transformDirection(this.localMatrix).normalize();
		
		this.threshold = 10;

		for ( var i = 0; i < vertices.length; i ++ ) {

				point = vertices[ i ];
				distance = this.distanceFromIntersection( localOrigin, localDirection, point );
				
				if  ((distance == null) || ( distance > this.threshold  )) {
						continue;
				}
				// console.log(distance, this.threshold);

				intersect = {

						distance: distance,
						point: point.clone(),
						face: null,
						object: object,
						vertex: i

				};

				intersects.push( intersect );
		}
	}
	
	//-------------------------------------------------------------

	$(document).ready(function() {
		init();
	});
	
	function generateSprite() {

		var scanvas = document.createElement( 'canvas' );
		scanvas.width = 20;
		scanvas.height = 20;

		var context = scanvas.getContext( '2d' );
		var gradient = context.createRadialGradient( scanvas.width / 2, scanvas.height / 2, 0, scanvas.width / 2, scanvas.height / 2, scanvas.width / 2 );
		gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
		gradient.addColorStop( 0.2, 'rgba(0,255,255,1)' );
		gradient.addColorStop( 0.4, 'rgba(0,0,64,1)' );
		gradient.addColorStop( 1, 'rgba(0,0,0,1)' );

		context.fillStyle = gradient;
		context.fillRect( 0, 0, scanvas.width, scanvas.height );

		return scanvas;

	}

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
		
		var ambient = new THREE.AmbientLight( 0x101010 );
		scene.add( ambient );

		scene.fog = new THREE.FogExp2( 0x000010, 0.00025 );

		renderer = new THREE.WebGLRenderer();
		// renderer = new THREE.CanvasRenderer();
		renderer.setClearColor(1, 1);
		renderer.setSize( swidth , sheight );

		container.appendChild( renderer.domElement );

		$(container).on('mousedown', onDocumentMouseDown);
		$(container).on('mouseup', onDocumentMouseUp);
		$(container).on('mousemove', onDocumentMouseMove);
		$(container).click(onDocumentMouseClick);
		
		//scroll, obviously; requires jQuery plugin
		/*$(container).on('mousewheel', function(event, delta){
			(delta > 0) ? moveForward() : moveBackward();
			console.log(event, event.deltaX, event.deltaFactor, event.delta, delta);
		});*/
		
		if (container.addEventListener) {
		  if ('onwheel' in document) {
			// IE9+, FF17+
			container.addEventListener ("wheel", onWheel, false);
		  } else if ('onmousewheel' in document) {
			// устаревший вариант события
			container.addEventListener ("mousewheel", onWheel, false);
		  } else {
			// 3.5 <= Firefox < 17, более старое событие DOMMouseScroll пропустим
			container.addEventListener ("MozMousePixelScroll", onWheel, false);
		  }
		} else { // IE<9
		  container.attachEvent ("onmousewheel", onWheel);
		}
	
		projector = new THREE.Projector();
		ray = new THREE.Ray();

		$(document).keydown(function(){
			if (event.which == 38 || event.which == 87)
				moveForward();
			else if (event.which == 40 || event.which == 83)
				moveBackward();
			// else if (event.which == 32)
			// {
				// console.log(geometry, material);
			// }
		});

		resetParticles();

		window.addEventListener( 'resize', onWindowResize, false );
		window.setTimeout(function() {
			container.click();
			//initial update needs to be set
		}, 1000);
	}
	
	function onWheel(e) {
	  e = e || window.event;
	  // wheelDelta не дает возможность узнать количество пикселей
	  var delta = e.deltaY || e.detail || e.wheelDelta;
	  (delta < 0) ? moveForward() : moveBackward();

	  e.preventDefault ? e.preventDefault() : (e.returnValue = false);
	}

	function resetParticles() {

		var url = '/site/cube/x/'+curpos[0]+'/y/'+curpos[1]+'/z/'+curpos[2];
		url = siteURL + url;
	
		$.post(url, {}, function(data){		
			if(data.success==true)
			{
				cubeId = data.cube.id;
				console.log("we're in cube", cubeId);
				
				// --- pic sprites --- //
				geometry = new THREE.Geometry();
				sprite = THREE.ImageUtils.loadTexture( "textures/sprites/disc.png" );
				sprite.needsUpdate=true;
				
				material = new THREE.ParticleBasicMaterial({ 
					size: 35, sizeAttenuation: false, blending: THREE.AdditiveBlending,
					map: sprite, transparent: true 
				});
				material.color.setHSL( 1.0, 0.3, 0.7 );
					
				var starData = data.stars;
				for(var i = 0; i < starData.length; ++i)
				{
					var posinfo = data.stars[i].star;
					var vertex = new THREE.Vector3(posinfo.x - cubeSize / 2, posinfo.y - cubeSize / 2, posinfo.z - cubeSize / 2);
					geometry.vertices.push( vertex );
				}
				
				scene.remove( particles );
				
				particles = new THREE.ParticleSystem( geometry, material );
				//particles.scale.x = particles.scale.y = Math.random() * 32 + 16;
				particles.sortParticles = true;

				scene.add( particles );
		
				dx = 0; dy = 0; dz = 0;
				mesh.position.x = 0;
				mesh.position.y = 0;
				mesh.position.z = 0;

				render();
				
			}else{
				console.log('Error. Load cube ('+curpos[0]+'x'+curpos[1]+'x'+curpos[2]+') failed.');
			}		
		},'json');
	}

	function cameraInBox() {

		var delta = cubeDeadAreaPercent * cubeSize;
		return (camera.position.x - delta > - cubeSize / 2) && (camera.position.x + delta < cubeSize / 2) &&
		(camera.position.y - delta > - cubeSize / 2) && (camera.position.y + delta < cubeSize / 2) &&
		(camera.position.z - delta > - cubeSize / 2) && (camera.position.z + delta < cubeSize / 2);
	}

	function resetCamera()
	{
		//now it's quite another cube
		var innerLen = cubeSize / 2 - cubeDeadAreaPercent * cubeSize;
		curpos[0] += Number(camera.position.x > innerLen);
		curpos[0] -= Number(-camera.position.x > innerLen);
		curpos[1] += Number(camera.position.y > innerLen);
		curpos[1] -= Number(-camera.position.y > innerLen);
		curpos[2] += Number(camera.position.z > innerLen);
		curpos[2] -= Number(-camera.position.z > innerLen);
		
		resetParticles();
		
		console.log("campos:",camera.position);
	

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

		render(true);
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
		dx = -dx; dy = -dy; dz = -dz;

		render(true);
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

	var mouse = { x: 0, y: 0 }, INTERSECTED;
	
	function onDocumentMouseMove( event ) {
		event.preventDefault();
	
		if ( isUserInteracting ) {

			lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
			lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
			render();
		}

		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		
		var Id = raycastStars();
		if (Id > 0)
			console.log(Id);
	}

	function onDocumentMouseUp( event ) {
		isUserInteracting = false;
		render();
	}
	
	function onDocumentMouseClick( event ) {
		event.preventDefault();
		var Id = raycastStars();
		if (Id > 0)
			alert(Id);
	}
	
	function raycastStars() {
		var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
		projector.unprojectVector( vector, camera );

		ray.set( camera.position, vector.sub( camera.position ).normalize() );
		var intersects = [];
		ray.intersectParticleSystem( particles, intersects);
		
		return (intersects.length > 0) ? intersects[0].vertex : -1;
	}

	function setAngles() {
		lat = Math.max( - 85, Math.min( 85, lat ) );
		phi = THREE.Math.degToRad( 90 - lat );
		theta = THREE.Math.degToRad( lon );
	}

	function render(moveCube) {
		moveCube = moveCube || false;

		setAngles();

		target.x = 0.5 * cubeSize * Math.sin( phi ) * Math.cos( theta );
		target.y = 0.5 * cubeSize * Math.cos( phi );
		target.z = 0.5 * cubeSize * Math.sin( phi ) * Math.sin( theta );

		camera.lookAt( target );

		// Static cube walls effect	
		if (moveCube)
		{
			mesh.position.x += dx;
			mesh.position.y += dy;
			mesh.position.z += dz;
		}
		
		/*var textOut = "Инфа" + "<br/>x: " + String(camera.position.x).substr(0,5) + "<br/>y: " 
								+ String(camera.position.y).substr(0,5) + "<br/>z: " + String(camera.position.z).substr(0,5);
		$("#info").html(textOut);*/

		renderer.render( scene, camera );

	}

}