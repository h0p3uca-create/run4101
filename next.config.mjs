/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static, client-side game → export to plain HTML/JS for Vercel/Cloudflare.
  output: 'export',
  images: { unoptimized: true },
  // Security headers are emitted at the host/CDN layer for static export
  // (next.config headers() is ignored with output:'export'); see docs/deploy.md.
  reactStrictMode: true,
};

export default nextConfig;
