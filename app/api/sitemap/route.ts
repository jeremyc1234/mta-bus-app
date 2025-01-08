import { NextRequest, NextResponse } from 'next/server';

const baseUrl = 'https://myMTAbus.com'; // Replace with your actual domain

// Utility function to escape special XML characters
function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(req: NextRequest) {
  const { BUS_STOP_LOCATIONS } = await import('../../data/busstops');

  const staticPaths = [
    '/',
    '/schedules',
    '/about',
    '/feedback',
  ];

  const allPaths = [...staticPaths];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${allPaths
        .map((path) => `
          <url>
            <loc>${escapeXml(baseUrl + path)}</loc>
            <lastmod>${new Date().toISOString()}</lastmod>
            <priority>0.8</priority>
          </url>
        `)
        .join('')}
    </urlset>
  `;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
