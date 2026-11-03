import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Markdown exported from Squarespace (Phase 1). Legacy "selected-projects" pages are saved but not built.
const pages = defineCollection({
  loader: glob({
    base: './content',
    pattern: ['*.md', '!selected-projects*.md', '!home.md', '!design-motion.md', '!404.md'],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      type: z.enum(['about', 'project']),
      date: z.string().nullable(),
      description: z.string().nullable(),
      cover_image: image().nullable(),
      order: z.number().nullable(),
      // which homepage roles a project belongs to (drives the Projects filter)
      roles: z.array(z.enum(['creative-direction', 'design', 'illustration', 'photography'])).default([]),
      // About page contact details
      location: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      socials: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
      copyright: z.string().optional(),
    }),
});

export const collections = { pages };
