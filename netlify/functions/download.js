import { getStore } from '@netlify/blobs';

export default async (req) => {
  const slug = new URL(req.url).searchParams.get('slug');
  if (!slug) return new Response('No link', { status: 400 });

  try {
    const store = getStore({
      name: 'airshare-files',
      consistency: 'strong'
    });

    const result = await store.getWithMetadata(slug, { type: 'arrayBuffer' });

    if (!result ||!result.data) {
      return new Response(`<h1>File not found</h1><p>Slug: ${slug}</p>`, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response(result.data, {
      headers: {
        'Content-Type': result.metadata?.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${result.metadata?.name || 'file'}"`
      }
    });
  } catch (e) {
    return new Response('Download error: ' + e.message, { status: 500 });
  }
};
