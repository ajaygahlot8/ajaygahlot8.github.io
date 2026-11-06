import { getCollection, type CollectionEntry } from 'astro:content';

export const me = {
  name: 'Ajay Singh',
  email: 'ajay.gahlot.08@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ajaygahlot',
  github: 'https://github.com/ajaygahlot8',
};

export type Post = CollectionEntry<'blog'>;

/** Published posts, newest first. Drafts are visible only in `astro dev`. */
export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const readingTime = (body = '') => `${Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220))} min read`;

export const fmtDate = (d: Date, long = false) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: long ? 'long' : 'short', year: 'numeric', timeZone: 'UTC' });
