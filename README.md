# doughindson.com

Portfolio site for Doug Hindson. Astro (static), plain CSS, no CMS or database. Deployed on Cloudflare Pages.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs dist/
npm run preview
```

Node 22.23.4 or newer (see `.nvmrc`). Dependencies are pinned to exact versions.

## How it is put together

- **One scrolling homepage** (`src/components/HomePage.astro`): About above, the hero sentence in the middle, Projects below. It is rendered at `/`, `/about` and `/projects` so every URL deep-loads at the right spot; `src/scripts/home.ts` keeps the URL in sync as you scroll.
- **Hero roles** live in `src/data/roles.ts`. Each role has an `images` array (one test image each for now; add more entries later for a slideshow).
- **Projects and About** come from the Markdown in `content/` (`content/<slug>.md`, images in `content/<slug>/`). Project pages are `src/pages/projects/[slug].astro`. The rehype plugin `src/plugins/rehype-project.mjs` groups images, collapses the credits behind a "Show all credits" toggle and turns video links into embeds.
- **Design tokens**: `tools/figma-tokens.json` is exported from the Figma variables; `npm run tokens` regenerates `src/styles/tokens.css`. Never edit that file by hand.
- **Redirects**: `npm run redirects` regenerates `public/_redirects` from `inventory.json` (old Squarespace URL → new URL).
- **Icons**: `npm run icons` regenerates the favicon set from `reference/site-assets/site-logo.png`.

## Updating content

- Edit the text or add images in the matching `content/<slug>.md` and `content/<slug>/` folder, then commit and push. Cloudflare Pages rebuilds automatically.
- Reorder projects with the `order:` number in each project's front matter.
- Videos: upload to Vimeo (or YouTube), then add `"<slug>/<video-file>.mp4": "https://player.vimeo.com/video/<id>"` to `src/data/video-sources.json`. Videos without an entry are hidden.

## Deploy (Cloudflare Pages)

Build command `npm run build`, output directory `dist`, Node version 22 (set `NODE_VERSION=22` if needed). Optional analytics: set `PUBLIC_CF_BEACON_TOKEN` (see `.env.example`).
