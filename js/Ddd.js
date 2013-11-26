function Ddd() {
	if(!Detector.webgl) {
		Detector.addGetWebGLMessage();	
	}

	this.height = 0;
	this.width = 0;
	this.calculateDimensions();

	this.container = $('#dddContainer')[0];

	this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 2000);
	this.camera.position.y = 400;

	this.scene = new THREE.Scene();

	this.renderer = new THREE.WebGLRenderer({ antialias: true });
	this.renderer.setSize(this.width, this.height);

	this.spheres = [];
	this.text = [];

	window.addEventListener('resize', bind(this.resize, this), false);
}

Ddd.prototype.init = function() {
	this.setupScene();
	this.animate();
};

Ddd.prototype.animate = function() {
	requestAnimationFrame(bind(this.animate, this));
	this.render();
};

Ddd.prototype.calculateDimensions = function() {
	this.width = $('#container').width()-20;
	this.height = this.width * (9/16);
};

Ddd.prototype.getCenter = function(n, x, r) {
	var a = 360/n;
	var point = {};
	point.x = r*Math.cos(Math.radians(a*x));
	point.y = r*Math.sin(Math.radians(a*x));
	return point;
};

Ddd.prototype.getCenters = function(n, r) {
	var a = 360/n;
	var points = [], x, y;
	for(var i = 0; i < n; i++) {
		x = r*Math.cos(Math.radians(a*i));
		y = r*Math.sin(Math.radians(a*i));
		points.push({ x: x, y: y });
	}
	return points;
};

Ddd.prototype.resize = function() {
	this.calculateDimensions();
	this.camera.aspect = this.width / this.height;
	this.camera.updateProjectionMatrix();
	this.renderer.setSize(this.width, this.height);
};

Ddd.prototype.render = function() {
	var timer = Date.now() * 0.0002;

	// Move the camera
	this.camera.position.x = Math.cos(timer) * 800;
	this.camera.position.z = Math.sin(timer) * 800;
	this.camera.lookAt(this.scene.position);

	// Rotate the spheres
	var object;
	for(var i = 0, l=this.spheres.length; i < l; i++) {
		object = this.spheres[i];
		object.rotation.x = timer * 5;
		object.rotation.y = timer * 2.5;
	}

	// Draw it
	this.renderer.render(this.scene, this.camera);
};

Ddd.prototype.setupScene = function() {
	this.scene.add(new THREE.AmbientLight(0x404040));
	var light = new THREE.DirectionalLight(0xcccccc);
	light.position.set(0, 1, 0);
	this.scene.add(light);

	// Test data
	var total = 1000;
	var fullWidth = 200;
	var that = this;

	db.getGenreCounts('movies', function(array) {
		var material, object, obj, radius, color, point, xOff, yOff, zOff;
		var textMaterial, text3d, text, group;
		for(var i = 0, l = array.length; i < l; i++) {
			obj = array[i];
			point = that.getCenter(array.length, i+1, 400);
			color = Math.random() * 0xffffff;

			// Sphere
			radius = obj.count / total * fullWidth;
			material = new THREE.MeshLambertMaterial({ ambient: color, side: THREE.DoubleSide });
			object = new THREE.Mesh(new THREE.SphereGeometry( radius, 20, 20 ), material);
			object.position.set(point.x, 100, point.y);
			that.scene.add(object);
			that.spheres.push(object);

			// Text
			text3d = new THREE.TextGeometry(obj.title, {
				size: 20,
				height: 5,
				curveSegments: 5,
				font: 'helvetiker'
			});
			text3d.computeBoundingBox();
			xOff = -0.5 * (text3d.boundingBox.max.x - text3d.boundingBox.min.x);
			yOff = -0.5 * (text3d.boundingBox.max.y - text3d.boundingBox.min.y);
			zOff = -0.5 * (text3d.boundingBox.max.z - text3d.boundingBox.min.z);
			textMaterial = new THREE.MeshBasicMaterial({ color: color, overdraw: true });
			text = new THREE.Mesh(text3d, textMaterial);

			text.position.set(xOff+point.x, 125+radius, point.y);
			text.rotation.x = 0;
			text.rotation.y = Math.PI * 2;
			that.text.push(text);

			group = new THREE.Object3D();
			group.add(text);
			that.scene.add(group);
		}

		that.container.appendChild(that.renderer.domElement);
	});
};