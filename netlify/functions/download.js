import { neon } from '@neondatabase/serverless';

export default async (req) => {
  try {
    const url = new URL(req.url);

    // Get slug from?slug= OR from /s/SLUG path
    let slug = url.searchParams.get('slug');
    if (!slug) {
      // fallback: try to get from path like /s/Ab12Cd34
      const parts = url.pathname.split('/');
      slug = parts[parts.length - 1];
      if (slug === 'download') slug = url.searchParams.get('splat') || '';
    }
    // Clean slug
    slug = slug?.replace('/', '').trim();

    if (!slug || slug.length < 3) {
      return new Response(`<h1>No link provided</h1><p>URL: ${req.url}</p>`, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT * FROM files WHERE slug = ${slug} LIMIT 1`;

    if (!rows[0]) {
      return new Response(`
        <html><body style="font-family:sans-serif;text-align:center;padding:50px">
          <h1>Link not found: ${slug}</h1>
          <p>This file may have been deleted or slug is wrong</p>
          <a href="/">Go back to Airshare</a>
        </body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    const file = rows[0];
    const buffer = Buffer.from(file.file_data, 'base64');

    return new Response(buffer, {
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.original_name}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (e) {
    console.error('DOWNLOAD ERROR', e);
    return new Response(`
      <html><body>
        <h1>Download error</h1>
        <p>${e.message}</p>
      </body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
};
