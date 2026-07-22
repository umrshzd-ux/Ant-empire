// ===== CAMERA RIG, PRESETS, TOUCH/MOUSE, WORLD-TO-SCREEN =====

var camR = {
  target: new THREE.Vector3(TX + 2, CCY + 1.5, CZ),
  radius: 18,
  theta: Math.PI / 4,
  phi: 1.1,
  minRadius: 4,
  maxRadius: 50,
  minPhi: 0.1,
  maxPhi: 1.5
};

function updateCamera() {
  var r = camR.radius, t = camR.theta, p = camR.phi;
  camera.position.set(
    camR.target.x + r * Math.sin(p) * Math.sin(t),
    camR.target.y + r * Math.cos(p),
    camR.target.z + r * Math.sin(p) * Math.cos(t)
  );
  camera.lookAt(camR.target);
}

var presets = {
  surface: { target: new THREE.Vector3(0, GTY + 1, 0), radius: 28, theta: Math.PI / 5, phi: 0.9 },
  nest:    { target: new THREE.Vector3(TX, CCY + 1.0, CZ), radius: 7, theta: 0.5, phi: 1.25 },
  overhead:{ target: new THREE.Vector3(TX, GTY + 1, TCZ), radius: 14, theta: 0, phi: 0.15 },
  queen:   { target: new THREE.Vector3(TX, NP.y + 0.5, CZ), radius: 4, theta: 0.8, phi: 1.35 },
  orbit:   { target: new THREE.Vector3(TX + 3, -0.5, 0), radius: 20, theta: Math.PI / 3, phi: 1.05 },
  tactical:{ target: new THREE.Vector3(TX, GTY + 2, TCZ), radius: 35, theta: Math.PI / 6, phi: 0.7 }
};

var camAnim = null;
function flyToPreset(name) {
  var p = presets[name];
  if (!p) return;
  camAnim = {
    start: { target: camR.target.clone(), radius: camR.radius, theta: camR.theta, phi: camR.phi },
    end: p,
    t: 0,
    duration: 0.8
  };
}

function updateCameraAnim(dt) {
  if (!camAnim) return;
  camAnim.t += dt / camAnim.duration;
  var t = Math.min(1, camAnim.t);
  var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  camR.target.lerpVectors(camAnim.start.target, camAnim.end.target, e);
  camR.radius = camAnim.start.radius + (camAnim.end.radius - camAnim.start.radius) * e;
  camR.theta = camAnim.start.theta + (camAnim.end.theta - camAnim.start.theta) * e;
  camR.phi = camAnim.start.phi + (camAnim.end.phi - camAnim.start.phi) * e;
  if (t >= 1) camAnim = null;
}

// ----- Touch / mouse controls with inertia -----
var ltX = 0, ltY = 0, lpd = 0, iD = false, vTh = 0, vPh = 0;

function setupCameraControls() {
  // Touch events
  renderer.domElement.addEventListener("touchstart", function(e) {
    camAnim = null;
    if (e.touches.length === 1) {
      iD = true;
      ltX = e.touches[0].clientX;
      ltY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      iD = false;
      lpd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  }, { passive: true });

  renderer.domElement.addEventListener("touchmove", function(e) {
    if (e.touches.length === 1 && iD) {
      var dx = e.touches[0].clientX - ltX;
      var dy = e.touches[0].clientY - ltY;
      vTh = -dx * 0.005;
      vPh = -dy * 0.004;
      camR.theta += vTh;
      camR.phi = Math.max(camR.minPhi, Math.min(camR.maxPhi, camR.phi + vPh));
      ltX = e.touches[0].clientX;
      ltY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      var newRadius = camR.radius * (lpd / d);
      camR.radius = Math.max(camR.minRadius, Math.min(camR.maxRadius, newRadius));
      lpd = d;
    }
  }, { passive: true });

  renderer.domElement.addEventListener("touchend", function(e) {
    if (e.touches.length === 0) {
      iD = false;
    } else if (e.touches.length === 1) {
      iD = true;
      ltX = e.touches[0].clientX;
      ltY = e.touches[0].clientY;
    }
  });
}

function updateInertia(dt) {
  if (iD) return;
  vTh *= Math.pow(0.9, dt * 60);
  vPh *= Math.pow(0.9, dt * 60);
  if (Math.abs(vTh) > 1e-4 || Math.abs(vPh) > 1e-4) {
    camR.theta += vTh;
    camR.phi = Math.max(camR.minPhi, Math.min(camR.maxPhi, camR.phi + vPh));
  } else {
    vTh = 0;
    vPh = 0;
  }
}

// ----- World‑to‑screen coordinates -----
function worldToScreen(v) {
  _v3.copy(v).project(camera);
  return {
    x: (_v3.x * 0.5 + 0.5) * window.innerWidth,
    y: (-_v3.y * 0.5 + 0.5) * window.innerHeight
  };
}

// ----- Resize handler -----
window.addEventListener("resize", function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----- Initialization function (called from main.js after THREE.js is ready) -----
function initCamera() {
  updateCamera();                   // set initial camera position
  setupCameraControls();            // attach touch/mouse listeners
}
