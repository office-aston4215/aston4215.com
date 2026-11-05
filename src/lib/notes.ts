import type { CollectionEntry } from 'astro:content';

export const isPublished = (note: CollectionEntry<'notes'>): boolean => !note.data.draft;
