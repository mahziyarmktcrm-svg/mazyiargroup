// Mahziyar Group — interactions. No dependencies.
(() => {
  const d = document, root = d.documentElement, body = d.body;
  const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const WA = body.dataset.wa;

  // ---------- loader (first page view of the session only) ----------
  const seen = sessionStorage.getItem('mz-seen');
  if (seen || RM) body.classList.add('no-loader');
  const done = () => { body.classList.add('is-loaded'); sessionStorage.setItem('mz-seen', '1'); };
  if (d.readyState === 'complete') setTimeout(done, seen ? 0 : 500); else addEventListener('load', () => setTimeout(done, seen ? 0 : 350));
  setTimeout(done, 2600); // never block longer than this

  // ---------- split headings into words ----------
  $$('[data-split]').forEach((el) => {
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = d.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) return frag.append(t);
          const w = d.createElement('span'); w.className = 'w';
          const s = d.createElement('span'); s.textContent = t; s.style.setProperty('--wi', i++); w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
  });
  $$('[data-scrub]').forEach((el) => { el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' '); });

  // ---------- reveal on scroll ----------
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('[data-reveal], [data-split], .trust__dial').forEach((el) => io.observe(el));

  // ---------- counters ----------
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '';
    if (RM) return; const t0 = performance.now(), dur = 1800;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - p, 4)); el.textContent = v.toFixed(dec) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  // ---------- header, progress, parallax, rail, scrub, stack, marquee (one rAF loop) ----------
  const hdr = $('[data-hdr]'), bar = $('[data-progress]');
  const para = $$('[data-parallax]');
  const scrubs = $$('[data-scrub]');
  const stack = $$('.stack__c');
  const rail = $('[data-rail]'), track = $('[data-rail-track]');
  const marquee = $('[data-marquee]');
  let lastY = scrollY, mx = 0, vel = 0, ticking = false;

  const setupRail = () => {
    if (!rail) return;
    const on = innerWidth > 980 && !RM;
    rail.classList.toggle('is-pinned', on);
    if (on) { const extra = track.scrollWidth - innerWidth; rail.style.setProperty('--rail-h', `${innerHeight + extra}px`); }
    else { track.style.transform = ''; }
  };
  setupRail(); addEventListener('resize', setupRail); addEventListener('load', setupRail);

  const frame = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight, dy = y - lastY;
    if (hdr) { hdr.classList.toggle('is-solid', y > 40); hdr.classList.toggle('is-hidden', y > 400 && dy > 4 && !body.classList.contains('menu-open')); if (dy < -4) hdr.classList.remove('is-hidden'); }
    if (bar) bar.style.transform = `scaleX(${y / Math.max(1, root.scrollHeight - vh)})`;
    vel = dy; lastY = y;
    if (RM) return;
    para.forEach((el) => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; const c = r.top + r.height / 2 - vh / 2; el.style.transform = `translate3d(0, ${(c * parseFloat(el.dataset.parallax)).toFixed(1)}px, 0)`; });
    scrubs.forEach((el) => { const r = el.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .35))); const ws = el.children, n = Math.floor(p * ws.length * 1.05); for (let i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n); });
    stack.forEach((c, i) => { const next = stack[i + 1]; if (!next) return; const r = next.getBoundingClientRect(), me = c.getBoundingClientRect(); const ov = Math.min(1, Math.max(0, (me.bottom - r.top) / me.height)); c.style.transform = `scale(${1 - ov * .06})`; c.style.filter = `brightness(${1 - ov * .35})`; });
    if (rail && rail.classList.contains('is-pinned')) {
      const r = rail.getBoundingClientRect(), total = rail.offsetHeight - vh, p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      const extra = track.scrollWidth - innerWidth; track.style.transform = `translate3d(${-p * extra}px,0,0)`;
      const n = $('[data-rail-n]'), cards = track.children.length - 1; if (n) n.textContent = String(Math.min(cards, 1 + Math.round(p * (cards - 1)))).padStart(2, '0');
      const b = $('[data-rail-bar]'); if (b) b.style.transform = `scaleX(${Math.max(.09, p)})`;
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true }); frame();
  // rail count on mobile (native scroll)
  if (track) track.addEventListener('scroll', () => { if (rail.classList.contains('is-pinned')) return; const p = track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth); const cards = track.children.length - 1; const n = $('[data-rail-n]'); if (n) n.textContent = String(1 + Math.round(p * (cards - 1))).padStart(2, '0'); const b = $('[data-rail-bar]'); if (b) b.style.transform = `scaleX(${Math.max(.09, p)})`; }, { passive: true });

  if (marquee && !RM) {
    const loop = () => { const half = marquee.scrollWidth / 2; mx -= .6 + Math.min(8, Math.abs(vel) * .15); vel *= .9; if (-mx >= half) mx += half; marquee.style.transform = `translate3d(${mx}px,0,0)`; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  // ---------- cursor glow + tilt + magnetic ----------
  if (FINE && !RM) {
    $$('[data-tilt], [data-glow]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
        if (el.hasAttribute('data-tilt')) el.style.transform = `perspective(900px) rotateX(${(.5 - y) * 6}deg) rotateY(${(x - .5) * 8}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- high-rise list ↔ image ----------
  const skyImgs = $$('[data-sky-img]'), skyLinks = $$('[data-sky]');
  const sky = (i) => { skyImgs.forEach((f) => f.classList.toggle('is-on', f.dataset.skyImg === String(i))); skyLinks.forEach((a) => a.classList.toggle('is-on', a.dataset.sky === String(i))); };
  skyLinks.forEach((a) => { a.addEventListener('pointerenter', () => sky(a.dataset.sky)); a.addEventListener('focus', () => sky(a.dataset.sky)); });
  if (skyLinks.length) sky(0);

  // ---------- hero reel (desktop vs phone master, WebM first) ----------
  const reel = $('[data-reel]');
  if (reel && !RM && !(navigator.connection && navigator.connection.saveData)) {
    const base = innerWidth <= 760 ? reel.dataset.m : reel.dataset.d;
    reel.innerHTML = `<source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4">`;
    reel.addEventListener('playing', () => reel.classList.add('is-on'), { once: true });
    reel.load(); reel.play().catch(() => {});
  }
  // muted loops only play while visible
  const vio = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { threshold: .2 });
  $$('video[data-inview], .phero__bg video').forEach((v) => { if (RM) { v.removeAttribute('autoplay'); return; } vio.observe(v); });

  // ---------- players ----------
  $$('[data-player]').forEach((p) => {
    const v = $('video', p), go = $('.player__go', p);
    go.addEventListener('click', () => { v.controls = true; v.preload = 'auto'; p.classList.add('is-playing'); v.play().catch(() => {}); });
    v.addEventListener('ended', () => { p.classList.remove('is-playing'); v.controls = false; });
  });

  // ---------- dialogs ----------
  const modal = $('#enquire'), lb = $('#lightbox');
  const open = (dlg) => { if (!dlg) return; dlg.showModal(); body.style.overflow = 'hidden'; };
  $$('dialog').forEach((dlg) => {
    dlg.addEventListener('close', () => { body.style.overflow = ''; });
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  });
  d.addEventListener('click', (e) => {
    const b = e.target.closest('[data-enquire]');
    if (b && modal) {
      const sel = $('select[name="project"]', modal), want = b.dataset.enquire;
      if (want) { const o = [...sel.options].find((x) => x.text === want || x.text.startsWith(`${want} (`)); if (o) sel.value = o.value; }
      open(modal); setTimeout(() => $('input', modal)?.focus(), 60); return;
    }
    const l = e.target.closest('[data-lightbox]');
    if (l && lb) { $('[data-lb-img]', lb).src = l.dataset.lightbox; $('[data-lb-img]', lb).alt = l.dataset.caption || ''; $('[data-lb-cap]', lb).textContent = l.dataset.caption || ''; open(lb); }
  });

  // ---------- mobile menu ----------
  const burger = $('[data-burger]'), mnav = $('[data-mnav]');
  if (burger && mnav) {
    const set = (on) => { burger.setAttribute('aria-expanded', on); burger.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); body.classList.toggle('menu-open', on); body.style.overflow = on ? 'hidden' : '';
      if (on) { mnav.hidden = false; requestAnimationFrame(() => mnav.classList.add('is-open')); } else { mnav.classList.remove('is-open'); setTimeout(() => { if (!mnav.classList.contains('is-open')) mnav.hidden = true; }, 300); } };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    mnav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  // ---------- sub-nav active section ----------
  const sub = $$('[data-subnav] a');
  if (sub.length) {
    const sio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) sub.forEach((a) => a.classList.toggle('is-on', a.hash === `#${e.target.id}`)); }), { rootMargin: '-40% 0px -55% 0px' });
    sub.forEach((a) => { const t = $(a.hash); if (t) sio.observe(t); });
  }
  // societies page tabs
  $$('.tabs a').forEach((a) => a.addEventListener('click', () => $$('.tabs a').forEach((x) => x.classList.toggle('is-on', x === a))));

  // ---------- share (connect page) ----------
  $$('[data-share]').forEach((b) => b.addEventListener('click', async () => {
    const data = { title: document.title, text: 'Mahziyar Group — real estate in Islamabad', url: location.href };
    try { if (navigator.share) return await navigator.share(data); await navigator.clipboard.writeText(location.href); const l = $('[data-share-l]', b); if (l) { l.textContent = 'Link copied ✓'; setTimeout(() => (l.textContent = 'This page'), 2200); } } catch {}
  }));

  // ---------- enquiry → WhatsApp ----------
  $$('[data-enquiry]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (n) => (f.elements[n]?.value || '').trim();
    const err = $('.form__err', f), bad = [];
    if (v('name').length < 2) bad.push('name');
    if (v('phone').replace(/\D/g, '').length < 7) bad.push('phone');
    $$('.fld', f).forEach((l) => l.classList.toggle('is-bad', bad.includes(l.querySelector('input,select,textarea')?.name)));
    if (bad.length) { err.hidden = false; f.elements[bad[0]].focus(); return; }
    err.hidden = true;
    const msg = ['Assalam o Alaikum Mahziyar Group, I would like to discuss a property investment.', '', `Name: ${v('name')}`, `Phone: ${v('phone')}`, `Interested in: ${v('project')}`, `Budget: ${v('budget')}`, `Purpose: ${v('purpose')}`, v('message') ? `Message: ${v('message')}` : '', '', `Page: ${location.href}`].filter((x, i, a) => x || a[i - 1]).join('\n');
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    if (window.gtag) gtag('event', 'generate_lead', { project: v('project') });
    const dlg = f.closest('dialog'); if (dlg) dlg.close();
  }));
  if (window.gtag) d.addEventListener('click', (e) => { const a = e.target.closest('a[href^="tel:"], a[href*="wa.me"]'); if (a) gtag('event', 'contact_click', { method: a.href.startsWith('tel:') ? 'call' : 'whatsapp' }); });
})();
