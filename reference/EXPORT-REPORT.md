# Export report — doughindson.com (Phase 1)

Source: Squarespace 7.1 site. `doughindson.com` 301-redirects to `www.doughindson.com`; crawled at ~1 request per 1.5 s.

## What was exported
| Item | Where | Count |
|---|---|---|
| Page inventory | `inventory.json` | 19 URLs (sitemap and crawl agree; crawl found nothing extra) |
| Markdown content | `content/<slug>.md` | 18 files (`/home` is an alias of `/`) |
| Images | `content/<slug>/` + `reference/images.json` | 331 files (279 unique) |
| Squarespace-hosted videos | `content/<slug>/video-*.mp4` + `reference/videos.json` | 22 |
| Screenshots | `reference/screenshots/` | 1440 and 390 for every page, plus mobile menu open |
| Design tokens | `reference/design-tokens.json` | typography, colours, layout, breakpoints, hover, fonts, custom CSS |
| Raw HTML / JSON, CSS | `reference/raw-html/`, `reference/css/` | for re-checking |
| Scripts used | `tools/` | re-runnable |

Site structure: nav is **Design & Motion** (`/design-motion`, 13 projects in grid order, see `inventory.json`) and **About**. Home is a headline plus image collage. No blog, no store, no contact form.

## Things to know / decide
1. **Images are NOT true originals.** `?format=original` returns at most **2500 px** on the long edge (128 images were uploaded larger, up to 4096 px). True originals only exist in your Squarespace Asset Library or your own files. Note: the CDN also serves WebP unless asked otherwise; I request native formats, and all files are verified as real PNG/JPG/GIF.
2. **Low-res images (<1600 px long edge)** — replace from your own files if you want them in the redesign:
- `content/selected-projects/01-factory_bw.jpg` — 832×563
- `content/selected-projects/02-French_Fields_02-Smaller.gif` — 600×600
- `content/selected-projects/14-building_short_loop.gif` — 500×500
- `content/selected-projects/15-tumblr_ndtckegBaV1qbkds3o1_1280.jpg` — 1000×563
- `content/selected-projects/17-tumblr_ndsz33X4uY1qbkds3o1_1280_1000.jpg` — 1000×563
- `content/selected-projects/18-USA_1_AE.gif` — 960×540
- `content/selected-projects/19-tumblr_nfl9oz3nZO1qbkds3o1_1280_1000.jpg` — 1000×563
- `content/selected-projects/22-tumblr_nhyryktLWS1qbkds3o1_1280.jpg` — 1280×720
- `content/selected-projects/24-tumblr_nhtbf5qLgF1qbkds3o1_1280.jpg` — 1280×720
- `content/selected-projects/25-tumblr_nak4e7fwQ01qbkds3o1_1280_1000.jpg` — 1000×1000
- `content/selected-projects/26-tumblr_mlauai7N321qbkds3o1_1280_o.jpg` — 1280×720
- `content/selected-projects/27-tumblr_mlymxvd5js1qbkds3o1_1280_o.jpg` — 1280×543
- `content/selected-projects/28-tumblr_my9ryvCpWU1qbkds3o1_1280_o.jpg` — 1000×1414
- `content/selected-projects/29-bloks.jpg` — 750×504
- `content/selected-projects/34-carmen.jpg` — 500×336
- `content/selected-projects/40-disconnect.jpg` — 768×516
- `content/selected-projects/49-skew.jpg` — 768×516
- `content/selected-projects/50-frisson2.jpg` — 768×516
- `content/selected-projects/51-image-asset.png` — 26×30
- `content/thorne-build-to-last/17-3360626.png` — 924×920
- `content/thorne-build-to-last/18-Frame_167-2.png` — 1386×1386
- `content/thorne-healthy-aging/05-08-FlowerWireframe.gif` — 800×800
- `content/thorne-healthy-aging/06-07_Flower.gif` — 800×800
- `content/landscapes/04-Apartments.gif` — 500×500
- `content/landscapes/10-Roadtrip.gif` — 960×540
- `content/disconnect/cover-02-Image-Crop.png` — 1584×908
- `content/spotify-premium/cover-SP340_Ambient_1080x1080.png` — 1080×1080
- `content/spotify-premium/01-SpotifyPremium_InitialConcepts_v01_dh_Ambient_07.png` — 1000×1000
- `content/spotify-premium/02-SpotifyPremium_InitialConcepts_v01_dh_Ambient_03.png` — 1000×1000
- `content/spotify-premium/03-SpotifyPremium_InitialConcepts_v01_dh_Classical_01.png` — 1000×1000
- `content/spotify-premium/04-SpotifyPremium_InitialConcepts_v01_dh_Classical_03.png` — 1000×1000
- `content/spotify-premium/05-SpotifyPremium_InitialConcepts_v01_dh_Classical_04.png` — 1000×1000
- `content/spotify-premium/06-SpotifyPremium_InitialConcepts_v01_dh_Classical_02.png` — 1000×1000
- `content/ibm-partnerships/02-IBM_SEP_FF_A_v09_1x1_H264.gif` — 320×320
- `content/ibm-partnerships/06-IBM_SEP_FF_F_v20_1x1_H264.gif` — 640×640
- `content/ibm-partnerships/07-IBM_SEP_FF_L_v13_1x1_H264.gif` — 640×640
- `content/ibm-partnerships/10-Image_gallery-2.png` — 1142×1142
- `content/ibm-partnerships/14-IBM_SEP_USO_A_v16_1x1_H264.gif` — 640×640
- `content/ibm-partnerships/15-IBM_SEP_USO_N_v06_1x1_H264.gif` — 640×640
- `content/ibm-partnerships/19-IBM_SEP_MAST_A_v09_1x1_H264.gif` — 540×540
- `content/ibm-partnerships/24-IBM_SEP_MAST_F_v11_1x1_H264.gif` — 640×640
- `content/ibm-partnerships/25-IBM_SEP_MAST_I_v16_1x1_H264.gif` — 540×540
- `content/ibm-partnerships/31-02_WIMB.png` — 1394×1440
- `content/ibm-partnerships/32-IBM_SEP_WIMB_A_v13_1x1_H264.gif` — 640×640
- `content/ibm-partnerships/36-IBM_SEP_WIMB_B_v07_1x1_H264.gif` — 640×640
- `content/ibm-partnerships/37-Frame_630614.png` — 1142×1356
- `content/ibm-partnerships/41-IBM_SEP_GRAM_G_v23_1x1_H264.gif` — 640×640
- `content/ibm-partnerships/42-04_GRAM.png` — 1142×1142
- `content/ibm-partnerships/43-IBM_SEP_GRAM_B_v11_1x1_H264.gif` — 480×480
3. **Alt text is missing on all 318 content images** (Squarespace defaults it to the filename; stored in `images.json`, left blank in Markdown). No captions exist. Needed for accessibility in Phase 3.
4. **Meta descriptions are empty on every page**; no custom favicon (Squarespace default); social share image is `site-logo.png` (1500×1500, saved in `reference/site-assets/`).
5. **Videos are hosted on Squarespace, not Vimeo.** Squarespace only serves HLS streams, so the MP4s are the best public rendition (max 1080p), not your masters. Brief says video stays embedded in Phase 3, so these need a home (Vimeo/YouTube upload from your masters). Files over Cloudflare's 25 MB limit are flagged:
- `content/transportation-alternatives/video-01-e0ad42be-e979-4720-9810-a857a45679fc.mp4` — 87s, 33.5 MB **(>25 MB)**
- `content/thorne-build-to-last/video-01-f0534023-a74d-4c8f-990d-14b6462c500e.mp4` — 46s, 17.0 MB
- `content/thorne-build-to-last/video-02-6f0d869b-bf8f-4e07-afee-2464f9bcb24e.mp4` — 8s, 2.3 MB
- `content/thorne-build-to-last/video-03-22da7d7c-d666-41f8-aec1-7118f5de220f.mp4` — 30s, 11.7 MB
- `content/citi/video-01-43aada20-3f91-49ae-9ec5-5fd3d02c43ed.mp4` — 10s, 3.8 MB
- `content/thorne-healthy-aging/video-01-5164b0be-3588-4d6d-a233-b0cd7123b7b5.mp4` — 60s, 22.9 MB
- `content/thorne-healthy-aging/video-02-f2ebd821-50cc-4d68-97b2-8b7bbebb56f8.mp4` — 4s, 1.4 MB
- `content/microsoft-365/video-01-fb4cc12f-e209-441a-bbe8-f103378cb1cb.mp4` — 30s, 10.7 MB
- `content/ibm-watsonx/video-01-e2809873-ef74-4171-9baa-29a4029a3f6f.mp4` — 100s, 41.0 MB **(>25 MB)**
- `content/ibm-watsonx/video-02-3f1dbe5d-75fc-4f9f-8e3c-670df53cb2eb.mp4` — 5s, 1.1 MB
- `content/chase-usopen/video-01-d63667f6-e54e-4447-8112-ac6b8d4ce90a.mp4` — 32s, 12.1 MB
- `content/disconnect/video-01-795c6ccb-7f84-44ec-820e-5480c57abb83.mp4` — 155s, 62.8 MB **(>25 MB)**
- `content/disconnect/video-02-94fbbd45-918d-443c-af26-f6654652ce8b.mp4` — 100s, 34.1 MB **(>25 MB)**
- `content/here-we-are/video-01-2f630a9c-fc69-4ea1-901e-bc47f71bd05c.mp4` — 99s, 37.9 MB **(>25 MB)**
- `content/spotify-premium/video-01-69239f6f-3a24-4be6-b2b2-ffcf0e23bdaa.mp4` — 10s, 3.6 MB
- `content/spotify-premium/video-02-fcd4b707-7907-4372-a9ae-4df9b26cc1ed.mp4` — 10s, 3.7 MB
- `content/ibm-partnerships/video-01-f74c0f24-7796-40a7-9924-9b9bafdb197a.mp4` — 6s, 2.3 MB
- `content/ibm-partnerships/video-02-ebe9e765-0a0c-4d2e-a754-6d44fb5b01e6.mp4` — 10s, 4.5 MB
- `content/ibm-partnerships/video-03-8bf8d8f7-3bef-4191-81b2-1ece27cd038c.mp4` — 10s, 5.3 MB
- `content/ibm-partnerships/video-04-0290df49-f601-4c97-9a0d-bbd267f6f7f2.mp4` — 12s, 3.8 MB
- `content/ibm-partnerships/video-05-7feb595d-6449-4dbc-affa-b582bd2dc189.mp4` — 12s, 5.3 MB
- `content/ibm-partnerships/video-06-7aa745e1-5ee0-4cc6-8c5b-b82f9db4ee3d.mp4` — 12s, 4.6 MB
6. **Vimeo embeds:**
- Vimeo `116533375` — DIS \ CONNECT — https://player.vimeo.com/video/116533375?wmode=opaque&api=1 — on `selected-projects`
- Vimeo `116533375` — DIS \ CONNECT — https://player.vimeo.com/video/116533375?wmode=opaque&api=1 — on `selected-projects`
- Vimeo `116057701` — The Making of DIS \ CONNECT — https://player.vimeo.com/video/116057701?wmode=opaque&api=1 — on `selected-projects`
- Vimeo `80622495` (code block) — on `selected-projects`
- Vimeo `80743624` — The Making of Skew — https://player.vimeo.com/video/80743624?wmode=opaque&api=1 — on `selected-projects`
- Vimeo `95583790` — Frisson — https://player.vimeo.com/video/95583790?wmode=opaque&api=1 — on `selected-projects`
7. **Legacy pages:** `/selected-projects` and `/selected-projects-1` are in the sitemap but not in the nav (old portfolio: tumblr-era images, GIFs, Vimeo). `/selected-projects-1` is near-identical to the other. **Question: still in use? Redirect to `/design-motion`?** `/home` duplicates `/`. `/404` is the custom error page ("Hmm, that page doesn't seem to exist…").
8. **Fonts (licensing flag):** body/headings use **Europa** (300/400/700, plus italics) and UI labels **Proxima Nova** (600), both from **Adobe Fonts (Typekit)** via Squarespace. These are licensed for Adobe web-project use and **cannot be self-hosted**; Adobe Fonts also needs a plan after you leave Squarespace. Phase 3 options: keep an Adobe Fonts web project (needs your Adobe subscription), buy a licence, or substitute (e.g. a similar free geometric sans). Roboto (Google) appears only inside the video player UI.
9. **Code / tracking:** no Google Analytics, pixels or other third-party tracking scripts. Only Squarespace scripts, Typekit, and Vimeo embeds. One `google-site-verification` meta tag (`mwNZungO7xryZ0XLSNOSGsmfZbguzYk8PhT93mdiC6M`) — carry over or re-verify in Search Console. Custom CSS (saved in `design-tokens.json` → `customCss`): reduces section padding to 20px and tightens nav spacing.
10. **Contact details on About page:** email hello@doughindson.com, a phone number, Vimeo and Instagram links (all public). Email is on this domain, so DNS records matter in Phase 3.

## Your manual checklist in Squarespace (I haven't touched the site)
- [ ] Run Settings → Website → Import/Export → **Export** (XML) as a backup.
- [ ] Download **original images** from the Asset Library for the low-res and >2500 px ones.
- [ ] Check **Settings → Advanced → Code Injection** (header/footer/lock page) — not visible publicly.
- [ ] Check **Settings → Advanced → URL Mappings** for existing redirects.
- [ ] Check **Domains → DNS settings** and note email provider; also whether the domain is managed by Squarespace or only pointed there (brief says Spaceship).
- [ ] Download form submissions / newsletter lists, if any exist (none seen on the public site).
- [ ] Note your **plan renewal date** and whether it's monthly or annual.
- [ ] Locate masters for the 22 videos (and the Vimeo embeds' source).

## Not done / uncertain
- Hover states: the only real hover effect found is the project-grid overlay (opacity 0 → 0.9, #f2f2f2); nav/link hover showed no computed change.
- Fluid-engine grid structure on home/about is recorded as computed layout boxes, not a clean column spec; Phase 2 will lean on the screenshots.
- Page `date` in frontmatter is the Squarespace CMS publish date, not necessarily the project date.
