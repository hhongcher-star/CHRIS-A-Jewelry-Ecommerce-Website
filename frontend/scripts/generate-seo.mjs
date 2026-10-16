import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const siteUrl = String(process.env.VITE_SITE_URL || 'https://mediumvioletred-stingray-627422.hostingersite.com').replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(siteUrl)) throw new Error('VITE_SITE_URL must be an HTTPS origin without a path');

const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const pages = [
  ['/', 'weekly', '1.0'],
  ['/shop', 'daily', '0.9'],
  ['/about', 'monthly', '0.7'],
  ['/reviews', 'weekly', '0.7']
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([pathname, frequency, priority]) => `  <url><loc>${siteUrl}${pathname}</loc><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`).join('\n')}
</urlset>
`;
const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /cart
Disallow: /receipt

Sitemap: ${siteUrl}/sitemap.xml
`;

await Promise.all([
  writeFile(path.join(publicDirectory, 'sitemap.xml'), sitemap),
  writeFile(path.join(publicDirectory, 'robots.txt'), robots)
]);
