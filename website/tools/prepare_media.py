"""Builds every image/video the Mahziyar Group site uses into src/static/assets and writes src/data/media.json.

Sources (all checked by eye for third-party branding before being listed here):
  - FM:  the sister site's asset folder (society drone/site stills, The Pearl & Sofia renders, Islamabad hero reel)
         Frames carrying another agency's logo, ticker or phone number are deliberately NOT listed.
  - MZ:  photos from the current mahziyargroup.com (downloaded to tools/src-assets/mz/)
  - FILM: clean frames pulled from the Sofia Sapphire developer film.

Run:  python tools/prepare_media.py   (needs: pip install pillow imageio-ffmpeg)
"""
import json, shutil, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/static/assets'
FM = Path(sys.argv[1] if len(sys.argv) > 1 else '/Users/macstore/Desktop/fatimamarketing-main/website/src/static/assets')
MZ = ROOT / 'tools/src-assets/mz'

# new name -> source file
IMAGES = {
    # Faisal Town (Phase 1)
    'ft-park': FM / 'society/faisal-town-4.webp', 'ft-hospital': FM / 'society/hl-hospital.webp',
    # Faisal Hills
    'fh-boulevard': FM / 'society/faisal-hills-1.webp',
    # Faisal Town Phase 2
    'ft2-office': FM / 'society/faisal-town-1.webp', 'ft2-land': FM / 'society/faisal-town-2.webp', 'ft2-access': FM / 'society/faisal-town-3.webp',
    # Top City-1
    'tc-1': FM / 'society/top-city-1-1.webp', 'tc-2': FM / 'society/top-city-1-2.webp', 'tc-3': FM / 'society/top-city-1-3.webp', 'tc-interchange': FM / 'society/hl-motorway.webp',
    # Mumtaz City
    'mc-1': FM / 'society/mumtaz-city-1.webp', 'mc-2': FM / 'society/mumtaz-city-2.webp', 'mc-3': FM / 'society/mumtaz-city-3.webp', 'mc-4': FM / 'society/mumtaz-city-4.webp',
    # Park View City
    'pvc-villas': FM / 'society/park-view-city-1.webp', 'pvc-park': FM / 'society/park-view-city-3.webp', 'pvc-commercial': FM / 'society/park-view-city-4.webp',
    # Capital Smart City
    'csc-1': FM / 'society/capital-smart-city-1.webp', 'csc-2': FM / 'society/capital-smart-city-2.webp', 'csc-3': FM / 'society/capital-smart-city-3.webp', 'csc-4': FM / 'society/capital-smart-city-4.webp',
    # PECHS
    'pechs-1': FM / 'society/pechs-islamabad-2.webp', 'pechs-2': FM / 'society/pechs-islamabad-1.webp', 'pechs-3': FM / 'society/pechs-islamabad-3.webp', 'pechs-4': FM / 'society/pechs-islamabad-4.webp',
    # Taj Residencia
    'taj-1': FM / 'society/taj-residencia-1.webp', 'taj-2': FM / 'society/taj-residencia-2.webp', 'taj-3': FM / 'society/taj-residencia-4.webp',
    # Blue World City
    'bwc-1': FM / 'society/blue-world-city-1.webp', 'bwc-2': FM / 'society/blue-world-city-2.webp', 'bwc-3': FM / 'society/blue-world-city-3.webp', 'bwc-4': FM / 'society/blue-world-city-4.webp',
    # The Pearl (developer renders)
    'pearl-1': FM / 'society/pearl-1.webp', 'pearl-2': FM / 'society/pearl-2.webp', 'pearl-day': FM / 'gallery/pearl-tower-day.webp', 'pearl-facade': FM / 'gallery/pearl-facade.webp',
    'pearl-podium': FM / 'gallery/pearl-podium.webp', 'pearl-night': FM / 'gallery/pearl-night.webp', 'pearl-balcony': FM / 'gallery/pearl-sunset-balcony.webp',
    # The Sofia (developer renders)
    'sofia-palace': FM / 'gallery/sofia-palace-facade.webp', 'sofia-domes': FM / 'gallery/sofia-domes.webp', 'sofia-pool': FM / 'gallery/sofia-pool-deck.webp', 'sofia-arch': FM / 'gallery/sofia-arch-entrance.webp',
    # Area
    'airport': FM / 'society/hl-airport.webp', 'centaurus': FM / 'society/hl-mall.webp',
    # mahziyargroup.com photography
    'mz-hero': MZ / 'hero-islamabad.jpg', 'mz-lounge': MZ / 'interior-lounge.jpg', 'mz-night': MZ / 'islamabad-night.jpg', 'mz-panorama': MZ / 'islamabad-panorama.jpg',
    'mz-mosque': MZ / 'mosque-reflection.jpg', 'mz-highrise': MZ / 'project-highrise.jpg', 'mz-luxury': MZ / 'project-luxury.jpg', 'mz-modern': MZ / 'project-modern.jpg',
    'mz-residence': MZ / 'project-residence.jpg', 'mz-villa': MZ / 'project-villa.jpg',
}
# Unsplash License photos (real photographs, no renders) — design inspiration for Mahziyar Luxury Villas.
# Credits are shown on the site from src/data/projects.mjs → villas.credits.
US = ROOT / 'tools/src-assets/unsplash'
IMAGES.update({
    'villa-dusk': US / 'cUoXTLVFQ9M.jpg', 'villa-glow': US / '4vioYQ9Nn9Y.jpg', 'villa-pool': US / 'ylzGfY-xzBY.jpg', 'villa-drive': US / 'mledaZ8XtVM.jpg',
    'villa-living': US / '0xp3aw009eo.jpg', 'villa-lounge': US / 'G5jPfwxZRzQ.jpg', 'villa-kitchen': US / 'NDapMfAONIg.jpg', 'villa-stairs': US / 'UV81E0oXXWQ.jpg',
    'solar-roof': US / 'Ja8t8nJN2I4.jpg', 'solar-homes': US / 'yxiP843xyrI.jpg',
    # the client's own brochure posters
    'brochure-why': ROOT / 'tools/src-assets/brochure/villas-why-mahziyar.jpg', 'brochure-plan': ROOT / 'tools/src-assets/brochure/villas-payment-plan.jpg',
})
# Sofia Sapphire developer film: second -> name
FILM = FM / 'video/sofia-sapphire-film.mp4'
FILM_FRAMES = {'sofia-living': 46, 'sofia-columns': 62, 'sofia-kitchen': 90, 'sofia-exterior': 134, 'sofia-terrace': 42}
VIDEOS = {  # new name -> source (clean: no third-party ticker/logo)
    'reel-d.mp4': FM / 'video/reel-d.mp4', 'reel-d.webm': FM / 'video/reel-d.webm', 'reel-m.mp4': FM / 'video/reel-m.mp4', 'reel-m.webm': FM / 'video/reel-m.webm',
    'pearl-loop.mp4': FM / 'video/hero-pearl.mp4', 'sofia-loop.mp4': FM / 'video/hero-sofia.mp4', 'sofia-film.mp4': FILM,
}
SOCIETY_LOGOS = {  # society slug -> developer logo (from developers' official sites, via the sister project)
    'faisal-town': 'faisal-town', 'faisal-hills': 'faisal-hills', 'faisal-town-phase-2': 'faisal-town', 'top-city': 'top-city-1',
    'mumtaz-city': 'mumtaz-city', 'park-view-city': 'park-view-city', 'capital-smart-city': 'capital-smart-city',
    'pechs': 'pechs-islamabad', 'taj-residencia': 'taj-residencia', 'blue-world-city': 'blue-world-city',
}


