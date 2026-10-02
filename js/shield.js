/* Carbon Shield: coated paint panel with water beads. Started by js/env.js. */
(window.AA_SCENES = window.AA_SCENES || []).push((THREE, { studioEnvironment, prefersReducedMotion, runWhenVisible }) => {

const canvas = document.getElementById('shieldCanvas');
const range = document.getElementById('coatRange');
const meters = {
  bead: document.getElementById('mBead'),
  gloss: document.getElementById('mGloss'),
  clean: document.getElementById('mClean'),
};

const smooth = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer, { key: 0xff5a6a, rim: 0xffc2a8, warm: 0xffffff });

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 3.6, 5.5);
  camera.lookAt(0, -0.75, 0);

  // A domed paint-sample panel: a spherical cap, so every point has an analytic normal.
  const R = 4;
  const THETA = 0.55;
  const tilt = new THREE.Group();
  tilt.position.y = 0.45;
  scene.add(tilt);

  const paint = new THREE.MeshPhysicalMaterial({
    color: 0x9a0716,
    metalness: 0.45,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.2,
  });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 60, 0, Math.PI * 2, 0, THETA), paint);
  cap.position.y = -R;
  tilt.add(cap);

  const bezel = new THREE.Mesh(
    new THREE.TorusGeometry(R * Math.sin(THETA), 0.045, 24, 200),
    new THREE.MeshPhysicalMaterial({ color: 0xd9dde6, metalness: 1, roughness: 0.15 }),
  );
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = R * Math.cos(THETA);
  cap.add(bezel);

  // ---------- droplets ----------
  const COUNT = 120;
  const water = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.25, ior: 1.33,
    envMapIntensity: 1.6, clearcoat: 1,
  });
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), water, COUNT);
  drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cap.add(drops);

  const state = Array.from({ length: COUNT }, () => spawn({}, Math.random()));
  function spawn(d, grow = 0) {
    const cosMax = Math.cos(THETA * 0.9);
    const th = Math.acos(1 - Math.random() * (1 - cosMax));
    const ph = Math.random() * Math.PI * 2;
    d.dir = (d.dir || new THREE.Vector3()).set(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    d.vel = (d.vel || new THREE.Vector3()).set(0, 0, 0);
    d.r = 0.03 + Math.pow(Math.random(), 2) * 0.08;
    d.grow = grow;
    return d;
  }

  // ---------- coating state ----------
  let coat = 1, coatTarget = 1;
  function readRange() {
    coatTarget = range.value / 100;
    range.style.setProperty('--p', `${range.value}%`);
  }
  range.addEventListener('input', readRange);
  readRange();

  // ---------- drag to tilt ----------
  const tiltTarget = { x: 0, z: 0 };
  let dragging = false, dragStart = null, idle = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, tx: tiltTarget.x, tz: tiltTarget.z };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const k = 0.006;
    tiltTarget.z = THREE.MathUtils.clamp(dragStart.tz - (e.clientX - dragStart.x) * k, -0.5, 0.5);
    tiltTarget.x = THREE.MathUtils.clamp(dragStart.tx + (e.clientY - dragStart.y) * k, -0.45, 0.45);
  });
  const release = () => { dragging = false; idle = 0; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const invQ = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const g = new THREE.Vector3();
  const gT = new THREE.Vector3();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  let lastMeter = -1;

  runWhenVisible(canvas, (dt, t) => {
    coat += (coatTarget - coat) * (1 - Math.pow(0.004, dt));

    // gentle idle sway so beads keep sheeting off when coated
    if (!dragging) {
      idle += dt;
      const sway = prefersReducedMotion ? 0 : Math.min(idle / 2, 1);
      tiltTarget.z += ((Math.sin(t * 0.5) * 0.28) * sway - tiltTarget.z) * 0.02;
      tiltTarget.x += ((Math.cos(t * 0.37) * 0.16) * sway - tiltTarget.x) * 0.02;
    }
    tilt.rotation.x += (tiltTarget.x - tilt.rotation.x) * 0.08;
    tilt.rotation.z += (tiltTarget.z - tilt.rotation.z) * 0.08;
    cap.rotation.y += dt * 0.06;

    // surface response to the coating
    paint.roughness = mix(0.62, 0.2, coat);
    paint.clearcoat = mix(0.05, 1, coat);
    paint.clearcoatRoughness = mix(0.5, 0.02, coat);

    const hy = mix(0.2, 0.9, coat);       // bead height (contact angle)
    const spread = mix(2.0, 1.0, coat);   // puddles spread when uncoated
    const roll = smooth(0.55, 1, coat);   // only coated paint sheds water

    // world gravity expressed in the cap's local frame
    cap.getWorldQuaternion(invQ).invert();
    g.set(0, -1, 0).applyQuaternion(invQ);

    for (let i = 0; i < COUNT; i++) {
      const d = state[i];
      d.grow = Math.min(d.grow + dt * 1.5, 1);

      gT.copy(g).addScaledVector(d.dir, -g.dot(d.dir));
      d.vel.addScaledVector(gT, roll * 2.2 * dt * (0.6 + d.r * 8));
      d.vel.multiplyScalar(Math.exp(-dt * (1.4 + (1 - roll) * 30)));
      d.vel.addScaledVector(d.dir, -d.vel.dot(d.dir));
      d.dir.addScaledVector(d.vel, dt / R).normalize();

      if (Math.acos(THREE.MathUtils.clamp(d.dir.y, -1, 1)) > THETA * 0.97) spawn(d);

      const e = 1 - Math.pow(1 - d.grow, 3);
      const r = d.r * e;
      p.copy(d.dir).multiplyScalar(R + r * hy * 0.35);
      q.setFromUnitVectors(up, d.dir);
      s.set(r * spread, Math.max(r * hy, 1e-4), r * spread);
      drops.setMatrixAt(i, m.compose(p, q, s));
    }
    drops.instanceMatrix.needsUpdate = true;

    const key = Math.round(coat * 100);
    if (key !== lastMeter) {
      lastMeter = key;
      meters.bead.style.transform = `scaleX(${coat.toFixed(3)})`;
      meters.gloss.style.transform = `scaleX(${mix(0.3, 1, coat).toFixed(3)})`;
      meters.clean.style.transform = `scaleX(${smooth(0.4, 1, coat).toFixed(3)})`;
    }

    renderer.render(scene, camera);
  });
}

if (canvas) init();

});
