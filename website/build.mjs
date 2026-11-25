// Mahziyar Group — static site generator. Zero dependencies (Node 18+).
//   node build.mjs   → writes ./dist (deploy that folder)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, services, steps, promises, faqs } from './src/data/site.mjs';
import { societies, highrises as rawHighrises, villas } from './src/data/projects.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const STATIC = join(ROOT, 'src/static');
const MEDIA = JSON.parse(readFileSync(join(ROOT, 'src/data/media.json'), 'utf8'));
const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = new Date().getFullYear();

// ---------- data ----------
const socBySlug = Object.fromEntries(societies.map((s) => [s.slug, s]));
const highrises = rawHighrises.map((h) => {
  const host = h.in ? socBySlug[h.in] : null;
  const cover = h.images?.[0]?.[0] || h.cover || host.images[0][0];
  return { ...h, host, area: h.area || host?.area, coverName: cover, thin: !h.story };
});
societies.forEach((s) => { s.towers = highrises.filter((h) => h.in === s.slug); });
// villa plan must add up
const planTotal = villas.plan.reduce((a, [, , amt, n]) => a + amt * n, 0);
if (planTotal !== villas.price) throw new Error(`villa plan adds to ${planTotal}, price ${villas.price}`);
const VURL = `/${villas.slug}/`;
const allProjects = [{ name: villas.name, url: VURL }, ...societies.map((s) => ({ ...s, kind: 'society', url: `/societies/${s.slug}/` })), ...highrises.map((h) => ({ ...h, kind: 'highrise', url: `/high-rise/${h.slug}/` }))];

// ---------- helpers ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nb = (s = '') => esc(s).replace(/-/g, '‑');
const abs = (p) => site.url + p;
const pad = (n) => String(n).padStart(2, '0');
const rs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK');
const crore = (n) => (n >= 1e7 ? `${+(n / 1e7).toFixed(2)} Crore` : `${+(n / 1e5).toFixed(2)} Lac`);
const wa = (text) => `https://wa.me/${site.phones.whatsapp.wa}?text=${encodeURIComponent(text)}`;
const WA_HELLO = 'Assalam o Alaikum Mahziyar Group, I would like property information.';
const ver = (f) => createHash('md5').update(readFileSync(join(STATIC, f))).digest('hex').slice(0, 8);
const AV = { css: ver('assets/css/site.css'), js: ver('assets/js/site.js') };

const img = (name, { alt = '', sizes = '(max-width: 760px) 100vw, 50vw', eager = false, cls = '', pos = '' } = {}) => {
  const m = MEDIA[name]; if (!m) throw new Error(`missing image ${name}`);
  return `<img class="${cls}" src="/assets/img/${name}-800.webp" srcset="/assets/img/${name}-800.webp ${m.sw}w, /assets/img/${name}.webp ${m.w}w" sizes="${sizes}" alt="${esc(alt)}" width="${m.w}" height="${m.h}"${pos ? ` style="object-position:${pos}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
};

// ---------- icons ----------
const P = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  pin: '<path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  check: '<path d="m5 12 4 4 10-10"/>', plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>', chev: '<path d="m6 9 6 6 6-6"/>', expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>', shield: '<path d="M12 3 4.5 6v5.6c0 4.5 3.1 8 7.5 9.4 4.4-1.4 7.5-4.9 7.5-9.4V6z"/><path d="m8.8 12.1 2.2 2.2 4.3-4.5"/>',
  plot: '<path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  tower: '<path d="M6 21V5l6-3v19M12 8l6 3v10M3 21h18M9 7h0M9 11h0M9 15h0M15 14h0M15 17h0"/>', shop: '<path d="M4 9h16l-1-5H5zM5 9v11h14V9M9 20v-6h6v6"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14"/>', file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 14.5l2 2 4-4"/>',
  route: '<circle cx="6" cy="18.5" r="2.2"/><path d="M8.2 18.5h7.3a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H13"/><path d="M18 10.5s-3-2.6-3-5a3 3 0 0 1 6 0c0 2.4-3 5-3 5z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', menu: '<path d="M4 8h16M4 16h16"/>',
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11.5h13V9"/><path d="M10 20.5v-6h4v6"/>', x: '<path d="M7 7l10 10M17 7 7 17"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3z"/>',
};
const ico = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const B = { // Simple Icons (monochrome; coloured on hover in CSS)
  fb: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  ig: 'M7.03.084c-1.277.06-2.149.264-2.911.563-.789.308-1.458.72-2.123 1.388-.665.668-1.075 1.337-1.38 2.127-.296.764-.496 1.637-.552 2.914-.056 1.278-.069 1.688-.063 4.947.006 3.259.021 3.667.083 4.947.061 1.277.264 2.148.563 2.911.308.789.72 1.457 1.388 2.123.668.665 1.337 1.074 2.129 1.38.763.295 1.636.496 2.913.552 1.277.056 1.688.069 4.946.063 3.258-.006 3.668-.021 4.948-.081 1.28-.061 2.147-.265 2.91-.563.789-.309 1.458-.72 2.123-1.388.665-.668 1.074-1.338 1.379-2.129.296-.763.497-1.636.552-2.912.056-1.281.069-1.69.063-4.948-.006-3.258-.021-3.667-.082-4.946-.061-1.28-.264-2.149-.563-2.912-.308-.789-.72-1.457-1.388-2.123C21.298 1.33 20.628.921 19.838.617 19.074.321 18.202.12 16.924.065 15.647.009 15.236-.005 11.977.001 8.718.008 8.31.022 7.03.084m.14 21.693c-1.17-.051-1.805-.245-2.229-.408-.561-.216-.96-.477-1.382-.895-.422-.418-.681-.819-.9-1.378-.164-.423-.362-1.058-.417-2.228-.06-1.265-.072-1.644-.079-4.848-.007-3.204.005-3.583.061-4.848.05-1.169.246-1.805.408-2.228.216-.561.476-.96.895-1.382.419-.422.818-.681 1.378-.9.423-.165 1.058-.361 2.227-.417 1.266-.06 1.645-.072 4.848-.079 3.203-.007 3.584.005 4.85.061 1.169.051 1.805.244 2.228.408.561.216.96.475 1.382.895.422.419.681.818.9 1.379.165.422.362 1.056.417 2.226.06 1.266.074 1.645.08 4.848.006 3.203-.006 3.583-.061 4.848-.051 1.17-.245 1.806-.408 2.23-.216.56-.476.96-.895 1.381-.419.422-.818.681-1.378.9-.422.165-1.058.362-2.226.417-1.266.06-1.645.072-4.849.079-3.205.007-3.583-.006-4.848-.061M16.953 5.586a1.44 1.44 0 1 0 1.437-1.442 1.44 1.44 0 0 0-1.437 1.442M5.839 12.012a6.161 6.161 0 1 0 12.323-.024 6.162 6.162 0 0 0-12.323.024M8 12.008A4 4 0 1 1 12.008 16 4 4 0 0 1 8 12.008',
  yt: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  tt: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  li: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  wa: 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.48-8.41',
  google: 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z',
};
const brand = (n, cls = 'b') => `<svg class="${cls} ${cls}--${n}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${B[n]}"/></svg>`;
const stars = () => `<span class="stars" aria-hidden="true">${ico('star')}${ico('star')}${ico('star')}${ico('star')}${ico('star')}</span>`;
const socials = (cls = 'soc') => `<ul class="${cls}">${site.social.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}: ${esc(s.handle)}" data-brand="${s.id}">${brand(s.id)}</a></li>`).join('')}</ul>`;

// ---------- components ----------
const kicker = (t) => `<p class="kicker"><span></span>${esc(t)}</p>`;
const btnWa = (label = 'WhatsApp us', text = WA_HELLO, cls = '') => `<a class="btn btn--wa ${cls}" href="${wa(text)}" target="_blank" rel="noopener" data-magnetic>${brand('wa', 'i')}<span>${label}</span></a>`;
const projectOptions = (sel) => ['Not sure yet — advise me', `${villas.name} (${villas.where})`, ...societies.map((s) => s.name), ...highrises.map((h) => `${h.name}${h.host ? ` (${h.host.name})` : ''}`), 'Commercial / office space'].map((o) => `<option${o === sel || o.startsWith(`${sel} (`) ? ' selected' : ''}>${esc(o)}</option>`).join('');

let formN = 0;
const enquiry = ({ project = '', title = 'Send an investment enquiry', sub = 'We open WhatsApp with your message ready — no account or sign-up needed.' } = {}) => {
  const id = `f${++formN}`;
  return `<form class="form" data-enquiry novalidate aria-labelledby="${id}">
  <h3 id="${id}" class="form__t">${esc(title)}</h3><p class="form__s">${esc(sub)}</p>
  <div class="form__row"><label class="fld"><input name="name" autocomplete="name" required minlength="2" placeholder=" "><span>Your name</span></label>
  <label class="fld"><input name="phone" type="tel" autocomplete="tel" required placeholder=" "><span>Phone / WhatsApp</span></label></div>
  <label class="fld fld--sel"><select name="project">${projectOptions(project)}</select><span>Interested in</span>${ico('chev')}</label>
  <div class="form__row"><label class="fld fld--sel"><select name="budget"><option>Under PKR 25 lac</option><option>PKR 25 – 50 lac</option><option>PKR 50 lac – 1 crore</option><option>PKR 1 – 3 crore</option><option>Above PKR 3 crore</option></select><span>Budget</span>${ico('chev')}</label>
  <label class="fld fld--sel"><select name="purpose"><option>Investment</option><option>To live in</option><option>Rental income</option><option>Site visit</option><option>Latest payment plan</option></select><span>Purpose</span>${ico('chev')}</label></div>
  <label class="fld"><textarea name="message" rows="3" placeholder=" "></textarea><span>Message (optional)</span></label>
  <p class="form__err" role="alert" hidden>Please add your name and a phone number so we can get back to you.</p>
  <button class="btn btn--gold btn--block" type="submit" data-magnetic>${brand('wa', 'i')}<span>Send on WhatsApp</span></button>
  <p class="form__note">Opens WhatsApp to ${site.phones.main.intl}. Prefer to talk? <a href="tel:${site.phones.main.tel}">Call us</a>.</p>
