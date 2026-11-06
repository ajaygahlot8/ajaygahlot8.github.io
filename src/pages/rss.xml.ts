import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/site';

export async function GET(ctx: APIContext) {
  const posts = await getPosts();
  return rss({
    title: 'Ajay Singh: writing',
    description: 'Notes on leading engineering teams and building AI agents.',
    site: ctx.site!,
    items: posts.map((p) => ({ title: p.data.title, description: p.data.description, pubDate: p.data.pubDate, link: `/writing/${p.id}/`, categories: p.data.tags })),
  });
}
