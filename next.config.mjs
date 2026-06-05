/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static, client-side game → export to plain HTML/JS for Vercel/Cloudflare.
  output: 'export',
  images: { unoptimized: true },
  // Security headers are emitted at the host/CDN layer for static export
  // (next.config headers() is ignored with output:'export'); see docs/deploy.md.
  reactStrictMode: true,
  // NOTE: `build` runs with --webpack (see package.json). Next 16's default
  // Turbopack build fails to collect metadata routes (robots.txt / sitemap.xml)
  // under output:'export' ("Cannot find module for page"). Webpack builds them
  // correctly; dev still uses Turbopack. Revisit when the Turbopack bug is fixed.
};

export default nextConfig;
