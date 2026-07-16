// ===== CAMERA RIG, PRESETS, TOUCH/MOUSE, WORLD-TO-SCREEN =====

var camR = {
  target: new THREE.Vector3(TX + 2, CCY + 1.5, CZ),   // look at the nest centre
  radius: 18,                                           // comfortable mid‑range distance
  theta: Math.PI / 4,                                   // 45° horizontal rotation
  phi: 1.1,                                             // slightly above horizontal
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
updateCamera();

// ----- Presets: quick access to useful viewpoints -----
var presets = {
  // Classic surface overview (unchanged)
  surface: { target: new THREE.Vector3(0, GTY + 1, 0), radius: 28, theta: Math.PI / 5, phi: 0.9 },

  // Focus on the underground nest
  nest:    { target: new THREE.Vector3(TX, CCY + 1.0, CZ), radius: 7, theta: 0.5, phi: 1.25 },

  // Top‑down orthogonal view for building / management
  overhead:{ target: new THREE.Vector3(TX, GTY + 1, TCZ), radius: 14, theta: 0, phi: 0.15 },

  // Close‑up on the queen chamber
  queen:   { target: new THREE.Vector3(TX, NP.y + 0.5, CZ), radius: 4, theta: 0.8, phi: 1.35 },

  // Free orbit (original)
  orbit:   { target: new THREE.Vector3(TX + 3, -0.5, 0), radius: 20, theta: Math.PI / 3, phi: 1.05 },

  // Wide tactical view (distant, high angle)
  tactical:{ target: new THREE.Vector3(TX, GTY + 2, TCZ), radius: 35, theta: Math.PI / 6, phi: 0.7 }
};

// ----- Smooth animation between presets -----
var camAnim = null;
function flyToPreset(name) {
  var p = presets[name];
  if (!p) return;
  camAnim = {
    start: { target: camR.target.clone(), radius: camR.radius, theta: camR.theta, phi: camR.phi },
    end: p,
    t: 0,
    duration: 0.8  // slightly longer for a cinematic feel
  };
}

function updateCameraAnim(dt) {
  if (!camAnim) return;
  camAnim.t += dt / camAnim.duration;
  var t = Math.min(1, camAnim.t);
  // Smooth ease‑in‑out
  var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  camR.target.lerpVectors(camAnim.start.target, camAnim.end.target, e);
  camR.radius = camAnim.start.radius + (camAnim.end.radius - camAnim.start.radius) * e;
  camR.theta = camAnim.start.theta + (camAnim.end.theta - camAnim.start.theta) * e;
  camR.phi = camAnim.start.phi + (camAnim.end.phi - camAnim.start.phi) * e;
  if (t >= 1) camAnim = null;
}

// ----- Touch / mouse controls with inertia -----
var ltX = 0, ltY = 0, lpd = 0, iD = false, vTh = 0, vPh = 0;

renderer.domElement.addEventListener("touchstart", function(e) {
  camAnim = null; // cancel any preset animation
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
    // Zoom: smaller distance → smaller radius (zoom in)
    var newRadius = camR.radius * (lpd / d);
    camR.radius = Math.max(camR.minRadius, Math.min(camR.maxRadius, newRadius));
    lpd = d;
  }
}, { passive: true });

renderer.domElement.addEventListener("touchend", function(e) {
  if (e.touches.length === 0) {
    iD = false;
  } else if (e.touches.length === 1) {
    // Transition from pinch to single finger
    iD = true;
    ltX = e.touches[0].clientX;
    ltY = e.touches[0].clientY;
  }
});

// Inertia update – called from main loop
function updateInertia(dt) {
  if (iD) return; // don't apply inertia while touching
  vTh *= Math.pow(0.9, dt * 60);   // frame‑rate independent damping
  vPh *= Math.pow(0.9, dt * 60);
  if (Math.abs(vTh) > 1e-4 || Math.abs(vPh) > 1e-4) {
    camR.theta += vTh;
    camR.phi = Math.max(camR.minPhi, Math.min(camR.maxPhi, camR.phi + vPh));
  } else {
    vTh = 0;
    vPh = 0;
  }
}

// ----- World‑to‑screen coordinates (for floaters, damage numbers) -----
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