</form>`;
};

const socCard = (s, i) => `<a class="scard" href="/societies/${s.slug}/" data-tilt>
  <span class="scard__media">${img(s.images[0][0], { sizes: '(max-width: 760px) 80vw, 420px' })}</span>
  <span class="scard__shade"></span><span class="scard__frame"></span>
  <span class="scard__top"><span class="scard__n">${pad(i + 1)}</span><span class="scard__code">${esc(s.code)}</span></span>
  <span class="scard__body"><span class="scard__area">${ico('pin')} ${esc(s.area)}</span><strong class="scard__name">${nb(s.name)}</strong>
    <span class="scard__hook">${esc(s.hook)}</span>
    <span class="scard__foot"><span class="scard__types">${s.types.slice(0, 3).map((t) => `<em>${esc(t)}</em>`).join('')}</span><span class="scard__go">${ico('arrowUR')}</span></span></span>
</a>`;

const towerCard = (h) => `<a class="tcard" href="/high-rise/${h.slug}/" data-tilt>
  <span class="tcard__media">${img(h.coverName, { sizes: '(max-width: 760px) 90vw, 360px' })}</span><span class="tcard__shade"></span>
  <span class="tcard__floors" aria-hidden="true">${'<i></i>'.repeat(9)}</span>
  <span class="tcard__body"><small>${esc(h.host ? h.host.name : h.area)}</small><strong>${nb(h.name)}</strong><span>${esc(h.kicker)}</span></span>
  <span class="tcard__go">${ico('arrowUR')}</span>
</a>`;

const faqList = (list) => `<div class="faq">${list.map((f, i) => `<details class="faq__i" data-reveal${i === 0 ? ' open' : ''}><summary><span class="faq__n">${pad(i + 1)}</span><span class="faq__q">${esc(f.q)}</span><span class="faq__x">${ico('plus')}</span></summary><div class="faq__a"><p>${esc(f.a)}</p></div></details>`).join('')}</div>`;

const mapBlock = (q, title) => `<div class="map" data-reveal><iframe title="Map: ${esc(title)}" src="https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=13&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
  <a class="btn btn--glass map__btn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}" target="_blank" rel="noopener">${ico('route')}<span>Get directions</span></a></div>`;

const player = ({ src, poster, title, len }) => `<div class="player" data-player>
  <video playsinline preload="none" aria-label="${esc(title)}"><source src="/assets/video/${src}" type="video/mp4"></video>
  ${img(poster, { cls: 'player__poster', sizes: '(max-width: 980px) 100vw, 1100px' })}
  <button class="player__go" type="button" aria-label="Play: ${esc(title)}"><span class="pbtn"><span class="pbtn__ring"></span>${ico('play')}</span><span class="player__l">${esc(title)}${len ? ` <b>${len}</b>` : ''}</span></button>
</div>`;

const lastSpan = (n) => { const k = n - 1, r = k % 4; return k >= 3 && r ? 5 - r : 0; }; // fill the 4-column grid's last row
const gallery = (list, label) => list.length < 2 ? '' : `<div class="mosaic mosaic--${Math.min(list.length, 5)}">${list.map(([n, cap], i) => `<button class="mosaic__i" type="button" data-lightbox="/assets/img/${n}.webp" data-caption="${esc(cap || label)}" data-reveal style="--d:${i * 60}ms${i === list.length - 1 && lastSpan(list.length) ? `;grid-column:span ${lastSpan(list.length)}` : ''}" aria-label="Open photo: ${esc(cap || label)}">${img(n, { sizes: i === 0 ? '(max-width: 760px) 100vw, 60vw' : '(max-width: 760px) 50vw, 30vw' })}<span class="mosaic__cap">${esc(cap)}</span><span class="mosaic__x">${ico('expand')}</span></button>`).join('')}</div>`;

const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([n, u], i) => `<li>${i < items.length - 1 ? `<a href="${u}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`}</li>`).join('')}</ol></nav>`;

const ctaBand = (title = 'Let’s find your address in the capital.', sub = 'Send your budget on WhatsApp — we come back with two or three options that genuinely fit, with the current payment plan.') => `<section class="cta" data-reveal>
  <div class="cta__bg">${img('mz-night', { sizes: '100vw' })}</div>
  <div class="wrap cta__in"><img class="cta__mark" src="/assets/logos/mark-gold.webp" alt="" width="${MEDIA['mark-gold'].w}" height="${MEDIA['mark-gold'].h}" loading="lazy">
    <h2 class="h2">${title}</h2><p>${esc(sub)}</p>
    <div class="cta__b">${btnWa('Message us on WhatsApp')}<a class="btn btn--glass" href="tel:${site.phones.alt.tel}" data-magnetic>${ico('phone')}<span>Call ${site.phones.alt.display}</span></a></div></div>
</section>`;

// ---------- JSON-LD ----------
const ORG = abs('/#org');
const ldOrg = () => ({
  '@context': 'https://schema.org', '@type': ['RealEstateAgent', 'LocalBusiness'], '@id': ORG, name: site.name, alternateName: [site.legalName, 'Mahziyar Marketing'],
  description: site.description, url: abs('/'), logo: abs('/assets/logos/mahziyar.png'), image: abs('/assets/img/og-mahziyar.jpg'), foundingDate: String(site.since),
  telephone: site.phones.main.tel, ...(site.email ? { email: site.email } : {}),
  address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, addressRegion: site.address.region, postalCode: site.address.postal, addressCountry: site.address.country },
  geo: { '@type': 'GeoCoordinates', latitude: site.address.geo.lat, longitude: site.address.geo.lng }, hasMap: site.google.maps,
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], closes: '19:00' }],
  aggregateRating: { '@type': 'AggregateRating', ratingValue: site.google.rating, reviewCount: site.google.count, bestRating: '5' },
  areaServed: [{ '@type': 'City', name: 'Islamabad' }, { '@type': 'City', name: 'Rawalpindi' }],
  sameAs: site.social.map((s) => s.url), knowsAbout: allProjects.map((p) => p.name),
});
const ldCrumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(u) })) });
const ldFaq = (list) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });

// ---------- layout ----------
const navMega = (list, kind) => `<div class="mega__grid">${list.map((p) => `<a class="mega__i" href="/${kind}/${p.slug}/"><span class="mega__img">${img(kind === 'societies' ? p.images[0][0] : p.coverName, { sizes: '120px' })}</span><span><strong>${nb(p.name)}</strong><small>${esc(kind === 'societies' ? p.area : p.host?.name || p.area)}</small></span></a>`).join('')}</div>`;

const header = (path) => `<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><span data-progress></span></div>
<header class="hdr" data-hdr><div class="wrap hdr__in">
  <a class="logo" href="/" aria-label="${esc(site.name)} — home"><img src="/assets/logos/mahziyar-360.webp" srcset="/assets/logos/mahziyar-360.webp 360w, /assets/logos/mahziyar-720.webp 720w" sizes="120px" alt="${esc(site.name)}" width="${MEDIA.logo.w}" height="${MEDIA.logo.h}"></a>
  <nav class="nav" aria-label="Main" data-nav><ul class="nav__l">
    <li><a href="/"${path === '/' ? ' aria-current="page"' : ''}>Home</a></li>
    <li class="has-mega"><a href="/societies/"${path.startsWith('/societies') ? ' aria-current="page"' : ''}>Societies ${ico('chev')}</a><div class="mega"><div class="mega__in">${navMega(societies, 'societies')}<a class="mega__all" href="/societies/">All ${societies.length} societies ${ico('arrow')}</a></div></div></li>
    <li class="has-mega"><a href="/societies/#high-rise"${path.startsWith('/high-rise') ? ' aria-current="page"' : ''}>High-rise ${ico('chev')}</a><div class="mega"><div class="mega__in">${navMega(highrises, 'high-rise')}<a class="mega__all" href="/societies/#high-rise">All ${highrises.length} high-rise projects ${ico('arrow')}</a></div></div></li>
    <li><a class="nav__new" href="${VURL}"${path === VURL ? ' aria-current="page"' : ''}>Luxury Villas <b>New</b></a></li>
    <li><a href="/about/"${path === '/about/' ? ' aria-current="page"' : ''}>About</a></li>
    <li><a href="/contact/"${path === '/contact/' ? ' aria-current="page"' : ''}>Contact</a></li>
  </ul></nav>
  <div class="hdr__r"><a class="hdr__tel" href="tel:${site.phones.main.tel}">${ico('phone')}<span>${site.phones.main.display}</span></a>
  <button class="btn btn--gold btn--sm" type="button" data-enquire>${ico('calendar')}<span>Book a visit</span></button>
  <button class="burger" type="button" aria-label="Open menu" aria-expanded="false" data-burger><span></span><span></span></button></div>
</div></header>
<div class="mnav" data-mnav hidden><div class="mnav__in">
  <ul class="mnav__l">${[['/', 'Home'], [VURL, 'Luxury Villas'], ['/societies/', 'Societies'], ['/societies/#high-rise', 'High-rise'], ['/about/', 'About'], ['/contact/', 'Contact'], ['/connect/', 'Connect with us']].map(([u, n], i) => `<li style="--i:${i}"><a href="${u}"><small>${pad(i + 1)}</small>${n}</a></li>`).join('')}</ul>
  <div class="mnav__b">${btnWa('WhatsApp', WA_HELLO, 'btn--block')}<a class="btn btn--glass btn--block" href="tel:${site.phones.main.tel}">${ico('phone')}<span>Call ${site.phones.main.display}</span></a>${socials()}</div>
</div></div>`;

