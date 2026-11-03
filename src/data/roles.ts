import type { ImageMetadata } from 'astro';

export type RoleSlug = 'creative-direction' | 'design' | 'illustration' | 'photography';
// How a role's slideshow moves from one image to the next (styles in global.css, timing here):
//   fade  - crossfade                      zoom  - crossfade over a slow push-in on each image
//   slide - the next image slides in        focus - the next image comes into focus as it fades in
//   cut   - straight cut, no transition
export type SlideStyle = 'fade' | 'zoom' | 'slide' | 'focus' | 'cut';
export interface Slideshow { style: SlideStyle; hold: number } // hold: ms each image is on screen, transition included
export interface Role { prefix?: string; label: string; punctuation: string; slug: RoleSlug; filterLabel: string; images: ImageMetadata[]; slideshow: Slideshow }

// Each role's slideshow is whatever sits in src/assets/roles/<slug>/, played in filename order (01.jpg, 02.jpg, …).
// Add, remove or rename files there; nothing here needs editing.
const files = import.meta.glob<ImageMetadata>('../assets/roles/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', { eager: true, import: 'default' });
const slides = (slug: RoleSlug) =>
  Object.keys(files)
    .filter((path) => path.split('/').at(-2) === slug)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((path) => files[path]);

export const roles: Role[] = [
  { label: 'Creative Director', slug: 'creative-direction', filterLabel: 'Creative Direction', punctuation: ',', images: slides('creative-direction'), slideshow: { style: 'fade', hold: 1200 } },
  { label: 'designer', slug: 'design', filterLabel: 'Design', punctuation: ',', images: slides('design'), slideshow: { style: 'fade', hold: 1200 } },
  { label: 'illustrator', slug: 'illustration', filterLabel: 'Illustration', punctuation: ',', images: slides('illustration'), slideshow: { style: 'fade', hold: 1200 } },
  { prefix: '& ', label: 'photographer', slug: 'photography', filterLabel: 'Photography', punctuation: '.', images: slides('photography'), slideshow: { style: 'fade', hold: 1200 } },
];
