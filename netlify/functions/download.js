import { neon } from '@neondatabase/serverless';

export default async (req) => {
  try {
    const url = new URL(req.url);
    let slug = url.searchParams.get('slug') || url.pathname.split('/').pop();
    slug = slug.replace('/', '').trim();

    if (!slug) return new Response('No slug', { status: 400 });

    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT * FROM files WHERE slug = ${slug} LIMIT 1`;

    if (!rows[0]) {
      return new Response(`<h1>File not found for ${slug}</h1>`, { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    const file = rows[0];
    const buffer = Buffer.from(file.file_data, 'base64');

    return new Response(buffer, {
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.original_name}"`
      }
    });
  } catch (e) {
    return new Response('Download error: ' + e.message, { status: 500 });
  }
};
