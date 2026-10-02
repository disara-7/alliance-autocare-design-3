const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------------------------------------------------------------- data */
// Prices are placeholders copied from the old homepage — confirm before launch.
const PRODUCTS = [
  { name: 'Interior Conditioner + Rose Gold Rapid Gels Kit', cat: 'Bundle', price: 15990, was: 17990, shape: 'kit', body: ['#2a2f3b', '#7d8699'], label: '#c98b7a', glow: 'rgba(255,170,150,.35)' },
  { name: 'Super Resin Polish', cat: 'Bodywork', price: 4950, shape: 'bottle', body: ['#7a0c18', '#e2394b'], label: '#f4f4f4', glow: 'rgba(255,59,79,.35)' },
  { name: 'Bodywork Shampoo Conditioner', cat: 'Bodywork', price: 3200, shape: 'bottle', body: ['#0f3d86', '#4d8dff'], label: '#e8eef9', glow: 'rgba(77,141,255,.4)' },
  { name: 'Rapid Ceramic Spray', cat: 'Protection', price: 14900, was: 16500, shape: 'spray', body: ['#15171d', '#4a4f5c'], label: '#7fe3ff', glow: 'rgba(127,227,255,.35)' },
  { name: 'Leather Care Balm', cat: 'Interior', price: 10600, shape: 'tin', body: ['#3a2416', '#a0704c'], label: '#e8d2b0', glow: 'rgba(224,170,110,.35)' },
];

const fmt = (n) => `Rs. ${n.toLocaleString('en-US')}`;
// Product photos live at images/products/<slug>.png; the SVG bottle is the fallback.
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------------------------------------------------------------- product art (SVG) */
function spray(c, id) {
  return `
    <path d="M58 22h44a8 8 0 0 1 8 8v26H50V30a8 8 0 0 1 8-8z" fill="url(#h${id})"/>
    <path d="M50 28H30a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h20z" fill="url(#h${id})"/>
    <path d="M60 56q-8 18-3 32h9q-3-14 5-32z" fill="url(#h${id})"/>
    <rect x="66" y="54" width="30" height="18" fill="url(#h${id})"/>
    <rect x="40" y="70" width="80" height="176" rx="16" fill="url(#b${id})"/>
    ${label(c, 46, 112, 68, 92)}
    <rect x="48" y="78" width="7" height="160" rx="3.5" fill="#fff" opacity=".22"/>`;
}
function bottle(c, id) {
  return `
    <rect x="62" y="20" width="36" height="34" rx="7" fill="url(#h${id})"/>
    <rect x="70" y="14" width="20" height="10" rx="3" fill="url(#h${id})"/>
    <path d="M50 66q30-18 60 0v166a14 14 0 0 1-14 14H64a14 14 0 0 1-14-14z" fill="url(#b${id})"/>
    ${label(c, 56, 108, 48, 100)}
    <rect x="56" y="74" width="6" height="164" rx="3" fill="#fff" opacity=".22"/>`;
}
function tin(c, id) {
  return `
    <rect x="32" y="172" width="96" height="70" rx="12" fill="url(#b${id})"/>
    <rect x="32" y="192" width="96" height="28" fill="${c.label}"/>
    <rect x="46" y="202" width="40" height="4" rx="2" fill="#000" opacity=".35"/>
    <rect x="46" y="210" width="26" height="3" rx="1.5" fill="#000" opacity=".25"/>
    <rect x="28" y="146" width="104" height="30" rx="10" fill="url(#h${id})"/>
    <ellipse cx="80" cy="148" rx="50" ry="6" fill="#fff" opacity=".15"/>
    <rect x="38" y="178" width="6" height="58" rx="3" fill="#fff" opacity=".2"/>`;
}
function label(c, x, y, w, h) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c.label}"/>
    <rect x="${x + 8}" y="${y + 14}" width="${w * 0.55}" height="5" rx="2.5" fill="#000" opacity=".55"/>
    <rect x="${x + 8}" y="${y + 24}" width="${w * 0.75}" height="3" rx="1.5" fill="#000" opacity=".3"/>
    <rect x="${x + 8}" y="${y + 31}" width="${w * 0.45}" height="3" rx="1.5" fill="#000" opacity=".3"/>
    <circle cx="${x + w / 2}" cy="${y + h - 26}" r="11" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2"/>`;
}
function productArt(p, i) {
  const [dark, light] = p.body;
  const id = `p${i}`;
  const defs = `
    <defs>
      <linearGradient id="b${id}" x1="0" x2="1"><stop offset="0" stop-color="${dark}"/><stop offset=".42" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <linearGradient id="h${id}" x1="0" x2="1"><stop offset="0" stop-color="#0c0e13"/><stop offset=".45" stop-color="#3a3f4a"/><stop offset="1" stop-color="#0c0e13"/></linearGradient>
    </defs>`;
  let body;
  if (p.shape === 'kit') {
    body = `
      <g transform="translate(-14 6) scale(.86)">${spray(p, id)}</g>
      <g transform="translate(66 40) scale(.76)">${bottle({ ...p, label: '#f1e3dc' }, id)}</g>
      <g transform="translate(18 20) scale(.84)">${tin(p, id)}</g>`;
  } else {
    body = { spray, bottle, tin }[p.shape](p, id);
  }
  return `<svg viewBox="0 0 160 260" aria-hidden="true">${defs}<ellipse cx="80" cy="250" rx="52" ry="6" fill="#000" opacity=".55"/>${body}</svg>`;
}

