// Helper function to generate standardized, clean, SEO-friendly URL slugs matching App.jsx and Sitemap
function generateSlug(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .trim()
    .normalize("NFD")                    // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "")    // Strip diacritic mark overlays
    .replace(/[–—]/g, "-")              // Convert En-dash & Em-dash to standard hyphens
    .replace(/[^a-z0-9\s-]/g, "")       // Keep only alphanumeric characters, spaces, and hyphens
    .replace(/\s+/g, "-")               // Replace spaces with single hyphens
    .replace(/-+/g, "-")                // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "");           // Strip leading and trailing hyphens
}

// Helper function to sanitize text for safe HTML attribute and tag insertion
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function handler(req, res) {
  const { slug, type } = req.query;
  const rawSlug = slug || "";
  const decodedName = decodeURIComponent(rawSlug).replace(/-/g, " ");

  // 1. Fixed Base URL setup using environment variables to mitigate Host Header Injection
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.myjournalview.com"
  ).replace(/\/$/, "");

  const routeType = type || "place";
  
  // Clean the slug using the uniform slugification utility
  const cleanSlug = generateSlug(decodedName) || rawSlug;
  const requestUrl = `${baseUrl}/${routeType}/${cleanSlug}`;

  // 2. Set Baseline SEO Defaults
  let title = decodedName
    ? `${decodedName} | My Journal`
    : "My Journal | Nature & Adventure Travel";
  let description = decodedName
    ? `Explore ${decodedName} and other remote Sri Lankan trails.`
    : "Discover hidden waterfalls, scenic hikes, and immersive travel stories across Sri Lanka.";
  let imageUrl = `${baseUrl}/my-journal-logo.png`;
  let isNotFound = false;

  // 3. Fetch Location Data from Supabase
  try {
    const SUPABASE_URL =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY =
      process.env.SUPABASE_KEY ||
      process.env.VITE_SUPABASE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (SUPABASE_URL && SUPABASE_KEY && decodedName) {
      // Query database using case-insensitive lookup
      const queryUrl = `${SUPABASE_URL}/rest/v1/travel_bucket_list?place_name=ilike.${encodeURIComponent(
        decodedName
      )}&select=place_name,cover_photo_url,ai_article&limit=1`;

      const response = await fetch(queryUrl, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const rows = await response.json();

        if (rows && rows.length > 0) {
          const place = rows[0];

          title =
            routeType === "gallery"
              ? `${place.place_name} Gallery | My Journal`
              : `${place.place_name} | My Journal`;

          if (place.ai_article?.story) {
            description =
              place.ai_article.story.substring(0, 155).trim() + "...";
          }

          if (place.cover_photo_url) {
            imageUrl = place.cover_photo_url;
            if (imageUrl.includes("googleusercontent.com")) {
              imageUrl = `${imageUrl.split("=")[0].split("?")[0]}=w1200-h630-c`;
            }
          }
        } else {
          // Record not found in database: Set up 404 fallback metadata for crawlers
          isNotFound = true;
          title = "404 - Page Not Found | My Journal";
          description =
            "The requested adventure or gallery route could not be found on My Journal.";
        }
      }
    }
  } catch (err) {
    console.error("API Metadata Supabase Fetch Error:", err);
  }

  // 4. Fetch index.html & Inject Dynamic Metadata Block
  try {
    const indexRes = await fetch(`${baseUrl}/index.html`);
    let html = await indexRes.text();

    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeImageUrl = escapeHtml(imageUrl);
    const safeRequestUrl = escapeHtml(requestUrl);

    // Dynamic Robots Meta Tag (Enforce noindex if record is missing)
    const robotsTag = isNotFound
      ? `<meta name="robots" content="noindex, follow" />`
      : `<meta name="robots" content="index, follow, max-image-preview:large" />`;

    // Build complete Open Graph, Twitter, and Canonical meta tags block
    const metaBlock = `
      <!-- Dynamic SEO & Social Sharing Tags -->
      <title>${safeTitle}</title>
      <meta name="description" content="${safeDescription}" />
      ${robotsTag}
      <link rel="canonical" href="${safeRequestUrl}" />

      <!-- Open Graph / Facebook / WhatsApp -->
      <meta property="og:type" content="article" />
      <meta property="og:url" content="${safeRequestUrl}" />
      <meta property="og:title" content="${safeTitle}" />
      <meta property="og:description" content="${safeDescription}" />
      <meta property="og:image" content="${safeImageUrl}" />

      <!-- Twitter / X -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="${safeRequestUrl}" />
      <meta name="twitter:title" content="${safeTitle}" />
      <meta name="twitter:description" content="${safeDescription}" />
      <meta name="twitter:image" content="${safeImageUrl}" />
    `;

    // Strip legacy meta tags from index.html template to prevent duplicate injection
    html = html
      .replace(/<title>[\s\S]*?<\/title>/gi, "")
      .replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, "")
      .replace(/<meta\s+name=["']robots["'][\s\S]*?>/gi, "")
      .replace(/<meta\s+property=["']og:[\s\S]*?>/gi, "")
      .replace(/<meta\s+name=["']twitter:[\s\S]*?>/gi, "")
      .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, "");

    // Inject fresh metadata block before closing </head>
    html = html.replace("</head>", `${metaBlock}\n</head>`);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );
    
    // Return 404 status header if database record doesn't exist, otherwise 200
    return res.status(isNotFound ? 404 : 200).send(html);
  } catch (error) {
    console.error("HTML Injection Error:", error);
    res.setHeader("Content-Type", "text/plain");
    return res.status(500).send("Server Error fetching index.html");
  }
}