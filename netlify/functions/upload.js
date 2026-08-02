import { getStore } from '@netlify/blobs';
import { nanoid } from 'nanoid';
import { neon } from '@neondatabase/serverless';

export default async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return Response.json({ error: 'No file sent' }, { status: 400 });

    const slug = nanoid(8); // this is your link code: e.g X7y9Kp2q
    const buffer = await file.arrayBuffer();

    // SAVE FILE - This is what makes the link work
    const store = getStore({
      name: 'airshare-files',
      consistency: 'strong'
    });

    await store.set(slug, buffer, {
      metadata: {
        name: file.name,
        type: file.type
      }
    });

    // TRY to save to Neon, but don't crash if it fails
    try {
      if (process.env.DATABASE_URL) {
        const sql = neon(process.env.DATABASE_URL);
        await sql`INSERT INTO files (original_name, storage_path, storage_key, file_size, mime_type) VALUES (${file.name}, ${'blob:'+slug}, ${slug}, ${file.size}, ${file.type}) ON CONFLICT (storage_key) DO NOTHING`;
        const fileRow = await sql`SELECT id FROM files WHERE storage_key = ${slug} LIMIT 1`;
        if (fileRow[0]) {
          await sql`INSERT INTO share_links (file_id, slug, is_active) VALUES (${fileRow[0].id}, ${slug}, true) ON CONFLICT (slug) DO NOTHING`;
        }
      }
    } catch (dbErr) {
      console.log('Neon error but continuing:', dbErr.message);
    }

    // THIS IS YOUR REAL LINK
    const origin = new URL(req.url).origin;
    const siteUrl = process.env.URL || origin;
    const finalLink = `${siteUrl}/s/${slug}`;

    return Response.json({
      url: finalLink,
      slug: slug,
      success: true
    });

  } catch (e) {
    console.error('UPLOAD CRASH:', e);
    return Response.json({ error: 'Upload failed: ' + e.message }, { status: 500 });
  }
};
