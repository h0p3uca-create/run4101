import type { MetadataRoute } from 'next';

const SITE = 'https://runfor101.vercel.app';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
  ];
}
