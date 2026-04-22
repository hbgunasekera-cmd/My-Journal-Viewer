const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (Use environment variables for security)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // 1. Fetch your destinations from Supabase
    const { data: destinations, error } = await supabase
      .from('travel_bucket_list')
      .select('place_name, updated_at');

    if (error) throw error;

    // 2. Start building the XML string
    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static Home Page
    xml += `
      <url>
        <loc>https://my-journal-viewer.vercel.app/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>`;

    // 3. Dynamically add each destination from your database
    destinations.forEach((dest) => {
      const slug = dest.place_name.toLowerCase().replace(/ /g, '-');
      xml += `
      <url>
        <loc>https://my-journal-viewer.vercel.app/?location=${slug}</loc>
        <lastmod>${new Date(dest.updated_at).toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`;
    });

    xml += `</urlset>`;

    // 4. Set headers so the browser/Google sees it as XML
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache for 24 hours
    
    return res.status(200).send(xml);
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