const footer = () => `<footer class="ftr">
  <div class="wrap ftr__top">
    <div class="ftr__brand"><img src="/assets/logos/mahziyar-360.webp" alt="${esc(site.name)}" width="${MEDIA.logo.w}" height="${MEDIA.logo.h}" loading="lazy">
      <p>One-stop shop for real estate in the capital — authorized societies and high-rise projects, verified files and transparent paperwork, from our office in Blue Area.</p>
      <a class="ftr__rate" href="${site.google.url}" target="_blank" rel="noopener">${brand('google', 'i')}<b>${site.google.rating}</b>${stars()}<small>${site.google.count} Google reviews</small></a>
      <a class="ftr__villa" href="${VURL}">${img('villa-dusk', { sizes: '120px' })}<span><small>Our own project</small><b>${esc(villas.name)}</b><em>${esc(villas.size)} · ${esc(villas.where)}</em></span>${ico('arrowUR')}</a></div>
    <div><h2 class="ftr__h">Societies</h2><ul class="ftr__l">${societies.map((s) => `<li><a href="/societies/${s.slug}/">${nb(s.name)}</a></li>`).join('')}</ul></div>
    <div><h2 class="ftr__h">High-rise</h2><ul class="ftr__l">${highrises.map((h) => `<li><a href="/high-rise/${h.slug}/">${nb(h.name)}</a></li>`).join('')}</ul></div>
    <div><h2 class="ftr__h">Visit & talk</h2><ul class="ftr__c">
      <li>${ico('pin')}<a href="${site.google.maps}" target="_blank" rel="noopener">${esc(site.address.line1)},<br>${esc(site.address.line2)} ${site.address.postal}</a></li>
      <li>${ico('phone')}<span><a href="tel:${site.phones.main.tel}">${site.phones.main.intl}</a><br><a href="tel:${site.phones.alt.tel}">${site.phones.alt.intl}</a></span></li>
      <li>${brand('wa', 'i')}<a href="${wa(WA_HELLO)}" target="_blank" rel="noopener">WhatsApp ${site.phones.whatsapp.display}</a></li>
      ${site.email ? `<li>${ico('mail')}<a href="mailto:${site.email}">${site.email}</a></li>` : ''}
      <li>${ico('clock')}<span>${site.hours.map(([d, h]) => `${d}: ${h}`).join('<br>')}</span></li></ul></div>
  </div>
  <div class="wrap ftr__soc"><p><a href="/connect/">Connect with us ${ico('arrow')}</a></p>${site.social.map((s) => `<a class="ftr__sl" href="${s.url}" target="_blank" rel="noopener" data-brand="${s.id}">${brand(s.id)}<span><b>${s.name}</b><small>${esc(s.handle)}</small></span>${ico('arrowUR')}</a>`).join('')}</div>
  <div class="ftr__word" aria-hidden="true">MAHZIYAR</div>
  <div class="wrap ftr__bar"><span>© ${YEAR} ${esc(site.name)} · ${esc(site.legalName)}. All rights reserved.</span><span><a href="/privacy-policy/">Privacy</a> · <a href="/terms/">Terms</a> · <a href="/connect/">Connect with us</a> · <a href="/sitemap.xml">Sitemap</a></span><span>Prices and plans are set by developers and may change.</span></div>
</footer>
<a class="fab" href="${wa(WA_HELLO)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${brand('wa', 'i')}</a>
<nav class="mbar" aria-label="Quick contact"><a href="tel:${site.phones.main.tel}">${ico('phone')}<span>Call</span></a><a class="mbar__wa" href="${wa(WA_HELLO)}" target="_blank" rel="noopener">${brand('wa', 'i')}<span>WhatsApp</span></a><button type="button" data-enquire>${ico('calendar')}<span>Visit</span></button></nav>
<dialog class="modal" id="enquire"><button class="modal__x" type="button" data-close aria-label="Close">${ico('close')}</button>${enquiry({ title: 'Book a visit or get a plan', sub: 'Tell us what you are looking for — we reply on WhatsApp.' })}</dialog>
<dialog class="modal modal--media" id="lightbox"><button class="modal__x" type="button" data-close aria-label="Close">${ico('close')}</button><figure><img data-lb-img alt=""><figcaption data-lb-cap></figcaption></figure></dialog>`;

const page = ({ path, title, desc, body, ld = [], og = '/assets/img/og-mahziyar.jpg', cls = '', bare = false, preload = '' }) => {
  const full = title.includes('Mahziyar') ? title : `${title} | Mahziyar Group`;
  return `<!doctype html>
<html lang="en-PK">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(path)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#08090b">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(site.name)}"><meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${abs(path)}"><meta property="og:image" content="${abs(og)}"><meta property="og:locale" content="en_PK">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/icons/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Inter:wght@400;500;600&family=Sora:wght@300;400;600;700;800&display=swap">
${preload}<link rel="stylesheet" href="/assets/css/site.css?v=${AV.css}">
${[ldOrg(), ...ld].map((x) => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}
${site.forms.analyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.forms.analyticsId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.forms.analyticsId}');</script>` : ''}
</head>
<body class="${cls}" data-wa="${site.phones.whatsapp.wa}">
<div class="loader" data-loader aria-hidden="true"><img src="/assets/logos/mark-gold.webp" alt="" width="${MEDIA['mark-gold'].w}" height="${MEDIA['mark-gold'].h}"><span class="loader__bar"><i></i></span></div>
${bare ? '' : header(path)}
<main id="main">
${body}
</main>
${bare ? '' : footer()}
<script src="/assets/js/site.js?v=${AV.js}" defer></script>
</body>
</html>`;
};

// ---------- home ----------
const reel = () => `<div class="hero__media">
  <picture><source media="(max-width: 760px)" srcset="/assets/img/poster-reel-m.webp"><img src="/assets/img/poster-reel-d.webp" alt="" width="1920" height="1080" fetchpriority="high"></picture>
  <video class="hero__vid" autoplay muted loop playsinline preload="metadata" data-reel data-d="/assets/video/reel-d" data-m="/assets/video/reel-m" aria-hidden="true"></video></div>`;

const homeBody = () => {
  const statItems = [[site.google.rating, '', 'Google rating', `${site.google.count} reviews`], ['19.9', 'K+', 'Facebook community', 'and growing'], [String(societies.length), '', 'Societies', 'on our panel'], [String(highrises.length), '', 'High-rise projects', 'apartments & commercial']];
  return `
<section class="hero">
  ${reel()}<div class="hero__shade"></div><div class="grain"></div>
  <div class="wrap hero__in">
    <p class="hero__k" data-reveal>${ico('spark')} Est. ${site.since} · Blue Area, Islamabad</p>
    <h1 class="hero__t" data-split>Your address in <em>the Capital</em>, verified before you invest.</h1>
    <p class="hero__s" data-reveal style="--d:.5s">Authorized societies and high-rise projects across Islamabad & Rawalpindi — verified files, transparent paperwork and direct developer rates from one trusted desk.</p>
    <div class="hero__b" data-reveal style="--d:.7s"><a class="btn btn--gold btn--lg" href="#societies" data-magnetic><span>Explore societies</span>${ico('arrow')}</a>${btnWa('Chat on WhatsApp', WA_HELLO, 'btn--lg btn--glass')}</div>
  </div>
  <div class="seal" aria-hidden="true"><svg viewBox="0 0 200 200"><defs><path id="seal-c" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs><text><textPath href="#seal-c">AUTHORIZED · VERIFIED · TRANSPARENT · MAHZIYAR · </textPath></text></svg><img src="/assets/logos/mark-gold.webp" alt="" width="${MEDIA['mark-gold'].w}" height="${MEDIA['mark-gold'].h}"></div>
  <div class="wrap hero__stats">${statItems.map(([v, suf, l, s], i) => `<div class="hstat" data-reveal style="--d:${0.2 + i * 0.1}s"><b data-count="${v}" data-suffix="${suf}">${v}${suf}</b><span>${l}<small>${s}</small></span></div>`).join('')}</div>
  <a class="hero__cue" href="#intro" aria-label="Scroll down"><span></span></a>
</section>

<div class="marquee" aria-hidden="true"><div class="marquee__t" data-marquee>${[...societies, ...highrises.slice(0, 6)].map((p) => `<span>${esc(p.name)}</span><i>✦</i>`).join('').repeat(2)}</div></div>

${villasHome()}

<section class="intro sec" id="intro">
  <div class="wrap intro__g">
    <div class="intro__txt">${kicker('Who we are')}
      <p class="scrub" data-scrub>Mahziyar is a Blue Area real estate firm that deals only in authorized projects. Since ${site.since} we have been a single point of contact for buying, selling, investing and project marketing — and we answer after the sale, too.</p>
      <ul class="ticks">${['Plots, villas, apartments and commercial — fresh booking and resale', 'Files, NOC and development status checked before you pay', 'Walk-in office on Jinnah Avenue — meet the team first'].map((t, i) => `<li data-reveal style="--d:${i * 90}ms">${ico('check')}${esc(t)}</li>`).join('')}</ul>
      <a class="link" href="/about/">More about Mahziyar ${ico('arrow')}</a></div>
    <div class="intro__art">
      <figure class="intro__a" data-parallax="-0.08">${img('mz-luxury', { sizes: '(max-width: 760px) 80vw, 34vw' })}</figure>
      <figure class="intro__b" data-parallax="0.1">${img('mz-lounge', { sizes: '(max-width: 760px) 60vw, 24vw' })}</figure>
      <blockquote class="intro__q" data-reveal><p>“${esc(site.motto)}”</p><cite>Time is money — and that gets real when you invest in property.</cite></blockquote>
    </div>
  </div>
</section>

<section class="rail" id="societies" data-rail>
  <div class="rail__pin">
    <div class="wrap rail__head"><div>${kicker('Societies on our panel')}<h2 class="h2">Eleven societies.<br><em>One trusted desk.</em></h2></div>
      <div class="rail__meta"><span class="rail__count"><b data-rail-n>01</b> / ${pad(societies.length)}</span><span class="rail__bar"><i data-rail-bar></i></span><a class="link" href="/societies/">View all ${ico('arrow')}</a></div></div>
    <div class="rail__track" data-rail-track>${societies.map(socCard).join('')}
      <a class="scard scard--end" href="/societies/"><span>See every society & tower</span>${ico('arrowUR')}</a></div>
  </div>
</section>

