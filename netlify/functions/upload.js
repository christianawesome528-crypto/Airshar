import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';

export default async (req) => {
  try {
    if (!process.env.DATABASE_URL) {
      return Response.json({ error: 'DATABASE_URL not set in Netlify env vars' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return Response.json({ error: 'No file' }, { status: 400 });

    // Limit 4MB for free version
    if (file.size > 4 * 1024) {
      return Response.json({ error: 'File too big, use file under 4MB' }, { status: 400 });
    }

    const slug = nanoid(8);
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    const sql = neon(process.env.DATABASE_URL);

    await sql`INSERT INTO files (slug, original_name, file_data, mime_type, file_size) VALUES (${slug}, ${file.name}, ${base64}, ${file.type}, ${file.size})`;

    const siteUrl = process.env.URL || 'https://airshar-file.netlify.app';
    return Response.json({ url: `${siteUrl}/s/${slug}`, slug });

  } catch (e) {
    console.error('UPLOAD ERROR:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
