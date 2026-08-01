import { neon } from '@neondatabase/serverless';
import { getStore } from '@netlify/blobs';
import { nanoid } from 'nanoid';

export default async (req) => {
  const formData = await req.formData();
  const file = formData.get('file');
  const slug = nanoid(8);
  const buffer = Buffer.from(await file.arrayBuffer());
  const sql = neon(process.env.DATABASE_URL);

  const store = getStore('airshare-files');
  await store.set(slug, buffer, {
    metadata: { originalName: file.name, mimeType: file.type }
  });

  await sql`INSERT INTO files (original_name, storage_path, storage_key, file_size, mime_type) VALUES (${file.name}, ${'blob:'+slug}, ${slug}, ${file.size}, ${file.type})`;
  const fileRow = await sql`SELECT id FROM files WHERE storage_key = ${slug} LIMIT 1`;
  await sql`INSERT INTO share_links (file_id, slug, is_active) VALUES (${fileRow[0].id}, ${slug}, true)`;

  const siteUrl = process.env.URL || new URL(req.url).origin;
  return Response.json({ url: `${siteUrl}/s/${slug}` });
};
