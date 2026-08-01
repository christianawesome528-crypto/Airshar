import { neon } from '@neondatabase/serverless';
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const slug = new URL(req.url).searchParams.get('slug');
  const sql = neon(process.env.DATABASE_URL);

  const row = await sql`SELECT s.id, f.original_name, f.mime_type FROM share_links s JOIN files f ON f.id = s.file_id WHERE s.slug = ${slug} LIMIT 1`;
  if (!row[0]) return new Response('Link not found', { status: 404 });

  const store = getStore('airshare-files');
  const file = await store.getWithMetadata(slug, { type: 'arrayBuffer' });

  await sql`UPDATE share_links SET download_count = download_count + 1 WHERE slug = ${slug}`;

  return new Response(file.data, {
    headers: {
      'Content-Type': file.metadata.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.metadata.originalName}"`
    }
  });
};
