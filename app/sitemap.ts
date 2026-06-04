import type { MetadataRoute } from 'next';

const SITE = 'https://gofor101.com';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
  ];
}