def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def save(im, name, media):
    im = im.convert('RGB')
    d = OUT / 'img'; d.mkdir(parents=True, exist_ok=True)
    full = im.copy(); full.thumbnail((1920, 1920), Image.LANCZOS)
    full.save(d / f'{name}.webp', 'WEBP', quality=82, method=6)
    sm = im.copy(); sm.thumbnail((800, 800), Image.LANCZOS)
    sm.save(d / f'{name}-800.webp', 'WEBP', quality=78, method=6)
    media[name] = {'w': full.width, 'h': full.height, 'sw': sm.width}


def main():
    media = {}
    for name, src in IMAGES.items():
        save(Image.open(src), name, media)
    tmp = ROOT / 'tools/.frames'; tmp.mkdir(exist_ok=True)
    for name, t in FILM_FRAMES.items():
        f = tmp / f'{name}.png'
        subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-ss', str(t), '-i', str(FILM), '-frames:v', '1', str(f)], check=True)
        save(Image.open(f), name, media)
    # video posters
    for name, (src, t) in {'poster-pearl': (FM / 'video/hero-pearl.mp4', 0.5), 'poster-sofia': (FM / 'video/hero-sofia.mp4', 0.5)}.items():
        f = tmp / f'{name}.png'
        subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-ss', str(t), '-i', str(src), '-frames:v', '1', str(f)], check=True)
        save(Image.open(f), name, media)
    for n in ('reel-d', 'reel-m'):
        save(Image.open(FM / f'img/{n}.webp'), f'poster-{n}', media)
    shutil.rmtree(tmp)

    vd = OUT / 'video'; vd.mkdir(parents=True, exist_ok=True)
    for name, src in VIDEOS.items():
        shutil.copy2(src, vd / name)

    ld = OUT / 'logos'; ld.mkdir(parents=True, exist_ok=True)
    for slug, src in SOCIETY_LOGOS.items():
        im = Image.open(FM / f'logos/{src}.webp').convert('RGBA'); im.thumbnail((320, 320), Image.LANCZOS)
        im.save(ld / f'{slug}.webp', 'WEBP', quality=90)
        media[f'logo:{slug}'] = {'w': im.width, 'h': im.height}

    # brand: gold logo + mark, favicons, share image
    logo = Image.open(MZ / 'logo.png').convert('RGBA')
    for w in (360, 720):
        l = logo.copy(); l.thumbnail((w, w), Image.LANCZOS); l.save(ld / f'mahziyar-{w}.webp', 'WEBP', quality=92)
    logo.copy().save(ld / 'mahziyar.png', optimize=True)
    mark = Image.open(MZ / 'mark.png').convert('RGBA')
    ic = OUT / 'icons'; ic.mkdir(parents=True, exist_ok=True)
    for s, n in ((32, 'favicon-32.png'), (180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
        mark.resize((s, s), Image.LANCZOS).save(ic / n)
    mark.resize((48, 48), Image.LANCZOS).save(ic / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    # mark without its black square, for the loader / header (crop to gold strokes on transparent)
    px = mark.copy(); data = [(r, g, b, 0 if r + g + b < 90 else a) for r, g, b, a in px.getdata()]; px.putdata(data)
    px = px.crop(px.getbbox()); px.thumbnail((256, 256), Image.LANCZOS); px.save(ld / 'mark-gold.webp', 'WEBP', quality=92)
    media['mark-gold'] = {'w': px.width, 'h': px.height}

    og = Image.new('RGB', (1200, 630), (8, 9, 11))
    bg = Image.open(MZ / 'islamabad-night.jpg').convert('RGB').resize((1200, 625))
    og.paste(Image.blend(bg, Image.new('RGB', bg.size, (8, 9, 11)), 0.62), (0, 0))
    l = logo.copy(); l.thumbnail((620, 620), Image.LANCZOS)
    og.paste(l, ((1200 - l.width) // 2, (630 - l.height) // 2), l)
    (OUT / 'img').mkdir(exist_ok=True); og.save(OUT / 'img/og-mahziyar.jpg', quality=86)
    l = logo.copy(); ratio = l.height / l.width; media['logo'] = {'w': 720, 'h': round(720 * ratio)}

    (ROOT / 'src/data/media.json').write_text(json.dumps(media, indent=1))
    print(f'{len(media)} media entries written')


if __name__ == '__main__':
    main()
