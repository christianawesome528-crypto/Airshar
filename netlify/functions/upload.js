import { neon } from '@neondatabase/serverless';
import { getStore } from '@netlify/blobs';
import { nanoid } from 'nanoid';

export default async (req) => {
  try {
    if (!process.env.DATABASE_URL) {
      return Response.json({ error: 'DATABASE_URL is missing in Netlify env vars' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return Response.json({ error: 'No file' }, { status: 400 });

    const slug = nanoid(8);
    const buffer = Buffer.from(await file.arrayBuffer());

    const sql = neon(process.env.DATABASE_URL);

    // Save file
    const store = getStore('airshare-files');
    await store.set(slug, buffer, {
      metadata: { originalName: file.name, mimeType: file.type }
    });

    // Save to Neon
    await sql`INSERT INTO files (original_name, storage_path, storage_key, file_size, mime_type) VALUES (${file.name}, ${'blob:'+slug}, ${slug}, ${file.size}, ${file.type})`;
    const fileRow = await sql`SELECT id FROM files WHERE storage_key = ${slug} LIMIT 1`;
    await sql`INSERT INTO share_links (file_id, slug, is_active) VALUES (${fileRow[0].id}, ${slug}, true)`;

    const siteUrl = process.env.URL || 'https://airshar-file.netlify.app';
    return Response.json({ url: `${siteUrl}/s/${slug}`, slug });

  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message + ' | ' + e.stack?.slice(0,300) }, { status: 500 });
  }
};
