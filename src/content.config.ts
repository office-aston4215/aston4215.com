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

// The label picks the logo in ContactIcon.astro, so a new channel has to bring its logo.
// Without a url the card shows only its logo and name, and is not a link.
const link = z
  .object({ label: z.enum(['GitHub', 'Instagram', 'Google Scholar', 'LinkedIn']), handle: z.string().optional(), url: z.url().optional() })
  .strict();
const email = z.object({ label: z.string(), address: z.email() }).strict();

// period is shown as written. start sorts newest first and is YYYY or YYYY-MM.
const timeline = {
  id: z.string(),
  period: z.string(),
  start: z.string().regex(/^\d{4}(-\d{2})?$/),
  title: z.string(),
};

const cvEntry = z
  .object({
    ...timeline,
    subtitle: z.string().optional(),
    location: z.string().optional(),
    details: z.array(z.string()).default([]),
  })
  .strict();

const profile = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/profile.yaml`),
  schema: z
    .object({
      id: z.string(),
      name: z.string(),
      headerLabel: z.string(),
      lead: z.array(z.string()).min(1),
      research: z.string(),
      institution: z.string(),
      emails: z.array(email).min(1),
      links: z.array(link),
    })
    .strict(),
});

const research = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/research.yaml`),
  schema: z
    .object({
      ...timeline,
      course: z.string(),
      role: z.string(),
      advisor: z.string(),
      location: z.string(),
      url: z.url(),
      logo: z.enum(['mlv', 'url']),
      details: z.array(z.string()).min(1),
    })
    .strict(),
});
const education = defineCollection({ loader: yamlFile(`${CONTENT_DIR}/education.yaml`), schema: cvEntry });
const experience = defineCollection({ loader: yamlFile(`${CONTENT_DIR}/experience.yaml`), schema: cvEntry });
const leadership = defineCollection({ loader: yamlFile(`${CONTENT_DIR}/leadership.yaml`), schema: cvEntry });

const honors = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/honors.yaml`),
  schema: z.object({ ...timeline, issuer: z.string() }).strict(),
});

const skills = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/skills.yaml`),
  schema: z.object({ id: z.string(), order: z.number().int(), label: z.string(), value: z.string() }).strict(),
});

const publications = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/publications.yaml`),
  schema: z
    .object({ ...timeline, authors: z.array(z.string()).min(1), venue: z.string(), url: z.url().optional() })
    .strict(),
});

const projects = defineCollection({
  loader: yamlFile(`${CONTENT_DIR}/projects.yaml`),
  schema: z.object({ ...timeline, summary: z.string(), url: z.url().optional() }).strict(),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: `${CONTENT_DIR}/notes` }),
  schema: z.object({ title: z.string(), date: z.date(), summary: z.string(), draft: z.boolean().default(false) }).strict(),
});

export const collections = { profile, research, education, experience, leadership, honors, skills, publications, projects, notes };