<section class="sky sec" id="high-rise">
  <div class="wrap">
    <div class="sec__head">${kicker('High-rise')}<h2 class="h2">The skyline <em>on our panel.</em></h2><p class="lead">Apartments, hotel suites, offices and shops in the towers rising across Faisal Hills, Faisal Town, Mumtaz City, Park View City and H-13.</p></div>
    <div class="sky__g">
      <div class="sky__stage" data-sky-stage>${highrises.map((h, i) => `<figure class="sky__img${i === 0 ? ' is-on' : ''}" data-sky-img="${i}">${img(h.coverName, { sizes: '(max-width: 980px) 100vw, 46vw' })}<figcaption>${esc(h.images ? h.images[0][1] : h.host ? `Photo: ${h.host.name}` : '')}</figcaption></figure>`).join('')}
        <span class="sky__frame"></span></div>
      <ol class="sky__list">${highrises.map((h, i) => `<li><a href="/high-rise/${h.slug}/" data-sky="${i}"><span class="sky__n">${pad(i + 1)}</span><span class="sky__name">${nb(h.name)}</span><span class="sky__host">${esc(h.host ? h.host.name : h.area)}</span>${ico('arrowUR')}</a></li>`).join('')}</ol>
    </div>
  </div>
</section>

<section class="film sec">
  <div class="film__bg" data-parallax="0.12">${img('sofia-palace', { sizes: '100vw' })}</div>
  <div class="wrap film__g">
    <div class="film__txt" data-reveal>${kicker('Now showing')}<h2 class="h2">Walk through <em>The Sofia</em> before you visit.</h2><p>Victorian palace architecture on the Mumtaz City boulevard — watch the developer’s film, then ask us for floor plans and the current plan.</p><a class="btn btn--gold" href="/high-rise/the-sofia/" data-magnetic><span>Explore The Sofia</span>${ico('arrow')}</a></div>
    <div class="film__p" data-reveal style="--d:120ms">${player({ src: 'sofia-film.mp4', poster: 'sofia-exterior', title: 'The Sofia — developer film', len: '2:34' })}</div>
    <a class="film__side" href="/high-rise/the-pearl/" data-reveal style="--d:240ms"><video autoplay muted loop playsinline preload="none" data-inview poster="/assets/img/poster-pearl-800.webp"><source src="/assets/video/pearl-loop.mp4" type="video/mp4"></video><span><small>Also on our panel</small><b>The Pearl, Mumtaz City</b>${ico('arrowUR')}</span></a>
  </div>
</section>