/* ---------------------------------------------------------------- coverflow */
(function coverflow() {
  const root = $('#coverflow');
  const stage = $('#cfStage');
  if (!root) return;

  stage.innerHTML = PRODUCTS.map((p, i) => `
    <article class="cf-card" data-i="${i}" aria-label="${p.name}">
      <div class="cf-card__inner" style="--glow:${p.glow}">
        <span class="cf-card__tag">${p.cat}</span>
        ${p.was ? `<span class="cf-card__badge">−${Math.round((1 - p.price / p.was) * 100)}%</span>` : ''}
        <div class="cf-card__art">
          <img src="images/products/${slug(p.name)}.png" alt="${p.name}" loading="lazy" onerror="this.remove()">
          ${productArt(p, i)}
        </div>
        <h3>${p.name}</h3>
        <div class="cf-card__price"><b>${fmt(p.price)}</b>${p.was ? `<s>${fmt(p.was)}</s>` : ''}</div>
        <button class="cf-card__add" type="button">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Add to cart</span>
        </button>
      </div>
      <div class="cf-card__reflect" aria-hidden="true"></div>
    </article>`).join('');

  const cards = $$('.cf-card', stage);
  const total = cards.length;
  // `pos` is unbounded so the ring can keep turning in either direction;
  // each card's offset is wrapped into [-total/2, total/2) around it.
  let pos = 1;
  let drag = 0;
  const offsets = [];
  $('#cfTotal').textContent = String(total).padStart(2, '0');

  const spacing = () => (window.innerWidth < 720 ? 175 : 255);
  const mod = (n, m) => ((n % m) + m) % m;
  const wrap = (o) => mod(o + total / 2, total) - total / 2;
  const activeIndex = () => mod(Math.round(pos), total);

  function layout() {
    const p = pos - drag / spacing();
    cards.forEach((card, i) => {
      const o = wrap(i - p);
      const a = Math.abs(o);
      // a card wrapping from one end to the other jumps instead of sweeping across the stage
      const jumped = offsets[i] !== undefined && Math.abs(o - offsets[i]) > total / 2;
      offsets[i] = o;
      if (jumped) card.style.transition = 'none';
      const rot = Math.max(-50, Math.min(50, -o * 32));
      card.style.transform = `translateX(${o * spacing()}px) translateZ(${-a * 170}px) rotateY(${rot}deg)`;
      card.style.zIndex = String(100 - Math.round(a * 10));
      card.style.opacity = a > 2.6 ? '0' : '1';
      if (jumped) { card.offsetWidth; card.style.transition = ''; }
      const isActive = a < 0.5;
      card.classList.toggle('is-active', isActive);
      card.setAttribute('aria-hidden', String(!isActive));
      $$('button', card).forEach((b) => (b.tabIndex = isActive ? 0 : -1));
    });
    $('#cfIndex').textContent = String(activeIndex() + 1).padStart(2, '0');
  }

  const step = (n) => { pos = Math.round(pos) + n; layout(); };
  $('#cfPrev').addEventListener('click', () => step(-1));
  $('#cfNext').addEventListener('click', () => step(1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  // drag / swipe
  let startX = null, moved = false;
  root.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    startX = e.clientX; moved = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    drag = e.clientX - startX;
    if (Math.abs(drag) > 6) { moved = true; root.classList.add('is-dragging'); layout(); }
  });
  window.addEventListener('pointerup', () => {
    if (startX === null) return;
    root.classList.remove('is-dragging');
    pos = Math.round(pos - drag / spacing());
    drag = 0; startX = null;
    layout();
  });

  // click a side card to bring it forward
  stage.addEventListener('click', (e) => {
    const card = e.target.closest('.cf-card');
    if (!card || moved) return;
    const i = +card.dataset.i;
    if (i !== activeIndex()) { step(Math.round(wrap(i - pos))); return; }
    const add = e.target.closest('.cf-card__add');
    if (add) addToCart(add);
  });

  // tilt + glare on the active card
  if (finePointer) {
    stage.addEventListener('pointermove', (e) => {
      const inner = e.target.closest('.cf-card.is-active .cf-card__inner');
      if (!inner || startX !== null) return;
      const r = inner.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      inner.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
      inner.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
      inner.style.setProperty('--mx', `${x * 100}%`);
      inner.style.setProperty('--my', `${y * 100}%`);
    });
    stage.addEventListener('pointerleave', () => {
      $$('.cf-card__inner', stage).forEach((el) => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  window.addEventListener('resize', layout);
  layout();
})();

/* ---------------------------------------------------------------- cart */
let cart = 0;
function addToCart(btn) {
  cart += 1;
  const count = $('#cartCount');
  count.textContent = cart;
  count.classList.remove('bump');
  void count.offsetWidth;
  count.classList.add('bump');
  btn.classList.add('is-added');
  btn.querySelector('span').textContent = 'Added';
  setTimeout(() => { btn.classList.remove('is-added'); btn.querySelector('span').textContent = 'Add to cart'; }, 1600);
}

/* ---------------------------------------------------------------- nav */
(function nav() {
  const navEl = $('#nav');
  const toggle = $('#navToggle');
  const onScroll = () => navEl.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toggle.addEventListener('click', () => {
    const open = navEl.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => {
    navEl.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
})();

/* ---------------------------------------------------------------- reveal + counters */
(function reveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  const counters = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      counters.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      const t0 = performance.now(), dur = reduced ? 1 : 1600;
      const step = (now) => {
        const k = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4))) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => counters.observe(el));
})();

/* ---------------------------------------------------------------- tilt panels */
if (finePointer) {
  $$('[data-tilt]').forEach((el) => {
    const max = +el.dataset.tilt || 8;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------------------------------------------------------------- exploded paint layers */
(function layers() {
  const wrap = $('#layersWrap');
  const stack = $('#layers');
  if (!wrap) return;
  const layerEls = $$('.layer', stack);
  const legend = $$('#layerLegend li');

  // explode as the section scrolls through the viewport
  const onScroll = () => {
    const r = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const k = Math.min(Math.max((vh - r.top) / (vh * 0.9), 0), 1);
    stack.style.setProperty('--explode', (reduced ? 1 : k).toFixed(3));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const highlight = (i) => {
    layerEls.forEach((el) => el.classList.toggle('is-hot', el.dataset.layer === i));
    legend.forEach((el) => el.classList.toggle('is-hot', el.dataset.layer === i));
  };
  [...layerEls, ...legend].forEach((el) => {
    el.addEventListener('pointerenter', () => highlight(el.dataset.layer));
    el.addEventListener('pointerleave', () => highlight(null));
  });
})();

/* ---------------------------------------------------------------- shop-by-surface panels */
(function matchPanels() {
  const panels = $$('#matchPanels .face');
  // the hovered / focused panel widens and lights up; it stays open until another is chosen
  const activate = (p) => panels.forEach((x) => x.classList.toggle('is-active', x === p));
  panels.forEach((p) => {
    p.addEventListener('pointerenter', () => activate(p));
    p.addEventListener('focus', () => activate(p));
  });
})();

/* ---------------------------------------------------------------- testimonial wall */
(function testimonials() {
  const section = $('#testimonials');
  const wall = $('#tWall');
  const source = $('#tSource');
  if (!section || !wall || !source) return;
  const items = $$('.t-card', source);
  const n = items.length;
  const head = $('.t-head', section);

  // each row holds every testimonial (in a rotated order) twice, so the drift loops seamlessly
  for (let r = 0; r < 2; r++) {
    const row = document.createElement('div');
    row.className = 't-row';
    row.style.setProperty('--dur', `${110 + r * 25}s`);
    const order = items.map((_, k) => (k + r * 4) % n);
    [...order, ...order].forEach((k) => {
      const tile = items[k].cloneNode(true);
      tile.dataset.k = k;
      row.appendChild(tile);
    });
    wall.appendChild(row);
  }
  const tiles = $$('.t-card', wall);
  let current = 0;

  const light = (tile) => tiles.forEach((t) => t.classList.toggle('is-focus', t === tile));

  // light the copy of testimonial k that is fully on screen, clear of the heading and nearest the middle
  function focus(k) {
    current = (k + n) % n;
    const box = wall.getBoundingClientRect();
    const h = head.getBoundingClientRect();
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    let best = null, bestScore = Infinity;
    tiles.forEach((t) => {
      if (+t.dataset.k !== current) return;
      const r = t.getBoundingClientRect();
      const offscreen = r.left < box.left + box.width * 0.08 || r.right > box.right - box.width * 0.08;
      const underHead = r.right > h.left && r.left < h.right && r.bottom > h.top && r.top < h.bottom;
      const score = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy) + (offscreen ? 1e4 : 0) + (underHead ? 1e5 : 0);
      if (score < bestScore) { bestScore = score; best = t; }
    });
    light(best);
  }

  // auto-advance while the section is on screen and the wall isn't being hovered
  let timer = null, hovering = false, visible = false;
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { stop(); if (visible && !hovering) timer = setInterval(() => focus(current + 1), 3800); };

  // hovering a tile brings it into focus; the rows pause (CSS) and so does the cycle
  wall.addEventListener('mouseover', (e) => {
    const tile = e.target.closest('.t-card');
    if (!tile) return;
    current = +tile.dataset.k;
    light(tile);
  });
  wall.addEventListener('mouseenter', () => { hovering = true; stop(); });
  wall.addEventListener('mouseleave', () => { hovering = false; start(); });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { focus(current); start(); } else stop();
  }, { threshold: 0.3 }).observe(section);
})();

/* ---------------------------------------------------------------- newsletter */
(function newsletter() {
  const form = $('#nlForm');
  const msg = $('#nlMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#nlEmail').value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    msg.classList.toggle('is-error', !ok);
    msg.textContent = ok ? 'Thanks — you’re on the list.' : 'Please enter a valid email address.';
    if (ok) form.reset();
    // TODO: POST to your email provider here.
  });
})();

$('#year').textContent = new Date().getFullYear();
