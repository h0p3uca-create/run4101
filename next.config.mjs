/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static, client-side game → export to plain HTML/JS for Vercel/Cloudflare.
  output: 'export',
  images: { unoptimized: true },
  // Security headers are emitted at the host/CDN layer for static export
  // (next.config headers() is ignored with output:'export'); see docs/deploy.md.
  reactStrictMode: true,
  // NOTE: both `dev` and `build` run with --webpack (see package.json). Next 16's
  // default Turbopack (a) fails to collect metadata routes (robots.txt /
  // sitemap.xml) under output:'export' on build, and (b) intermittently fails to
  // resolve next/font/google in dev (500s). Webpack handles both. Revisit when
  // the Turbopack bugs are fixed.
};

export default nextConfig;
