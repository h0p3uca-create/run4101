# Deploy & security headers

`next.config.mjs` uses `output: 'export'`, producing a fully static `./out`.
With static export, `next.config` `headers()` is **ignored** — security headers
must be set at the host/CDN layer. Both references we studied missed most of
these; setting them is an easy edge over them.

## Vercel (`vercel.json`)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'" }
      ]
    }
  ]
}
```

> If analytics (e.g. gtag) is added later, extend `script-src`/`connect-src` accordingly.

## Cloudflare Pages

Add a `_headers` file in the output root:

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'
```

## SEO files (Phase 5)

- `app/robots.ts` → emit `robots.txt` (both references returned 404 here).
- `app/sitemap.ts` → emit `sitemap.xml`.
- OG image route for `summary_large_image` cards (already declared in metadata).
