# Mahziyar Group website

Static site for **Mahziyar Group** (Mahziyar Real Estate Marketing), Benazir Plaza, Blue Area, Islamabad.
Zero-dependency Node generator → plain HTML/CSS/JS in `website/dist`.

```
node website/build.mjs                 # build → website/dist (30 pages, sitemap, robots, redirects)
node website/tools/serve.mjs 4180      # preview → http://localhost:4180
```

| Change… | Edit |
|---|---|
| Phones, address, hours, social links, rating, email | `website/src/data/site.mjs` |
| Society / high-rise text, facts, sizes, photos | `website/src/data/projects.mjs` (order = order on site; Blue World City stays last) |
| Services, process steps, promises, FAQ | `website/src/data/site.mjs` |
| Look & feel | `website/src/static/assets/css/site.css` (colour tokens at the top) |
| Scroll effects, forms → WhatsApp | `website/src/static/assets/js/site.js` |
| Photos / videos | `python website/tools/prepare_media.py` (rebuilds `assets/img`, `video`, `logos`, `icons` and `src/data/media.json`) |

**Pages:** home · `/luxury-villas/` (Mahziyar's own 5 Marla villas, Faisal Hills A Block — data in `projects.mjs` → `villas`; the build stops if the plan doesn't add up to the price) · `/societies/` (all societies + high-rise) · 11 society pages · 11 high-rise pages · about · contact · `/connect/` (Connect with us — QR landing page: social profiles with audience figures, WhatsApp/call, save-contact vCard, share; old `/links/` redirects here; figures in `site.social[].count`) · privacy · terms · 404.

**Deploy:** Vercel (`vercel.json` at the root) or Cloudflare Pages (build `node website/build.mjs`, output `website/dist`).

## Waiting on the client
- **Luxury Villas offer date:** the brochure says “valid until 30 October” and “price increases after 30 October”, which has passed, so neither is shown. Set `villas.offerNote` (e.g. a new date) once the client confirms.
- **Real villa photos/renders:** the villa page uses real Unsplash photographs captioned as *design inspiration* (credits shown). Replace with the client's own villa photos when built.
- **Photos for:** DHA Gandhara, Etimaad Heights 1, Faisal Jewel, Faisal Heights, ESMR, Doha Heights, The Residencies by Altaf, City Walk, Hillwalk, Elanza. These pages currently use a photo of the surrounding society (captioned as such) or an Islamabad skyline.
- **Facts for:** ESMR, Doha Heights, The Residencies by Altaf, City Walk, Etimaad Heights 1. Almost nothing about these is public, so their pages say only what is confirmed and offer the brochure on WhatsApp. Add `story`, `facts` and `units` in `projects.mjs` when the details arrive.
- Office **email** (`site.email`). It stays hidden until filled in.
- **Google review texts** if they want quotes on the site. Only the 4.9 ★ / 16 reviews summary is shown, with a link to Google.

## Media sources
- Luxury Villas inspiration photos: Unsplash License (free commercial use), real photographs only (renders excluded): Michael Brown, Arthur Baudry, Franco Debartolo, Jason Briscoe, Salvo Media LLC, Watt A Lot. Originals in `tools/src-assets/unsplash/` (named by Unsplash photo ID). The two brochure posters are the client's own.
- Society stills and The Pearl / The Sofia renders and loops are reused from the sister project. Every frame was checked by eye, and any frame showing another agency's logo, ticker or phone number was left out.
- Islamabad photography and the logo come from the current mahziyargroup.com.
- Sofia interior frames are taken from the developer's own film.
