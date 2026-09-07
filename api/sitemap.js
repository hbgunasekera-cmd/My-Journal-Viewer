import { createClient } from "@supabase/supabase-js";

// Helper to generate standardized, clean, SEO-friendly URL slugs matching App.jsx
function generateSlug(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Helper to safely escape specific XML characters in slugs to prevent broken sitemaps
function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export default async function handler(req, res) {
  // 1. Fixed Base URL setup using environment variables to mitigate Host Header Injection
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.myjournalview.com"
  ).replace(/\/$/, "");

  // 2. Safely load Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.setHeader("Content-Type", "text/plain");
    return res
      .status(500)
      .send("Error: Missing Supabase environment variables in Vercel.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Paginated query execution to bypass Supabase PostgREST 1,000-row default response cap
    let places = [];
    let page = 0;
    const pageSize = 1000;
    let fetchMore = true;

    while (fetchMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("travel_bucket_list")
        .select("place_name, album_photos, created_at")
        .eq("status", "done")
        .range(from, to);

      if (error) throw error;

      if (data && data.length > 0) {
        places = places.concat(data);
        if (data.length < pageSize) {
          fetchMore = false;
        } else {
          page++;
        }
      } else {
        fetchMore = false;
      }
    }

    const todayIso = new Date().toISOString().split("T")[0];

    // 4. Construct the baseline XML Sitemap structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/route-planner</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/suggest-spot</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // 5. Append dynamic routes based on database records
    if (places.length > 0) {
      places.forEach((place) => {
        if (place.place_name) {
          // Standardize slug format using generateSlug and escape for XML
          const cleanSlug = escapeXml(generateSlug(place.place_name));

          // Use created_at or fallback to today
          const lastMod = place.created_at
            ? new Date(place.created_at).toISOString().split("T")[0]
            : todayIso;

          // Place Route
          xml += `
  <url>
    <loc>${baseUrl}/place/${cleanSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;

          // Gallery Route
          if (place.album_photos && place.album_photos.length > 0) {
            xml += `
  <url>
    <loc>${baseUrl}/gallery/${cleanSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
          }
        }
      });
    }

    // Close the XML tag
    xml += `\n</urlset>`;

    // 6. Return standard XML response with cache control
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "s-maxage=7200, stale-while-revalidate=86400"
    );
    return res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap Generation Error:", err);
    res.setHeader("Content-Type", "text/plain");
    return res.status(500).send(`Database Error: ${err.message}`);
  }
}