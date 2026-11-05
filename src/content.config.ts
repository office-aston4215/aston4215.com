import { defineCollection } from 'astro:content';
import { file, glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';

// Tests point this at a temporary copy so they never touch the real content.
const CONTENT_DIR = process.env.CONTENT_DIR ?? 'src/content';

// file() only logs bad YAML and missing or duplicate ids, then the build succeeds without those entries.
// Turning those messages into errors stops a broken content edit from being deployed.
const yamlFile = (path: string): Loader => {
  const loader = file(path);
  return {
    ...loader,
    load: (context) =>
      loader.load({
        ...context,
        logger: Object.create(context.logger, {
          error: {
            value: (message: string) => {
              throw new Error(`${path}: ${message}`);
            },
          },
          warn: {
            value: (message: string) => {
              if (message.includes('same slug')) throw new Error(`${path}: ${message}`);
              context.logger.warn(message);
            },
          },
        }),
      }),
  };
};

const link = z.object({ label: z.string(), handle: z.string(), url: z.url() }).strict();
const email = z.object({ label: z.string(), address: z.email() }).strict();

const profile = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/profile.yaml`),
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
  loader: yamlFile(`${CONTENT_DIR}/education.yaml`),
  schema: z
    .object({
      id: z.string(),
      school: z.string(),
      location: z.string(),
      period: z.string(),
      start: z.number().int(),
      details: z.array(z.string()).default([]),
    })
    .strict(),
});

const publications = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/publications.yaml`),
  schema: z
    .object({ ...timelineEntry, authors: z.array(z.string()).min(1), venue: z.string(), url: z.url().optional() })
    .strict(),
});

const projects = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/projects.yaml`),
  schema: z.object({ ...timelineEntry, summary: z.string(), url: z.url().optional() }).strict(),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: `${CONTENT_DIR}/notes` }),
  schema: z.object({ title: z.string(), date: z.date(), summary: z.string(), draft: z.boolean().default(false) }).strict(),
});

export const collections = { profile, education, publications, projects, notes };
