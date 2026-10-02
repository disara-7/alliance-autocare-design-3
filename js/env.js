/* Shared 3D helpers + loader.
   Plain (non-module) scripts register scene functions on window.AA_SCENES; this
   file loads Three.js from the CDN and starts them. Using classic scripts keeps
   the page working when index.html is opened straight from disk (file://). */
(function () {
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

  function createEnv(THREE) {
    /**
     * Builds a "photo studio" environment map from emissive softboxes, so glossy
     * materials pick up crisp strip reflections like a car under showroom lights.
     */
    function studioEnvironment(renderer, { key = 0x3d6bff, rim = 0x6fe7ff, warm = 0xffffff } = {}) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020308);

      const box = (color, intensity, w, h, pos) => {
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        mesh.position.set(...pos);
        mesh.lookAt(0, 0, 0);
        scene.add(mesh);
      };

      box(0xffffff, 4.0, 10, 1.4, [0, 7, 1]);     // overhead strip
      box(0xffffff, 2.2, 1.0, 8, [-3, 0, 7]);     // front-left vertical strip
      box(key, 5.0, 4, 7, [-7, 1, 0]);            // cool key panel
      box(rim, 3.5, 2, 7, [7, 0, -2]);            // rim light
      box(warm, 1.6, 8, 0.4, [0, 1.5, -7]);       // thin back line
      box(0x1a2340, 1.0, 14, 14, [0, -7, 0]);     // floor bounce

      const rt = pmrem.fromScene(scene, 0.03);
      pmrem.dispose();
      scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
      return rt.texture;
    }

    /** Runs `tick` via rAF only while `el` is on screen. */
    function runWhenVisible(el, tick) {
      let raf = 0, visible = false, last = performance.now();
      const loop = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        tick(dt, now / 1000);
        raf = requestAnimationFrame(loop);
      };
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(loop); }
        else if (!entry.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); }
      }, { rootMargin: '100px' }).observe(el);
    }

    return { studioEnvironment, runWhenVisible, supportsWebGL, prefersReducedMotion };
  }

  function supportsWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch { return false; }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fallback() {
    document.documentElement.classList.add('no-webgl');
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (!supportsWebGL()) return fallback();
    import(THREE_URL)
      .then((THREE) => {
        const env = createEnv(THREE);
        (window.AA_SCENES || []).forEach((start) => start(THREE, env));
      })
      .catch(fallback);
  });
})();