<section class="svc sec" id="services">
  <div class="wrap"><div class="sec__head sec__head--split">${kicker('What we do')}<h2 class="h2">Every step of the deal, <em>under one roof.</em></h2><p class="lead">From the first shortlist to the day the file is in your name — one team, not five middlemen.</p></div>
  <div class="bento">${services.map((s, i) => `<article class="bento__i" data-reveal data-glow style="--d:${i * 70}ms"><span class="bento__n">${pad(i + 1)}</span><span class="bento__ic">${ico(s.icon)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('')}</div></div>
</section>

<section class="steps sec" id="process">
  <div class="wrap steps__g">
    <div class="steps__head">${kicker('How it works')}<h2 class="h2">Four steps. <em>No surprises.</em></h2><p class="lead">The same process whether you are buying a 5 Marla plot or a corporate floor.</p>${btnWa('Start with a message')}</div>
    <ol class="stack">${steps.map((s, i) => `<li class="stack__i" style="--i:${i}"><div class="stack__c"><span class="stack__n">${pad(i + 1)}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>${img(['mz-mosque', 'tc-1', 'mz-modern', 'mz-villa'][i], { sizes: '(max-width: 760px) 90vw, 280px', cls: 'stack__img' })}</div></li>`).join('')}</ol>
  </div>
</section>

<section class="quote" aria-label="Our motto">
  <div class="quote__bg" data-parallax="0.18">${img('mz-hero', { sizes: '100vw' })}</div>
  <div class="wrap quote__in"><p data-split>Do not wait to buy real estate — <em>buy real estate and wait.</em></p></div>
</section>

<section class="trust sec" id="reviews">
  <div class="wrap trust__g">
    <div class="trust__dial" data-reveal><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle class="trust__arc" cx="60" cy="60" r="52" style="--p:${(+site.google.rating / 5).toFixed(3)}"/></svg>
      <div><b data-count="${site.google.rating}">${site.google.rating}</b>${stars()}<span>${site.google.count} Google reviews</span><span>${site.google.facebookRating} on Facebook</span></div></div>
    <div class="trust__txt">${kicker('Why clients stay')}<h2 class="h2">Rated ${site.google.rating} by the people <em>who actually bought.</em></h2>
      <div class="promises">${promises.map((p, i) => `<article data-reveal style="--d:${i * 80}ms"><span>${ico('shield')}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></article>`).join('')}</div>
      <div class="trust__b"><a class="btn btn--glass" href="${site.google.url}" target="_blank" rel="noopener">${brand('google', 'i')}<span>Read our Google reviews</span></a><a class="btn btn--glass" href="${site.social[0].url}" target="_blank" rel="noopener">${brand('fb', 'i')}<span>Facebook reviews</span></a></div></div>
  </div>
</section>

<section class="sec faqs"><div class="wrap faqs__g"><div>${kicker('Questions')}<h2 class="h2">Good to <em>know.</em></h2><p class="lead">Can’t see your question? Ask us on WhatsApp — a real person answers.</p>${btnWa('Ask a question')}</div>${faqList(faqs)}</div></section>

<section class="contact sec" id="contact">
  <div class="wrap contact__g">
    <div class="contact__info">${kicker('Get in touch')}<h2 class="h2">Come and see us <em>in Blue Area.</em></h2>
      <ul class="cinfo">
        <li>${ico('pin')}<div><small>Office</small><a href="${site.google.maps}" target="_blank" rel="noopener">${esc(site.address.line1)},<br>${esc(site.address.line2)} ${site.address.postal}</a><em>${esc(site.address.near)} · tap for directions</em></div></li>
        <li>${ico('phone')}<div><small>Phone & WhatsApp</small><a href="tel:${site.phones.main.tel}">${site.phones.main.intl}</a><a href="tel:${site.phones.alt.tel}">${site.phones.alt.intl}</a></div></li>
        <li>${ico('clock')}<div><small>Office hours</small>${site.hours.map(([d, h]) => `<span>${d} — ${h}</span>`).join('')}</div></li>
      </ul>${socials()}
    </div>
    <div class="contact__form" data-reveal>${enquiry()}</div>
  </div>
</section>
${ctaBand()}`;
};

// ---------- societies index ----------
const indexBody = () => `
<section class="phero phero--short">
  <div class="phero__bg" data-parallax="0.15">${img('mz-panorama', { sizes: '100vw', eager: true })}</div><div class="phero__shade"></div><div class="grain"></div>
  <div class="wrap phero__in">${crumbs([['Home', '/'], ['Societies & high-rise', '/societies/']])}<h1 class="phero__t" data-split>Societies <em>& high-rise</em></h1>
    <p class="phero__s" data-reveal>${societies.length} authorized societies and ${highrises.length} high-rise projects across Islamabad & Rawalpindi — every one checked before we offer it.</p>
    <div class="tabs" role="tablist" data-reveal><a href="#societies-grid" class="is-on">Societies <b>${societies.length}</b></a><a href="#high-rise">High-rise <b>${highrises.length}</b></a></div></div>
</section>
<section class="sec" id="societies-grid"><div class="wrap"><div class="sgrid">${societies.map((s, i) => `<div data-reveal style="--d:${(i % 3) * 80}ms">${socCard(s, i)}</div>`).join('')}</div></div></section>
<section class="sec sec--tint" id="high-rise"><div class="wrap"><div class="sec__head">${kicker('High-rise')}<h2 class="h2">Towers, residences <em>& commercial.</em></h2><p class="lead">Apartments, hotel suites, offices and shops — ask for floor plans and the latest instalment plan of any project.</p></div>
  <div class="tgrid">${highrises.map((h, i) => `<div data-reveal style="--d:${(i % 4) * 70}ms">${towerCard(h)}</div>`).join('')}</div></div></section>
${ctaBand('Not sure which one fits?', 'Tell us your budget and purpose. We shortlist two or three options with their current plans.')}`;

// ---------- society page ----------
const subnav = (items) => `<nav class="subnav" aria-label="On this page" data-subnav><div class="wrap subnav__in">${items.map(([id, n]) => `<a href="#${id}">${n}</a>`).join('')}<button class="btn btn--gold btn--sm" type="button" data-enquire>Enquire</button></div></nav>`;
const factsCard = (facts, title) => `<aside class="facts" data-reveal><h2 class="facts__t">${esc(title)}</h2><dl>${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></aside>`;
const sizesBlock = (sizes) => `<div class="sizes">${Object.entries(sizes).map(([k, list]) => `<div class="sizes__g" data-reveal><h3>${esc(k)}</h3><ul>${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>`;
const listBlock = (title, list, icon) => `<div class="lblock" data-reveal><h3>${esc(title)}</h3><ul>${list.map((x) => `<li>${ico(icon)}<span>${esc(x)}</span></li>`).join('')}</ul></div>`;

const pager = (list, i, base) => { const n = list[(i + 1) % list.length]; const cover = n.images?.[0]?.[0] || n.coverName;
  return `<a class="pager" href="/${base}/${n.slug}/"><span class="pager__bg">${img(cover, { sizes: '100vw' })}</span><span class="wrap pager__in"><small>Next ${base === 'societies' ? 'society' : 'project'}</small><strong>${nb(n.name)}</strong>${ico('arrow')}</span></a>`; };

const societyBody = (s, i) => {
  const logo = MEDIA[`logo:${s.slug}`];
  return `
<section class="phero">
  <div class="phero__bg" data-parallax="0.2">${img(s.images[0][0], { sizes: '100vw', eager: true, cls: 'kb' })}</div><div class="phero__shade"></div><div class="grain"></div>
  <span class="phero__code" aria-hidden="true">${esc(s.code)}</span>
  <div class="wrap phero__in">${crumbs([['Home', '/'], ['Societies', '/societies/'], [s.name, `/societies/${s.slug}/`]])}
    ${logo ? `<span class="phero__logo" data-reveal><img src="/assets/logos/${s.slug}.webp" alt="${esc(s.name)} logo" width="${logo.w}" height="${logo.h}"></span>` : ''}
    <p class="phero__k" data-reveal>${pad(i + 1)} / ${pad(societies.length)} · ${esc(s.area)}</p>
    <h1 class="phero__t" data-split>${nb(s.name)}</h1><p class="phero__s" data-reveal>${esc(s.hook)}</p>
    <ul class="chips" data-reveal><li>${ico('shield')}${esc(s.approval)}</li>${s.types.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="phero__b" data-reveal><button class="btn btn--gold" type="button" data-enquire="${esc(s.name)}" data-magnetic><span>Get plan & availability</span>${ico('arrow')}</button>${btnWa('WhatsApp', `Assalam o Alaikum Mahziyar Group, please share the latest plan and availability for ${s.name}.`, 'btn--glass')}</div>
    ${s.ambient ? '' : `<p class="phero__cap">${esc(s.images[0][1])}</p>`}
  </div>
</section>
${s.slug === V.host ? `<a class="vbanner" href="${VURL}">${img('villa-dusk', { sizes: '200px' })}<span><small>${ico('spark')} Our own project in ${esc(s.name)}</small><b>${esc(V.size)} ${esc(V.name)} — ${esc(V.where)}</b><em>Rs ${crore(V.price)} · book with 15% · 5 kW solar for the first 5 bookings</em></span>${ico('arrowUR')}</a>` : ''}
${subnav([['overview', 'Overview'], ['sizes', 'Sizes'], ['location', 'Location'], ...(s.images.length > 1 ? [['gallery', 'Gallery']] : []), ...(s.towers.length ? [['towers', 'High-rise']] : []), ['map', 'Map']])}
<section class="sec" id="overview"><div class="wrap ov">
  <div class="ov__txt">${kicker(`About ${s.name}`)}<h2 class="h2 h2--sm">${esc(s.location)}.</h2>${s.story.map((p) => `<p data-reveal>${esc(p)}</p>`).join('')}
    <p class="ov__dev" data-reveal>${ico('tower')}<span><small>Developer</small>${esc(s.developer)}</span></p></div>
  ${factsCard(s.facts, 'Key facts')}
</div></section>
<section class="sec sec--tint" id="sizes"><div class="wrap">${kicker('What you can buy')}<h2 class="h2 h2--sm">Sizes & options</h2>${sizesBlock(s.sizes)}
  ${s.blocks ? `<div class="blocks" data-reveal><h3>Blocks</h3><ul>${s.blocks.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>` : ''}
  <p class="note">${ico('clock')} Availability and rates change often — ask us for what is open today.</p></div></section>
<section class="sec" id="location"><div class="wrap two">${listBlock('Location & access', s.access, 'route')}${listBlock('Amenities', s.amenities, 'check')}</div></section>
${s.images.length > 1 ? `<section class="sec sec--tint" id="gallery"><div class="wrap">${kicker('Gallery')}<h2 class="h2 h2--sm">On the ground</h2>${gallery(s.images, s.name)}</div></section>` : ''}
${s.towers.length ? `<section class="sec" id="towers"><div class="wrap">${kicker(`High-rise in ${s.name}`)}<h2 class="h2 h2--sm">${s.towers.length} tower${s.towers.length > 1 ? 's' : ''} we market here</h2><div class="tgrid">${s.towers.map((h, k) => `<div data-reveal style="--d:${k * 70}ms">${towerCard(h)}</div>`).join('')}</div></div></section>` : ''}
<section class="sec sec--tint" id="map"><div class="wrap map__g">${mapBlock(s.mapQuery, s.name)}<div class="map__form">${enquiry({ project: s.name, title: `Ask about ${s.name}`, sub: 'Latest plan, available blocks and a site visit — we reply on WhatsApp.' })}</div></div></section>
${pager(societies, i, 'societies')}`;
};

// ---------- high-rise page ----------
const towerBody = (h, i) => {
  const host = h.host;
  const story = h.story || [
    `${h.name} is one of the ${host ? `high-rise projects we market in ${host.name}` : `apartment projects we market in ${h.area}`}. Floor plans, unit sizes and the current payment plan are shared on request — so you always get today’s figures, not an outdated brochure.`,
    host ? `You also get everything ${host.name} offers around it: ${host.access.slice(0, 2).join(' and ').replace(/^./, (c) => c.toLowerCase())}.` : 'H-13 sits on the Srinagar Highway corridor beside NUST, a short drive from the Blue Area and the new airport.',
  ];
  const imgs = h.images || (host ? host.images.filter((x) => x[1]).map(([n, c]) => [n, `${host.name}: ${c.charAt(0).toLowerCase()}${c.slice(1)}`]) : []);
  const facts = h.facts || [['Project', h.name], ['Location', host ? host.name : h.area], ['Area', host ? host.area : h.area], ['Details', 'Floor plans & payment plan on request']];
  const heroCap = h.images ? h.images[0][1] : host ? `Photo: ${host.name}` : '';
  return `
<section class="phero phero--tower">
  <div class="phero__bg" data-parallax="0.2">${h.loop ? `<video autoplay muted loop playsinline preload="metadata" poster="/assets/img/${h.loopPoster}.webp"><source src="/assets/video/${h.loop}" type="video/mp4"></video>` : img(h.coverName, { sizes: '100vw', eager: true, cls: 'kb' })}</div><div class="phero__shade"></div><div class="grain"></div>
  <div class="wrap phero__in">${crumbs([['Home', '/'], ['High-rise', '/societies/#high-rise'], [h.name, `/high-rise/${h.slug}/`]])}
    <p class="phero__k" data-reveal>${esc(h.kicker)}</p><h1 class="phero__t" data-split>${nb(h.name)}</h1>
    <p class="phero__s" data-reveal>${host ? `In <a href="/societies/${host.slug}/">${esc(host.name)}</a> · ${esc(host.area)}` : esc(h.area)}</p>
    ${h.units ? `<ul class="chips" data-reveal>${h.units.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : ''}
    <div class="phero__b" data-reveal><button class="btn btn--gold" type="button" data-enquire="${esc(h.name)}" data-magnetic><span>Get floor plans & price</span>${ico('arrow')}</button>${btnWa('WhatsApp', `Assalam o Alaikum Mahziyar Group, please share floor plans, prices and the payment plan for ${h.name}${host ? ` (${host.name})` : ''}.`, 'btn--glass')}</div>
    ${heroCap ? `<p class="phero__cap">${esc(heroCap)}</p>` : ''}
  </div>
</section>
<section class="sec"><div class="wrap ov">
  <div class="ov__txt">${kicker(`About ${h.name}`)}${story.map((p) => `<p data-reveal>${esc(p)}</p>`).join('')}
    ${h.thin ? `<div class="ask" data-reveal>${ico('file')}<div><strong>Get the full brochure</strong><span>Floor plans, unit sizes, prices and the payment plan — sent to your WhatsApp.</span></div>${btnWa('Request', `Assalam o Alaikum Mahziyar Group, please send the brochure and payment plan for ${h.name}${host ? ` (${host.name})` : ''}.`)}</div>` : ''}</div>
  ${factsCard(facts, 'At a glance')}
</div></section>
${h.film ? `<section class="sec sec--tint"><div class="wrap">${kicker('Watch')}<h2 class="h2 h2--sm">${esc(h.film.title)}</h2><div data-reveal>${player(h.film)}</div></div></section>` : ''}
${imgs.length > 1 ? `<section class="sec${h.film ? '' : ' sec--tint'}"><div class="wrap">${kicker('Gallery')}<h2 class="h2 h2--sm">${h.images ? 'Renders & views' : `Around ${esc(host.name)}`}</h2>${gallery(imgs.slice(0, 8), h.name)}</div></section>` : ''}
${host ? `<section class="sec sec--tint"><div class="wrap host">
  <a class="host__card" href="/societies/${host.slug}/" data-reveal><span class="host__img">${img(host.images[0][0], { sizes: '(max-width: 760px) 100vw, 40vw' })}</span><span class="host__body"><small>The society around it</small><strong>${nb(host.name)}</strong><span>${esc(host.hook)}</span><em>Explore ${esc(host.name)} ${ico('arrow')}</em></span></a>
  ${listBlock('Location & access', host.access, 'route')}</div></section>` : ''}
<section class="sec" id="map"><div class="wrap map__g">${mapBlock(host ? host.mapQuery : `${h.name}, ${h.area}`, h.name)}<div class="map__form">${enquiry({ project: h.name, title: `Ask about ${h.name}`, sub: 'Floor plans, prices and the payment plan — we reply on WhatsApp.' })}</div></div></section>
${pager(highrises, i, 'high-rise')}`;
};


// ---------- Mahziyar Luxury Villas (own project) ----------
const V = villas;
const vWa = (t = `Assalam o Alaikum Mahziyar Group, I am interested in the ${V.size} ${V.name} in ${V.where}. Please share availability and the payment plan.`) => wa(t);
const SEGS = ['seg1', 'seg2', 'seg3', 'seg4', 'seg5'];
const planBar = () => `<div class="vbar" role="img" aria-label="Payment split: ${V.plan.map(([l, , a, n]) => `${l} ${Math.round((a * n / V.price) * 100)}%`).join(', ')}">${V.plan.map(([, , a, n], i) => `<span class="${SEGS[i]}" style="--w:${((a * n / V.price) * 100).toFixed(2)}%"></span>`).join('')}</div>`;
const planTable = () => `<ol class="vplan">${V.plan.map(([l, pct, a, n], i) => `<li data-reveal style="--d:${i * 70}ms"><span class="vplan__dot ${SEGS[i]}"></span><span class="vplan__l">${esc(l)}${pct ? ` <small>${Math.round(pct * 100)}%</small>` : ''}</span><span class="vplan__v">${n > 1 ? `<b>${n} ×</b> ` : ''}${rs(a)}</span><span class="vplan__t">${n > 1 ? rs(a * n) : ''}</span></li>`).join('')}
  <li class="vplan__sum"><span></span><span class="vplan__l">Total price</span><span class="vplan__v">${rs(V.price)}</span><span class="vplan__t">${crore(V.price)}</span></li></ol>`;
const solarBadge = (cls = '') => `<div class="sbadge ${cls}" aria-label="${esc(V.offer.title)} — ${esc(V.offer.who)}"><span class="sbadge__ring"></span>${ico('sun')}<b>5 kW</b><small>Solar free</small><em>First 5 bookings</em></div>`;

const villasHome = () => `<section class="vhome" id="villas">
  <div class="vhome__media" data-parallax="0.1">${img('villa-dusk', { sizes: '(max-width: 980px) 100vw, 60vw', alt: 'Modern villa at dusk — design inspiration' })}</div><div class="vhome__shade"></div>
  <div class="wrap vhome__g">
    <div class="vhome__txt">
      <p class="vhome__tag" data-reveal>${ico('spark')} Our own project · Now booking</p>
      <h2 class="h2" data-split>${esc(V.size)} luxury villas, <em>${esc(V.where)}.</em></h2>
      <p class="lead" data-reveal>${esc(V.intro[0])}</p>
      <div class="vhome__price" data-reveal><div><small>Total price</small><b>Rs ${crore(V.price)}</b></div><div><small>Book with</small><b>15% · ${rs(V.plan[0][2])}</b></div><div><small>Plan</small><b>Up to 2 years</b></div></div>
      ${planBar()}
      <div class="vhome__b" data-reveal><a class="btn btn--gold btn--lg" href="${VURL}" data-magnetic><span>See the villas & plan</span>${ico('arrow')}</a>${btnWa('Book a visit', vWa(), 'btn--glass btn--lg')}</div>
    </div>
    <div class="vhome__side" data-reveal style="--d:200ms">${solarBadge()}
      <ul class="vhome__ticks">${['Your own design & elevation', 'Cash & instalment: same rate', 'A-to-Z construction updates', 'A+ grade materials'].map((t) => `<li>${ico('check')}${t}</li>`).join('')}</ul></div>
  </div>
</section>`;

const villasBody = () => `
<section class="phero phero--villa">
  <div class="phero__bg" data-parallax="0.2">${img('villa-dusk', { sizes: '100vw', eager: true, cls: 'kb' })}</div><div class="phero__shade"></div><div class="grain"></div>
  <div class="wrap phero__in">${crumbs([['Home', '/'], [V.name, VURL]])}
    <p class="phero__k" data-reveal>Mahziyar Group · ${esc(V.where)}</p>
    <h1 class="phero__t" data-split>${esc(V.size)} <em>Luxury Villas</em></h1>
    <p class="phero__s" data-reveal>${esc(V.tagline)} ${esc(V.promise)}</p>
    <ul class="chips" data-reveal><li>${ico('shield')}RDA-approved Faisal Hills</li><li>Rs ${crore(V.price)}</li><li>Book with 15%</li><li>Shariah compliant</li></ul>
    <div class="phero__b" data-reveal><button class="btn btn--gold" type="button" data-enquire="${esc(V.name)}" data-magnetic><span>Book your villa</span>${ico('arrow')}</button>${btnWa('WhatsApp 0311 1555426', vWa(), 'btn--glass')}</div>
    <p class="phero__cap">Design inspiration (photo: Michael Brown / Unsplash) — not the final villa</p>
  </div>
  ${solarBadge('sbadge--hero')}
</section>
<section class="vfeat"><div class="wrap vfeat__g">${V.features.map(([ic, t, d], i) => `<div class="vfeat__i" data-reveal style="--d:${i * 80}ms"><span>${ico(ic)}</span><div><b>${esc(t)}</b><small>${esc(d)}</small></div></div>`).join('')}</div></section>

<section class="sec"><div class="wrap ov">
  <div class="ov__txt">${kicker('The project')}<h2 class="h2 h2--sm">Built with you, <em>not just sold to you.</em></h2>${V.intro.map((p) => `<p data-reveal>${esc(p)}</p>`).join('')}
    <div class="ask" data-reveal>${ico('file')}<div><strong>Want the official brochure?</strong><span>Payment plan, terms and availability — sent to your WhatsApp.</span></div>${btnWa('Request', vWa('Assalam o Alaikum Mahziyar Group, please send the brochure for the 5 Marla Luxury Villas, A Block Faisal Hills.'))}</div></div>
  ${factsCard([['Project', V.name], ['Location', V.where], ['Size', `${V.size} villa`], ['Total price', rs(V.price)], ['Booking', `15% · ${rs(V.plan[0][2])}`], ['Plan', '6 months – 2 years'], ['Payment', 'Cash = instalment rate']], 'At a glance')}
</div></section>

<section class="sec sec--tint" id="plan"><div class="wrap vplan__g">
  <div>${kicker('Payment plan')}<h2 class="h2">Invest today, <em>in a brighter tomorrow.</em></h2>
    <div class="vtotal" data-reveal><small>Total price · ${esc(V.size)} luxury villa</small><b data-count="${(V.price / 1e7).toFixed(2)}" data-suffix=" Crore">${crore(V.price)}</b><span>${rs(V.price)}</span></div>
    ${planBar()}<p class="note">${ico('check')} Same price in cash or on instalments — no markup.</p>
    ${V.offerNote ? `<p class="note">${ico('clock')} ${esc(V.offerNote)}</p>` : ''}</div>
  <div>${planTable()}<div class="vplan__cta"><button class="btn btn--gold" type="button" data-enquire="${esc(V.name)}"><span>Reserve with 15%</span>${ico('arrow')}</button>${btnWa('Ask about a custom plan', vWa('Assalam o Alaikum Mahziyar Group, I would like a custom payment plan for the 5 Marla Luxury Villa, A Block Faisal Hills.'))}</div></div>
</div></section>

<section class="sec" id="why"><div class="wrap">
  <div class="sec__head">${kicker('Why choose Mahziyar Group')}<h2 class="h2">A smarter choice <em>for a brighter tomorrow.</em></h2></div>
  <div class="vs">
    <div class="vs__col vs__col--us" data-reveal><header><img src="/assets/logos/mark-gold.webp" alt="" width="${MEDIA['mark-gold'].w}" height="${MEDIA['mark-gold'].h}" loading="lazy"><div><b>Mahziyar Group</b><small>Your home dream, our responsibility</small></div></header>
      <ul>${V.compare.map(([t, d], i) => `<li style="--d:${i * 60}ms" data-reveal><span class="vs__ok">${ico('check')}</span><div><b>${esc(t)}</b><small>${esc(d)}</small></div></li>`).join('')}</ul></div>
    <div class="vs__col vs__col--them" data-reveal style="--d:150ms"><header><span class="vs__q">?</span><div><b>Others in the market</b><small>Just another deal</small></div></header>
      <ul>${V.compare.map(([, , t, d], i) => `<li style="--d:${i * 60}ms" data-reveal><span class="vs__no">${ico('x')}</span><div><b>${esc(t)}</b><small>${esc(d)}</small></div></li>`).join('')}</ul></div>
  </div>
</div></section>

<section class="vsolar"><div class="vsolar__bg" data-parallax="0.14">${img(V.solarImg[0], { sizes: '100vw', alt: V.solarImg[1] })}</div><div class="vsolar__shade"></div>
  <div class="wrap vsolar__in" data-reveal><p class="vhome__tag">${ico('sun')} Limited time offer</p><h2 class="h2">${esc(V.offer.title)}, <em>on us.</em></h2><p>${esc(V.offer.text)} — ${esc(V.offer.who.toLowerCase())}.</p>${btnWa('Claim a solar booking', vWa('Assalam o Alaikum Mahziyar Group, is the 5 kW solar offer still available for the 5 Marla Luxury Villas?'))}<small class="vsolar__cr">Photo: ${esc(V.solarImg[2])} / Unsplash</small></div></section>

<section class="sec sec--tint" id="gallery"><div class="wrap">${kicker('Design inspiration')}<h2 class="h2 h2--sm">The finish we build towards</h2>
  <p class="lead">Real photographs of villas and interiors that inspire our elevations and finishes. Your own villa is designed with you, so the final look is yours to choose.</p>
  ${gallery(V.gallery.map(([n, c, by]) => [n, `${c} — photo: ${by} / Unsplash`]), V.name)}</div></section>

<section class="sec" id="terms"><div class="wrap vterms">
  <div>${kicker('Terms & conditions')}<h2 class="h2 h2--sm">Clear terms, <em>in writing.</em></h2><ol class="vterms__l">${V.terms.map((t, i) => `<li data-reveal style="--d:${i * 60}ms"><span>${pad(i + 1)}</span><p>${esc(t)}</p></li>`).join('')}</ol></div>
  <div>${kicker('Official brochure')}<div class="vbro">${V.brochures.map(([n, c]) => `<button class="vbro__i" type="button" data-lightbox="/assets/img/${n}.webp" data-caption="${esc(c)}" data-reveal>${img(n, { sizes: '(max-width: 760px) 50vw, 22vw', alt: c })}<span>${ico('expand')} ${esc(c.split(' (')[0])}</span></button>`).join('')}</div></div>
</div></section>

<section class="vcomm"><div class="wrap vcomm__g">${V.community.map(([ic, t, d]) => `<div data-reveal>${ico(ic)}<b>${esc(t)}</b><small>${esc(d)}</small></div>`).join('')}</div></section>

<section class="sec sec--tint"><div class="wrap host">
  <a class="host__card" href="/societies/${V.host}/" data-reveal><span class="host__img">${img(socBySlug[V.host].images[0][0], { sizes: '(max-width: 760px) 100vw, 40vw' })}</span><span class="host__body"><small>The society around it</small><strong>Faisal Hills</strong><span>${esc(socBySlug[V.host].hook)}</span><em>Explore Faisal Hills ${ico('arrow')}</em></span></a>
  ${listBlock('Location & access', socBySlug[V.host].access, 'route')}</div></section>
<section class="sec"><div class="wrap map__g">${mapBlock('Faisal Hills A Block, Taxila', V.name)}<div class="map__form">${enquiry({ project: `${V.name} (${V.where})`, title: 'Book your luxury villa', sub: 'Tell us your preferred plan and timing — we reply on WhatsApp.' })}</div></div></section>`;

// ---------- about / contact / links / legal ----------
const aboutBody = () => `
<section class="phero phero--short">
  <div class="phero__bg" data-parallax="0.15">${img('mz-mosque', { sizes: '100vw', eager: true })}</div><div class="phero__shade"></div><div class="grain"></div>
  <div class="wrap phero__in">${crumbs([['Home', '/'], ['About', '/about/']])}<h1 class="phero__t" data-split>Real estate advice <em>you can verify.</em></h1>
    <p class="phero__s" data-reveal>${esc(site.legalName)} — Blue Area, Islamabad, since ${site.since}.</p></div>
</section>
<section class="sec"><div class="wrap ov">
  <div class="ov__txt">${kicker('Our story')}
    <p class="scrub" data-scrub>Mahziyar works out of Benazir Plaza on Jinnah Avenue, in the heart of Blue Area. We are a single point of contact for selling, buying, investing and project marketing — and we deal only in authorized projects in and around the Capital Territory.</p>
    <p data-reveal>Our work is simple to describe and hard to do well: put two or three realistic options in front of you, take you to see the ground, check the file, the dealer status, the NOC and the development position — and only then talk about payment. After the booking we stay on for instalment reminders, transfers and resale.</p>
    <p data-reveal>Alongside the ${societies.length} societies and ${highrises.length} high-rise projects on this site, we have held dealerships with ${site.dealerships.join(', ')}.</p></div>
  ${factsCard([['Company', site.legalName], ['Serving since', String(site.since)], ['Office', 'Benazir Plaza, Jinnah Avenue, Blue Area'], ['Google rating', `${site.google.rating} ★ (${site.google.count} reviews)`], ['Facebook', '19.9K+ followers · 5.0 rating']], 'Mahziyar at a glance')}
</div></section>
<section class="svc sec sec--tint"><div class="wrap"><div class="sec__head">${kicker('What we do')}<h2 class="h2">Services</h2></div>
  <div class="bento">${services.map((s, i) => `<article class="bento__i" data-reveal data-glow style="--d:${i * 70}ms"><span class="bento__n">${pad(i + 1)}</span><span class="bento__ic">${ico(s.icon)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><div class="sec__head">${kicker('Our promise')}<h2 class="h2">Why clients <em>stay with us.</em></h2></div>
  <div class="promises promises--4">${promises.map((p, i) => `<article data-reveal style="--d:${i * 80}ms"><span>${ico('shield')}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></article>`).join('')}</div></div></section>
<section class="steps sec sec--tint"><div class="wrap steps__g"><div class="steps__head">${kicker('How it works')}<h2 class="h2">Four steps. <em>No surprises.</em></h2></div>
  <ol class="stack">${steps.map((s, i) => `<li class="stack__i" style="--i:${i}"><div class="stack__c"><span class="stack__n">${pad(i + 1)}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>${img(['mz-mosque', 'tc-1', 'mz-modern', 'mz-villa'][i], { sizes: '280px', cls: 'stack__img' })}</div></li>`).join('')}</ol></div></section>
${ctaBand()}`;

const contactBody = () => `
<section class="phero phero--short">
  <div class="phero__bg" data-parallax="0.15">${img('mz-night', { sizes: '100vw', eager: true })}</div><div class="phero__shade"></div><div class="grain"></div>
  <div class="wrap phero__in">${crumbs([['Home', '/'], ['Contact', '/contact/']])}<h1 class="phero__t" data-split>Come and see us <em>in Blue Area.</em></h1>
    <p class="phero__s" data-reveal>Walk in, call, or send an enquiry — it opens straight into WhatsApp with your details filled in.</p></div>
</section>
<section class="contact sec"><div class="wrap contact__g">
  <div class="contact__info"><ul class="cinfo">
    <li>${ico('pin')}<div><small>Office</small><a href="${site.google.maps}" target="_blank" rel="noopener">${esc(site.address.line1)},<br>${esc(site.address.line2)} ${site.address.postal}</a><em>${esc(site.address.near)} · tap for directions</em></div></li>
    <li>${ico('phone')}<div><small>Phone & WhatsApp</small><a href="tel:${site.phones.main.tel}">${site.phones.main.intl}</a><a href="tel:${site.phones.alt.tel}">${site.phones.alt.intl}</a></div></li>
    ${site.email ? `<li>${ico('mail')}<div><small>Email</small><a href="mailto:${site.email}">${site.email}</a></div></li>` : ''}
    <li>${ico('clock')}<div><small>Office hours</small>${site.hours.map(([d, h]) => `<span>${d} — ${h}</span>`).join('')}</div></li></ul>
    <h2 class="ftr__h">Follow us</h2>${socials()}</div>
  <div class="contact__form" data-reveal>${enquiry()}</div>
</div></section>
<section class="sec sec--tint"><div class="wrap">${mapBlock(site.address.mapQuery, site.name)}</div></section>`;

const connectBody = () => {
  const total = site.social.reduce((a, x) => a + (x.count || 0), 0);
  const counted = site.social.filter((x) => x.count);
  const card = (x, i) => `<a class="cx cx--${x.id}${i === 0 ? ' cx--lead' : ''}" href="${x.url}" target="_blank" rel="noopener" style="--i:${i}">
    <span class="cx__glow"></span>
    <span class="cx__top"><span class="cx__ic">${brand(x.id)}</span><span class="cx__name"><b>${x.name}</b><small>${esc(x.handle)}</small></span><span class="cx__go">${ico('arrowUR')}</span></span>
    ${x.count ? `<span class="cx__num"><b data-count="${x.count >= 1000 ? (x.count / 1000).toFixed(1) : x.count}" data-suffix="${x.count >= 1000 ? 'K+' : ''}">${x.countLabel}</b><em>${x.unit}</em></span>` : `<span class="cx__num cx__num--soft"><b>${esc(x.extra)}</b></span>`}
    <span class="cx__pitch">${esc(x.pitch)}</span>
    <span class="cx__foot">${x.count ? `<em>${esc(x.extra)}</em>` : '<em>&nbsp;</em>'}<span class="cx__btn">${x.id === 'yt' ? 'Subscribe' : 'Follow'}</span></span>
  </a>`;
  return `
<section class="cn">
  <div class="cn__bg">${img('mz-night', { sizes: '100vw', eager: true })}</div><span class="cn__aur cn__aur--1"></span><span class="cn__aur cn__aur--2"></span><div class="grain"></div>
  <div class="cn__in">
    <header class="cn__head">
      <a href="/" aria-label="${esc(site.name)} website"><img class="cn__logo" src="/assets/logos/mahziyar-720.webp" alt="${esc(site.name)}" width="${MEDIA.logo.w}" height="${MEDIA.logo.h}"></a>
      <h1 class="cn__t">Connect <em>with us</em></h1>
      <p class="cn__s">Real estate in the Capital — follow, message or visit Mahziyar Group.</p>
      <div class="cn__aud"><span class="cn__faces">${counted.map((x) => `<i class="cx--${x.id}">${brand(x.id)}</i>`).join('')}</span><span><b data-count="${(total / 1000).toFixed(1)}" data-suffix="K+">${(total / 1000).toFixed(1)}K+</b> people follow Mahziyar</span></div>
      <div class="cn__rates"><a href="${site.google.url}" target="_blank" rel="noopener">${brand('google', 'i')}<b>${site.google.rating}</b>${stars()}<small>${site.google.count} Google reviews</small></a><a href="${site.social[0].url}" target="_blank" rel="noopener">${brand('fb', 'i')}<b>${site.google.facebookRating}</b>${stars()}<small>Facebook</small></a></div>
    </header>

    <div class="cn__act">
      <a class="ca ca--wa" href="${wa(WA_HELLO)}" target="_blank" rel="noopener">${brand('wa')}<span><b>WhatsApp</b><small>${site.phones.whatsapp.display}</small></span></a>
      <a class="ca" href="tel:${site.phones.main.tel}">${ico('phone', 'b')}<span><b>Call</b><small>${site.phones.main.display}</small></span></a>
      <a class="ca" href="/mahziyar-group.vcf" download>${ico('file', 'b')}<span><b>Save contact</b><small>Add to phone</small></span></a>
      <button class="ca" type="button" data-share>${ico('link', 'b')}<span><b>Share</b><small data-share-l>This page</small></span></button>
    </div>

    <h2 class="cn__h">${ico('spark')} Follow us</h2>
    <div class="cn__grid">${site.social.map(card).join('')}</div>

    <h2 class="cn__h">${ico('home')} Explore</h2>
    <a class="cn__villa" href="${VURL}">${img('villa-dusk', { sizes: '(max-width: 600px) 100vw, 600px' })}<span class="cn__villa-t"><small>${ico('spark')} Our own project · Now booking</small><b>${esc(villas.size)} Luxury Villas</b><em>${esc(villas.where)} · Rs ${crore(villas.price)} · book with 15%</em></span><span class="cn__solar">5 kW<br><small>solar</small></span></a>
    <div class="cn__ex">
      <a href="/societies/">${ico('plot', 'b')}<span><b>${societies.length} societies</b><small>Faisal Hills, Top City, CSC…</small></span>${ico('arrowUR')}</a>
      <a href="/societies/#high-rise">${ico('tower', 'b')}<span><b>${highrises.length} high-rise</b><small>The Pearl, The Sofia…</small></span>${ico('arrowUR')}</a>
    </div>

    <h2 class="cn__h">${ico('pin')} Visit us</h2>
    <a class="cn__visit" href="${site.google.maps}" target="_blank" rel="noopener"><span class="cn__pin">${ico('pin')}</span><span><b>${esc(site.address.line1)}</b><small>${esc(site.address.line2)} ${site.address.postal}</small><em>${site.hours.map(([d, h]) => `${d}: ${h}`).join(' · ')}</em></span><span class="cx__btn">Directions</span></a>

    <footer class="cn__f"><a href="/">mahziyargroup.com</a><span>© ${YEAR} ${esc(site.name)}</span></footer>
  </div>
</section>`;
};

const vcard = () => ['BEGIN:VCARD', 'VERSION:3.0', `N:;${site.name};;;`, `FN:${site.name}`, `ORG:${site.legalName}`, `TEL;TYPE=CELL,VOICE:${site.phones.main.tel}`, `TEL;TYPE=WORK,VOICE:${site.phones.alt.tel}`, ...(site.email ? [`EMAIL;TYPE=WORK:${site.email}`] : []),
  `ADR;TYPE=WORK:;;${site.address.street};${site.address.city};${site.address.region};${site.address.postal};Pakistan`, `URL:${site.url}`, ...site.social.map((x) => `X-SOCIALPROFILE;TYPE=${x.name.toLowerCase()}:${x.url}`), `NOTE:${site.tagline} — Blue Area, Islamabad. Mon–Sat until 7 PM.`, 'END:VCARD'].join('\r\n') + '\r\n';

const legal = (title, sections) => `<section class="phero phero--legal"><div class="phero__shade"></div><div class="wrap phero__in">${crumbs([['Home', '/'], [title, '#']])}<h1 class="phero__t">${esc(title)}</h1><p class="phero__s">Last updated ${TODAY}</p></div></section>
<section class="sec"><div class="wrap prose">${sections.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}</div></section>`;
const PRIVACY = [
  ['Who we are', `${site.name} (${site.legalName}), ${site.address.street}, ${site.address.city}.`],
  ['What we collect', 'Only what you choose to send us: your name, phone number and the details you type into an enquiry. Enquiry forms open WhatsApp on your own device; nothing is stored on this website.'],
  ['How we use it', 'To answer your enquiry, share payment plans and availability, and arrange site visits. We do not sell or rent your details.'],
  ['Third parties', 'Maps are embedded from Google, videos are served from this site, and fonts are loaded from Google Fonts. Their own privacy policies apply.'],
  ['Your choices', `Ask us at any time to delete your enquiry history: call or WhatsApp ${site.phones.main.intl}.`],
];
const TERMS = [
  ['Information only', 'Content on this website is for general information. Prices, payment plans, sizes and availability are set by developers and may change without notice.'],
  ['Verify before you pay', 'Always confirm the current rate, plan and approval status with our team, and make payments to the developer as instructed in writing.'],
  ['Images', 'Some images are developer renders or photographs of the surrounding society; captions say which. Final products may differ from renders.'],
  ['Trademarks', 'Society and project names and logos belong to their respective developers and are used to identify the projects we market.'],
  ['Contact', `${site.name}, ${site.address.street}, ${site.address.city} · ${site.phones.main.intl}.`],
];

// ---------- write ----------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(STATIC), DIST, { recursive: true });
const pages = [];
const out = (path, html, pri = '0.7') => { const d = join(DIST, path); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'index.html'), html); pages.push([path, pri]); };

out('/', page({ path: '/', title: 'Mahziyar Group — Real Estate in Islamabad | Societies & High-rise', desc: 'Mahziyar Group, Blue Area Islamabad: authorized societies and high-rise projects — Faisal Town, Faisal Hills, Top City-1, Mumtaz City, Park View City, DHA Gandhara, Capital Smart City, PECHS, Taj Residencia, Blue World City.', body: homeBody(), cls: 'home', ld: [ldFaq(faqs), { '@context': 'https://schema.org', '@type': 'WebSite', url: abs('/'), name: site.name, publisher: { '@id': ORG } }], preload: '<link rel="preload" as="image" href="/assets/img/poster-reel-d.webp" media="(min-width: 761px)" fetchpriority="high">\n<link rel="preload" as="image" href="/assets/img/poster-reel-m.webp" media="(max-width: 760px)" fetchpriority="high">\n' }), '1.0');
out('/societies/', page({ path: '/societies/', title: 'Societies & High-rise Projects in Islamabad', desc: `${societies.length} authorized societies and ${highrises.length} high-rise projects in Islamabad & Rawalpindi, marketed by Mahziyar Group, Blue Area.`, body: indexBody(), ld: [ldCrumbs([['Home', '/'], ['Societies', '/societies/']]), { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: allProjects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(p.url), name: p.name })) }] }), '0.9');
societies.forEach((s, i) => out(`/societies/${s.slug}/`, page({ path: `/societies/${s.slug}/`, title: `${s.name} Islamabad — Plots, Plans & Location`, desc: `${s.name}: ${s.hook} ${s.area}. Sizes, location, amenities and the latest plan from Mahziyar Group, Blue Area Islamabad.`, body: societyBody(s, i), og: `/assets/img/${s.images[0][0]}.webp`, ld: [ldCrumbs([['Home', '/'], ['Societies', '/societies/'], [s.name, `/societies/${s.slug}/`]]), { '@context': 'https://schema.org', '@type': 'Place', name: s.name, description: s.story[0], url: abs(`/societies/${s.slug}/`), address: { '@type': 'PostalAddress', streetAddress: s.area, addressCountry: 'PK' }, ...(s.geo ? { geo: { '@type': 'GeoCoordinates', latitude: s.geo.lat, longitude: s.geo.lng } } : {}) }] }), '0.8'));
highrises.forEach((h, i) => out(`/high-rise/${h.slug}/`, page({ path: `/high-rise/${h.slug}/`, title: `${h.name}${h.host ? ` ${h.host.name}` : ''} — Apartments & Plans`, desc: `${h.name}${h.host ? `, ${h.host.name}` : `, ${h.area}`}: ${h.kicker}. Floor plans, prices and payment plan from Mahziyar Group, Islamabad.`, body: towerBody(h, i), og: `/assets/img/${h.coverName}.webp`, ld: [ldCrumbs([['Home', '/'], ['High-rise', '/societies/'], [h.name, `/high-rise/${h.slug}/`]])] }), '0.7'));
out(VURL, page({ path: VURL, title: `${V.size} Luxury Villas, Faisal Hills A Block — Mahziyar Group`, desc: `${V.size} luxury villas in A Block, Faisal Hills by Mahziyar Group: Rs ${crore(V.price)}, book with 15%, Shariah-compliant 2-year plan, your own elevation, 5 kW solar for the first 5 bookings.`, body: villasBody(), og: '/assets/img/villa-dusk.webp', ld: [ldCrumbs([['Home', '/'], [V.name, VURL]]), { '@context': 'https://schema.org', '@type': 'Product', name: `${V.size} ${V.name}, ${V.where}`, description: V.intro[0], image: abs('/assets/img/brochure-plan.webp'), brand: { '@id': ORG }, offers: { '@type': 'Offer', price: V.price, priceCurrency: 'PKR', availability: 'https://schema.org/InStock', seller: { '@id': ORG } } }] }), '0.95');
out('/about/', page({ path: '/about/', title: 'About Mahziyar Group — Blue Area, Islamabad', desc: `${site.legalName}: authorized real estate in Islamabad since ${site.since}. Verified files, transparent paperwork and support after the sale.`, body: aboutBody(), ld: [ldCrumbs([['Home', '/'], ['About', '/about/']])] }), '0.6');
out('/contact/', page({ path: '/contact/', title: 'Contact Mahziyar Group — Benazir Plaza, Blue Area', desc: `Visit Mahziyar Group at ${site.address.street}, Islamabad, call ${site.phones.main.intl} or WhatsApp us.`, body: contactBody(), ld: [ldCrumbs([['Home', '/'], ['Contact', '/contact/']])] }), '0.6');
out('/connect/', page({ path: '/connect/', title: 'Connect with Mahziyar Group — Facebook, Instagram, YouTube, TikTok', desc: `Follow Mahziyar Group: ${site.social.filter((x) => x.count).map((x) => `${x.name} ${x.countLabel} ${x.unit}`).join(', ')}. WhatsApp, call, save our contact or visit us in Blue Area, Islamabad.`, body: connectBody(), bare: true, cls: 'connect-page' }), '0.6');
writeFileSync(join(DIST, 'mahziyar-group.vcf'), vcard());
// old /links/ URL → /connect/ (static fallback for hosts without redirects)
mkdirSync(join(DIST, 'links'), { recursive: true }); writeFileSync(join(DIST, 'links/index.html'), `<!doctype html><meta charset="utf-8"><title>Connect with Mahziyar Group</title><link rel="canonical" href="${abs('/connect/')}"><meta http-equiv="refresh" content="0; url=/connect/"><a href="/connect/">Connect with us</a>`);
out('/privacy-policy/', page({ path: '/privacy-policy/', title: 'Privacy Policy', desc: 'How Mahziyar Group handles the details you send in an enquiry.', body: legal('Privacy Policy', PRIVACY) }), '0.2');
out('/terms/', page({ path: '/terms/', title: 'Terms & Conditions', desc: 'Terms of use for the Mahziyar Group website.', body: legal('Terms & Conditions', TERMS) }), '0.2');
writeFileSync(join(DIST, '404.html'), page({ path: '/404/', title: 'Page not found', desc: 'This page does not exist.', body: `<section class="phero phero--short"><div class="phero__bg">${img('mz-night', { sizes: '100vw' })}</div><div class="phero__shade"></div><div class="wrap phero__in"><p class="phero__k">404</p><h1 class="phero__t">This address <em>isn’t on our map.</em></h1><p class="phero__s">The page may have moved. Try the societies list or talk to us.</p><div class="phero__b"><a class="btn btn--gold" href="/societies/"><span>Browse societies</span>${ico('arrow')}</a>${btnWa('WhatsApp us', WA_HELLO, 'btn--glass')}</div></div></section>` }));

// old mahziyargroup.com single-page URLs → new pages
const REDIRECTS = [['/links/', '/connect/'], ['/privacy.html', '/privacy-policy/'], ['/terms.html', '/terms/'], ['/index.html', '/'], ['/projects/', '/societies/']];
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([p, pr]) => `<url><loc>${abs(p)}</loc><lastmod>${TODAY}</lastmod><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${abs('/sitemap.xml')}\n`);
writeFileSync(join(DIST, 'site.webmanifest'), JSON.stringify({ name: site.name, short_name: site.short, start_url: '/', display: 'standalone', background_color: '#08090b', theme_color: '#08090b', icons: [{ src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }));
writeFileSync(join(DIST, '_redirects'), REDIRECTS.map(([a, b]) => `${a} ${b} 301`).join('\n') + '\n');
writeFileSync(join(DIST, '_headers'), `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/mahziyar-group.vcf\n  Content-Type: text/vcard; charset=utf-8\n  Content-Disposition: attachment; filename="Mahziyar Group.vcf"\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n`);
writeFileSync(join(ROOT, '..', 'vercel.json'), JSON.stringify({ $schema: 'https://openapi.vercel.sh/vercel.json', framework: null, installCommand: '', buildCommand: 'node website/build.mjs', outputDirectory: 'website/dist', cleanUrls: true, trailingSlash: true,
  redirects: REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true })),
  headers: [{ source: '/mahziyar-group.vcf', headers: [{ key: 'Content-Type', value: 'text/vcard; charset=utf-8' }, { key: 'Content-Disposition', value: 'attachment; filename="Mahziyar Group.vcf"' }] }, { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }, { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }] }, null, 1));
console.log(`Built ${pages.length} pages → dist/`);
