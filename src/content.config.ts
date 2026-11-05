import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({ label: z.string(), handle: z.string(), url: z.url() }).strict();
const email = z.object({ label: z.string(), address: z.email() }).strict();

const profile = defineCollection({
  loader: file('src/content/profile.yaml'),
  schema: z
    .object({
      id: z.string(),
      name: z.string(),
      lead: z.string(),
      research: z.string(),
      lab: z.string(),
      labUrl: z.url(),
      institution: z.string(),
      professor: z.string(),
      emails: z.array(email).min(1),
      links: z.array(link),
    })
    .strict(),
});

const timelineEntry = {
  id: z.string(),
  period: z.string(),
  start: z.number().int(),
  title: z.string(),
};

const education = defineCollection({
  loader: file('src/content/education.yaml'),
  schema: z.object(timelineEntry).strict(),
});

const publications = defineCollection({
  loader: file('src/content/publications.yaml'),
  schema: z
    .object({ ...timelineEntry, authors: z.array(z.string()).min(1), venue: z.string(), url: z.url().optional() })
    .strict(),
});

const projects = defineCollection({
  loader: file('src/content/projects.yaml'),
  schema: z.object({ ...timelineEntry, summary: z.string(), url: z.url().optional() }).strict(),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/notes' }),
  schema: z
    .object({ title: z.string(), date: z.coerce.date(), summary: z.string(), draft: z.boolean().default(false) })
    .strict(),
});

export const collections = { profile, education, publications, projects, notes };
