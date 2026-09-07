// =======================================================================
// 1. REACT CORE & DOM HOOKS
// =======================================================================
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
  lazy
} from 'react';
import { createRoot } from 'react-dom/client';

// =======================================================================
// 2. THIRD-PARTY LIBRARIES & UTILITIES
// =======================================================================
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';

// =======================================================================
// 3. DRAG AND DROP ENGINE
// =======================================================================
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// =======================================================================
// 4. LEAFLET MAP ENGINE & STYLES
// =======================================================================
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// =======================================================================
// 5. LUCIDE ICONS (CONSOLIDATED & ALPHABETIZED)
// =======================================================================
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  Globe,
  GripVertical,
  Heart,
  Image as ImageIcon,
  Info,
  Lock,
  Mail,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Minus,
  Moon,
  Navigation,
  Pause,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sun,
  UserCheck,
  Video,
  Wind,
  X,
  Zap
} from 'lucide-react';

// =======================================================================
// 6. LOCAL UTILITIES, COMPONENTS & LOCALIZATION CONFIG
// =======================================================================
import './i18n.js';

// =======================================================================
// 7. CONFIGURATION & INITIALIZATION
// =======================================================================
const CONFIG = {
  SUPABASE: {
    URL: import.meta.env.VITE_SUPABASE_URL,
    KEY: import.meta.env.VITE_SUPABASE_KEY,
  },
  API_KEYS: {
    WEATHER: import.meta.env.VITE_WEATHER_KEY,
    ORS: import.meta.env.VITE_ORS_KEY,
  }
};

const { URL: SUPABASE_URL, KEY: SUPABASE_KEY } = CONFIG.SUPABASE;
const { WEATHER: WEATHER_KEY, ORS: ORS_KEY } = CONFIG.API_KEYS;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "Configuration missing! Check VITE_SUPABASE_URL and VITE_SUPABASE_KEY environment variables."
  );
}

export const supabaseClient = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Global Leaflet attachment for routing compatibility
if (typeof window !== 'undefined') {
  window.L = L;
}

// Leaflet Default Marker Asset Fix
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// =======================================================================
// 8. CONSTANTS & CATEGORY DESCRIPTIONS
// =======================================================================
export const DEFAULT_LOCATION = { lat: 7.0777, lng: 79.8924 };

export const VALID_CATEGORIES = [
  "Waterfall", "Mountain", "Trail", "Viewpoint", "Beach", "Park",
  "Plateaus", "Reserved Forest", "Monastery", "Archaeology", "Reservoir",
  "Pool", "Stream", "Location"
];

export const CATEGORY_STYLES = {
  // Water & Coastal 
  Waterfall: {
    class: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/30",
    hex: "#0ea5e9"
  },
  Beach: {
    class: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-700/40",
    hex: "#2563eb"
  },
  Reservoir: {
    class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30",
    hex: "#3b82f6"
  },
  Pool: {
    class: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/30",
    hex: "#6366f1"
  },
  Stream: {
    class: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/30",
    hex: "#06b6d4"
  },

  // Earth, Mountains & Forests
  Mountain: {
    class: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/30",
    hex: "#a855f7" // Purple
  },
  Trail: {
    class: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/40",
    hex: "#d97706"
  },
  Park: {
    class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/30",
    hex: "#22c55e"
  },
  Plateaus: {
    class: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700/30",
    hex: "#84cc16"
  },
  "Reserved Forest": {
    class: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/30",
    hex: "#10b981" // Original required color
  },

  // Culture, Heritage & Sightseeing
  Monastery: {
    class: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/30",
    hex: "#f97316" // Original required color
  },
  Archaeology: {
    class: "bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-900/30 dark:text-stone-300 dark:border-stone-700/30",
    hex: "#78716c" // Stone
  },
  Viewpoint: {
    class: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-700/30",
    hex: "#d946ef"
  },
  Location: {
    class: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-300 dark:border-zinc-700/30",
    hex: "#71717a"
  },

  // Amenities & Attractions
  attraction: {
    class: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/30",
    hex: "#eab308" // Yellow/Gold
  },
  gas_station: {
    class: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/30",
    hex: "#ef4444" // Red
  },
  restaurant: {
    class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30",
    hex: "#3b82f6"
  },
  lodging: {
    class: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-700/30",
    hex: "#d946ef"
  },

  // Fallback
  Default: {
    class: "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-700/30",
    hex: "#525252"
  }
};


export const getCategoryStyleObject = (category) => {
  if (!category) return CATEGORY_STYLES.Default;

  if (CATEGORY_STYLES[category]) return CATEGORY_STYLES[category];

  const normalizedCategory = category.trim().toLowerCase();
  const matchedKey = Object.keys(CATEGORY_STYLES).find(
    (key) => key.toLowerCase() === normalizedCategory
  );

  return CATEGORY_STYLES[matchedKey] || CATEGORY_STYLES.Default;
};

export const getCategoryColorClass = (category) => {
  return getCategoryStyleObject(category).class;
};

export const getCategoryHex = (category) => {
  return getCategoryStyleObject(category).hex;
};

export const CATEGORY_DESCRIPTIONS = {
  "All": "A comprehensive expedition directory detailing remote geographical locations across Sri Lanka. Explore mapped coordinates, terrain conditions, and photographic field notes spanning waterfalls, highland mountain trails, historical monasteries, and hidden natural streams.",
  "Waterfall": "Documenting Sri Lanka's spectacular hydrological systems and hidden cascade clusters. This index details trail routes, baseline water volumes, seasonal patterns, and safe approaches for photographing remote waterfalls embedded within the island's central tea valley basins and mountain ranges.",
  "Mountain": "High-altitude alpine formations, mountain peaks, and challenging ridges across Sri Lanka's central highlands. Access field telemetry regarding elevation statistics, cloud forest borders, geographic exposure profiles, and wild camping layout vectors.",
  "Trail": "Backcountry trekking pathways, wilderness hiking loops, and primitive footpaths. Tracks technical navigation indicators, terrain difficulty scales, path visibility parameters, and essential equipment prep benchmarks for foot expeditions.",
  "Viewpoint": "Panoramic geographical lookouts, sheer cliff drop-offs, and high-altitude observation horizons across mountain passes. Includes solar tracking visibility timelines and optimal ambient conditions for wide-angle landscape photography.",
  "Beach": "Remote coastal formations, pristine sandy shorelines, and maritime boundaries across Sri Lanka's marine belts. Documenting reef layouts, localized tidal tendencies, and uncrowded coastal horizons suited for adventure tracking.",
  "Park": "National parks, strictly handled wildlife sanctuaries, and ecological reserves. Information focuses on protected habitat limits, migration corridors, Department of Wildlife Conservation (DWC) access rules, and field safety protocols.",
  "Plateaus": "High-altitude tablelands and unique highland plains ecosystems characterized by distinct dwarf forest flora and open montane grasslands. Field metrics map shifting cloud cover, high wind exposures, and overnight trail conditions.",
  "Reserved Forest": "Highly protected tropical rainforests, pristine endemic biomes, and protected buffer woodland zones. These technical logs emphasize strict wilderness conservation ethics, deep jungle path navigation, and biological diversity indices.",
  "Monastery": "Ancient rock-cut forest hermitages and meditative sanctuary complexes tucked away inside isolated canopies. These field reports outline historic architectural structures, step routes, cave inscriptions, and respect-driven exploration rules.",
  "Archaeology": "Preserved historic ruins, ancient structural components, stupas, and royal gardens throughout Sri Lanka's historic capitals. Mapping spatial networks between historic stone masonry, ancient inscription coordinates, and guardstones.",
  "Reservoir": "Massive historical man-made lake systems and catchments engineered throughout the island's river basins. Tracks surrounding forest buffers, protective embankment pathways, and visual vantage horizons for photography.",
  "Pool": "Pristine natural rock pools, secluded stream basins, and wild swimming water bodies found along mountain river beds. Emphasizes depth assessments, water flow safety vectors, and seasonal water volume updates.",
  "Stream": "Clear natural waterways, cold-water channels, and minor river tributaries flowing through dense reserves. Ideal reference points for identifying clean mountain water collection nodes, micro-climate variations, and aquatic biodiversity clusters.",
  "Location": "Geographic landmarks, notable rural waypoints, and specialized exploratory points of interest across Sri Lanka. Serves as a localized spatial reference framework connecting different natural terrains and tracking coordinates."
};

// =======================================================================
// 9. UTILITY HELPERS & HOOKS
// =======================================================================

const recentLogsCache = new Map();

/**
 * Custom React hook to debounce state updates
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}


/**
 * Left-click drag scrolling for application scroll containers.
 *
 * Native wheel / touchpad / touchscreen scrolling is intentionally
 * NOT intercepted. This hook only adds the optional left-mouse-drag
 * scrolling behavior.
 *
 * Interactive descendants such as buttons, links, inputs, textareas,
 * selects, and drag handles are excluded so normal interaction remains
 * intact.
 */

export function useDragScroll() {
  // Use state instead of useRef so we trigger a re-render/effect when the element mounts
  const [element, setElement] = useState(null);
  const dragState = useRef({
    active: false,
    dragging: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });

  useEffect(() => {
    // If the element isn't in the DOM yet, do nothing. 
    // It will run again automatically once the element mounts.
    if (!element) return;

    const isInteractiveTarget = (target) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          'button, a, input, textarea, select, option, [role="button"], [role="link"], [data-no-drag-scroll], [draggable="true"]'
        )
      );
    };

    const handlePointerDown = (e) => {
      /* Only physical left mouse button. */
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (isInteractiveTarget(e.target)) return;

      dragState.current = {
        active: true,
        dragging: false,
        startX: e.clientX,
        startY: e.clientY,
        startScrollLeft: element.scrollLeft,
        startScrollTop: element.scrollTop,
      };
    };

    const handlePointerMove = (e) => {
      const state = dragState.current;
      if (!state.active) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (!state.dragging) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

        state.dragging = true;
        element.classList.add('drag-scroll-active');
        element.setPointerCapture?.(e.pointerId);
      }

      element.scrollLeft = state.startScrollLeft - dx;
      element.scrollTop = state.startScrollTop - dy;

      e.preventDefault();
    };

    const endDrag = (e) => {
      const state = dragState.current;
      if (element?.hasPointerCapture?.(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
      }

      element?.classList.remove('drag-scroll-active');

      dragState.current = {
        active: false,
        dragging: false,
        startX: 0,
        startY: 0,
        startScrollLeft: 0,
        startScrollTop: 0,
      };
    };

    // Attach listeners dynamically when the element becomes available
    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', endDrag);
    element.addEventListener('pointercancel', endDrag);
    element.addEventListener('lostpointercapture', endDrag);

    // Clean up event listeners when the element unmounts
    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', endDrag);
      element.removeEventListener('pointercancel', endDrag);
      element.removeEventListener('lostpointercapture', endDrag);
    };
  }, [element]); // Dependency array tracks the DOM element

  // Return the state setter to act as our callback ref
  return setElement;
}

// =======================================================================
// 10. GEO & MATH HELPERS
// =======================================================================

/**
 * Calculates Haversine distance in kilometers between two lat/lon coordinates
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// =======================================================================
// 11. STRING & URL FORMATTING HELPERS
// =======================================================================

/**
 * Sanitizes location names by stripping non-standard special characters
 */
export const auditLocationName = (name) => {
  if (!name) return "Unnamed Location";
  return String(name).replace(/[^a-zA-Z0-9\s\-'\.]/g, '').trim();
};

/**
 * Generates URL-friendly slugs with diacritic stripping and normalization
 */
export const generateSlug = (name) => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .normalize('NFD')                   // Strip accents/diacritics for backend parity
    .replace(/[\u0300-\u036f]/g, '')    // Remove diacritic marks
    .replace(/[–—]/g, '-')              // Convert En-dash & Em-dash to standard hyphens
    .replace(/[^a-z0-9\s-]/g, '')       // Keep only alphanumeric characters, spaces, and hyphens
    .replace(/\s+/g, '-')               // Replace spaces with single hyphens
    .replace(/-+/g, '-')                // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');           // Strip leading and trailing hyphens
};

/**
 * Optimizes image URLs for Google User Content and Supabase Storage
 */
export const getOptimizedUrl = (url, width = 1000, quality = 70) => {
  if (!url) return '';
  if (url.includes('googleusercontent.com')) {
    const baseUrl = url.split('=')[0].split('?')[0];
    return `${baseUrl}=w${width}-rw`;
  }
  if (url.includes('supabase.co')) {
    return `${url}?width=${width}&quality=${quality}&format=webp`;
  }
  return url;
};

/**
 * Helper to truncate text cleanly on full word boundaries to prevent broken SERP snippets
 */
export const truncateText = (text, maxLength = 155) => {
  if (!text || text.length <= maxLength) return text || '';
  const trimmed = text.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > 0 ? trimmed.substring(0, lastSpace) : trimmed) + '...';
};

// =======================================================================
// 12. CONSOLIDATED SEO & SCHEMA MANAGERS
// =======================================================================

/**
 * Injects or updates Schema.org JSON-LD structured data with XSS prevention
 */
export const injectJSONLDSchema = (place, canonicalUrl, isGallery = false) => {
  let schemaScript = document.getElementById('json-ld-schema');

  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'json-ld-schema';
    schemaScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(schemaScript);
  }

  const BASE_URL = "https://www.myjournalview.com";

  // Default website schema for home/fallback contexts
  if (!place || typeof place !== 'object' || !place.place_name) {
    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "My Journal",
      "url": canonicalUrl || BASE_URL,
      "description": "Explore remote Sri Lankan trails, hidden waterfalls, and backcountry coordinates.",
      "abstract": "විදිමු , රැකගමු අනාගතය වෙනුවෙන්. Live with care, preserve with love — for the future yet to come."
    };
    schemaScript.textContent = JSON.stringify(defaultSchema).replace(/</g, '\\u003c');
    return;
  }

  // Handle structured JSONB objects and legacy string entries
  const article = typeof place.ai_article === 'object' && place.ai_article !== null
    ? place.ai_article
    : {};
  const legacyStory = typeof place.ai_article === 'string' ? place.ai_article : null;
  const metrics = article.metrics || {};
  const about = article.about || {};

  const description =
    about.overview ||
    article.story ||
    legacyStory ||
    place.description ||
    `Explore ${place.place_name} in ${place.locality || 'Sri Lanka'}.`;

  let schemaData;

  if (isGallery) {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "name": `${place.place_name || 'Gallery'} Photos`,
      "description": description,
      "url": canonicalUrl,
      "primaryImageOfPage": place.cover_photo_url || `${BASE_URL}/my-journal-logo.png`
    };
  } else {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      "name": place.place_name,
      "description": description,
      "url": canonicalUrl,
      "image": place.cover_photo_url || `${BASE_URL}/my-journal-logo.png`,
      "location": {
        "@type": "Place",
        "name": place.locality || "Sri Lanka",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "LK"
        },
        "geo": (place.latitude && place.longitude) ? {
          "@type": "GeoCoordinates",
          "latitude": place.latitude,
          "longitude": place.longitude
        } : undefined,
        "elevation": metrics.elevation_m ? `${metrics.elevation_m} m` : undefined
      },
      "additionalProperty": [
        metrics.difficulty_level && {
          "@type": "PropertyValue",
          "name": "Trail Difficulty",
          "value": metrics.difficulty_level
        },
        metrics.trek_distance_km && {
          "@type": "PropertyValue",
          "name": "Trek Distance",
          "value": `${metrics.trek_distance_km} km`
        },
        metrics.estimated_time_mins && {
          "@type": "PropertyValue",
          "name": "Estimated Time",
          "value": `${metrics.estimated_time_mins} mins`
        }
      ].filter(Boolean)
    };
  }

  // Prevent XSS script tag escape breakout by escaping '<'
  schemaScript.textContent = JSON.stringify(schemaData).replace(/</g, '\\u003c');
};

/**
 * Consolidated SEO Manager for 'My Journal'
 * Updates dynamic meta tags, OpenGraph tags, canonical URLs, and structured data
 */
export const updateSEO = (place = null, options = {}) => {
  const {
    isGallery = false,
    category = 'All',
    searchTerm = '',
    categoryDescriptions = {}
  } = typeof options === 'boolean' ? { isGallery: options } : options;

  const BASE_URL = (
    (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL)) ||
    "https://www.myjournalview.com"
  ).replace(/\/$/, "");

  const DEFAULT_LOGO = `${BASE_URL}/my-journal-logo.png`;

  let title = "Sri Lanka Backcountry Travel Guide & Maps | My Journal";
  let ogTitle = "Sri Lanka Backcountry Travel Guide: Waterfalls, Hidden Trails & Maps";
  let description = "Explore remote Sri Lankan trails, hidden waterfalls, coordinates, and high-altitude mountain lookouts captured by Drone and iPhone.";
  let canonicalUrl = `${BASE_URL}/`;
  let imageUrl = DEFAULT_LOGO;

  const hasPlace = Boolean(place && typeof place === 'object' && place.place_name);

  if (hasPlace) {
    const placeName = place.place_name.trim();
    const categoryName = place.category || 'Attraction';
    const localityName = place.locality ? `, ${place.locality}` : '';
    const slug = typeof generateSlug === 'function' ? generateSlug(placeName) : encodeURIComponent(placeName.toLowerCase());

    if (isGallery) {
      title = `${placeName} Photos & Aerial Views (${categoryName}), Sri Lanka | My Journal`;
      ogTitle = `Explore ${placeName} (${categoryName}) - Aerial Photos & Field Notes`;
      description = `Browse high-resolution photo gallery and drone perspectives of ${placeName}${localityName}, Sri Lanka. Field notes and route details included.`;
      canonicalUrl = `${BASE_URL}/gallery/${slug}`;
    } else {
      title = `${placeName} ${categoryName} Guide${localityName} Sri Lanka | My Journal`;
      ogTitle = `${placeName} ${categoryName} Guide: Mapped Coordinates & Trail Access`;

      const rawStory = place.ai_article?.story || place.description;
      if (rawStory) {
        description = truncateText(rawStory, 150);
      } else {
        description = `Complete travel & trail guide for ${placeName} in ${place.locality || 'Sri Lanka'}. Mapped coordinates, elevation telemetry, and visitor access notes.`;
      }
      canonicalUrl = `${BASE_URL}/place/${slug}`;
    }

    if (place.cover_photo_url) {
      imageUrl = place.cover_photo_url;
      if (imageUrl.includes('googleusercontent.com')) {
        imageUrl = `${imageUrl.split('=')[0].split('?')[0]}=w1200-rw`;
      }
    }

  } else if (category && category !== 'All') {
    title = `Best ${category}s in Sri Lanka: Mapped Trails & Field Notes | My Journal`;
    ogTitle = `Explore Top ${category}s in Sri Lanka | Route Maps & Coordinates`;

    const catDesc = categoryDescriptions[category];
    description = catDesc
      ? truncateText(catDesc, 155)
      : `Explore mapped ${category.toLowerCase()} locations across Sri Lanka with exact coordinates, weather tracking, and access details.`;
    canonicalUrl = `${BASE_URL}/?category=${encodeURIComponent(category.toLowerCase())}`;

  } else if (searchTerm) {
    title = `Search Results for "${searchTerm}" | Sri Lanka Travel Logs`;
    ogTitle = `Sri Lanka Travel Logs: Results for "${searchTerm}"`;
    description = `Explore mapped locations, trails, and field notes matching "${searchTerm}" in Sri Lanka on My Journal.`;
  }

  // Enforce SERP snippet safety (truncate title if exceeding 65 chars)
  if (title.length > 65) {
    const brandIndex = title.indexOf(' | My Journal');
    if (brandIndex > 0) {
      const coreTitle = title.substring(0, brandIndex);
      title = `${truncateText(coreTitle, 52)} | My Journal`;
    }
  }

  // Sync document title
  document.title = title;

  // Sync canonical link element
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  // Sync Meta & OpenGraph tags
  const metaTags = {
    'fb:app_id': '966242223397117',
    'robots': 'index, follow, max-image-preview:large',
    'description': description,
    'og:title': ogTitle,
    'og:description': description,
    'og:image': imageUrl,
    'og:url': canonicalUrl,
    'og:type': hasPlace ? 'article' : 'website',
    'og:site_name': 'My Journal',
    'twitter:card': 'summary_large_image',
    'twitter:title': ogTitle,
    'twitter:description': description,
    'twitter:image': imageUrl
  };

  Object.entries(metaTags).forEach(([key, content]) => {
    const isProperty = key.startsWith('og:') || key.startsWith('fb:');
    const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
    let el = document.querySelector(selector);

    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(isProperty ? 'property' : 'name', key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content || '');
  });

  // Inject structured JSON-LD schema with isGallery context flag
  injectJSONLDSchema(place, canonicalUrl, isGallery);
};

// =======================================================================
// 13. TELEMETRY, ANALYTICS & GEOLOCATION
// =======================================================================

/**
 * Initializes Microsoft Clarity analytics tracker
 */
export const initClarity = () => {
  if (typeof window === 'undefined' || document.getElementById('dynamic-clarity')) return;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
    t = l.createElement(r); t.id = 'dynamic-clarity'; t.async = 1; t.src = "https://www.clarity.ms/tag/" + i + "?ref=bwt";
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "wogn225m7r");
};

/**
 * Fetches visitor geo-metadata from external IP fallback providers
 */
export const getInteractionMetadata = async () => {
  let geo = { ip: '0.0.0.0', country: 'Unknown', region: 'Unknown', city: 'Unknown' };

  const providers = [
    {
      url: 'https://ipwho.is/',
      parse: (data) => ({ ip: data.ip, country: data.country, region: data.region, city: data.city })
    },
    {
      url: 'https://ipapi.co/json/',
      parse: (data) => ({ ip: data.ip, country: data.country_name, region: data.region, city: data.city })
    },
    {
      url: 'https://api.db-ip.com/v2/free/self',
      parse: (data) => ({ ip: data.ipAddress, country: data.countryName, region: data.stateProv, city: data.city })
    }
  ];

  const fetchWithTimeout = async (url, timeoutMs = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  for (const provider of providers) {
    try {
      const response = await fetchWithTimeout(provider.url, 3000);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      const parsedData = provider.parse(data);

      if (parsedData.ip && parsedData.ip !== '0.0.0.0') {
        geo = {
          ip: parsedData.ip,
          country: parsedData.country || 'Unknown',
          region: parsedData.region || 'Unknown',
          city: parsedData.city || 'Unknown'
        };
        break;
      }
    } catch (e) {
      console.warn(`Geo provider ${provider.url} failed, trying next...`);
    }
  }

  return geo;
};

/**
 * Logs visitor interactions to Supabase backend tracking function
*/


export const logVisit = async (path = null) => {
  // 1. Localhost exclusion
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '192.168.8.176') return;

  // 2. Owner mode bypass
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'owner') {
    localStorage.setItem('owner_auth_token', 'owner');
  }
  if (localStorage.getItem('owner_auth_token') === 'owner' || !supabaseClient) return;

  const safeDecode = (str) => {
    try { return decodeURIComponent(str); } catch { return str; }
  };

  // 3. Extract QR scan parameters and normalize path
  const utmSource = (urlParams.get('utm_source') || '').toLowerCase();
  const rawPath = path || window.location.pathname;

  let loggingPath = rawPath;
  if (rawPath === '/' || rawPath === '' || rawPath === 'Main Page') {
    loggingPath = 'Main Page';
  } else if (rawPath === 'Video Gallery' || rawPath.startsWith('/videos') || rawPath.startsWith('/video-gallery')) {
    loggingPath = 'Video Gallery';
  } else if (rawPath === 'Add Function' || rawPath === '/add') {
    loggingPath = 'Add Function';
  } else if (rawPath === 'Plan Function' || rawPath === '/plan') {
    loggingPath = 'Plan Function';
  } else if (rawPath.startsWith('/place/')) {
    const slug = rawPath.replace('/place/', '').split('?')[0].replace(/\/$/, '');
    loggingPath = `Place/${safeDecode(slug).toLowerCase().trim().replace(/-/g, ' ')}`;
  } else if (rawPath.startsWith('/gallery/')) {
    const slug = rawPath.replace('/gallery/', '').split('?')[0].replace(/\/$/, '');
    loggingPath = `Gallery/${safeDecode(slug).toLowerCase().trim().replace(/-/g, ' ')}`;
  } else if (rawPath.startsWith('/')) {
    loggingPath = safeDecode(rawPath.split('?')[0]).toLowerCase().replace(/^\/+|\/+$/g, '');
  } else {
    // Retains explicitly passed custom labels (e.g., custom display names)
    loggingPath = rawPath;
  }

  // 4. Rate-limit cache check (10 seconds per path)
  const now = Date.now();
  const lastLoggedTime = recentLogsCache.get(loggingPath);
  if (lastLoggedTime && now - lastLoggedTime < 10000) return;

  recentLogsCache.set(loggingPath, now);
  recentLogsCache.forEach((timestamp, key) => {
    if (now - timestamp > 60000) recentLogsCache.delete(key);
  });

  // 5. Session deduplication
  const sessionKey = `logged_visit_${loggingPath}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, 'true');

  // 6. Invoke Edge Function
  try {
    const { error } = await supabaseClient.functions.invoke('track-visit', {
      body: {
        page_path: loggingPath,
        user_agent: navigator.userAgent || "",
        referrer: document.referrer ? document.referrer.toLowerCase() : "",
        utm_source: utmSource,
        is_webdriver: Boolean(navigator.webdriver)
      }
    });
    if (error) throw error;
  } catch (err) {
    sessionStorage.removeItem(sessionKey);
    recentLogsCache.delete(loggingPath);
    console.error('Logging failed:', err);
  }
};

/**
 * Real-time Geolocation tracker watcher
 */
export const getUserLocation = (setUserCoords) => {
  if (!navigator.geolocation) {
    console.warn("Geolocation is not supported by this browser.");
    setUserCoords(DEFAULT_LOCATION);
    return null;
  }

  return navigator.geolocation.watchPosition(
    (pos) => {
      setUserCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    },
    (err) => {
      console.warn("Geolocation tracking error:", err);
      setUserCoords((prevCoords) => prevCoords || DEFAULT_LOCATION);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
};

// =======================================================================
// 14.EN-ROUTE CORRIDOR FILTERING
// =======================================================================
export const getPlacesAlongRoute = (places, routeCoordinates, maxDistanceKm = 15) => {
  if (!routeCoordinates || routeCoordinates.length === 0 || !places.length) return [];

  // Subsample route coordinates for performance
  const step = Math.max(1, Math.floor(routeCoordinates.length / 80));
  const sampledCoords = routeCoordinates.filter((_, idx) => idx % step === 0);

  return places.filter(place => {
    const pLat = place.latitude ?? place.lat;
    const pLng = place.longitude ?? place.lng;
    if (!pLat || !pLng) return false;

    // Find distance to the closest point along the route
    for (let i = 0; i < sampledCoords.length; i++) {
      const rCoord = sampledCoords[i];
      const dist = calculateDistance(pLat, pLng, rCoord.lat, rCoord.lng);
      if (dist <= maxDistanceKm) return true;
    }
    return false;
  });
};

// =======================================================================
// 15.MEAL & STAY MILESTONE GENERATOR
// =======================================================================
export const calculateMealAndStayMilestones = (routeData) => {
  if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) return null;

  const totalDist = parseFloat(routeData.distance) || 0;
  const totalMinutes = routeData.duration || 0;
  const coords = routeData.coordinates;

  const getPointAtFraction = (fraction) => {
    const idx = Math.min(coords.length - 1, Math.floor(coords.length * fraction));
    return coords[idx];
  };

  return {
    breakfast: {
      title: "Breakfast Stop",
      timeEstimate: "~1.5–2 hrs into drive",
      coord: getPointAtFraction(0.20),
      distanceMark: (totalDist * 0.20).toFixed(1)
    },
    lunch: {
      title: "Lunch Stop",
      timeEstimate: "Midway (~3–4 hrs)",
      coord: getPointAtFraction(0.50),
      distanceMark: (totalDist * 0.50).toFixed(1)
    },
    dinner: {
      title: "Dinner Stop",
      timeEstimate: "Near Destination / Evening",
      coord: getPointAtFraction(0.80),
      distanceMark: (totalDist * 0.80).toFixed(1)
    },
    staying: {
      title: "Overnight Accommodation",
      timeEstimate: "Destination Area",
      coord: coords[coords.length - 1],
      distanceMark: totalDist.toFixed(1)
    }
  };
};

// =======================================================================
// 16. GEMINI AI TRANSLATION SERVICE
// =======================================================================

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_ARTICLE_KEY);

const MODEL_PRIORITY_LIST = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash" // Fallback
];

const generationConfig = {
  maxOutputTokens: 65536, // Gemini 2.5 Flash max limit
  temperature: 0.2,
  responseMimeType: "application/json",
};

const SUPPORTED_LANGUAGES = {
  'ar': 'Arabic', 'de': 'German', 'en': 'English', 'es': 'Spanish',
  'fr': 'French', 'he': 'Hebrew', 'hi': 'Hindi', 'in': 'Indonesian', 'it': 'Italian',
  'ja': 'Japanese', 'kr': 'Korean', 'nl': 'Dutch', 'pl': 'Polish',
  'pt': 'Portuguese', 'ru': 'Russian', 'si': 'Sinhala', 'sr': 'Serbian',
  'sv': 'Swedish', 'th': 'Thai', 'tr': 'Turkish', 'uk': 'Ukrainian', 'zh': 'Chinese'
};

// In-memory cache store
const translationCache = new Map();

// Helper function for exponential backoff delay between model fallbacks
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const translateContentService = async (ai_article, targetLangCode, articleId) => {
  if (!ai_article) return ai_article;

  const baseLang = targetLangCode?.split('-')[0].toLowerCase() || 'en';

  // 1. Instant return for default English content (No AI call required)
  if (baseLang === 'en') {
    return ai_article;
  }

  // BUMPED CACHE KEY VERSION (v3) to bust previous incomplete translations
  const cacheKey = `v3:${baseLang}:${articleId}`;

  // 2. Cache hit check
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  let translatedData = null;
  let success = false;

  try {
    const lookupKey = targetLangCode?.toLowerCase();
    const targetLanguageName = SUPPORTED_LANGUAGES[lookupKey] || SUPPORTED_LANGUAGES[baseLang] || baseLang;

    // TRANSLATION PROMPT — TARGET ONLY THE FOUR ARTICLE PROSE FIELDS
    const prompt = `
You are an expert localization engine.

Translate ONLY these four human-readable prose fields into "${targetLanguageName}":

1. seo_intro
2. why_visit.summary
3. story
4. history

CRITICAL CONSTRAINTS:
1. Keep ALL JSON keys exactly unchanged.
2. Keep ALL numeric values, booleans, arrays, and technical values unchanged.
3. DO NOT translate any other fields.
4. The following exact JSON paths MUST be translated:
   - ["seo_intro"]
   - ["why_visit"]["summary"]
   - ["story"]
   - ["history"]
5. Preserve the exact JSON structure and all existing nodes.
6. Do not add, remove, rename, or reorder fields.
7. Return a complete valid JSON object only.
8. Never return markdown fences or explanatory text.
9. If one of the four fields is missing or empty in the source, leave it unchanged.
10. The translated result MUST contain all four original fields when they exist.

SOURCE JSON:
${JSON.stringify(ai_article)}
`.trim();

    for (let i = 0; i < MODEL_PRIORITY_LIST.length; i++) {
      const modelName = MODEL_PRIORITY_LIST[i];
      let currentResponseText = '';

      try {
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
        const result = await model.generateContent(prompt);
        currentResponseText = result.response.text().trim();

        // Strip markdown fences cleanly
        let cleanJsonText = currentResponseText
          .replace(/^```(?:json)?\s*/gi, '')
          .replace(/\s*```$/gi, '')
          .trim();

        // Attempt JSON parse with auto-repair for truncated tail brackets
        try {
          translatedData = JSON.parse(cleanJsonText);
        } catch (parseErr) {
          if (!cleanJsonText.endsWith('}')) {
            console.warn(`[Translation Engine] JSON truncation detected for ${modelName}. Attempting auto-repair...`);
            cleanJsonText += '}';
            translatedData = JSON.parse(cleanJsonText);
          } else {
            throw parseErr;
          }
        }

        success = true;
        break; // Exit loop on successful translation & parse
      } catch (err) {
        console.warn(`[Translation Engine] ${modelName} failed generation or produced invalid JSON. Output length: ${currentResponseText.length}`);
        if (currentResponseText) {
          console.log(`[Raw Output Preview]:`, currentResponseText.substring(0, 300) + '...[TRUNCATED]');
        }

        // Exponential backoff delay before hitting next fallback model to prevent rate-limit cascading (HTTP 429)
        if (i < MODEL_PRIORITY_LIST.length - 1) {
          const backoffDelay = Math.pow(2, i) * 1000; // 1000ms, 2000ms...
          console.warn(`[Translation Engine] Delaying ${backoffDelay}ms before trying fallback model...`);
          await delay(backoffDelay);
        }
      }
    }

    if (!success || !translatedData) {
      throw new Error("All translation models failed to produce valid JSON.");
    }

    const finalResult = { ...translatedData, language: baseLang };

    // Save to cache
    translationCache.set(cacheKey, finalResult);
    return finalResult;

  } catch (error) {
    console.error("[Translation Engine Error]: Fallback to original content.", error);
    return ai_article; // Default fallback on failure
  }
};

// =======================================================================
// 17. UI COMPONENTS
// =======================================================================

export const WeatherIcon = ({ condition, className = "" }) => {
  const c = (condition || '').toLowerCase();
  let Icon = Cloud;
  let defaultColor = 'text-slate-400';

  if (c.includes('clear') || c.includes('sun')) {
    Icon = Sun;
    defaultColor = 'text-amber-500';
  } else if (c.includes('thunderstorm') || c.includes('lightning')) {
    Icon = CloudLightning;
    defaultColor = 'text-yellow-500';
  } else if (c.includes('rain')) {
    Icon = CloudRain;
    defaultColor = 'text-blue-500';
  } else if (c.includes('drizzle')) {
    Icon = CloudDrizzle;
    defaultColor = 'text-cyan-500';
  } else if (c.includes('snow')) {
    Icon = Snowflake;
    defaultColor = 'text-sky-300';
  } else if (c.includes('mist') || c.includes('haze') || c.includes('fog') || c.includes('smoke')) {
    Icon = CloudFog;
    defaultColor = 'text-slate-300';
  } else if (c.includes('dust') || c.includes('wind')) {
    Icon = Wind;
    defaultColor = 'text-orange-300';
  } else if (c.includes('cloud')) {
    Icon = Cloud;
    defaultColor = 'text-slate-400';
  }

  const hasCustomWidth = /\bw-\d+/.test(className);
  const hasCustomHeight = /\bh-\d+/.test(className);
  const hasCustomColor = /\btext-/.test(className);

  const finalClassName = [
    !hasCustomWidth && 'w-3.5',
    !hasCustomHeight && 'h-3.5',
    !hasCustomColor && defaultColor,
    'shrink-0',
    className
  ].filter(Boolean).join(' ');

  return <Icon className={finalClassName} strokeWidth={2.25} />;
};



export const RestrictionBadge = ({ level }) => {
  const { t } = useTranslation();
  const normalizedLevel = String(level || '').trim().toLowerCase();

  const config = {
    'open': {
      color: 'text-green-500 bg-green-50',
      icon: <CheckCircle2 size={14} />,
      label: t('restriction.public')
    },
    'permit required': {
      color: 'text-orange-600 bg-orange-50',
      icon: <AlertCircle size={14} />,
      label: t('restriction.permit')
    },
    'guide mandatory': {
      color: 'text-blue-600 bg-blue-50',
      icon: <UserCheck size={14} />,
      label: t('restriction.guide')
    },
    'restricted': {
      color: 'text-red-600 bg-red-50',
      icon: <Lock size={14} />,
      label: t('restriction.restricted')
    },
    'high': {
      color: 'text-red-600 bg-red-50',
      icon: <Lock size={14} />,
      label: t('restriction.restricted')
    },
  };

  const { color, icon, label } = config[normalizedLevel] || config['open'];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${color}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
};

export const RouteWeatherBadge = ({ weatherData, placeId, lat, lng }) => {
  // Determine the key based on how the place was saved
  const key = placeId || `${lat?.toFixed(4)},${lng?.toFixed(4)}`;
  const weather = weatherData[key];

  if (!weather) {
    // Optional: Return a loading skeleton or null while data is fetching
    return (
      <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-8 w-32 rounded-lg"></div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 w-max shadow-sm">
      {/* Current Weather */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 font-bold tracking-wider uppercase text-[9px]">
          Now
        </span>
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
          <WeatherIcon condition={weather.current.condition} className="w-3.5 h-3.5" />
          <span>{weather.current.temp}°</span>
        </div>
      </div>

      <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600"></div>

      {/* Next Day Weather */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 font-bold tracking-wider uppercase text-[9px]">
          Tmw
        </span>
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs" title={weather.nextDay.description}>
          <WeatherIcon condition={weather.nextDay.condition} className="w-3.5 h-3.5" />
          <span>{weather.nextDay.temp}°</span>
        </div>
      </div>
    </div>
  );
};


export const GoogleBottomAd = () => {
  const adRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const timer = setTimeout(() => {
      try {
        // Check component mount status and DOM visibility before initializing AdSense
        if (
          isMountedRef.current &&
          adRef.current &&
          adRef.current.offsetParent !== null &&
          typeof window !== 'undefined'
        ) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        console.error("AdSense Error:", e);
      }
    }, 1000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="my-8 flex justify-center w-full min-h-[280px] md:min-h-[90px] overflow-hidden bg-slate-50/50 rounded-xl">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
        ref={adRef}
      />
    </div>
  );
};

export const RenderDynamicIcon = ({ iconName, className }) => {
  const IconMap = {
    'camera': Camera,
    'video': Video,
    'map': MapIcon,
    'book-open': BookOpen,
    'image': ImageIcon
  };

  const IconComponent = IconMap[iconName] || Info;

  return (
    <IconComponent
      className={className}
      aria-hidden="true"
      strokeWidth={2.5}
    />
  );
};

const MapSelectionComponent = React.memo(({ onLocationSelect, initialCoords, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // STABILITY GUARD: If map exists, do nothing.
    if (mapInstance.current || !mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialCoords?.lat || 7.8731, initialCoords?.lng || 80.7718], 8);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    }).addTo(mapInstance.current);

    // Pass the Leaflet instance back to App.jsx so Autocomplete can sync with it
    if (onMapReady) {
      onMapReady(mapInstance.current);
    }

    mapInstance.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng).addTo(mapInstance.current);
      }
      onLocationSelect(lat.toFixed(6), lng.toFixed(6));
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off();
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [initialCoords, onLocationSelect, onMapReady]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
});


/*
* ============================================================
* PHOTO GALLERY
* ============================================================
*/


export const PhotoGallery = React.memo(
  ({ photos, onClose, placeName, selectedLocation, onShare }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [isSlideshowActive, setIsSlideshowActive] = useState(false);

    // Two separate refs for the two different scrollable areas in the modal
    const gridScrollRef = useDragScroll();
    const lightboxScrollRef = useDragScroll();

    const preventCopy = (e) => {
      e.preventDefault();
      return false;
    };

    /*
     * ============================================================
     * PHOTO GALLERY SEO
     * ============================================================
     */
    useEffect(() => {
      if (selectedLocation || placeName) {
        const locationObj =
          selectedLocation || { place_name: placeName };

        updateSEO(locationObj, {
          isGallery: true,
          galleryPhotos: photos
        });
      }
    }, [selectedLocation, placeName, photos]);

    /*
     * ============================================================
     * PHOTO GALLERY MODAL + URL LIFECYCLE
     * ============================================================
     */
    useEffect(() => {
      const scrollY = window.scrollY;

      document.body.classList.add('modal-open');

      const locationObj =
        selectedLocation ||
        (placeName ? { place_name: placeName } : null);

      if (locationObj?.place_name) {
        const rawName = String(locationObj.place_name);

        const gallerySlug = generateSlug(rawName);

        const galleryPath = `/gallery/${gallerySlug}`;

        if (window.location.pathname !== galleryPath) {
          window.history.pushState(
            {
              modalOpen: true,
              gallery: true,
              placeId: locationObj.id || null
            },
            '',
            galleryPath
          );
        }
      }

      const handlePopState = () => {
        if (typeof onClose === 'function') {
          onClose();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        document.body.classList.remove('modal-open');
        window.scrollTo(0, scrollY);

        window.removeEventListener(
          'popstate',
          handlePopState
        );
      };
    }, [selectedLocation, placeName, onClose]);

    /*
     * ============================================================
     * PINTEREST
     * ============================================================
     */
    const handlePinterestSave = (e, imageUrl, locationData) => {
      e.stopPropagation();

      const locationName =
        locationData?.place_name ||
        placeName ||
        'New Discovery';

      const rawCategory =
        locationData?.category ||
        'Location';

      const baseUrl =
        'https://www.myjournalview.com';

      const formattedLocation =
        typeof generateSlug === 'function'
          ? generateSlug(locationName)
          : encodeURIComponent(
            locationName.toLowerCase()
          );

      const sourceUrl =
        `${baseUrl}/gallery/${formattedLocation}?utm_source=pinterest_save_btn`;

      const mandatoryHashtags = [
        'MyJournal',
        'SriLanka',
        'VisitSriLanka',
        'TravelSriLanka',
        'WanderlustSriLanka',
        'BeautifulSriLanka',
        'HiddenGemsSriLanka',
        'SriLankaDiaries',
        'ChasingWaterfalls',
        'HikingAdventures',
        'CampingLife',
        'MountainViews',
        'NatureSeekers',
        'AdventureSriLanka',
        'ExploreSriLanka',
        'TravelPhotography',
        'TravelDiaries',
        'IslandParadise',
        'ProtectNature',
        'CeylonVibes'
      ];

      const categoryMap = {
        Waterfall: ['Waterfalls', 'Nature'],
        Mountain: ['Mountains', 'Peaks', 'Hiking'],
        Trail: ['Trekking', 'Adventure'],
        Viewpoint: ['ScenicViews', 'Landscape'],
        Beach: ['Coastal', 'OceanVibes', 'BeachLife'],
        Park: ['NationalPark', 'Wildlife'],
        Plateaus: ['Highlands', 'Plains'],
        'Reserved Forest': ['Rainforest', 'EcoTravel'],
        Monastery: [
          'Spiritual',
          'BuddhistTemple',
          'Serenity'
        ],
        Archaeology: [
          'AncientHistory',
          'Heritage',
          'HistoricalSites'
        ],
        Reservoir: ['Lakes', 'WaterViews'],
        Pool: ['NaturalPool', 'Swimming'],
        Stream: ['Rivers', 'Streams'],
        Location: ['Travel', 'Explore']
      };

      const uniqueHashtags =
        new Set(mandatoryHashtags);

      const locationHashtag =
        locationName.replace(
          /[^a-zA-Z0-9]/g,
          ''
        );

      if (locationHashtag) {
        uniqueHashtags.add(locationHashtag);
      }

      const dynamicTags =
        categoryMap[rawCategory] || [];

      dynamicTags.forEach((tag) => {
        uniqueHashtags.add(tag);
      });

      const hashtagString =
        Array.from(uniqueHashtags)
          .map((tag) => `#${tag}`)
          .join(' ');

      const protectedDescription =
        `New Adventure: ${locationName} (${rawCategory}) 🏔️ | ` +
        `Experience breathtaking views and cinematic highlights. ` +
        `See the full gallery on My Journal! © Hasitha Gunasekera\n\n` +
        hashtagString;

      const pinterestUrl =
        `https://www.pinterest.com/pin/create/button/?` +
        `url=${encodeURIComponent(sourceUrl)}` +
        `&media=${encodeURIComponent(imageUrl)}` +
        `&description=${encodeURIComponent(protectedDescription)}`;

      window.open(
        pinterestUrl,
        '_blank',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
    };

    /*
     * ============================================================
     * SLIDESHOW
     * ============================================================
     */
    useEffect(() => {
      let timer;

      if (
        isSlideshowActive &&
        activeIndex !== null
      ) {
        timer = setTimeout(() => {
          nextImage();
        }, 5000);
      }

      return () => clearTimeout(timer);
    }, [isSlideshowActive, activeIndex]);

    /*
     * ============================================================
     * KEYBOARD CONTROLS
     * ============================================================
     */
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (activeIndex === null) return;

        if (e.key === 'ArrowRight') {
          nextImage();
          setIsSlideshowActive(false);
        }

        if (e.key === 'ArrowLeft') {
          prevImage(e);
          setIsSlideshowActive(false);
        }

        if (e.key === 'Escape') {
          setActiveIndex(null);
        }

        if (e.key === ' ') {
          e.preventDefault();

          setIsSlideshowActive(
            (prev) => !prev
          );
        }
      };

      window.addEventListener(
        'keydown',
        handleKeyDown
      );

      return () => {
        window.removeEventListener(
          'keydown',
          handleKeyDown
        );
      };
    }, [activeIndex]);

    /*
     * ============================================================
     * IMAGE NAVIGATION
     * ============================================================
     */
    const nextImage = (e) => {
      if (e) e.stopPropagation();

      setActiveIndex(
        (prev) => (prev + 1) % photos.length
      );
    };

    const prevImage = (e) => {
      if (e) e.stopPropagation();

      setActiveIndex(
        (prev) =>
          (prev - 1 + photos.length) %
          photos.length
      );
    };

    /*
     * ============================================================
     * CLOSE GALLERY
     * ============================================================
     */
    const handleCloseGallery = (e) => {
      if (e) {
        e.stopPropagation();
      }

      if (
        window.location.pathname.startsWith(
          '/gallery/'
        )
      ) {
        window.history.replaceState(
          {
            modalOpen: false
          },
          '',
          '/'
        );
      }

      updateSEO(null);

      if (typeof onClose === 'function') {
        onClose();
      }
    };

    /*
     * ============================================================
     * SAFETY
     * ============================================================
     */
    if (!photos || photos.length === 0) {
      return null;
    }

    /*
     * ============================================================
     * RENDER
     * ============================================================
     */
    return (
      <div
        className="fixed inset-0 z-[10000] bg-white/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-200 select-none"
        style={{ height: '100dvh' }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={preventCopy}
      >
        {/* ======================================================
            HEADER
            ====================================================== */}
        <header className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-slate-600 font-black uppercase tracking-widest text-xs">
              {placeName
                ? `${placeName} Gallery`
                : 'Location Gallery'}
            </h3>

            <p className="text-[10px] text-indigo-400 font-bold uppercase">
              {photos.length} Total Images
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* SHARE */}
            <button
              onClick={(e) => {
                e.stopPropagation();

                if (onShare) {
                  onShare(
                    e,
                    selectedLocation
                  );
                }
              }}
              aria-label="Share Gallery"
              className="w-12 h-12 flex items-center justify-center bg-slate-800/10 text-slate-700 hover:bg-blue-500 hover:text-white rounded-full transition-all shadow-sm"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* CLOSE */}
            <button
              type="button"
              onClick={handleCloseGallery}
              aria-label="Close photo gallery"
              className="w-12 h-12 flex items-center justify-center bg-gray-600/80 hover:bg-rose-600 text-white rounded-full transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            >
              <X
                className="w-5 h-5"
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        {/* ======================================================
            SEO CONTEXT BLOCK
            ====================================================== */}
        {(selectedLocation?.description || selectedLocation?.ai_article?.story) && (
          <div className="px-6 pt-4 pb-2 text-slate-500 text-xs max-w-3xl leading-relaxed shrink-0">
            <p>{selectedLocation.description || selectedLocation.ai_article.story}</p>
          </div>
        )}

        {/* ======================================================
            PHOTO GRID
            ====================================================== */}
        <main
          ref={gridScrollRef}
          className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y p-4 md:p-10 custom-scrollbar"
        >
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((url, i) => (
              <article
                key={`${placeName}-${i}`}
                onClick={() =>
                  setActiveIndex(i)
                }
                className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-800 border border-white/5 shadow-2xl cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
              >
                <img
                  src={
                    typeof getOptimizedUrl ===
                      'function'
                      ? getOptimizedUrl(
                        url,
                        400,
                        60
                      )
                      : url
                  }
                  className="w-full h-full object-cover select-none pointer-events-none"
                  loading={
                    i === 0
                      ? 'eager'
                      : 'lazy'
                  }
                  fetchPriority={
                    i === 0
                      ? 'high'
                      : 'auto'
                  }
                  draggable={false}
                  alt={`${placeName || 'Remote location'} ${selectedLocation?.category ? `(${selectedLocation.category})` : ''} in ${selectedLocation?.locality || 'Sri Lanka'} - High resolution image ${i + 1}`}
                />
              </article>
            ))}
          </div>
        </main>

        {/* ======================================================
            LIGHTBOX
            ====================================================== */}
        {activeIndex !== null && (
          <div
            className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-2xl flex flex-col animate-in zoom-in-95 duration-200"
            onContextMenu={preventCopy}
          >
            {/* SLIDESHOW PROGRESS */}
            {isSlideshowActive && (
              <div className="absolute top-0 left-0 h-1 bg-indigo-500 z-[12001] animate-[progress_5s_linear_infinite]" />
            )}

            {/* LIGHTBOX CONTROLS */}
            <div className="absolute top-6 right-6 flex gap-3 z-[12000]">
              {/* PINTEREST */}
              <button
                className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-[#E60023] text-white rounded-full transition-all shadow-lg"
                onClick={(e) =>
                  handlePinterestSave(
                    e,
                    photos[activeIndex],
                    selectedLocation
                  )
                }
                aria-label="Save to Pinterest"
              >
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.261 7.929-7.261 4.162 0 7.397 2.966 7.397 6.93 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.033-1.002 2.324-1.492 3.121 1.12.345 2.3.533 3.524.533 6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.638 0 12.017 0z" />
                </svg>
              </button>

              {/* SLIDESHOW */}
              <button
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isSlideshowActive
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                onClick={(e) => {
                  e.stopPropagation();

                  setIsSlideshowActive(
                    (prev) => !prev
                  );
                }}
                aria-label={
                  isSlideshowActive
                    ? 'Pause Slideshow'
                    : 'Start Slideshow'
                }
              >
                {isSlideshowActive ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              {/* CLOSE LIGHTBOX */}
              <button
                className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all"
                onClick={() =>
                  setActiveIndex(null)
                }
                aria-label="Close image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREVIOUS */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white rounded-full transition-all z-[12000]"
              onClick={(e) => {
                prevImage(e);
                setIsSlideshowActive(false);
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* NEXT */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white rounded-full transition-all z-[12000]"
              onClick={(e) => {
                nextImage(e);
                setIsSlideshowActive(false);
              }}
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* IMAGE */}
            <div
              ref={lightboxScrollRef}
              className="photo-gallery-scroll native-scroll-y flex-1 w-full overflow-y-auto p-4 no-scrollbar"
              onClick={() =>
                setActiveIndex(null)
              }
            >
              <div className="min-h-full w-full flex items-center justify-center">
                <div
                  className="relative w-fit h-fit"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <img
                    key={photos[activeIndex]}
                    src={
                      typeof getOptimizedUrl ===
                        'function'
                        ? getOptimizedUrl(
                          photos[activeIndex],
                          1200,
                          85
                        )
                        : photos[activeIndex]
                    }
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500"
                    alt={`${placeName || 'Gallery'} featured view`}
                    fetchPriority="high"
                    loading="eager"
                    draggable={false}
                  />

                  {/* WATERMARK */}
                  <div className="absolute bottom-6 right-6 pointer-events-none select-none">
                    <div className="flex flex-col items-end drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      <span className="text-[10px] md:text-xs font-light tracking-[0.4em] text-white/70 uppercase border-b border-white/30 pb-0.5">
                        My Journal
                      </span>

                      <div className="w-4 h-[0.5px] bg-white/30 mt-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COUNTER */}
            <footer className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 px-6 py-2 rounded-full border border-white/10 z-[12000]">
              <p className="text-white text-[10px] font-black tracking-[0.2em] uppercase">
                {activeIndex + 1} / {photos.length}
              </p>
            </footer>
          </div>
        )}

        {/* ======================================================
            STYLES
            ====================================================== */}
        <style>{`
          @keyframes progress {
            from {
              width: 0%;
            }

            to {
              width: 100%;
            }
          }

          .modal-open {
            overflow: hidden !important;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }
        `}</style>
      </div>
    );
  }
);

/*
* ============================================================
* VIDEO GALLERY
* ============================================================
*/


// YouTube Video ID parser

export const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};


export const HubVideoList = ({ supabaseClient, onVideosLoaded }) => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    let isSubscribed = true;

    const fetchVideos = async () => {
      if (!supabaseClient) {
        if (onVideosLoaded) onVideosLoaded([]);
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from('hub_videos')
          .select('id, url, title, custom_thumbnail_url')
          .eq('is_active', true)
          .order('display_order', {
            ascending: false,
            nullsFirst: false
          })
          .order('created_at', {
            ascending: false
          });

        if (!error && data && isSubscribed) {
          setVideos(data);

          if (onVideosLoaded) {
            onVideosLoaded(data);
          }
        } else if (isSubscribed) {
          setVideos([]);

          if (onVideosLoaded) {
            onVideosLoaded([]);
          }
        }
      } catch (err) {
        console.error("Error loading hub videos:", err);

        if (isSubscribed) {
          setVideos([]);

          if (onVideosLoaded) {
            onVideosLoaded([]);
          }
        }
      }
    };

    fetchVideos();

    return () => {
      isSubscribed = false;
    };
  }, [supabaseClient, onVideosLoaded]);

  return null;
};


export const VideoGallery = React.memo(({ videos, initialIndex = 0, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // FIX 1: Robust URL parsing using Regex to handle
  // commas, spaces, newlines, semicolons, and pipe separators
  const videoList = (Array.isArray(videos) ? videos : [videos])
    .flatMap((item) => {
      if (typeof item === 'string') {
        return item.split(/[\s,;|]+/);
      }

      // Handle DB objects where the url property contains multiple links
      if (
        item &&
        typeof item === 'object' &&
        typeof item.url === 'string'
      ) {
        const urls = item.url.split(/[\s,;|]+/);

        if (urls.length > 1) {
          return urls.map((u) => ({
            ...item,
            url: u,
          }));
        }
      }

      return item;
    })
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();

        return {
          url: trimmed,
          title: '',
          custom_thumbnail_url: '',
        };
      }

      return item;
    })
    .filter(
      (item) =>
        item &&
        (item.url || item.custom_thumbnail_url) &&
        String(item.url).trim() !== ''
    );

  // FIX 2: Gallery lifecycle + URL synchronization
  // The parent MUST provide a stable onClose callback.
  useEffect(() => {
    const scrollY = window.scrollY;

    document.body.classList.add('modal-open');

    // Log visit analytics once when Video Gallery mounts
    if (typeof logVisit === 'function') {
      logVisit('Video Gallery');
    }

    // FIX 3: Do not push /videos if we are already there.
    // Prevents unnecessary history entries and URL blinking.
    if (window.location.pathname !== '/videos') {
      window.history.pushState(
        { modalOpen: true },
        '',
        '/videos'
      );
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Browser Back button closes the gallery
    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.classList.remove('modal-open');
      window.scrollTo(0, scrollY);

      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);

      // Revert URL when the gallery actually closes
      if (window.location.pathname === '/videos') {
        window.history.pushState(
          { modalOpen: false },
          '',
          '/'
        );
      }
    };
  }, [onClose]);

  if (videoList.length === 0) {
    return null;
  }

  const currentVideo =
    videoList[activeIndex] || videoList[0];

  const videoId = getYouTubeId(currentVideo.url);

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/98 backdrop-blur-3xl flex flex-col animate-in fade-in duration-200 select-none">

      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
        <div>
          <h3 className="text-white font-black uppercase tracking-widest text-xs">
            Video Journal
          </h3>

          <p className="text-[10px] text-indigo-400 font-bold uppercase">
            {activeIndex + 1} of {videoList.length} Clips
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close video gallery"
          className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-hidden">

        {/* FIX 4:
            Mobile uses flex-none instead of flex-1 so the
            video area does not force the playlist off-screen.
        */}
        <div className="flex-none lg:flex-1 w-full flex items-center justify-center relative min-h-[40vh] lg:min-h-0">

          <div className="relative w-full max-w-5xl aspect-video rounded-[2rem] overflow-hidden bg-black border border-white/10 shadow-2xl">

            {videoId ? (
              <iframe
                key={videoId}
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentVideo.title || 'Video Journal Player'}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/50 text-sm">
                Invalid or Unsupported Video URL
              </div>
            )}

          </div>
        </div>

        {/* FIX 5:
            flex-1 + min-h-0 creates an internal scrolling boundary
            for the video list on mobile.
        */}
        <aside className="w-full lg:w-80 flex-1 lg:flex-none flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-20 lg:pb-0 min-h-0">

          <h4 className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2 px-1">
            More Videos
          </h4>

          {videoList.map((item, idx) => {
            const listVideoId = getYouTubeId(item.url);

            const thumbnailUrl =
              item.custom_thumbnail_url ||
              (
                listVideoId
                  ? `https://img.youtube.com/vi/${listVideoId}/hqdefault.jpg`
                  : '/default-video-placeholder.jpg'
              );

            const isActive = activeIndex === idx;

            return (
              <button
                key={item.id || item.url || idx}
                onClick={() => setActiveIndex(idx)}
                className={`group flex items-start gap-3 w-full text-left p-2 rounded-xl transition-all ${isActive
                  ? 'bg-white/10 border border-indigo-500'
                  : 'hover:bg-white/5 border border-transparent'
                  }`}
              >

                {/* Thumbnail */}
                <div className="relative w-24 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">

                  <img
                    src={thumbnailUrl}
                    alt={item.title || 'Thumbnail'}
                    className={`w-full h-full object-cover transition-opacity ${isActive
                      ? 'opacity-100'
                      : 'opacity-70 group-hover:opacity-100'
                      }`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        '/default-video-placeholder.jpg';
                    }}
                  />

                  {isActive && (
                    <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}

                </div>

                {/* Title */}
                <div className="flex-1 overflow-hidden">
                  <p
                    className={`text-xs font-semibold line-clamp-2 ${isActive
                      ? 'text-white'
                      : 'text-slate-300'
                      }`}
                  >
                    {item.title || 'Journal Entry'}
                  </p>
                </div>

              </button>
            );
          })}

        </aside>
      </main>
    </div>
  );
});

export const MapComponent = ({
  places = [],
  nearbyAttractions = [],
  routeAmenities = { gas_stations: [], restaurants: [], lodgings: [] },
  userCoords,
  selectedRoute = [],
  hoveredPlaceId,
  setHoveredPlaceId,
  fetchAttractions,
  setRouteDistance,
  setRouteData,
  mapInstanceRef,
  handleOpenArticle,
  isNearbySearchEnabled = false
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRegistryRef = useRef({});
  const userMarkerRef = useRef(null);

  // Active Polyline Ref
  const routeLineRef = useRef(null);

  // OpenRouteService API Key from environment variables
  const ORS_KEY = import.meta.env.VITE_ORS_KEY;

  // Debounce user coordinates for routing to prevent API rate limits (HTTP 429)
  const debouncedUserCoords = useDebounce(userCoords, 3000);

  // Helper for Category Hex Colors
  const getCategoryHex = (category) => {
    const categoryColors = {
      gas_station: '#e11d48',
      restaurant: '#f59e0b',
      lodging: '#8b5cf6',
      attraction: '#06b6d4',
      Location: '#64748b'
    };
    return categoryColors[category] || '#64748b';
  };

  const getSlug = (item) => {
    const text = item.place_name || item.name || item.slug || '';
    return generateSlug(text);
  };

  // Helper to standardise line rendering across services
  const renderPolyline = (pathCoords, color = '#ef4444', dashArray = null) => {
    if (routeLineRef.current) {
      mapInstance.current.removeLayer(routeLineRef.current);
    }
    routeLineRef.current = L.polyline(pathCoords, {
      color,
      weight: color === '#ef4444' ? 6 : 4,
      opacity: 0.9,
      lineJoin: 'round',
      ...(dashArray && { dashArray })
    }).addTo(mapInstance.current);

    mapInstance.current.fitBounds(routeLineRef.current.getBounds(), { padding: [50, 50] });
  };

  // Helper to update state metrics
  const updateRouteMetrics = (distKm, durationMins, pathCoords = []) => {
    if (setRouteDistance) setRouteDistance(distKm);
    if (setRouteData) {
      setRouteData({
        active: true,
        distance: distKm,
        duration: durationMins,
        coordinates: pathCoords
      });
    }
  };

  // 1. Initialize Map & User Location Marker
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([userCoords?.lat || 7.0777, userCoords?.lng || 79.8924], 10);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
      }).addTo(mapInstance.current);
      if (mapInstanceRef) mapInstanceRef.current = mapInstance.current;
    }

    if (mapInstance.current && userCoords?.lat && userCoords?.lng) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.circleMarker([userCoords.lat, userCoords.lng], {
          radius: 10,
          fillColor: "#3b82f6",
          color: "#fff",
          weight: 3,
          fillOpacity: 0.9,
          zIndexOffset: 1000
        }).addTo(mapInstance.current).bindTooltip("You are here");
      } else {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      }
    }
  }, [userCoords, mapInstanceRef]);

  // 2. Dynamic Marker Management (Places, Attractions, and Amenities)
  useEffect(() => {
    if (!mapInstance.current) return;

    // Normalize Saved Places
    const normalizedPlaces = (places || [])
      .filter(p => !p.isNearby || ['gas_station', 'restaurant', 'lodging', 'Gas Station', 'Restaurant', 'Lodging'].includes(p.category))
      .map(p => {
        let mappedCategory = p.category || 'Location';
        let registryPrefix = 'place';

        if (p.category === 'Gas Station' || p.category === 'gas_station') {
          mappedCategory = 'gas_station';
          registryPrefix = 'gas';
        } else if (p.category === 'Restaurant' || p.category === 'restaurant') {
          mappedCategory = 'restaurant';
          registryPrefix = 'rest';
        } else if (p.category === 'Lodging' || p.category === 'lodging') {
          mappedCategory = 'lodging';
          registryPrefix = 'hotel';
        }

        return {
          ...p,
          category: mappedCategory,
          lat: p.latitude ?? p.lat,
          lng: p.longitude ?? p.lng,
          title: p.place_name || p.name || 'Location',
          registryKey: `${registryPrefix}-${p.id}`,
          isSavedPlace: true
        };
      });

    // Conditionally Normalize Nearby Items ONLY when search toggle is active
    const normalizedAttractions = isNearbySearchEnabled ? (nearbyAttractions || []).map(a => ({
      ...a,
      category: 'attraction',
      lat: a.lat,
      lng: a.lng,
      title: a.name || 'Attraction',
      registryKey: `attr-${a.id}`,
    })) : [];

    const normalizedGas = isNearbySearchEnabled ? (routeAmenities?.gas_stations || []).map(g => ({
      ...g,
      category: 'gas_station',
      lat: g.lat,
      lng: g.lng,
      title: g.name || 'Fuel Station',
      registryKey: `gas-${g.id}`,
    })) : [];

    const normalizedRestaurants = isNearbySearchEnabled ? (routeAmenities?.restaurants || []).map(r => ({
      ...r,
      category: 'restaurant',
      lat: r.lat,
      lng: r.lng,
      title: r.name || 'Restaurant',
      registryKey: `rest-${r.id}`,
    })) : [];

    const normalizedLodgings = isNearbySearchEnabled ? (routeAmenities?.lodgings || []).map(h => ({
      ...h,
      category: 'lodging',
      lat: h.lat,
      lng: h.lng,
      title: h.name || 'Hotel/Lodging',
      registryKey: `hotel-${h.id}`,
    })) : [];

    // Combine all active layers
    const allItems = [
      ...normalizedPlaces,
      ...normalizedAttractions,
      ...normalizedGas,
      ...normalizedRestaurants,
      ...normalizedLodgings
    ];

    const currentKeys = new Set(allItems.map(item => item.registryKey));

    // Cleanup markers removed when toggle turns OFF or state updates
    Object.keys(markerRegistryRef.current).forEach(key => {
      if (!currentKeys.has(key)) {
        mapInstance.current.removeLayer(markerRegistryRef.current[key]);
        delete markerRegistryRef.current[key];
      }
    });

    // Render & Update Active Markers
    allItems.forEach(item => {
      if (item.lat == null || item.lng == null) return;

      const isSelected = selectedRoute.some(p => p.id === item.id);
      const isHovered = hoveredPlaceId === item.id;

      let markerColor = getCategoryHex(item.category);

      if (item.status === 'pending') {
        markerColor = '#f97316';
      } else if (item.status === 'done') {
        markerColor = '#10b981';
      }

      if (isSelected) {
        markerColor = '#3b82f6';
      } else if (isHovered) {
        markerColor = '#10b981';
      }

      const radius = (isSelected || isHovered) ? 9 : 6;
      const slug = getSlug(item);

      const isPublished = item.status === 'done';
      const placeUrl = isPublished ? `/place/${slug}` : null;

      const popupContent = `
        <div class="map-popup-node">
          <a ${isPublished ? `href="${placeUrl}"` : `href="javascript:void(0);"`} class="font-bold text-slate-800 hover:text-indigo-600 transition-colors">
            ${item.title}
          </a>
        </div>
      `;

      let marker = markerRegistryRef.current[item.registryKey];

      if (!marker) {
        marker = L.circleMarker([item.lat, item.lng], {
          radius,
          fillColor: markerColor,
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
          pane: 'markerPane'
        });

        if (item.isSavedPlace) {
          marker.bindPopup(popupContent);
        } else {
          marker.bindTooltip(item.title);
        }

        marker.addTo(mapInstance.current);
        markerRegistryRef.current[item.registryKey] = marker;
      } else {
        marker.setStyle({ fillColor: markerColor, radius });
        if (item.isSavedPlace) {
          marker.setPopupContent(popupContent);
        } else {
          marker.setTooltipContent(item.title);
        }
      }

      // Refresh Click Handlers
      marker.off('click');
      marker.on('click', () => {
        if (setHoveredPlaceId) setHoveredPlaceId(item.id);

        // Fetch nearby attractions on click STRICTLY when toggle is enabled
        if (item.isSavedPlace && fetchAttractions && isNearbySearchEnabled) {
          fetchAttractions(item.lat, item.lng);
        }

        if (typeof handleOpenArticle === 'function') {
          handleOpenArticle(item);
        } else if (isPublished && placeUrl) {
          window.history.pushState({ placeId: item.id }, '', placeUrl);
        }
      });

      // Intercept Popup Links for SPA Navigation
      if (item.isSavedPlace) {
        marker.off('popupopen');
        marker.on('popupopen', (e) => {
          const popupNode = e.popup.getElement();
          const anchor = popupNode?.querySelector('a');
          if (anchor) {
            anchor.onclick = (evt) => {
              evt.preventDefault();
              if (typeof handleOpenArticle === 'function') {
                handleOpenArticle(item);
              } else if (isPublished && placeUrl) {
                window.history.pushState({ placeId: item.id }, '', placeUrl);
              }
            };
          }
        });
      }
    });
  }, [
    places,
    nearbyAttractions,
    routeAmenities,
    selectedRoute,
    hoveredPlaceId,
    fetchAttractions,
    setHoveredPlaceId,
    handleOpenArticle,
    isNearbySearchEnabled
  ]);

  // 3. Routing Engine (Tiered Strategy: OpenRouteService -> Google Directions API -> Polyline Fallback)
  useEffect(() => {
    if (!mapInstance.current || !debouncedUserCoords) return;

    if (selectedRoute.length === 0) {
      if (routeLineRef.current) {
        mapInstance.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      if (setRouteDistance) setRouteDistance(0);
      if (setRouteData) setRouteData(null);
      return;
    }

    const destinationPlace = selectedRoute[selectedRoute.length - 1];
    const destLat = destinationPlace?.latitude ?? destinationPlace?.lat;
    const destLng = destinationPlace?.longitude ?? destinationPlace?.lng;

    if (destLat == null || destLng == null) {
      console.warn("Invalid destination coordinates for route calculation.");
      return;
    }

    // Final Fallback: Dashed Straight Line
    const renderStraightLineFallback = () => {
      console.warn("Rendering straight-line fallback.");
      const fallbackCoords = [
        [debouncedUserCoords.lat, debouncedUserCoords.lng],
        ...selectedRoute
          .map(p => [p.latitude ?? p.lat, p.longitude ?? p.lng])
          .filter(([lat, lng]) => lat != null && lng != null)
      ];
      renderPolyline(fallbackCoords, '#6366f1', '8, 8');
    };

    // 2. Fallback Service: Google Directions API
    const calculateGoogleDirections = () => {
      if (!window.google || !window.google.maps) {
        console.warn("Google Maps API unavailable; using straight-line fallback.");
        renderStraightLineFallback();
        return;
      }

      const directionsService = new window.google.maps.DirectionsService();
      const origin = new window.google.maps.LatLng(debouncedUserCoords.lat, debouncedUserCoords.lng);
      const destination = new window.google.maps.LatLng(destLat, destLng);

      const waypoints = selectedRoute.slice(0, -1).reduce((acc, p) => {
        const lat = p.latitude ?? p.lat;
        const lng = p.longitude ?? p.lng;
        if (lat != null && lng != null) {
          acc.push({
            location: new window.google.maps.LatLng(lat, lng),
            stopover: true
          });
        }
        return acc;
      }, []);

      directionsService.route({
        origin,
        destination,
        waypoints,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status === 'OK' && response?.routes?.[0]) {
          const route = response.routes[0];
          const pathCoords = route.overview_path.map(p => [p.lat(), p.lng()]);

          let totalDistMeters = 0;
          let totalTimeSecs = 0;
          route.legs.forEach(leg => {
            totalDistMeters += leg.distance.value;
            totalTimeSecs += leg.duration.value;
          });

          const distKm = (totalDistMeters / 1000).toFixed(1);
          renderPolyline(pathCoords);
          updateRouteMetrics(distKm, Math.round(totalTimeSecs / 60), pathCoords);
        } else {
          console.warn("Google Directions Request failed:", status);
          renderStraightLineFallback();
        }
      });
    };

    // 1. Primary Service: OpenRouteService (Free)
    const calculateORS = async () => {
      try {
        const coordsList = [[debouncedUserCoords.lng, debouncedUserCoords.lat]];
        selectedRoute.forEach(p => {
          const lat = p.latitude ?? p.lat;
          const lng = p.longitude ?? p.lng;
          if (lat != null && lng != null) coordsList.push([lng, lat]);
        });

        const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
          method: 'POST',
          headers: {
            'Authorization': ORS_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ coordinates: coordsList })
        });

        if (!response.ok) throw new Error(`ORS HTTP Error: ${response.status}`);

        const data = await response.json();
        const route = data.features[0];
        const pathCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

        const distKm = (route.properties.summary.distance / 1000).toFixed(1);
        const durationMins = Math.round(route.properties.summary.duration / 60);

        renderPolyline(pathCoords);
        updateRouteMetrics(distKm, durationMins, pathCoords);
      } catch (error) {
        console.warn("OpenRouteService failed. Falling back to Google Directions API...", error);
        calculateGoogleDirections();
      }
    };

    // Trigger primary service if key exists; otherwise jump to secondary fallback
    if (ORS_KEY) {
      calculateORS();
    } else {
      calculateGoogleDirections();
    }

  }, [selectedRoute, debouncedUserCoords, setRouteData, setRouteDistance, ORS_KEY]);

  return <div ref={mapRef} className="h-full w-full z-0" />;
};

export const NewsletterSubscribe = ({ supabaseClient }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient.from('subscribers').insert([{ email }]);
      if (error) {
        if (error.code === '23505') {
          toast.error("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully subscribed to the journal!");
        setEmail('');
      }
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-10 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Mail className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
          Field Log Newsletter
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">
        Get notified instantly when a new backcountry location is fully mapped, verified, and updated from pending to complete.
      </p>
      <form onSubmit={handleSubscribe} className="relative">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address..."
          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-4 pr-12 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export const LegalAndAboutModal = ({ isOpen, onClose, currentView, setView }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[11000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl h-[85vh] md:h-[75vh] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs md:text-sm">
              {currentView === 'about' ? t('about.about_title', 'About Platform & Explorer') : t(`legal.${currentView}_title`, 'Legal Info')}
            </h2>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mt-0.5">
              {t('about.subtitle', 'My Journal Sri Lanka')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y p-8 custom-scrollbar space-y-8 text-slate-600 dark:text-slate-300">
          {currentView === 'about' ? (
            <>
              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Camera className="w-4 h-4" strokeWidth={2.5} />
                  <h3 className="font-black uppercase tracking-widest text-xs">
                    {t('about.myself_title', 'About Myself')}
                  </h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed font-medium">
                  {t('about.myself_body', "Hi, I'm Hasitha Gunasekera. I'm an explorer, road-tripper, and outdoor photographer dedicated to tracking down unknown spaces across Sri Lanka. My true passion lies in backcountry trekking, remote high-altitude wilderness camping, and exploring uncharted waterfall cascades tucked deep within mountain ranges.")}
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-4 h-4" strokeWidth={2.5} />
                  <h3 className="font-black uppercase tracking-widest text-xs">
                    {t('about.site_title', 'About the Site')}
                  </h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed font-medium">
                  {t('about.site_body', "My Journal serves as a specialized, technical field log detailing remote coordinates, spatial records, and trail notes across Sri Lanka. Engineered to integrate backcountry mapping indicators, weather monitors, and route telemetry, it aims to connect adventure travelers safely to hidden destinations while establishing strict environmental safety standards.")}
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-700">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <MapIcon className="w-4 h-4" strokeWidth={2.5} />
                  <h3 className="font-black uppercase tracking-widest text-xs">
                    {t('about.spots_title', 'Sri Lankan Natural Attractions')}
                  </h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed font-medium">
                  {t('about.spots_body', "Sri Lanka houses phenomenal geographic biodiversity, stretching from the dense mountain ridges of the Knuckles Forest Reserve to pristine cascade clusters like Bambarakanda and Diyaluma Falls. This open ledger indexes mountain plain tablelands, deep natural pools, and historic forest hermitages to showcase raw island terrain while advocating for strict nature preserve conservation metrics.")}
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-900">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
                  <h3 className="font-black uppercase tracking-widest text-xs">
                    {t('about.media_title', 'Media & Copyright')}
                  </h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed font-medium">
                  {t('about.media_body', "All photographic content featured on this platform is captured personally by me using my iPhone and Drone. Images undergo only light, mobile-device editing to preserve their raw, authentic essence. All rights to every photo are strictly reserved under my name, Hasitha Gunasekera. Unauthorized reproduction or commercial use is prohibited.")}
                </p>
              </section>
            </>
          ) : (
            <div className="space-y-6 text-sm leading-relaxed">
              {currentView === 'privacy' ? (
                <>
                  <section>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-2">{t('legal.privacy_s1_title')}</h3>
                    <p>{t('legal.privacy_s1_desc')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-2">{t('legal.privacy_s2_title')}</h3>
                    <p>{t('legal.privacy_s2_desc')}</p>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-2">{t('legal.terms_s1_title')}</h3>
                    <p>{t('legal.terms_s1_desc')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-2">{t('legal.terms_s2_title')}</h3>
                    <p>{t('legal.terms_s2_desc')}</p>
                  </section>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center items-center gap-2 shrink-0">
          <button
            onClick={() => setView('privacy')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'privacy' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
          >
            {t('legal.btn_privacy', 'Privacy')}
          </button>
          <button
            onClick={() => setView('terms')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'terms' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
          >
            {t('legal.btn_terms', 'Terms')}
          </button>
          <button
            onClick={() => setView('about')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'about' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
          >
            {t('legal.btn_about', 'About Journal')}
          </button>
        </div>
      </div>
    </div>
  );
};


function App() {

  // ============================================================================
  // 18. MUTABLE APPLICATION REFERENCES (DOM & MAP INSTANCE REGISTRIES)
  // ============================================================================
  const lastLoggedArticleRef = useRef(null);
  const lastLoggedGalleryRef = useRef(null);
  const mapRef = useRef(null);
  const addMapRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const markerRegistryRef = useRef({});
  const routingControlRef = useRef(null);
  const currentRouteIdsRef = useRef("");
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const nearbyMarkersRef = useRef([]);
  const placesCacheRef = useRef(new Map());
  const hasHandledDeepLink = useRef(false);
  const hasLoggedPlanOpen = useRef(false);
  const hasLoggedAddOpen = useRef(false);
  const hasLoggedVideoOpen = useRef(false);
  const pendingRouteRef = useRef({ type: null, slug: null });
  const sentinelRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLineRef = useRef(null);

  // ============================================================================
  // 19. TRANSLATION, LOCALIZATION, COOKIE CONSENT & PROMPTS
  // ============================================================================
  const { t, i18n } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);

  // Persistent Client Storage: Cookie Consent Tracking
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('myjournal_cookie_consent') === null;
    }
    return false;
  });

  // Persistent Theme Tracker
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Newsletter Prompt Tracking
  const [showNewsletterPrompt, setShowNewsletterPrompt] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);

  // ============================================================================
  // 20. CORE UI, MODALS & OVERLAYS STATE
  // ============================================================================
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [viewingArticle, setviewingArticle] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingData, setSharingData] = useState(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [legalView, setLegalView] = useState('privacy');
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showEngineHint, setShowEngineHint] = useState(true);

  // ============================================================================
  // 21. DATA LISTS, FILTERING & PAGINATION STATE
  // ============================================================================
  const [places, setPlaces] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('All');
  const [statusFilter, setStatusFilter] = useState('done');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedLocation, setSelectedLocation] = useState(null);


  // ============================================================================
  // 22. ADVENTURE ENGINE & ROUTE PLANNER STATE
  // ============================================================================
  const [isEngineOpen, setIsEngineOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isPlannerExpanded, setIsPlannerExpanded] = useState(false);
  const [plannerSearch, setPlannerSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);
  const [destination, setDestination] = useState(null); // { name, lat, lng }
  const [enRouteBucketPlaces, setEnRouteBucketPlaces] = useState([]);
  const [enRouteAttractions, setEnRouteAttractions] = useState([]);
  const [isCalculatingSuggestions, setIsCalculatingSuggestions] = useState(false);
  const [isNearbySearchEnabled, setIsNearbySearchEnabled] = useState(false);

  // Data states for the markers
  const [routeAmenities, setRouteAmenities] = useState({
    gas_stations: [],
    restaurants: [],
    lodgings: []
  });

  const formatCategoryLabel = (cat) => {
    switch (cat) {
      case 'gas_station': return 'Gas Station';
      case 'restaurant': return 'Restaurant';
      case 'lodging': return 'Lodging';
      case 'attraction': return 'Attraction';
      default: return cat;
    }
  };

  // ============================================================================
  // 23. CONTENT CREATION & NEW LOCATION FORM STATE
  // ============================================================================
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addMapInstance, setAddMapInstance] = useState(null);

  const [formData, setFormData] = useState({
    place_name: '',
    locality: '',
    latitude: '',
    longitude: '',
    map_url: '',
    image_url: 'https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/my-journal-logo.png',
    status: 'backlog',
    category: 'Waterfall'
  });

  // ============================================================================
  // 24. SOCIAL INTERACTIONS & ENGAGEMENT STATE
  // ============================================================================
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [newCommentText, setnewCommentText] = useState('');

  // ============================================================================
  // 25. UI EXPANSION & ACTION NAVIGATION CONTROLS (FABs)
  // ============================================================================
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [isSocialExpanded, setIsSocialExpanded] = useState(false);
  const [isAddExpanded, setIsAddExpanded] = useState(false);
  const locationGridScrollRef = useDragScroll();
  const articleWindowScrollRef = useDragScroll();

  // ============================================================================
  // 26. EXTERNAL METRIC UTILITIES (WEATHER, MAP POIs)
  // ============================================================================
  const [weatherData, setWeatherData] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [activeVideos, setActiveVideos] = useState([]);
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [qrUrl, setQrUrl] = useState(null);
  const fetchedWeatherKeys = useRef(new Set());
  const [videoLibrary, setVideoLibrary] = useState([]);
  const [isVideosLoading, setIsVideosLoading] = useState(false);

  const fetchVideoLibrary = useCallback(async () => {
    if (!supabaseClient) return [];

    setIsVideosLoading(true);

    try {
      const { data, error } = await supabaseClient
        .from('hub_videos')
        .select('id, url, title, custom_thumbnail_url')
        .eq('is_active', true)
        .order('display_order', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading videos:', error);
        return [];
      }

      const videos = data || [];
      setVideoLibrary(videos);
      return videos;
    } catch (err) {
      console.error('Error loading video library:', err);
      return [];
    } finally {
      setIsVideosLoading(false);
    }
  }, [supabaseClient]);

  useEffect(() => {
    fetchVideoLibrary();
  }, [fetchVideoLibrary]);

  const handleClosePhotoGallery = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleCloseVideoGallery = useCallback(() => {
    setActiveVideos([]);
  }, []);

  // ============================================================================
  // 27. PERFORMANCE OPTIMIZATION & DEBOUNCED / DERIVED STATE
  // ============================================================================
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedPlannerSearch = useDebounce(plannerSearch, 300);

  /**
   * Data Pipeline Step 1: Distance calculation for saved places
   */
  const placesWithDistance = useMemo(() => {
    return (places || []).map(place => ({
      ...place,
      currentDistance: userCoords
        ? calculateDistance(userCoords.lat, userCoords.lng, place.latitude, place.longitude)
        : Infinity
    }));
  }, [places, userCoords]);

  /**
   * Data Pipeline Step 2: Combine and Deduplicate
   * Merges saved places with fetched Google places ONLY when nearby search is active.
   */
  const allPlaces = useMemo(() => {
    const DUPLICATE_THRESHOLD_KM = 0.5; // 500 meters

    // Strictly skip API data arrays when the toggle is OFF
    const combinedAPIPlaces = isNearbySearchEnabled
      ? [
        ...(nearbyAttractions || []),
        ...(routeAmenities?.gas_stations || []),
        ...(routeAmenities?.restaurants || []),
        ...(routeAmenities?.lodgings || [])
      ]
      : [];

    const normalizedNearby = combinedAPIPlaces.map(place => {
      const pLat = place.lat ?? place.latitude;
      const pLng = place.lng ?? place.longitude;
      return {
        ...place,
        id: place.id,
        place_name: place.name || place.place_name,
        category: place.category || 'Location',
        status: place.status || 'nearby',
        isNearby: true,
        latitude: pLat,
        longitude: pLng,
        cover_photo_url: place.image || place.cover_photo_url,
        currentDistance: userCoords
          ? calculateDistance(userCoords.lat, userCoords.lng, pLat, pLng)
          : Infinity
      };
    });

    const finalPlaces = [...placesWithDistance];
    const seenIds = new Set(finalPlaces.map(p => p.id));

    normalizedNearby.forEach(nearby => {
      if (!nearby.id || seenIds.has(nearby.id)) return;

      const isDuplicate = placesWithDistance.some(saved => {
        if (!saved.latitude || !saved.longitude || !nearby.latitude || !nearby.longitude) return false;
        const dist = calculateDistance(nearby.latitude, nearby.longitude, saved.latitude, saved.longitude);
        return dist < DUPLICATE_THRESHOLD_KM;
      });

      if (!isDuplicate) {
        finalPlaces.push(nearby);
        seenIds.add(nearby.id);
      }
    });

    return finalPlaces;
  }, [placesWithDistance, nearbyAttractions, routeAmenities, userCoords, isNearbySearchEnabled]);

  /**
   * Data Pipeline Step 3: Search, Filter, and Sort (Main List View)
   */
  const filteredPlaces = useMemo(() => {
    const search = (debouncedSearch || "").toLowerCase().trim();
    const searchTokens = search ? search.split(/\s+/) : [];

    const filtered = allPlaces.filter(place => {
      const matchesStatus =
        statusFilter === 'All' ||
        place.status === statusFilter ||
        (statusFilter === 'nearby' && place.isNearby);
      const matchesCategory = filterTag === 'All' || place.category === filterTag;

      if (!matchesStatus || !matchesCategory) return false;
      if (searchTokens.length === 0) return true;

      const searchableFields = [
        place.place_name,
        place.locality,
        place.category
      ].filter(Boolean).map(f => f.toLowerCase());

      return searchTokens.every(token =>
        searchableFields.some(field => field.includes(token))
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        if (a.isNearby && !b.isNearby) return -1;
        if (!a.isNearby && b.isNearby) return 1;

        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

        if (dateA === 0 && dateB === 0) {
          return (a.place_name || "").localeCompare(b.place_name || "");
        }
        return dateB - dateA;
      }

      if (sortBy === 'distance') {
        const distA = a.currentDistance ?? Infinity;
        const distB = b.currentDistance ?? Infinity;
        return distA - distB;
      }

      return (a.place_name || "").localeCompare(b.place_name || "");
    });
  }, [allPlaces, statusFilter, filterTag, debouncedSearch, sortBy]);

  /**
   * Data Pipeline Step 4: Route Planner Multi-Tier Sorting & Corridor Filtering
   */
  const plannerFilteredPlaces = useMemo(() => {
    const search = (debouncedPlannerSearch || "").toLowerCase().trim();
    const tokens = search ? search.split(/\s+/) : [];

    const baseList = allPlaces.filter(p =>
      ['done', 'pending', 'backlog', 'bucket', 'nearby', 'gas_station', 'restaurant', 'lodging'].includes(p.status) ||
      ['gas_station', 'restaurant', 'lodging'].includes(p.category) ||
      p.isNearby
    );

    const searchedList = tokens.length === 0 ? baseList : baseList.filter(place => {
      const searchableFields = [
        place.place_name,
        place.locality,
        place.category
      ].filter(Boolean).map(f => f.toLowerCase());

      return tokens.every(token =>
        searchableFields.some(field => field.includes(token))
      );
    });

    const routeCoords = routeData?.coordinates || [];
    const MAX_CORRIDOR_DIST_KM = 15;

    // Calculate proximity to the route corridor
    const placesWithRouteProximity = searchedList.map(place => {
      const pLat = place.latitude ?? place.lat;
      const pLng = place.longitude ?? place.lng;

      let minDistanceToRoute = Infinity;

      if (routeCoords.length > 0 && pLat != null && pLng != null) {
        const step = Math.max(1, Math.floor(routeCoords.length / 80));
        for (let i = 0; i < routeCoords.length; i += step) {
          const rCoord = routeCoords[i];
          const rLat = Array.isArray(rCoord) ? rCoord[0] : rCoord.lat;
          const rLng = Array.isArray(rCoord) ? rCoord[1] : rCoord.lng;

          const dist = calculateDistance(pLat, pLng, rLat, rLng);
          if (dist < minDistanceToRoute) {
            minDistanceToRoute = dist;
          }
        }
      }

      return {
        ...place,
        minDistanceToRoute,
        isEnRoute: minDistanceToRoute <= MAX_CORRIDOR_DIST_KM
      };
    });

    // Multi-tier Sorting Logic
    return placesWithRouteProximity.sort((a, b) => {
      // 1. Route Priority: En-Route locations sit at top
      if (a.isEnRoute && !b.isEnRoute) return -1;
      if (!a.isEnRoute && b.isEnRoute) return 1;

      // 2. Saved Bucket List Priority
      const isBucketA = a.status === 'bucket';
      const isBucketB = b.status === 'bucket';
      if (isBucketA && !isBucketB) return -1;
      if (!isBucketA && isBucketB) return 1;

      // 3. Attractions Priority (Pushes fetched Google places higher than general backlog)
      if (a.isNearby && !b.isNearby) return -1;
      if (!a.isNearby && b.isNearby) return 1;

      // 4. Distance Priority
      if (a.isEnRoute && b.isEnRoute) {
        return a.minDistanceToRoute - b.minDistanceToRoute;
      }
      const distA = a.currentDistance ?? Infinity;
      const distB = b.currentDistance ?? Infinity;
      return distA - distB;
    });
  }, [allPlaces, debouncedPlannerSearch, routeData]);

  /**
   * Data Pipeline Step 5: Pagination Slice
   */
  const displayedPlaces = useMemo(() => {
    return filteredPlaces.slice(0, visibleCount);
  }, [filteredPlaces, visibleCount]);

  const fetchAttractions = async (lat, lng) => {
    if (!lat || !lng) return;

    try {
      setIsCalculatingSuggestions(true);

      // TODO: Insert your actual API call here. 
      // (e.g., Google Places Service, Supabase Edge Function, or Overpass API)
      console.log(`Fetching nearby attractions for: ${lat}, ${lng}`);

      // Example of setting the state once data is fetched:
      // const data = await myGeocodingOrPlacesApi(lat, lng);
      // setNearbyAttractions(data);

    } catch (error) {
      console.error("Error fetching attractions:", error);
    } finally {
      setIsCalculatingSuggestions(false);
    }
  };


  // ============================================================================
  // 28. EVENT HANDLERS & BUSINESS LOGIC
  // ============================================================================

  // ---------------------------------------------------------------------------
  // A. Localization, Prompts & Newsletter Handlers
  // ---------------------------------------------------------------------------
  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleDismissNewsletterPrompt = () => {
    setShowNewsletterPrompt(false);
    localStorage.setItem('myjournal_newsletter_prompted', 'dismissed');
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const sanitizedEmail = newsletterEmail.trim();
    if (!sanitizedEmail) return;

    if (!supabaseClient) {
      toast.error("Database layer is not initialized.");
      return;
    }

    setIsNewsletterSubmitting(true);
    try {
      const { data: existingSubscriber, error: checkError } = await supabaseClient
        .from('subscribers')
        .select('email')
        .eq('email', sanitizedEmail)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingSubscriber) {
        toast.error(t('newsletter.duplicate_message', "You are already subscribed to this expedition list!"));
        return;
      }

      const { error: insertError } = await supabaseClient
        .from('subscribers')
        .insert([{ email: sanitizedEmail }]);

      if (insertError) {
        if (insertError.code === '23505') {
          toast.error(t('newsletter.duplicate_message', "You are already subscribed to this expedition list!"));
          return;
        }
        throw insertError;
      }

      toast.success(t('newsletter.success_message', 'Welcome aboard! Subscription successful.'));
      setNewsletterEmail('');
      setShowNewsletterPrompt(false);
      localStorage.setItem('myjournal_newsletter_prompted', 'subscribed');

    } catch (err) {
      console.error("Supabase Newsletter Pipeline Failure:", err);
      if (err.code === '23505' || (err.message && err.message.includes('unique constraint'))) {
        toast.error(t('newsletter.duplicate_message', "You are already subscribed to this expedition list!"));
      } else {
        toast.error(err.message || "Subscription failed. Please try again.");
      }
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // B. Database & Content Management Handlers (Supabase)
  // ---------------------------------------------------------------------------
  const fetchPlaces = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('travel_bucket_list')
        .select(`
        id, 
        created_at,
        place_name,
        locality, 
        category, 
        status, 
        cover_photo_url, 
        latitude, 
        longitude, 
        google_maps_url, 
        album_photos,
        restriction_level,
        governing_org,
        ai_article_preview:ai_article->story 
      `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const optimizedData = data.map(p => ({
        ...p,
        restriction_level: p.restriction_level || 'Open',
        hasArticle: !!p.ai_article_preview,
        ai_article: p.ai_article_preview ? { story: p.ai_article_preview.substring(0, 100) } : null
      }));

      setPlaces(optimizedData);
    } catch (err) {
      console.error("Fetch Error:", err.message);
      toast.error("Failed to load locations");
    }
  }, [toast]);

  const updateLocationLifecycle = async (locationId, nextStatus) => {
    const { data, error } = await supabaseClient.rpc('update_location_status_and_stage_notify', {
      target_id: locationId,
      new_status: nextStatus
    });

    if (error) {
      console.error('Failed to transition lifecycle state:', error.message);
      return null;
    }
    return data[0];
  };


  const handleOpenArticle = useCallback(async (place) => {
    if (!place) return;

    const isPublished = place.status === 'done';
    const slug = generateSlug(place.place_name || place.name || place.slug);

    if (isPublished) {
      window.history.pushState({ placeId: place.id }, '', `/place/${slug}`);
      updateSEO(place, { isGallery: false });
    }

    setviewingArticle(place);
    setIsArticleOpen(true);

    if (place.ai_article?.isFullContent) return;

    try {
      const { data, error } = await supabaseClient
        .from('travel_bucket_list')
        .select('ai_article, restriction_level, governing_org')
        .eq('id', place.id)
        .single();

      if (error) throw error;

      if (data) {
        const hydratedPlace = {
          ...place,
          restriction_level: data.restriction_level || place.restriction_level || 'Open',
          governing_org: data.governing_org || place.governing_org || 'Department of Wildlife Conservation / Local Authority',
          ai_article: {
            ...data.ai_article,
            isFullContent: true
          }
        };

        setviewingArticle(hydratedPlace);
        setPlaces(prev => prev.map(p => (p.id === place.id ? hydratedPlace : p)));

        if (isPublished) {
          updateSEO(hydratedPlace, { isGallery: false });
        }
      }
    } catch (err) {
      console.error("Content Fetch Failure:", err);
      toast.error("Error loading article content");
    }
  }, [supabaseClient, toast, setviewingArticle, setIsArticleOpen, setPlaces]);

  // ---------------------------------------------------------------------------
  // C. Social Interactions Handlers (Likes & Comments)
  // ---------------------------------------------------------------------------
  const fetchInteractions = async () => {
    try {
      const meta = await getInteractionMetadata();
      const userIp = meta.ip || '0.0.0.0';

      const [likesResponse, commentsResponse] = await Promise.all([
        supabaseClient.from('location_likes').select('location_id, ip_address'),
        supabaseClient.from('location_comments').select('*').order('created_at', { ascending: true })
      ]);

      const structuredLikes = (likesResponse.data || []).reduce((acc, curr) => {
        const locId = curr.location_id;
        if (!acc[locId]) acc[locId] = { count: 0, isUserLiked: false };
        acc[locId].count += 1;
        if (curr.ip_address === userIp) acc[locId].isUserLiked = true;
        return acc;
      }, {});

      const groupedComments = (commentsResponse.data || []).reduce((acc, curr) => {
        if (!acc[curr.location_id]) acc[curr.location_id] = [];
        acc[curr.location_id].push(curr);
        return acc;
      }, {});

      setLikes(structuredLikes);
      setComments(groupedComments);
    } catch (err) {
      console.error("Interaction Fetch Error:", err);
    }
  };

  const handleLike = async (locationId) => {
    const meta = await getInteractionMetadata();
    const userIp = meta.ip;
    const currentStatus = likes[locationId] || { count: 0, isUserLiked: false };

    if (currentStatus.isUserLiked) {
      const { error } = await supabaseClient
        .from('location_likes')
        .delete()
        .match({ location_id: locationId, ip_address: userIp });

      if (!error) {
        setLikes(prev => ({
          ...prev,
          [locationId]: {
            count: Math.max(0, (prev[locationId]?.count || 1) - 1),
            isUserLiked: false
          }
        }));
      }
    } else {
      const { error } = await supabaseClient
        .from('location_likes')
        .insert([{
          location_id: locationId,
          country: meta.country,
          city: meta.city,
          ip_address: userIp
        }]);

      if (!error) {
        setLikes(prev => ({
          ...prev,
          [locationId]: {
            count: (prev[locationId]?.count || 0) + 1,
            isUserLiked: true
          }
        }));
      }
    }
  };

  const handleOpenComments = async (place) => {
    // 1. Await your existing function to fetch the full article data
    await handleOpenArticle(place);

    // 2. Wait for the React state to update and the modal to render/animate
    setTimeout(() => {
      // 3. Target the comments section by ID and scroll it into view
      const commentsSection = document.getElementById('comments-discussion-section');
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 400); // Adjust this delay slightly if your modal animation takes longer
  };

  const submitComment = async (locationId, text) => {
    const meta = await getInteractionMetadata();
    const { data, error } = await supabaseClient
      .from('location_comments')
      .insert([{
        location_id: locationId,
        comment_text: text,
        country: meta.country,
        city: meta.city
      }])
      .select();

    if (error) return;
    if (data?.length > 0) {
      setComments(prev => ({
        ...prev,
        [locationId]: [...(prev[locationId] || []), data[0]]
      }));
    }
  };

  // ===========================================================================
  // 29. Map, Route Planner & External Service Handlers
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 1. Core Map Callbacks & Memoized Components
  // ---------------------------------------------------------------------------
  const handleLocationSelect = useCallback((lat, lng, dist) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      locality: dist || prev.locality
    }));
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedRoute);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedRoute(items); // Updates state and triggers map redraw
  };

  const MemoizedAddMap = useMemo(() => (
    <Suspense fallback={<div className="w-full h-full bg-slate-200 animate-pulse" />}>
      <MapSelectionComponent
        onMapReady={(map) => setAddMapInstance(map)}
        onLocationSelect={handleLocationSelect}
      />
    </Suspense>
  ), [handleLocationSelect]);

  // ---------------------------------------------------------------------------
  // 2. Data Fetching & External Service API Calls
  // ---------------------------------------------------------------------------

  const fetchRoutePlaceData = useCallback(async (coordsOrLat, optionalLng) => {
    let normalizedCoords = [];

    // 1. Normalize Route Coordinates
    if (Array.isArray(coordsOrLat)) {
      normalizedCoords = coordsOrLat
        .map(c => {
          if (Array.isArray(c)) return { lat: c[0], lng: c[1] };
          return { lat: c?.lat ?? c?.latitude, lng: c?.lng ?? c?.longitude };
        })
        .filter(c => c.lat != null && c.lng != null);
    } else if (typeof coordsOrLat === 'number' && typeof optionalLng === 'number') {
      normalizedCoords = [{ lat: coordsOrLat, lng: optionalLng }];
    } else {
      setNearbyAttractions([]);
      setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
      return;
    }

    if (normalizedCoords.length === 0) {
      setNearbyAttractions([]);
      setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
      return;
    }

    try {
      // Graceful fallback when Google Maps API / Places library is absent
      if (!window.google || !window.google.maps) {
        console.warn("Google Maps API unavailable; skipping route place fetch.");
        setNearbyAttractions([]);
        setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
        return;
      }

      const { PlacesService, PlacesServiceStatus } = await window.google.maps.importLibrary("places");
      if (!window.placesService) {
        window.placesService = new PlacesService(document.createElement('div'));
      }

      // 2. Sample Points along the Corridor (Up to 12 corridor points)
      const maxRequests = 12;
      const step = Math.max(1, Math.floor(normalizedCoords.length / maxRequests));
      const sampledPoints = normalizedCoords.filter((_, idx) => idx % step === 0).slice(0, maxRequests);

      // 3. Define Search Tasks (Radius set to 5000m corridor)
      const searchTasks = [
        { key: 'attractions', types: ['natural_feature', 'park'], radius: 5000 },
        { key: 'gas_stations', types: ['gas_station'], radius: 5000 },
        { key: 'restaurants', types: ['restaurant', 'cafe', 'food'], radius: 5000 },
        { key: 'lodgings', types: ['lodging', 'hotel'], radius: 5000 }
      ];

      // Slug helper fallback
      const createSlug = (text) => generateSlug(text);

      // Helper mapper for formatting place objects cleanly with consistent URL slugs
      const mapPlaceData = (place, categoryType) => {
        const pLat = place.geometry?.location?.lat ? place.geometry.location.lat() : null;
        const pLng = place.geometry?.location?.lng ? place.geometry.location.lng() : null;

        return {
          id: place.place_id,
          name: place.name || 'Unknown Location',
          slug: createSlug(place.name),
          category: categoryType,
          lat: pLat,
          lng: pLng,
          image: place.photos && place.photos.length > 0
            ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
            : 'https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/my-journal-logo.png',
          rating: place.rating || 0
        };
      };

      // Helper to sort by rating, cap strictly to 10 items max, and format objects
      const processCategoryResults = (items, category) => {
        return (items || [])
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)
          .map(p => mapPlaceData(p, category))
          .filter(p => p.lat != null && p.lng != null);
      };

      // 4. Run Concurrent Requests for each Task across sampled points
      const categoryResults = {};

      for (const task of searchTasks) {
        const searchPromises = sampledPoints.flatMap(point => {
          const location = new window.google.maps.LatLng(point.lat, point.lng);

          return task.types.map(targetType => {
            return new Promise((resolve) => {
              window.placesService.nearbySearch({
                location: location,
                radius: task.radius,
                type: targetType
              }, (results, status) => {
                if (status === PlacesServiceStatus.OK && results) {
                  resolve(results);
                } else {
                  console.warn(`Places API failed for ${targetType} with status: ${status}`);
                  resolve([]);
                }
              });
            });
          });
        });

        const allResultsArrays = await Promise.all(searchPromises);

        // Deduplicate results by place_id
        const uniqueMap = new Map();
        allResultsArrays.flat().forEach(place => {
          if (place && place.place_id && !uniqueMap.has(place.place_id)) {
            uniqueMap.set(place.place_id, place);
          }
        });

        categoryResults[task.key] = Array.from(uniqueMap.values());
      }

      // 5. Process & Filter Nature Attractions
      if (categoryResults.attractions) {
        const natureWords = new Set([
          'waterfall', 'viewpoint', 'peak', 'mountain', 'forest', 'reserve',
          'reservoir', 'lake', 'dam', 'river', 'falls', 'rock', 'cave',
          'beach', 'lagoon', 'conservation', 'stream', 'plateau', 'gorge', 'gap',
          'canyon', 'bay', 'cove', 'peninsula', 'island', 'reef', 'spring', 'sanctuary',
          'national', 'nature', 'biosphere', 'wilderness',
          'ella', 'kanda', 'gala', 'wewa', 'oya', 'ganga', 'kelle', 'hela', 'aranya', 'pokuna'
        ]);

        const commercialWords = new Set([
          'hotel', 'resort', 'villa', 'restaurant', 'cafe', 'bistro', 'inn', 'lodge',
          'stay', 'guesthouse', 'home', 'cottage', 'cabana', 'shop', 'store', 'bar',
          'spa', 'center', 'centre', 'suites', 'pvt', 'ltd', 'factory', 'ticket',
          'tours', 'agency', 'museum', 'gallery', 'boutique', 'retreat', 'glamping',
          'camp', 'safari', 'spice', 'gem', 'wood', 'rent', 'rental', 'club', 'pub',
          'lounge', 'mart', 'supermarket', 'studio', 'photography', 'inc', 'llc',
          'company', 'holdings', 'enterprises', 'estate', 'plantation', 'bungalow',
          'chalet', 'rooms', 'homestay', 'motel', 'tavern', 'jeep', 'cab', 'taxi',
          'tuktuk', 'skincare', 'bridal', 'sports', 'adventure', 'salon', 'beauty',
          'wellness', 'wedding', 'apparel', 'fashion', 'tailor', 'parlour', 'parlor',
          'fitness', 'gym', 'rafting', 'services', 'consultancy', 'care', 'clinic',
          'pharmacy', 'hardware', 'children', 'childrens', 'child', 'kids', 'kid',
          'playground', 'play', 'playarea', 'municipal', 'urban', 'memorial', 'jogging',
          'walking', 'recreation', 'recreational', 'amusement', 'town', 'city', 'public',
          'leisure', 'fun', 'waterpark'
        ]);

        const excludedTypes = [
          'store', 'restaurant', 'lodging', 'hotel', 'cafe', 'bar', 'shopping_mall',
          'taxi_stand', 'transit_station', 'bus_station', 'gas_station', 'car_repair',
          'finance', 'bank', 'atm', 'amusement_park', 'playground', 'place_of_worship',
          'church', 'hindu_temple', 'mosque', 'food', 'travel_agency', 'museum', 'casino',
          'bowling_alley', 'stadium', 'sports_complex', 'zoo', 'aquarium', 'art_gallery',
          'campground', 'rv_park', 'spa', 'gym', 'health', 'beauty_salon', 'hair_care',
          'laundry', 'real_estate_agency', 'school', 'university', 'library', 'hospital'
        ];

        const filteredAttractions = categoryResults.attractions.filter(place => {
          const rawName = (place.name || '').toLowerCase();
          const types = place.types || [];

          const nameTokens = rawName
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);

          const hasCommercialWord = nameTokens.some(token => commercialWords.has(token));
          if (hasCommercialWord) return false;

          const isCommercialCategory = types.some(t => excludedTypes.includes(t));
          if (isCommercialCategory) return false;

          const isNaturalType = types.includes('natural_feature');
          const hasNatureWord = nameTokens.some(token => natureWords.has(token));

          const isNatureSpot = isNaturalType || hasNatureWord;
          const hasGoodRating = place.rating === undefined || place.rating >= 3.0;

          return isNatureSpot && hasGoodRating;
        });

        // Filtered & capped strictly to top 10 nature attractions
        setNearbyAttractions(processCategoryResults(filteredAttractions, 'attraction'));
      } else {
        setNearbyAttractions([]);
      }

      // 6. Update Route Amenities State (Strictly capped to top 10 items per category)
      setRouteAmenities({
        gas_stations: processCategoryResults(categoryResults.gas_stations, 'gas_station'),
        restaurants: processCategoryResults(categoryResults.restaurants, 'restaurant'),
        lodgings: processCategoryResults(categoryResults.lodgings, 'lodging')
      });

    } catch (e) {
      console.error("Failed to fetch route places:", e);
      setNearbyAttractions([]);
      setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
    }
  }, [setNearbyAttractions, setRouteAmenities]);


  // ---------------------------------------------------------------------------
  // Weather Service Handler
  // ---------------------------------------------------------------------------

  // 1. Define the callback at the TOP LEVEL of the component
  const fetchRouteWeather = useCallback(async () => {
    if (!selectedRoute || selectedRoute.length === 0 || !CONFIG.API_KEYS.WEATHER) return;

    const fetchPromises = selectedRoute.map(async (place) => {
      const lat = place.latitude ?? place.lat;
      const lng = place.longitude ?? place.lng;
      if (!lat || !lng) return null;

      const placeKey = place.id || `${lat.toFixed(4)},${lng.toFixed(4)}`;

      if (fetchedWeatherKeys.current.has(placeKey)) return null;

      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${CONFIG.API_KEYS.WEATHER}&units=metric`
        );

        if (!res.ok) throw new Error("API Error");

        const data = await res.json();
        fetchedWeatherKeys.current.add(placeKey);

        const current = data.list[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        let nextDay = data.list.find(item => {
          const d = new Date(item.dt * 1000);
          return d.getDate() === tomorrow.getDate() && d.getHours() >= 12;
        });

        if (!nextDay) nextDay = data.list[8];

        return {
          key: placeKey,
          data: {
            current: {
              temp: Math.round(current.main.temp),
              condition: current.weather[0].main,
              description: current.weather[0].description
            },
            nextDay: {
              temp: Math.round(nextDay.main.temp),
              condition: nextDay.weather[0].main,
              description: nextDay.weather[0].description
            }
          }
        };
      } catch (e) {
        console.warn(`Weather fetch failed for ${placeKey}:`, e);
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);
    const newWeather = {};
    let hasUpdates = false;

    results.forEach(res => {
      if (res) {
        newWeather[res.key] = res.data;
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      setWeatherData(prev => ({ ...prev, ...newWeather }));
    }
  }, [selectedRoute]);

  // 1. Debounced Weather Fetching
  useEffect(() => {
    if (!selectedRoute || selectedRoute.length === 0 || !CONFIG.API_KEYS.WEATHER) return;

    // 800ms debounce to prevent rapid firing when adding multiple locations quickly
    const timer = setTimeout(fetchRouteWeather, 800);
    return () => clearTimeout(timer);
  }, [selectedRoute, fetchRouteWeather]);

  // 2. Attraction and En-Route Place Fetching
  useEffect(() => {
    // GUARD: Stop API calls if user has disabled nearby search
    if (!isNearbySearchEnabled) return;

    if (routeData?.coordinates && routeData.coordinates.length > 0) {
      fetchRoutePlaceData(routeData.coordinates);

      // Populate the un-used en-route bucket places state
      setEnRouteBucketPlaces(getPlacesAlongRoute(places, routeData.coordinates));
    }
  }, [routeData, isNearbySearchEnabled, fetchRoutePlaceData, places, getPlacesAlongRoute]);

  // 3. Meal and Lodging Suggestions Function
  const fetchMealAndLodgingSuggestions = async (currentRouteData) => {
    // GUARD: Early return if nearby search toggle is disabled
    if (!isNearbySearchEnabled) return;

    const milestones = calculateMealAndStayMilestones(currentRouteData);
    if (!milestones || !window.google?.maps) return;

    setIsCalculatingSuggestions(true);

    try {
      const { PlacesService } = await google.maps.importLibrary("places");
      const service = new PlacesService(document.createElement('div'));

      const searchNearCoord = (coord, type) => {
        return new Promise((resolve) => {
          service.nearbySearch(
            {
              location: new google.maps.LatLng(coord.lat, coord.lng),
              radius: 4000,
              type: type
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(
                  results.slice(0, 3).map((p) => ({
                    id: p.place_id,
                    name: p.name,
                    rating: p.rating,
                    vicinity: p.vicinity,
                    lat: p.geometry.location.lat(),
                    lng: p.geometry.location.lng()
                  }))
                );
              } else {
                resolve([]);
              }
            }
          );
        });
      };

      // ... milestone processing logic using searchNearCoord ...

    } catch (err) {
      console.error("Failed to fetch meal/stay suggestions:", err);
    } finally {
      setIsCalculatingSuggestions(false);
    }
  };



  // ---------------------------------------------------------------------------
  // 3. Effects & Autocomplete Initialization
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let placeChangedListener = null;

    const initPlannerAutocomplete = async () => {
      // 1. Guard clause: Ensure script and DOM element exist
      if (
        !window.google ||
        !window.google.maps ||
        !searchInputRef.current ||
        !(searchInputRef.current instanceof HTMLInputElement)
      ) {
        return;
      }

      // 2. Prevent duplicate instances on the same input
      if (autocompleteRef.current) {
        return;
      }

      try {
        const { Autocomplete } = await window.google.maps.importLibrary("places");

        autocompleteRef.current = new Autocomplete(searchInputRef.current, {
          fields: ["place_id", "geometry", "name", "formatted_address"],
        });

        // 3. Store the listener so we can clean it up later
        placeChangedListener = autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();

          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            const newWaypoint = {
              id: crypto.randomUUID(), // 4. Prevents duplicate React keys if same place is added twice
              place_id: place.place_id,
              place_name: place.name,
              lat: lat,
              lng: lng,
              latitude: lat,
              longitude: lng,
            };

            setSelectedRoute(prev => [...prev, newWaypoint]);

            if (searchInputRef.current) {
              searchInputRef.current.value = '';
            }

            setPlannerSearch('');
          }
        });
      } catch (error) {
        console.error("Failed to initialize Google Places Autocomplete:", error);
      }
    };

    if (isPlannerOpen) {
      initPlannerAutocomplete();
    }

    // 5. Cleanup Function
    return () => {
      // Remove the event listener to prevent duplicate triggers
      if (placeChangedListener) {
        placeChangedListener.remove();
      }

      // If the planner is closed and the input unmounts, clear the ref 
      // so it knows to re-initialize next time it opens.
      if (!isPlannerOpen) {
        autocompleteRef.current = null;
      }
    };
  }, [isPlannerOpen]);

  // ---------------------------------------------------------------------------
  // 4. Route Planning & Management Handlers
  // ---------------------------------------------------------------------------

  const toggleRoutePlace = useCallback((place) => {
    if (!place || !place.id) return;

    const isCurrentlySelected = (selectedRoute || []).some(p => p.id === place.id);
    const level = String(place.restriction_level || '').trim().toLowerCase();
    const isRestrictedEntry = ['high', 'restricted'].includes(level);

    // Trigger location preview/modal if selecting a restricted place
    if (!isCurrentlySelected && isRestrictedEntry && typeof handleViewLocation === 'function') {
      handleViewLocation(place);
    }

    setSelectedRoute(prev => {
      const currentList = prev || [];
      const exists = currentList.some(p => p.id === place.id);
      const selectionPool = exists
        ? currentList.filter(p => p.id !== place.id)
        : [...currentList, place];

      if (selectionPool.length === 0) return [];
      if (!userCoords?.lat || !userCoords?.lng) return selectionPool;

      // Nearest Neighbor Route Optimization starting from user coordinates
      const optimizedRoute = [];
      const remainingOptions = [...selectionPool];
      let currentPoint = { lat: userCoords.lat, lng: userCoords.lng };

      while (remainingOptions.length > 0) {
        let nearestIndex = 0;
        let shortestDistance = Infinity;

        for (let i = 0; i < remainingOptions.length; i++) {
          const item = remainingOptions[i];
          const itemLat = item.latitude ?? item.lat;
          const itemLng = item.longitude ?? item.lng;

          if (itemLat == null || itemLng == null) continue;

          // Assumes calculateDistance helper is defined in scope
          const distance = calculateDistance(
            currentPoint.lat,
            currentPoint.lng,
            itemLat,
            itemLng
          );

          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestIndex = i;
          }
        }

        const nextStop = remainingOptions.splice(nearestIndex, 1)[0];
        optimizedRoute.push(nextStop);

        const nextLat = nextStop?.latitude ?? nextStop?.lat;
        const nextLng = nextStop?.longitude ?? nextStop?.lng;
        if (nextLat != null && nextLng != null) {
          currentPoint = { lat: nextLat, lng: nextLng };
        }
      }

      return optimizedRoute;
    });
  }, [selectedRoute, userCoords, handleViewLocation, setSelectedRoute]);


  const handleSelectSuggestion = useCallback((attr) => {
    if (!attr) return;

    const newLocation = {
      ...attr,
      id: attr.id,
      place_name: attr.place_name || attr.name || 'Selected Place',
      latitude: attr.latitude ?? attr.lat,
      longitude: attr.longitude ?? attr.lng
    };

    setSelectedRoute(prev => {
      if (prev.some(p => p.id === newLocation.id)) return prev;
      return [...prev, newLocation];
    });

    if (typeof setIsPlannerOpen === 'function') {
      setIsPlannerOpen(true);
    }
  }, []);

  const handleSetDestination = useCallback((name, lat, lng) => {
    const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);
    const parsedLng = typeof lng === 'number' ? lng : parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    const destObj = {
      id: `dest-${Date.now()}`,
      place_name: name || 'Destination',
      latitude: parsedLat,
      longitude: parsedLng
    };

    setDestination(destObj);
    setSelectedRoute([destObj]);

    if (typeof fetchAttractions === 'function') {
      fetchAttractions(parsedLat, parsedLng);
    }
  }, [fetchAttractions]);

  const clearSelectedRoute = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all selected locations?")) {
      setSelectedRoute([]);
      if (setRouteData) setRouteData(null);
      if (setRouteDistance) setRouteDistance(0);
    }
  }, [setRouteData, setRouteDistance]);

  const handleReset = useCallback(() => {
    // 1. Reset Inputs, Selections & UI Interactivity
    if (setPlannerSearch) setPlannerSearch('');
    if (setDestination) setDestination(null);
    if (setHoveredPlaceId) setHoveredPlaceId(null);
    if (setSelectedLocation) setSelectedLocation(null);

    // 2. Reset Route Data & Metrics
    if (setSelectedRoute) setSelectedRoute([]);
    if (setRouteData) setRouteData(null);
    if (setRouteDistance) setRouteDistance(0);

    // 3. Reset Extracted Spatial Data & Amenities
    if (setRouteAmenities) setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
    if (setNearbyAttractions) setNearbyAttractions([]);
    if (setEnRouteAttractions) setEnRouteAttractions([]);
    if (setEnRouteBucketPlaces) setEnRouteBucketPlaces([]);

    // 4. Map Layer & Ref Cleanup
    const targetMap = mapInstanceRef?.current || mapRef?.current;
    if (!targetMap) return;

    // Clear active route polyline if present
    if (routeLineRef?.current) {
      if (targetMap.hasLayer(routeLineRef.current)) {
        targetMap.removeLayer(routeLineRef.current);
      }
      routeLineRef.current = null;
    }

    // Clear registered dynamic markers from Map Registry
    if (markerRegistryRef?.current) {
      const targetPrefixes = ['gas-', 'rest-', 'hotel-', 'attr-', 'nearby-', 'route-'];

      Object.keys(markerRegistryRef.current).forEach((key) => {
        if (targetPrefixes.some((prefix) => key.startsWith(prefix))) {
          const marker = markerRegistryRef.current[key];
          if (marker && targetMap.hasLayer(marker)) {
            targetMap.removeLayer(marker);
          }
          delete markerRegistryRef.current[key];
        }
      });
    }

    // Clear legacy nearby markers array
    if (nearbyMarkersRef?.current) {
      nearbyMarkersRef.current.forEach((item) => {
        const markerObj = item?.marker || item;
        if (markerObj && targetMap.hasLayer(markerObj)) {
          targetMap.removeLayer(markerObj);
        }
      });
      nearbyMarkersRef.current = [];
    }
  }, [
    setPlannerSearch,
    setDestination,
    setHoveredPlaceId,
    setSelectedLocation,
    setSelectedRoute,
    setRouteData,
    setRouteDistance,
    setRouteAmenities,
    setNearbyAttractions,
    setEnRouteAttractions,
    setEnRouteBucketPlaces,
    mapInstanceRef,
    mapRef,
    routeLineRef,
    markerRegistryRef,
    nearbyMarkersRef
  ]);

  // ---------------------------------------------------------------------------
  // 5. Route Sharing, Exporting & QR Code Generator
  // ---------------------------------------------------------------------------
  const generateGoogleMapsUrl = (points) => {
    if (!points || points.length === 0) return "";
    const baseUrl = "https://www.google.com/maps/dir/";
    const stops = points.map(p => `${p.latitude},${p.longitude}`).join('/');
    return `${baseUrl}${stops}`;
  };

  const shareRoute = () => {
    if (selectedRoute.length < 2) return;
    const origin = `${selectedRoute[0].latitude},${selectedRoute[0].longitude}`;
    const destination = `${selectedRoute[selectedRoute.length - 1].latitude},${selectedRoute[selectedRoute.length - 1].longitude}`;
    const waypoints = selectedRoute.slice(1, -1).map(p => `${p.latitude},${p.longitude}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const showQRCode = (points, name = "My Travel Route") => {
    const universalUrl = generateGoogleMapsUrl(points);
    if (!universalUrl) return;

    const existing = document.getElementById('qr-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = "qr-modal-overlay";
    overlay.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-6";

    const modal = document.createElement('div');
    modal.className = "bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full border border-slate-100";
    modal.onclick = (e) => e.stopPropagation();
    overlay.onclick = () => overlay.remove();

    modal.innerHTML = `
      <div class="text-center">
          <p class="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Scan to Navigate</p>
          <h3 class="text-sm font-black uppercase text-slate-800 leading-tight mb-4 px-4 line-clamp-2">${name}</h3>
      </div>
      <div class="p-5 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
          <div id="qrcode-canvas"></div>
      </div>
      <div class="w-full space-y-3">
          <button id="copy-link-btn" class="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">Copy Link</button>
          <button id="whatsapp-modal-btn" class="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95">WhatsApp</button>
          <button id="close-qr-btn" class="w-full py-3 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-slate-600">Dismiss</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => {
      const qrContainer = document.getElementById("qrcode-canvas");
      if (qrContainer) {
        qrContainer.innerHTML = '';
        const root = createRoot(qrContainer);
        root.render(
          <QRCodeSVG value={universalUrl} size={200} bgColor="#f8fafc" fgColor="#0f172a" level="H" includeMargin={false} />
        );
      }
    }, 50);

    modal.querySelector('#close-qr-btn').onclick = () => overlay.remove();
    modal.querySelector('#copy-link-btn').onclick = () => {
      navigator.clipboard.writeText(universalUrl);
      toast.success("Link copied to clipboard!");
    };
    modal.querySelector('#whatsapp-modal-btn').onclick = () => {
      const text = encodeURIComponent(`Check out my travel route: ${universalUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    };
  };

  const downloadRouteFile = (type = 'gpx') => {
    if (!routeData || !routeData.coordinates) {
      toast.info("Please calculate a route first!");
      return;
    }

    const coords = routeData.coordinates;
    const routeName = `MyJournal_Route_${new Date().toISOString().split('T')[0]}`;
    let content = "";
    let mimeType = "";

    if (type === 'gpx') {
      mimeType = "application/gpx+xml";
      content = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="My Journal" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>${routeName}</name><trkseg>
      ${coords.map(c => `<trkpt lat="${c.lat}" lon="${c.lng}"></trkpt>`).join('\n      ')}
  </trkseg></trk>
</gpx>`;
    } else if (type === 'kml') {
      mimeType = "application/vnd.google-earth.kml+xml";
      content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document><name>${routeName}</name><Placemark><name>Path</name><LineString><tessellate>1</tessellate><coordinates>
          ${coords.map(c => `${c.lng},${c.lat},0`).join(' ')}
  </coordinates></LineString></Placemark></Document>
</kml>`;
    }

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${routeName}.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Route exported as ${type.toUpperCase()}`);
    } catch (err) {
      toast.error("Download failed. Check browser permissions.");
    }
  };

  const handleShare = async (e, place, isGallery = false) => {
    if (e) e.stopPropagation();
    if (!place) return;

    const slug = generateSlug(place.place_name);
    const url = `${window.location.origin}/${isGallery ? 'gallery' : 'place'}/${slug}`;
    const shareText = isGallery
      ? `Explore the photo gallery for ${place.place_name} on My Journal: ${url}`
      : `Check out this amazing spot on My Journal: ${place.place_name} ${url}`;

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    };

    const copied = await copyToClipboard(shareText);
    if (copied) toast.success(isGallery ? "Gallery link copied!" : "Link & details copied!");

    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `${place.place_name} | My Journal`,
          text: shareText.replace(url, ''),
          url: url
        });
        return;
      } catch { }
    }

    setSharingData({ name: place.place_name, url, text: shareText, isGallery });
    setIsShareModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // 6. UI Helpers, Localization & Form Actions
  // ---------------------------------------------------------------------------
  const handleAlbumClick = (albumUrl) => {
    if (!albumUrl) {
      toast.warning("No album link available for this location.");
      return;
    }
    window.open(albumUrl, '_blank');
  };

  function handleViewLocation(location) {
    setSelectedLocation(location);
    const level = String(location.restriction_level || '').trim().toLowerCase();
    const shouldShowModal = ['high', 'restricted'].includes(level);
    if (shouldShowModal) setShowSafetyModal(true);
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    const isDuplicate = places.some(place =>
      place.place_name.toLowerCase() === formData.place_name.trim().toLowerCase() ||
      (place.latitude === parseFloat(formData.latitude) && place.longitude === parseFloat(formData.longitude))
    );

    if (isDuplicate) {
      toast.error("This spot is already in the Journal!");
      return;
    }

    try {
      const { error } = await supabaseClient.from('pending_approvals').insert([{
        place_name: formData.place_name, locality: formData.locality,
        latitude: formData.latitude, longitude: formData.longitude,
        map_url: formData.map_url, image_url: formData.image_url,
        category: formData.category, status: 'pending'
      }]);
      if (error) throw error;
      toast.success("Success! Spot submitted for review.");
      setIsAddOpen(false);
      setFormData({ place_name: "", category: "Location", latitude: null, longitude: null, locality: "", map_url: "" });
    } catch (err) {
      toast.error("Failed to submit: " + err.message);
    }
  };

  const getActiveContent = (field) =>
    translatedContent?.[field] || viewingArticle?.ai_article?.[field] || "";

  const getLocalizedValue = (item, baseKey, currentLanguage = 'en') => {
    if (!item) return '';
    const lang = currentLanguage.split('-')[0].toLowerCase();
    if (lang === 'en') return item[baseKey] || '';
    const localizedKey = `${baseKey}_${lang}`;
    return item[localizedKey] || item[baseKey] || '';
  };

  const handleCloseLegalModal = () => {
    setIsPrivacyOpen(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('myjournal_cookie_consent', 'granted');
    setShowCookieBanner(false);
    initClarity();
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'cookie_consent_granted' });
    }
    toast.success("Preferences saved!", { id: "cookie-consent" });
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('myjournal_cookie_consent', 'denied');
    setShowCookieBanner(false);
    toast.info("Optional tracking cookies declined.", { id: "cookie-consent" });
  };

  // ============================================================================
  // 30. LIFECYCLE EFFECTS (API calls, Observer, Maps, Theme)
  // ============================================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSeenPrompt = localStorage.getItem('myjournal_newsletter_prompted');
    if (hasSeenPrompt) return;

    const isFeatureActive = isArticleOpen || activeId !== null || isPlannerOpen || isAddOpen;
    let timer;

    if (isFeatureActive) {
      timer = setTimeout(() => setShowNewsletterPrompt(true), 3000);
    } else {
      timer = setTimeout(() => setShowNewsletterPrompt(true), 10000);
    }

    return () => clearTimeout(timer);
  }, [isArticleOpen, activeId, isPlannerOpen, isAddOpen]);

  useEffect(() => {
    if (i18n.language !== 'en') i18n.changeLanguage('en');
  }, []);

  useEffect(() => {
    const findAllowedModels = async () => {
      try {
        const apiKey = import.meta.env.VITE_ARTICLE_KEY;
        if (!apiKey) return;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Failed to fetch model list");
      } catch (err) {
        console.error("CRITICAL: Your API Key cannot even list models:", err.message);
      }
    };
    findAllowedModels();
  }, []);

  useEffect(() => {
    let isCurrent = true;
    let activeToastId = null;

    const content = viewingArticle?.ai_article;
    const baseLang = i18n.language?.split('-')[0].toLowerCase() || 'en';
    const shouldTranslate = isArticleOpen && content?.isFullContent && baseLang !== 'en';

    const runTranslation = async () => {
      setIsTranslating(true);

      // Look up the full language name from your existing SUPPORTED_LANGUAGES object
      const targetLangName = SUPPORTED_LANGUAGES[baseLang] || baseLang.toUpperCase();

      // Update the toast to show the dynamic translation message
      activeToastId = toast.loading(`Translating to ${targetLangName}`);

      try {
        const { isFullContent, ...cleanContent } = content;
        const result = await translateContentService(cleanContent, i18n.language, viewingArticle?.id);
        if (isCurrent) {
          setTranslatedContent({ ...result, isFullContent: true });
          toast.success("Translation complete!", { id: activeToastId });
          activeToastId = null;
        }
      } catch (e) {
        if (isCurrent) {
          toast.error("Translation failed. Showing original.", { id: activeToastId });
          setTranslatedContent(null);
          activeToastId = null;
        }
      } finally {
        if (isCurrent) setIsTranslating(false);
      }
    };

    if (shouldTranslate) {
      runTranslation();
    } else {
      setTranslatedContent(null);
    }

    return () => {
      isCurrent = false;
      if (activeToastId) toast.dismiss(activeToastId);
    };
  }, [viewingArticle?.id, viewingArticle?.ai_article?.isFullContent, i18n.language, isArticleOpen]);

  useEffect(() => {
    const watchId = getUserLocation(setUserCoords, toast);

    fetchPlaces();
    fetchInteractions();
    logVisit();

    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');

    const normalizedPath = window.location.pathname
      .toLowerCase()
      .replace(/\/$/, '');

    const placeMatch = window.location.pathname.match(/\/place\/([^/]+)/i);
    const galleryMatch = window.location.pathname.match(/\/gallery\/([^/]+)/i);

    // =====================================================================
    // INITIAL ROUTE / DEEP-LINK HANDLING
    // =====================================================================

    if (placeMatch && placeMatch[1]) {
      // Direct Place URL:
      // /place/location-name
      pendingRouteRef.current = {
        type: 'place',
        slug: placeMatch[1]
      };

    } else if (galleryMatch && galleryMatch[1]) {
      // Direct Photo Gallery URL:
      // /gallery/location-name
      pendingRouteRef.current = {
        type: 'gallery',
        slug: galleryMatch[1]
      };

    } else if (normalizedPath === '/videos') {
      // Direct Video Gallery URL:
      // /videos
      //
      // The VideoGallery component is controlled by activeVideos,
      // so load the library and populate activeVideos directly.
      fetchVideoLibrary().then((videos) => {
        if (videos.length > 0) {
          setActiveVideos(videos);
          hasHandledDeepLink.current = true;
        } else {
          console.warn('No active videos found in hub_videos.');
        }
      });

    } else {
      // ===================================================================
      // LEGAL / UTILITY ROUTES
      // ===================================================================

      const activeLegalView = ['privacy', 'terms', 'about'].find(
        (view) => viewParam === view || normalizedPath === `/${view}`
      );

      if (activeLegalView) {
        setLegalView(activeLegalView);
        setIsPrivacyOpen(true);

      } else if (
        viewParam === 'route_planner' ||
        normalizedPath === '/route-planner'
      ) {
        setIsPlannerOpen(true);

      } else if (
        viewParam === 'suggest_spot' ||
        normalizedPath === '/suggest-spot'
      ) {
        setIsAddOpen(true);
      }
    }

    // =====================================================================
    // COOKIE CONSENT / CLARITY INITIALIZATION
    // =====================================================================

    if (localStorage.getItem('myjournal_cookie_consent') === 'granted') {
      initClarity();

      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];

        window.dataLayer.push({
          event: 'cookie_consent_granted'
        });
      }
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };

  }, [setUserCoords, toast, fetchVideoLibrary]);


  // =======================================================================
  // 31. VISITATION LOGGING (ARTICLE & GALLERY)
  // =======================================================================
  useEffect(() => {
    if (isArticleOpen && viewingArticle?.place_name) {
      if (lastLoggedArticleRef.current !== viewingArticle.id) {
        logVisit(`Place/${viewingArticle.place_name}`);
        lastLoggedArticleRef.current = viewingArticle.id;
      }
    } else if (!isArticleOpen) {
      lastLoggedArticleRef.current = null;
    }

    if (activeId && places.length > 0) {
      if (lastLoggedGalleryRef.current !== activeId) {
        const activePlace = places.find(p => p.id === activeId);
        if (activePlace?.place_name) {
          logVisit(`Gallery/${activePlace.place_name}`);
          lastLoggedGalleryRef.current = activeId;
        }
      }
    } else if (!activeId) {
      lastLoggedGalleryRef.current = null;
    }
  }, [isArticleOpen, viewingArticle, activeId, places]);

  // =======================================================================
  // 32. INITIAL ROUTE & DEEP-LINKING HANDLER
  // =======================================================================

  useEffect(() => {
    if (hasHandledDeepLink.current) return;

    const { type, slug } = pendingRouteRef.current || {};
    if (!places.length || !type || !slug) return;

    try {
      const decodedName = decodeURIComponent(slug).replace(/-/g, ' ');

      const targetPlace = places.find(p =>
        p.place_name?.toLowerCase() === decodedName.toLowerCase() ||
        (typeof generateSlug === 'function' && generateSlug(p.place_name) === slug)
      );

      if (!targetPlace) {
        toast.error("Location not found.");
        pendingRouteRef.current = { type: null, slug: null };
        return;
      }

      if (type === 'gallery') {
        setActiveId(targetPlace.id);
      } else if (type === 'place') {
        // 👇 TRIGGER YOUR EXISTING FUNCTION INSTEAD OF MANUAL STATES
        handleOpenArticle(targetPlace);
      }

      hasHandledDeepLink.current = true;
      pendingRouteRef.current = { type: null, slug: null };

    } catch (err) {
      toast.error("Invalid location link.");
      pendingRouteRef.current = { type: null, slug: null };
    }
  }, [places, setActiveId]);

  // =======================================================================
  // 33. MASTER DYNAMIC SEO & META TAG SYNCHRONIZER
  // =======================================================================
  useEffect(() => {
    // Wait if deep-link processing is actively pending
    if (pendingRouteRef.current.type && hasHandledDeepLink?.current === false) return;

    const activeGalleryPlace = activeId ? places.find(p => p.id === activeId) : null;

    if (activeGalleryPlace) {
      // 1. Active Photo Gallery View
      updateSEO(activeGalleryPlace, { isGallery: true });
    } else if (isArticleOpen && viewingArticle) {
      // 2. Active Place Article Detail View
      updateSEO(viewingArticle, { isGallery: false });
    } else {
      // 3. Main Catalog View (Handles Filter Tag & Search Queries dynamically)
      updateSEO(null, {
        category: filterTag,
        searchTerm: debouncedSearch
      });
    }
  }, [activeId, viewingArticle, isArticleOpen, places, filterTag, debouncedSearch]);

  // =======================================================================
  // 34. PAGINATION RESET ON FILTER CHANGE
  // =======================================================================
  useEffect(() => {
    setVisibleCount(20);
  }, [filterTag, debouncedSearch, statusFilter]);


  useEffect(() => {
    // Reset the log flag and revert URL when the add panel is closed
    if (!isAddOpen) {
      hasLoggedAddOpen.current = false;
      if (window.location.pathname === '/add') {
        window.history.pushState({ modalOpen: false }, '', '/');
      }
    }

    if (isAddOpen) {
      // 1. Sync URL for the Add Function
      if (window.location.pathname !== '/add') {
        window.history.pushState({ modalOpen: true }, '', '/add');
      }

      // 2. Handle the browser back button to close the panel
      const handlePopState = () => setIsAddOpen(false);
      window.addEventListener('popstate', handlePopState);

      // Analytics logging (fires once per modal open)
      if (!hasLoggedAddOpen.current) {
        logVisit('Add Function');
        hasLoggedAddOpen.current = true;
      }

      let autocompleteInstance = null;

      const initAutocomplete = async () => {
        if (!window.google || !window.google.maps) return;

        try {
          const { Autocomplete } = await google.maps.importLibrary("places");
          const input = document.getElementById('location-search');
          if (!input) return;

          autocompleteInstance = new Autocomplete(input, {
            fields: ["address_components", "geometry", "name", "url"],
            componentRestrictions: { country: "lk" } // Country restriction
          });

          autocompleteInstance.addListener("place_changed", () => {
            const place = autocompleteInstance.getPlace();
            if (!place.geometry || !place.geometry.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            const components = place.address_components || [];
            const locality = components.find(c => c.types.includes("administrative_area_level_2"))?.long_name ||
              components.find(c => c.types.includes("locality"))?.long_name || "";

            // Auto-fill form state with Google Places details
            setFormData(prev => ({
              ...prev,
              place_name: place.name,
              latitude: parseFloat(lat.toFixed(6)),
              longitude: parseFloat(lng.toFixed(6)),
              locality: locality,
              map_url: place.url
            }));

            // Map Visual Sync: Fly to location AND drop yellow marker
            if (addMapInstance) {
              addMapInstance.flyTo([lat, lng], 16, {
                animate: true,
                duration: 1.5
              });

              // Clear previous temporary search markers
              if (tempMarkerRef.current) {
                addMapInstance.removeLayer(tempMarkerRef.current);
              }

              // Drop signature yellow marker on search result
              tempMarkerRef.current = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: '#facc15',
                color: '#ca8a04',
                weight: 3,
                fillOpacity: 1
              }).addTo(addMapInstance);
            }
          });
        } catch (err) {
          console.error("Autocomplete init error:", err);
        }
      };

      // Retry loop until Google Maps JS SDK is loaded
      const retryInterval = setInterval(() => {
        if (window.google?.maps) {
          initAutocomplete();
          clearInterval(retryInterval);
        }
      }, 500);

      return () => {
        clearInterval(retryInterval);
        if (window.google?.maps?.event && autocompleteInstance) {
          google.maps.event.clearInstanceListeners(autocompleteInstance);
        }
        // 3. Cleanup the back button listener
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isAddOpen, addMapInstance]);

  useEffect(() => {
    if (!isPlannerOpen) {
      hasLoggedPlanOpen.current = false;
      // Revert URL when the planner is closed
      if (window.location.pathname === '/plan') {
        window.history.pushState({ modalOpen: false }, '', '/');
      }
      return;
    }

    // 1. Sync URL for the Plan Function
    if (window.location.pathname !== '/plan') {
      window.history.pushState({ modalOpen: true }, '', '/plan');
    }

    // 2. Handle the browser back button to close the planner
    const handlePopState = () => setIsPlannerOpen(false);
    window.addEventListener('popstate', handlePopState);

    if (isPlannerOpen && places.length > 0 && !hasLoggedPlanOpen.current) {
      logVisit('Plan Function');
      hasLoggedPlanOpen.current = true;
    }

    const filteredForWeather = places.filter(place => {
      const search = (debouncedPlannerSearch || "").toLowerCase();
      if (!search) return place.status === 'done' || place.status === 'pending';
      const name = (place.place_name || "").toLowerCase();
      const locality = (place.locality || "").toLowerCase();
      const cat = (place.category || "").toLowerCase();
      return (place.status === 'done' || place.status === 'pending') &&
        (name.includes(search) || locality.includes(search) || cat.includes(search));
    });

    if (filteredForWeather.length > 0) fetchRouteWeather(filteredForWeather);

    return () => {
      // 3. Cleanup the event listener to prevent memory leaks during re-renders
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isPlannerOpen, debouncedPlannerSearch, places]);



  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filteredPlaces.length) {
        setVisibleCount((prev) => prev + 20);
      }
    }, { root: null, rootMargin: '400px', threshold: 0 });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
  }, [visibleCount, filteredPlaces.length]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    if (places.length > 0 && !hasHandledDeepLink.current) {
      const path = window.location.pathname;
      let isGalleryRoute = false;
      let slug = '';
      if (path.startsWith('/place/')) {
        slug = path.replace('/place/', '').replace(/\/$/, '');
      } else if (path.startsWith('/gallery/')) {
        isGalleryRoute = true;
        slug = path.replace('/gallery/', '').replace(/\/$/, '');
      }
      if (slug) {
        const decodedPlaceName = decodeURIComponent(slug).replace(/-/g, ' ');
        const target = places.find(p => {
          const dbName = p.place_name?.trim().toLowerCase();
          return dbName === decodedPlaceName.toLowerCase() || dbName === slug.replace(/-/g, ' ').toLowerCase();
        });
        if (target) {
          if (isGalleryRoute) {
            setviewingArticle(target);
            setSelectedLocation(target);
            updateSEO(target, true);
          } else {
            handleOpenArticle(target);
            updateSEO(target, false);
          }
          hasHandledDeepLink.current = true;
        }
      }
    }
  }, [places, handleOpenArticle]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const timer = setTimeout(() => setShowEngineHint(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // ============================================================================
  // 35. INTERNAL UI COMPONENTS (Overlays, Skeletons, Disclaimers)
  // ============================================================================

  const ArticleSkeleton = () => (
    <div className="animate-pulse space-y-6 p-4">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mb-4"></div>
      <div className="flex gap-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5"></div>
      </div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2rem] w-full mt-6"></div>
    </div>
  );

  const SafetyOverlay = ({ location, isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    if (!isOpen || !location) return null;

    const restrictionLevel = String(location.restriction_level || '').trim().toLowerCase();
    const isHighRisk = ['high', 'restricted'].includes(restrictionLevel);
    const currentLang = i18n.language || 'en';
    const placeName = getLocalizedValue(location, 'place_name', currentLang);
    const locality = getLocalizedValue(location, 'locality', currentLang);
    const governingOrg = location.governing_org || t('safety_overlay.default_authority', { defaultValue: 'local administrative departments' });

    const theme = {
      headerBg: isHighRisk ? 'bg-orange-500' : 'bg-blue-600',
      cardStyles: isHighRisk
        ? 'bg-orange-50 border-orange-100 text-orange-900 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-300'
        : 'bg-slate-50 border-slate-100 text-slate-800 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-300'
    };

    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all scale-100">
          <div className={`p-4 flex items-center justify-between text-white ${theme.headerBg}`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="font-black uppercase text-xs tracking-widest">{t('safety_overlay.title')}</span>
            </div>
            <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors active:scale-95" aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
          <div className="p-6">
            <div className="mb-5">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white leading-snug">{placeName}</h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{locality}</p>
              <div className="mt-3"><RestrictionBadge level={location.restriction_level} /></div>
            </div>
            <div className="space-y-4 text-sm">
              <div className={`p-4 rounded-xl border leading-relaxed ${theme.cardStyles}`}>
                <p className="font-bold mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
                  <ShieldCheck size={16} className={isHighRisk ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'} />
                  {t('safety_overlay.notice_title')}
                </p>
                <p className="text-sm">
                  {placeName} {t('safety_overlay.jurisdiction')} <span className="font-bold text-slate-900 dark:text-white">{governingOrg}</span>.
                  {isHighRisk ? (<span className="block mt-2 font-medium">{t('safety_overlay.controlled')}</span>) : (<span className="block mt-2 font-medium">{t('safety_overlay.guidelines')}</span>)}
                </p>
              </div>
              <p className="text-[10px] leading-relaxed italic text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                {t('safety_overlay.footer_disclaimer')}
              </p>
            </div>
            <button onClick={onClose} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all duration-150 shadow-sm">
              {t('safety_overlay.button')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const GeneralDisclaimer = () => {
    const { t } = useTranslation();
    return (
      <div className="bg-amber-50/50 dark:bg-amber-950/10 border-l-4 border-amber-500 p-6 my-8 rounded-r-xl shadow-sm border border-amber-100 dark:border-amber-900/20">
        <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400">
          <AlertCircle size={20} />
          <h3 className="font-bold uppercase tracking-wide text-sm">{t('general_disclaimer.title')}</h3>
        </div>
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <p><strong>{t('general_disclaimer.risk_title')}:</strong> {t('general_disclaimer.risk_desc')}</p>
          <p><strong>{t('general_disclaimer.accuracy_title')}:</strong> {t('general_disclaimer.accuracy_desc')}</p>
          <p><strong>{t('general_disclaimer.drone_title')}:</strong> {t('general_disclaimer.drone_desc')}</p>
          <p><strong>{t('general_disclaimer.liability_title')}:</strong> {t('general_disclaimer.liability_desc')}</p>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 36. MAIN RENDER STARTS
  // ============================================================================

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">

      {/* Toaster Notification */}

      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '1rem',
          },
        }}
      />

      {/* EDIT 1: ADDED THIS HIDDEN H1 FOR SEO PURPOSES */}
      <h1 className="sr-only">
        My Journal: Sri Lanka Adventure Travel, Waterfall Hunting, and Trekking Guide
      </h1>

      {/* --- CONSOLIDATED HEADER, NAVIGATION & DYNAMIC CATEGORY LANDING AREA --- */}
      <div className="flex flex-col w-full bg-white md:bg-transparent">

        {/* 1. HEADER SECTION */}
        <header className="p-4 md:px-10 md:pt-8 md:pb-4 flex justify-between items-start md:items-center bg-white md:bg-transparent border-b md:border-none">

          {/* LEFT SIDE: Logo & Identity */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="shrink-0 w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden p-1.5">
              <img
                src="https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/my-journal-logo.png"
                alt="My Journal Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col justify-center">
              {/* EDIT 2: CHANGED H1 TO H2 TO PREVENT DUPLICATE H1 PENALTIES (Visual styling remains identical) */}
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-800 leading-none">
                {t('common.title')}
              </h2>
              <p className="mt-2 text-slate-500 text-xs sm:text-sm font-medium leading-tight max-w-[200px] sm:max-w-none">
                {t('common.subtitle')}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: Navigation Actions */}
          {/* We use flex-col for mobile (stacking) and flex-row-reverse for desktop (order swap) */}
          <div className="flex flex-col md:flex-row-reverse gap-2 items-end">

            {/* LANGUAGE SELECTOR */}
            <div className="relative flex items-center">
              <Globe className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                onChange={changeLanguage}
                defaultValue={i18n.language}
                className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-[10px] font-black uppercase appearance-none focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer transition-all w-full"
              >
                <option value="en">EN</option>
                <option value="ar">AR</option>
                <option value="zh">CH</option>
                <option value="de">DE</option>
                <option value="es">ES</option>
                <option value="fr">FR</option>
                <option value="he">HE</option>
                <option value="hi">HI</option>
                <option value="in">IN</option>
                <option value="it">IT</option>
                <option value="ja">JA</option>
                <option value="kr">KO</option>
                <option value="nl">NL</option>
                <option value="pl">PL</option>
                <option value="pt">PT</option>
                <option value="ru">RU</option>
                <option value="si">SI</option>
                <option value="sr">SR</option>
                <option value="sv">SV</option>
                <option value="th">TH</option>
                <option value="tr">TR</option>
                <option value="uk">UK</option>
              </select>
              <ChevronDown className="absolute right-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* FILTER TRIGGER BUTTON */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all hover:bg-slate-800"
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 transition-transform duration-300 ${isFilterOpen ? 'text-white' : 'text-orange-400'}`} />
              <span>{isFilterOpen ? t('common.close') : t('common.filters')}</span>
            </button>


            {/* --- FIXED HUB SYSTEM --- */}
            {!isAddOpen && !isPlannerOpen && !isArticleOpen && !isShareModalOpen && (
              <div className="fixed bottom-4 right-3 z-[4000] flex flex-col items-end gap-2 max-w-[280px]">

                {/* HUB 1: SOCIAL HUB */}
                <div className="flex flex-col items-end gap-2 relative">
                  <div className={`flex flex-col items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-400 ${isSocialOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-90 pointer-events-none absolute'
                    }`}>
                    <a href="https://web.facebook.com/profile.php?id=61571059524746" target="_blank" rel="noreferrer" className="p-2.5 bg-[#1877F2] text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a href="https://www.pinterest.com/myjournalview" target="_blank" rel="noreferrer" className="p-2.5 bg-[#E60023] text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.261 7.929-7.261 4.162 0 7.397 2.966 7.397 6.93 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.033-1.002 2.324-1.492 3.121 1.12.345 2.3.533 3.524.533 6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.638 0 12.017 0z" />
                      </svg>
                    </a>
                    <a href="https://www.youtube-nocookie.com/channel/UCMm2MGAcrH51oXgJwx0O4cw" target="_blank" rel="noreferrer" className="p-2.5 bg-[#FF0000] text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                    <a href="https://www.tiktok.com/@myjournalview" target="_blank" rel="noreferrer" className="p-2.5 bg-black text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.13-.31-2.34-.25-3.41.33-.71.38-1.27 1.03-1.51 1.8-.31.82-.28 1.73.08 2.51.26.6.68 1.14 1.22 1.51.51.35 1.11.53 1.73.54 1.24-.03 2.38-.67 3-1.77.24-.46.33-.98.35-1.5.01-4.14 0-8.28.01-12.42z" />
                      </svg>
                    </a>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => {
                        setIsSocialOpen(!isSocialOpen);
                        setIsEngineOpen(false);
                        setIsVideoHubOpen?.(false);
                      }}
                      className={`relative z-10 w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300 rounded-full ${isSocialOpen
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        }`}
                    >
                      {isSocialOpen ? <X className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>


                {/* HUB 2: DIRECT VIDEO PLAYER */}
                <div className="relative">

                  {/* Blue Ping Effect */}
                  {activeVideos.length === 0 && (
                    <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-40 z-0"></span>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      // Close other FAB panels
                      setIsSocialOpen(false);
                      setIsEngineOpen(false);

                      // Videos are already preloaded — open immediately
                      if (videoLibrary.length > 0) {
                        setActiveVideos(videoLibrary);
                        return;
                      }

                      // Safety fallback if background loading has not finished yet
                      const videos = await fetchVideoLibrary();

                      if (videos.length > 0) {
                        setActiveVideos(videos);
                      } else {
                        console.warn("No active videos found in hub_videos.");
                      }
                    }}
                    className="relative z-10 w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-105 active:scale-95"
                    aria-label="Open Video Player"
                    title="Video Journal"
                  >
                    <Video className="w-5 h-5" />
                  </button>

                </div>

                {/* HUB 3: ENGINE HUB */}
                <div className="flex flex-col items-end gap-2 relative">

                  <div className={`flex flex-col gap-2 transition-all duration-400 ${isEngineOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-90 pointer-events-none absolute'
                    }`}>
                    <button
                      onClick={() => { setIsAddOpen(true); setIsEngineOpen(false); }}
                      className="flex items-center justify-end gap-2 bg-white text-slate-900 p-1.5 pr-2 rounded-2xl shadow-lg border border-slate-100"
                    >
                      <span className="font-black uppercase text-[8px] tracking-tighter ml-2">{t('hub.add', { defaultValue: 'Add' })}</span>
                      <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Plus className="w-4 h-4" /></div>
                    </button>
                    <button
                      onClick={() => { setIsPlannerOpen(true); setIsEngineOpen(false); }}
                      className="flex items-center justify-end gap-2 bg-white text-slate-900 p-1.5 pr-2 rounded-2xl shadow-lg border border-slate-100"
                    >
                      <span className="font-black uppercase text-[8px] tracking-tighter ml-2">{t('hub.plan', { defaultValue: 'Plan' })}</span>
                      <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white"><MapIcon className="w-6 h-6" /></div>
                    </button>
                  </div>

                  <div className="relative">
                    {!isEngineOpen && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-40 z-0"></span>}
                    <button
                      onClick={() => {
                        setIsEngineOpen(!isEngineOpen);
                        setIsSocialOpen(false);
                        setIsVideoHubOpen?.(false);
                        setShowEngineHint(false);
                      }}
                      className={`relative z-10 w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300 rounded-full ${isEngineOpen
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        }`}
                    >
                      {isEngineOpen ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </header>

        {/* 2. SEARCH, FILTER & SORT PANEL */}
        <div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out relative z-[50] mx-4 md:mx-10 ${isFilterOpen ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'}`}>
          <div className="overflow-hidden flex flex-col bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="p-5 flex flex-col">
              {/* Search & Sort */}
              <div className="flex flex-col md:flex-row gap-3 mb-4 w-full">
                <div className="flex-[2] relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('filters.search_placeholder')} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 font-bold text-[11px] outline-none border border-transparent focus:border-slate-200 transition-all text-slate-800" />
                </div>
                <div className="relative flex-1">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-slate-900 text-white border border-slate-900 rounded-xl px-4 py-3 text-[10px] font-black uppercase appearance-none focus:outline-none shadow-lg shadow-slate-900/20 cursor-pointer pr-10">
                    <option value="recent">{t('filters.sort_newest')}</option>
                    <option value="distance">{t('filters.sort_nearest')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-100/50 pointer-events-none" />
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 w-full pt-2 border-t border-slate-50">
                {['All', ...VALID_CATEGORIES].map(tag => {
                  const normalizedKey = tag.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <button key={tag} onClick={() => setFilterTag(tag)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all active:scale-95 ${filterTag === tag ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                      {t(`categories.${normalizedKey}`, { defaultValue: tag })}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Context */}
              <section className="w-auto mb-2 mt-4">
                <div className="p-6 bg-slate-50/70 border border-slate-100 rounded-3xl backdrop-blur-sm transition-all duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{t('discovery.index_heading')}</h3>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{t('discovery.scope_label')}: {filterTag === 'All' || !filterTag ? t('discovery.all_records') : t(`categories.${filterTag.toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: filterTag })}</span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-4xl transition-opacity duration-200">
                    {t(`categories.desc_${(filterTag || 'All').toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: CATEGORY_DESCRIPTIONS[filterTag] || CATEGORY_DESCRIPTIONS["All"] })}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200/50 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>• {t('discovery.meta_topographic')}</span>
                    <span>• {t('discovery.meta_backcountry')}</span>
                    <span>• {t('discovery.meta_geospatial')}</span>
                    <span>• {t('discovery.meta_route_index')}</span>
                  </div>
                </div>
              </section>

              {/* Close Button */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end w-full">
                <button type="button" onClick={() => setIsFilterOpen(false)} className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <X className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t('filters.apply_close')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={locationGridScrollRef}
        className="location-grid-scroll native-scroll-y flex-1 px-4 md:px-10 pb-20 no-scrollbar"
      >

        {/* 1. Main Grid: Location Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pt-2">
          {/* SKELETON STATE: Prevents CLS by reserving space while 'places' is empty/loading */}
          {places.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <article
                key={`skeleton-${i}`}
                className="group relative rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm min-h-[450px] animate-pulse"
              >
                <div className="w-full aspect-video bg-slate-200 dark:bg-slate-800"></div>
                <div className="p-4 flex flex-col flex-1 gap-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
                  <div className="mt-auto grid grid-cols-3 gap-2">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            /* ACTUAL CONTENT: Rendered once data exists */
            displayedPlaces.map((place, index) => {
              const isPriority = index < 2;
              const hasPhotos = place.album_photos && place.album_photos.length > 0;

              return (
                <article
                  key={place.id}
                  className="group relative rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-xl"
                >
                  <header
                    className={`relative w-full aspect-video bg-slate-200 dark:bg-slate-800 overflow-hidden ${hasPhotos ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={(e) => {
                      if (hasPhotos) {
                        e.stopPropagation();
                        setActiveId(place.id);
                      }
                    }}
                  >
                    {place.cover_photo_url && (
                      <img
                        src={getOptimizedUrl(place.cover_photo_url, 400, 70)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading={isPriority ? "eager" : "lazy"}
                        fetchPriority={isPriority ? "high" : "auto"}
                        alt={`${place.place_name} - Technical ${place.category} index record located in ${place.locality || "the backcountry wilderness"}, Sri Lanka.`}
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

                    {/* Top Status Overlay Badge */}
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <span
                        className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider shadow-sm ${place.status === "done" ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"
                          }`}
                      >
                        {place.status === "done"
                          ? t('places.status.visited', { defaultValue: '✨ Visited' })
                          : t('places.status.bucket_list', { defaultValue: '⏳ Bucket List' })}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 pr-4 pointer-events-none">
                      <h3 className="text-white text-xs md:text-sm font-extrabold uppercase tracking-tight">
                        {auditLocationName(place.place_name)}
                      </h3>
                    </div>
                  </header>

                  <main className="p-4 flex flex-col flex-1">
                    {/* Locality & Color-coded Category Bubble */}
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">
                          {place.locality || t('places.labels.explore', { defaultValue: 'Explore' })}
                        </span>
                      </div>

                      {/* Exact size & position preserved, only dynamic colors applied */}
                      <span
                        className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase shrink-0 transition-colors ${getCategoryColorClass(
                          place.category
                        )}`}
                      >
                        {t(`categories.${place.category ? place.category.toLowerCase() : 'default'}`, {
                          defaultValue: place.category
                        })}
                      </span>
                    </div>

                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      {userCoords
                        ? `${calculateDistance(userCoords.lat, userCoords.lng, place.latitude, place.longitude).toFixed(1)} ${t('places.labels.km_away', { defaultValue: 'KM AWAY' })}`
                        : t('places.labels.location_required', { defaultValue: 'Location Access Required' })}
                    </div>

                    {place.status !== "pending" && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/60">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLike(place.id); }}
                          className="flex items-center gap-1.5 group outline-none select-none pr-2"
                        >
                          <div className="p-2 rounded-full group-hover:bg-rose-50 dark:group-hover:bg-rose-950/30 transition-colors">
                            <Heart className={`w-4 h-4 ${likes[place.id] ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                          </div>
                          <span className={`text-[10px] font-black transition-colors ${likes[place.id]?.isUserLiked ? "text-rose-600" : "text-slate-500"}`}>
                            {likes[place.id]?.count || 0}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenComments(place);
                          }}
                          className="flex items-center gap-1.5 group outline-none select-none pr-2"
                        >
                          <div className="p-2 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-colors">
                            <MessageCircle className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{(comments[place.id] || []).length}</span>
                        </button>
                        <button
                          onClick={(e) => handleShare(e, place)}
                          className="flex items-center gap-1.5 group outline-none select-none"
                        >
                          <div className="p-2 rounded-full group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors">
                            <Share2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                          </div>
                        </button>
                      </div>
                    )}

                    <footer className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-100/60 dark:border-slate-800/60">
                      {place.google_maps_url && (
                        <button
                          onClick={() => window.open(place.google_maps_url, "_blank")}
                          className="flex flex-col items-center justify-center py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 active:scale-90 transition-all border border-slate-100/50 dark:border-slate-700/50"
                        >
                          <MapIcon className="w-4 h-4" />
                          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{t('places.labels.maps', { defaultValue: 'Maps' })}</span>
                        </button>
                      )}
                      {hasPhotos && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveId(place.id); }}
                          className="flex flex-col items-center justify-center py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-100/50 dark:border-orange-900/30"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{t('places.labels.gallery', { defaultValue: 'Gallery' })}</span>
                        </button>
                      )}
                      {place.ai_article?.story && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenArticle(place);
                          }}
                          className="flex flex-col items-center justify-center py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-100/50 dark:border-emerald-900/30"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{t('places.labels.read', { defaultValue: 'Read' })}</span>
                        </button>
                      )}
                    </footer>
                  </main>
                </article>
              );
            })
          )}
        </div>

        {/* 2. INFINITE SCROLL SENTINEL */}
        <div ref={sentinelRef} className="w-full flex justify-center items-center py-12">
          {visibleCount < filteredPlaces.length && <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />}
        </div>


        {/* =======================================================================
          3. DESTINATION FIELD GUIDES & TRAVEL LOGS (ADSENSE ACCORDION)
          Uses a native HTML <details> tag for instant crawler indexing and clean UI.
          ======================================================================= */}
        <details className="group w-full max-w-6xl mx-auto mb-10 [&::-webkit-details-marker]:hidden">
          {/* Button-like Toggle */}
          <summary className="list-none cursor-pointer flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all select-none active:scale-[0.98]">
            <BookOpen className="w-4 h-4 text-indigo-500 transition-transform duration-300 group-open:-rotate-12" />
            <span className="group-open:hidden">Read Detailed Field Guides & Travel Logs</span>
            <span className="hidden group-open:inline">Hide Exploration Directory</span>
          </summary>

          {/* Expanded Content */}
          <div className="overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-8 px-2 md:px-4 w-full">

              {/* Header */}
              <div className="mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('headers.directory_title')}
                </h2>
              </div>

              {/* Grid Directory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {places?.map((place) => {
                  // Abstracted Access Restriction Status Configuration
                  const restrictionLevel = place.restriction_level?.trim() || 'None';
                  let statusLabel = "No Restriction";
                  let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30";

                  if (restrictionLevel === 'Low') {
                    statusLabel = "Tickets Required";
                    badgeColor = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30";
                  } else if (restrictionLevel === 'High') {
                    statusLabel = "Permit Required";
                    badgeColor = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30";
                  } else if (restrictionLevel === 'Restricted') {
                    statusLabel = "No Entry";
                    badgeColor = "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30";
                  }

                  return (
                    <article
                      key={`visible-art-${place.id}`}
                      className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Metadata Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {place.category || "Adventure"}
                        </span>

                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {place.locality || "Sri Lanka"}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide inline-block border ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Title & Content */}
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {place.place_name} Travel Information
                      </h3>

                      <div className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-4 leading-relaxed">
                        <p>{place.ai_article_preview || place.ai_article?.story || "Detailed exploration logs are updating live via telemetry datasets."}</p>
                      </div>

                      {/* Footer Attribution Context */}
                      <div className="border-t border-slate-50 dark:border-slate-800/50 pt-3 text-xs text-slate-400 dark:text-slate-500">
                        <p>
                          <span className="font-semibold text-slate-500 dark:text-slate-400">Authority Context:</span> Verified under the jurisdiction of {place.governing_org || "local administrative departments"}.
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>

            </div>
          </div>
        </details>


        {/* 4. GOOGLE AD & EXPANDED LEGAL FOOTER */}
        {import.meta.env.VITE_ALLOW_ADSENSE === 'true' && (
          <div className="w-full max-w-5xl mx-auto px-4 min-h-[100px] mb-10 transition-all flex justify-center items-center overflow-hidden bg-slate-50 rounded-[2rem] border border-slate-100">
            {/* Google Ad */}
          </div>
        )}

        {/* ============================================================================
          APPLICATION FOOTER LAYER (SEO & ADSENSE COMPLIANCE NAVIGATION)
          ============================================================================ */}
        <footer className="py-12 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 transition-colors duration-200">
          <div className="max-w-6xl mx-auto px-6">

            {/* Policy & Expedition Disclaimer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left mb-10">

              {/* Safety & Localized Terrain Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <AlertCircle size={14} className="text-amber-500" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
                    {t('footer.safety_title')}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {t('footer.safety_body')}
                </p>
              </div>

              {/* Drone Operations & Technical Telemetry Disclaimer */}
              <div className="md:border-l md:border-slate-200 md:dark:border-slate-800 md:pl-10 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Video size={14} className="text-indigo-500" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
                    {t('footer.drone_title')}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {t('footer.drone_body')}
                </p>
              </div>
            </div>

            {/* ============================================================================
              LOCATION 4: RENDER THE NEWSLETTER COMPONENT (FULLY FUNCTIONAL)
              ============================================================================ */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-8 pb-4 my-2">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-100/40 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 transition-colors">

                {/* Newsletter Header Text */}
                <div className="space-y-1 text-left w-full md:w-auto">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">
                    {t('newsletter.title', 'Join the Expedition')}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {t('newsletter.subtitle', 'Get coordinates, field notes, and remote terrain tracking straight to your inbox.')}
                  </p>
                </div>

                {/* Newsletter Input/Action Form Matrix */}
                <form className="flex w-full md:w-auto max-w-md items-center gap-2" onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    placeholder={t('newsletter.placeholder', 'Your email address')}
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={isNewsletterSubmitting}
                    className="w-full md:w-64 px-3 py-2 text-[11px] font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors disabled:opacity-60"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isNewsletterSubmitting}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center min-w-[90px]"
                  >
                    {isNewsletterSubmitting ? t('newsletter.submitting', 'Saving...') : t('newsletter.subscribe', 'Subscribe')}
                  </button>
                </form>

              </div>
            </div>

            {/* Compliance Navigation Links */}
            <div className="flex flex-col items-center border-t border-slate-100 dark:border-slate-800 pt-8 gap-6">
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">

                {/* Privacy Policy Route */}
                <a
                  href="/?view=privacy"
                  className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setLegalView('privacy');
                    setIsPrivacyOpen(true);
                    window.history.pushState({}, '', '/?view=privacy');
                  }}
                >
                  {t('legal.privacy_title')}
                </a>

                {/* Terms of Service Route */}
                <a
                  href="/?view=terms"
                  className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setLegalView('terms');
                    setIsPrivacyOpen(true);
                    window.history.pushState({}, '', '/?view=terms');
                  }}
                >
                  {t('legal.terms_title')}
                </a>

                {/* Ad-Engine Trackable About Summary Route */}
                <a
                  href="/?view=about"
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 uppercase tracking-widest transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setLegalView('about');
                    setIsPrivacyOpen(true);
                    window.history.pushState({}, '', '/?view=about');
                  }}
                >
                  {t('footer.about')}
                </a>

                {/* Support Mailbox Routing */}
                <a
                  href="mailto:my.journal.view@gmail.com"
                  className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('mailto:my.journal.view@gmail.com', '_blank', 'noopener,noreferrer');
                  }}
                >
                  {t('footer.contact_support')}
                </a>
              </div>

              {/* Branding & Digital Rights Footer Metadata */}
              <div className="text-center">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-[0.3em]">
                  © {new Date().getFullYear()} {t('common.title')} • Hasitha Gunasekera
                </p>
                <p className="text-[8px] text-slate-300 dark:text-slate-600 uppercase font-medium mt-2 tracking-widest">
                  {t('footer.location')}
                </p>
              </div>

            </div>
          </div>
        </footer>

        {/* 5. SHARE DIALOG SYSTEM maintained */}
        {isShareModalOpen && sharingData && (
          <div className="fixed inset-0 z-[15000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsShareModalOpen(false)}
            ></div>

            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">
                  {sharingData.isGallery ? 'Share Gallery' : 'Share Journey'}
                </h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {sharingData.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* WhatsApp: Supports Text + Link */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(sharingData.text + " " + sharingData.url)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-colors group text-center"
                >
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">WhatsApp</span>
                </a>

                {/* Facebook: ONLY URL (Facebook handles the preview via your SEO tags) */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharingData.url)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors group text-center"
                >
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                    <span className="font-black text-lg">f</span>
                  </div>
                  <span className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">Facebook</span>
                </a>

                {/* X (Twitter): Supports Text + Link */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(sharingData.text)}&url=${encodeURIComponent(sharingData.url)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-200 transition-colors group text-center"
                >
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg shadow-slate-300 group-hover:scale-110 transition-transform">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">Twitter (X)</span>
                </a>

                {/* Copy Link: The most reliable way for Instagram/Stories */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sharingData.url);
                    toast.success("Link ready to paste!");
                    setIsShareModalOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-colors group text-center"
                >
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-tighter">Copy Link</span>
                </button>
              </div>

              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-full mt-8 py-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

      </div>

      {/* =======================================================================
        HUMAN VISUAL INTERFACE (DYNAMIC MODAL OVERLAY)
        ======================================================================= */}
      {isArticleOpen && viewingArticle && (() => {
        // ================================================================
        // 1. SAFELY PARSE AI_ARTICLE (Handles Objects & JSON Strings)
        // ================================================================
        let article = {};

        if (
          typeof viewingArticle.ai_article === 'object' &&
          viewingArticle.ai_article !== null
        ) {
          article = viewingArticle.ai_article;
        } else if (typeof viewingArticle.ai_article === 'string') {
          try {
            article = JSON.parse(viewingArticle.ai_article);
          } catch (e) {
            console.error("Failed to parse ai_article JSON:", e);
            article = {};
          }
        }

        // ================================================================
        // 2. ARTICLE CONTENT + TRANSLATION-AWARE PROSE FIELDS
        // ================================================================
        const metrics = article.metrics || {};
        const about = article.about || {};
        const highlights = article.highlights || [];

        /*
         * IMPORTANT:
         * These fields must read from translatedContent/getActiveContent first.
         * This prevents the Article Window from falling back to the
         * original English article when a translated version exists.
         */
        const seoIntro =
          getActiveContent('seo_intro') ||
          article.seo_intro ||
          '';

        const whyVisitSummary =
          translatedContent?.why_visit?.summary ||
          article.why_visit?.summary ||
          '';

        const storyText =
          getActiveContent('story') ||
          article.story ||
          (
            typeof viewingArticle.ai_article === 'string'
              ? viewingArticle.ai_article
              : ''
          );

        const historyText =
          getActiveContent('history') ||
          article.history ||
          '';

        // ================================================================
        // 3. SAFE FAQ EXTRACTION
        // ================================================================
        const rawFaqs =
          article.faqs ||
          article.faq ||
          article.faq_list ||
          [];

        const faqs = Array.isArray(rawFaqs) ? rawFaqs : [];

        // ================================================================
        // 4. REGULATORY METADATA & FALLBACKS
        // ================================================================
        const governingOrg =
          viewingArticle.governing_org ||
          'Department of Wildlife Conservation / Local Authority';

        const restrictionLevel =
          viewingArticle.restriction_level?.trim() ||
          'None';

        let statusLabel = "No Restriction";
        let badgeColor =
          "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30";

        if (restrictionLevel === 'Low') {
          statusLabel = "Tickets Required";
          badgeColor =
            "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30";
        } else if (restrictionLevel === 'High') {
          statusLabel = "Permit Required";
          badgeColor =
            "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30";
        } else if (restrictionLevel === 'Restricted') {
          statusLabel = "No Entry";
          badgeColor =
            "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30";
        }

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
              onClick={() => {
                setIsArticleOpen(false);
                setviewingArticle(null);
                window.history.replaceState(null, '', '/');
              }}
            ></div>

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

              {/* Header Image */}
              <div className="relative h-48 w-full shrink-0">
                <img
                  src={viewingArticle.cover_photo_url}
                  className="h-full w-full object-cover"
                  alt={getLocalizedValue(
                    viewingArticle,
                    'place_name',
                    i18n.language
                  )}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsArticleOpen(false);
                    setviewingArticle(null);
                    window.history.replaceState(null, '', '/');
                  }}
                  className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-gray-500/80 hover:bg-rose-600 text-white rounded-full transition-all shadow-sm backdrop-blur-sm"
                  aria-label={t('article.close', { defaultValue: 'Close' })}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                ref={articleWindowScrollRef}
                className="article-window-scroll native-scroll-y p-8 scrollable-list no-scrollbar bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >

                {/* ============================================================
              META BAR
          ============================================================ */}
                <div className="flex items-center justify-between mb-4">

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${getCategoryColorClass(
                        viewingArticle.category
                      )}`}
                    >
                      {t(
                        `categories.${viewingArticle.category?.toLowerCase()}`,
                        {
                          defaultValue: viewingArticle.category
                        }
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setIsArticleOpen(false);
                        setActiveId(viewingArticle.id);
                        window.history.replaceState(null, '', '/');
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-900/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors animate-pulse"
                    >
                      <Camera className="w-3 h-3" />
                      {t('article.gallery_btn', { defaultValue: 'Gallery' })}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShare(null, viewingArticle)}
                      className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-100 dark:hover:border-indigo-900/50 rounded-xl transition-colors border border-slate-100 dark:border-slate-700/60 group"
                      title={t('article.share', { defaultValue: 'Share' })}
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          viewingArticle.google_maps_url ||
                          `https://www.google.com/maps/search/?api=1&query=${viewingArticle.latitude},${viewingArticle.longitude}`,
                          '_blank'
                        )
                      }
                      className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-100 dark:border-slate-700/60"
                      title={t('article.view_maps', { defaultValue: 'View on Maps' })}
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </button>

                    {viewingArticle.status !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleLike(viewingArticle.id)}
                        className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700/60 transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 ${likes[viewingArticle.id]
                            ? 'fill-rose-500 text-rose-500'
                            : 'text-slate-400'
                            }`}
                        />
                        <span
                          className={`text-[10px] font-black transition-colors ${likes[viewingArticle.id]?.isUserLiked
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-slate-200'
                            }`}
                        >
                          {likes[viewingArticle.id]?.count || 0}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ============================================================
              AI JOURNAL MAIN BODY
          ============================================================ */}
                <div className="mb-10">

                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">
                    {getActiveContent('title') ||
                      getLocalizedValue(
                        viewingArticle,
                        'place_name',
                        i18n.language
                      )}
                  </h2>

                  {/* SEO INTRO */}
                  {seoIntro && (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                      {seoIntro}
                    </p>
                  )}

                  {storyText ? (
                    <div className="space-y-8">

                      {/* QUICK FACTS */}
                      {article.quick_facts && (
                        <section className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            Quick Facts
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                            <div><span className="block text-slate-400 font-bold mb-1">Elevation</span><span className="font-semibold">{article.quick_facts.elevation_m}m</span></div>
                            <div><span className="block text-slate-400 font-bold mb-1">Difficulty</span><span className="font-semibold">{article.quick_facts.difficulty}</span></div>
                            <div><span className="block text-slate-400 font-bold mb-1">Time Req</span><span className="font-semibold">{article.quick_facts.time_required}</span></div>
                            <div><span className="block text-slate-400 font-bold mb-1">Vehicle Access</span><span className="font-semibold">{article.quick_facts.vehicle_access}</span></div>
                            <div><span className="block text-slate-400 font-bold mb-1">Moto Friendly</span><span className="font-semibold">{article.quick_facts.motorcycle_friendly}</span></div>
                            <div><span className="block text-slate-400 font-bold mb-1">Mobile Signal</span><span className="font-semibold">{article.quick_facts.mobile_coverage}</span></div>
                          </div>
                        </section>
                      )}

                      {/* WHY VISIT? */}
                      {(article.why_visit || translatedContent?.why_visit) && (
                        <section>
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">
                            Why Visit?
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                            {whyVisitSummary}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                              <span className="block text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-2">
                                Highly Rewarding For
                              </span>
                              <ul className="space-y-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                {article.why_visit?.best_for?.map((item, i) => <li key={i}>✓ {item}</li>)}
                              </ul>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                              <span className="block text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 mb-2">
                                Less Suitable For
                              </span>
                              <ul className="space-y-1 text-xs font-medium text-rose-800 dark:text-rose-300">
                                {article.why_visit?.less_suitable_for?.map((item, i) => <li key={i}>✗ {item}</li>)}
                              </ul>
                            </div>
                          </div>
                        </section>
                      )}

                      {/* EXPEDITION JOURNAL */}
                      <section className="prose dark:prose-invert max-w-none">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">
                          Expedition Journal
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line border-l-2 border-indigo-500 pl-4 italic">
                          {storyText}
                        </p>
                      </section>

                      {/* EXPLORER RATING */}
                      {article.explorer_rating && (
                        <section className="bg-indigo-900 text-white rounded-3xl p-6 shadow-lg">
                          <h3 className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-4">Explorer Rating</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">📸 Photography</span><span className="font-black text-lg">{article.explorer_rating.photography}/10</span></div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">🏍 Adventure</span><span className="font-black text-lg">{article.explorer_rating.adventure}/10</span></div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">👨‍👩‍👧 Family</span><span className="font-black text-lg">{article.explorer_rating.family_friendly}/10</span></div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">🚁 Drone</span><span className="font-black text-lg">{article.explorer_rating.drone}/10</span></div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">😌 Crowds</span><span className="font-black text-lg">{article.explorer_rating.crowd_level}/10</span></div>
                            <div className="bg-indigo-500 p-3 rounded-xl shadow-inner"><span className="block text-indigo-100 mb-1">⭐ Overall</span><span className="font-black text-lg">{article.explorer_rating.overall}/10</span></div>
                          </div>
                        </section>
                      )}

                      {/* PHOTOGRAPHY & DRONE NOTES */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {article.photography_notes && (
                          <section className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">📸 Photography Notes</h3>
                            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-medium">
                              <li><strong className="text-slate-900 dark:text-slate-100">Best Time:</strong> {article.photography_notes.best_time}</li>
                              <li><strong className="text-slate-900 dark:text-slate-100">Lighting:</strong> {article.photography_notes.lighting}</li>
                              <li><strong className="text-slate-900 dark:text-slate-100">Composition:</strong> {article.photography_notes.best_composition}</li>
                              <li><strong className="text-slate-900 dark:text-slate-100">Lenses:</strong> {article.photography_notes.lens_recommendation}</li>
                              <li className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 italic text-[10px]">{article.photography_notes.mobile_notes}</li>
                            </ul>
                          </section>
                        )}
                        {article.drone_notes && (
                          <section className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">🚁 Drone Flying Notes</h3>
                            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-medium">
                              <li><strong className="text-slate-900 dark:text-slate-100">Conditions:</strong> {article.drone_notes.flight_conditions}</li>
                              <li><strong className="text-slate-900 dark:text-slate-100">Wind:</strong> {article.drone_notes.wind}</li>
                              <li><strong className="text-slate-900 dark:text-slate-100">Launch Area:</strong> {article.drone_notes.launch_area}</li>
                              <li><strong className="text-slate-900 dark:text-slate-100">Obstacles:</strong> {article.drone_notes.obstacles}</li>
                              <li className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-rose-500 font-bold text-[10px]">Restrictions: {article.drone_notes.restrictions}</li>
                            </ul>
                          </section>
                        )}
                      </div>

                      {/* ROUTE & ACCESS REPORT */}
                      {article.route_report && (
                        <section className="p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">🏍 Route & Access Report</h3>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div><span className="block text-slate-400 font-bold mb-1">Starting Point</span><span className="font-semibold dark:text-slate-200">{article.route_report.starting_point}</span></div>
                            <div><span className="block text-slate-400 font-bold mb-1">Distance & Time</span><span className="font-semibold dark:text-slate-200">{article.route_report.distance_km}km ({article.route_report.travel_time})</span></div>
                            <div className="col-span-2"><span className="block text-slate-400 font-bold mb-1">Road Conditions</span><span className="font-semibold dark:text-slate-200">{article.route_report.road_condition}</span></div>
                            <div className="col-span-2"><span className="block text-slate-400 font-bold mb-1">Hazards & Fuel</span><span className="font-semibold text-amber-600 dark:text-amber-400">{article.route_report.hazards} | {article.route_report.fuel_parking}</span></div>
                          </div>
                        </section>
                      )}

                      {/* WHAT I WISH I KNEW */}
                      {article.wish_i_knew && article.wish_i_knew.length > 0 && (
                        <section className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-3">💡 What I Wish I Knew</h3>
                          <ul className="list-disc list-inside space-y-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
                            {article.wish_i_knew.map((tip, i) => <li key={i}>{tip}</li>)}
                          </ul>
                        </section>
                      )}

                      {/* BEHIND THE SHOT */}
                      {article.behind_the_shot && (
                        <section className="bg-slate-900 dark:bg-black text-white p-6 rounded-3xl shadow-xl">
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Behind The Shot</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                            <div>
                              <p className="text-slate-300 italic mb-3">"{article.behind_the_shot.why_i_took_it}"</p>
                              <div className="space-y-1 text-slate-400">
                                <p><strong>Device:</strong> {article.behind_the_shot.device}</p>
                                <p><strong>Time:</strong> {article.behind_the_shot.captured_time}</p>
                                <p><strong>Conditions:</strong> {article.behind_the_shot.conditions}</p>
                              </div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                              <span className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Post-Processing</span>
                              <p className="text-slate-300">{article.behind_the_shot.editing}</p>
                            </div>
                          </div>
                        </section>
                      )}



                      {/* HISTORY & HERITAGE */}
                      {historyText && (
                        <section className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">History & Heritage</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{historyText}</p>
                        </section>
                      )}

                    </div>
                  ) : (
                    /* FALLBACK SUMMARY LAYER */
                    <div className="space-y-4">
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                        {getLocalizedValue(
                          viewingArticle,
                          'description',
                          i18n.language
                        ) ||
                          t('article.fallback_desc')}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleOpenArticle(viewingArticle)}
                        className="inline-flex items-center justify-center px-5 py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        {t('article.load_journal_btn')}
                      </button>
                    </div>
                  )}

                  {/* ============================================================
                CONSERVATION, REGULATIONS & EDITORIAL FOOTER
            ============================================================ */}
                  <section className="mt-6 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">
                          {t('article.compliance_title')}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between items-center text-center">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                          {t('article.governing_body')}
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 truncate w-full">
                          <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{governingOrg}</span>
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between items-center text-center">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                          {t('article.access_restriction')}
                        </span>
                        <div className="mt-0.5 flex justify-center w-full">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                            {t(`restriction.${restrictionLevel.toLowerCase()}`, { defaultValue: statusLabel })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium pt-1">
                      <p>
                        {about.conservation_rules ||
                          t('article.compliance_prose_1', {
                            place: getLocalizedValue(viewingArticle, 'place_name', i18n.language) || 'this destination',
                            org: governingOrg
                          })}
                      </p>
                    </div>
                  </section>

                  {/* FAQ SECTION */}
                  {faqs.length > 0 && (
                    <section className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h3>
                      <div className="space-y-4">
                        {faqs.map((faq, index) => (
                          <div key={index} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                              {faq.question || faq.q}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {faq.answer || faq.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <footer className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-black text-[9px]">
                        HG
                      </div>
                      <span>
                        {t('article.archived_by')}{' '}
                        <strong className="text-slate-800 dark:text-slate-200">Hasitha Gunasekera</strong>
                      </span>
                    </div>
                    <div>
                      <span>
                        {t('article.record_ref')} #{viewingArticle.id || '000'}
                      </span>
                    </div>
                  </footer>
                </div>

                {/* ============================================================
              DISCUSSION / COMMENTS BLOCK
          ============================================================ */}
                <div
                  id="comments-discussion-section"
                  className="border-t border-slate-100 dark:border-slate-800 pt-8"
                >
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    {t('article.discussion_count', {
                      defaultValue: 'Discussion',
                      count: comments[viewingArticle.id]?.length || 0
                    })}{' '}
                    ({comments[viewingArticle.id]?.length || 0})
                  </h4>

                  <div className="space-y-4 mb-8">
                    {comments[viewingArticle.id]?.map((c, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                      >
                        <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mb-2">
                          {c.comment_text}
                        </p>
                        <div className="flex justify-between items-center opacity-60">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                          {(c.city || c.country) && (
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                              {[c.city, c.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>

                        {c.reply_text && (
                          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                              <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                {t('article.author_response', { defaultValue: 'Author Response' })}
                              </span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                "{c.reply_text}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="relative sticky bottom-0 bg-white dark:bg-slate-900 pt-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setnewCommentText(e.target.value)}
                      placeholder={t('article.comment_placeholder', { defaultValue: 'Add your trail note...' })}
                      className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-slate-900 dark:focus:border-slate-100 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none pr-12"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newCommentText.trim()) {
                          const text = newCommentText;
                          setnewCommentText('');
                          await submitComment(viewingArticle.id, text);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCommentText.trim()) submitComment(viewingArticle.id, newCommentText);
                        setnewCommentText('');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* --- ROUTE PLANNER MODAL --- */}

      {isPlannerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"
            onClick={() => setIsPlannerOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative bg-white dark:bg-slate-900 w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

            {/* LEFT SIDE: MAP ENGINE (Full Screen on Mobile) */}
            <div className="absolute inset-0 md:relative md:inset-auto md:h-full md:w-[60%] bg-slate-100 dark:bg-slate-950 z-0 overflow-hidden">
              <MapComponent
                // Places feed dynamically based on planner state
                places={isPlannerOpen ? plannerFilteredPlaces : filteredPlaces}
                nearbyAttractions={nearbyAttractions}
                routeAmenities={routeAmenities}
                userCoords={userCoords}
                selectedRoute={selectedRoute}
                hoveredPlaceId={hoveredPlaceId}
                setHoveredPlaceId={setHoveredPlaceId}
                // Spatial data fetching and route state handlers
                fetchAttractions={fetchRoutePlaceData}
                setRouteDistance={setRouteDistance}
                setRouteData={setRouteData}
                // Toggle gatekeeper state for nearby searches & amenities
                isNearbySearchEnabled={isNearbySearchEnabled}
                // Component references & navigation callbacks
                mapInstanceRef={mapRef}
                routeLineRef={routeLineRef}
                handleOpenArticle={handleOpenArticle}
              />

              {/* Floating Map Label */}
              <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
                    Interactive Route Engine
                  </p>
                </div>
              </div>

              {/* Mobile Quick Expand Floating Button */}
              {!isPlannerExpanded && (
                <button
                  onClick={() => setIsPlannerExpanded(true)}
                  className="md:hidden absolute bottom-28 right-4 z-[1000] bg-slate-900 text-white p-3 rounded-full shadow-2xl active:scale-95 transition-transform"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* RIGHT SIDE: SELECTION PANEL & DRAG-AND-DROP WAYPOINTS */}
            <div
              className={`absolute inset-x-0 bottom-0 z-10 flex flex-col bg-white dark:bg-slate-900 rounded-t-[2.5rem] md:rounded-t-none md:relative md:w-[40%] md:h-full border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 shadow-[0_-15px_40px_rgba(0,0,0,0.15)] md:shadow-none transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${isPlannerExpanded
                ? 'translate-y-0 h-[85vh]'
                : 'translate-y-[calc(100%-100px)] h-[85vh] md:translate-y-0 md:h-full'
                }`}
            >
              {/* Mobile Drag Indicator & Toggle */}
              <div
                className="w-full flex flex-col items-center pt-2 pb-1 md:hidden cursor-pointer touch-none bg-white dark:bg-slate-900 rounded-t-[2.5rem]"
                onClick={() => setIsPlannerExpanded(!isPlannerExpanded)}
              >
                <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-1"></div>
                <div className={`transition-transform duration-500 ${isPlannerExpanded ? 'rotate-0' : 'animate-bounce'}`}>
                  {isPlannerExpanded ? (
                    <ChevronDown className="w-6 h-6 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-6 h-6 text-slate-900 dark:text-slate-100" />
                  )}
                </div>
              </div>

              {/* 1. Header Section & Unified Search */}
              <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center justify-between pt-2">
                  <div
                    className="min-w-0 flex-1 cursor-pointer md:cursor-auto"
                    onClick={() => { if (window.innerWidth < 768) setIsPlannerExpanded(!isPlannerExpanded); }}
                  >
                    <h2 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 dark:text-slate-100 leading-none truncate">
                      Route Planner
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        {selectedRoute.length} Stops
                      </span>
                      {selectedRoute.length > 0 && parseFloat(routeDistance) > 0 && (
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900 flex items-center gap-1">
                          <Navigation className="w-2.5 h-2.5" />
                          {routeDistance} KM
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedRoute.length > 0 && (
                      <button
                        onClick={handleReset}
                        className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full active:rotate-180 transition-transform duration-500"
                        title="Reset Route"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsPlannerOpen(false);
                        window.history.pushState({}, '', window.location.pathname);
                      }}
                      className="w-8 h-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 dark:hover:bg-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Unified Search Bar (Google Places Autocomplete Input) */}
                <div className={`relative transition-opacity duration-300 ${!isPlannerExpanded ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'opacity-100'}`}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="planner-autocomplete-input"
                    ref={searchInputRef}
                    type="text"
                    value={plannerSearch}
                    onChange={(e) => setPlannerSearch(e.target.value)}
                    placeholder="Search database or global places..."
                    autoComplete="off"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-[11px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 2. Scrollable Content Area: Waypoints & Available Locations */}
              <div className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y custom-scrollbar bg-white dark:bg-slate-900 pb-28 md:pb-24 p-4 space-y-6">

                {/* Section A: Active Waypoints (Drag-and-Drop) */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Active Route Stops
                  </h3>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="route-waypoints-list">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {selectedRoute.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl opacity-40 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              No waypoints added yet. Select from below or click map markers.
                            </div>
                          ) : (
                            selectedRoute.map((place, index) => (
                              <Draggable key={place.id.toString()} draggableId={place.id.toString()} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="flex items-center p-3 rounded-2xl border border-indigo-500 bg-indigo-50/35 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20 shadow-sm transition-all"
                                  >
                                    {/* Drag Handle */}
                                    <div {...provided.dragHandleProps} className="mr-2 cursor-grab text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 touch-none">
                                      <GripVertical className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1 min-w-0 pr-2 flex flex-col gap-2">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {/* Category Color Dot */}
                                        <span
                                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${place.status === 'pending'
                                            ? 'bg-orange-500'
                                            : place.status === 'done'
                                              ? 'bg-green-500'
                                              : getCategoryColorClass(place.category)
                                            }`}
                                          style={{
                                            backgroundColor:
                                              place.status === 'pending'
                                                ? '#f97316'
                                                : place.status === 'done'
                                                  ? '#22c55e'
                                                  : typeof getCategoryHex === 'function'
                                                    ? getCategoryHex(place.category)
                                                    : undefined,
                                          }}
                                          title={place.category || 'Location'}
                                        />
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase truncate text-slate-900 dark:text-slate-100">
                                              {place.place_name || place.name}
                                            </span>
                                          </div>
                                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5 block">
                                            Stop #{index + 1} {place.isNearby ? '• Nearby Attraction' : ''}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Weather Integration Badge */}
                                      <RouteWeatherBadge
                                        weatherData={weatherData}
                                        placeId={place.id}
                                        lat={place.latitude ?? place.lat}
                                        lng={place.longitude ?? place.lng}
                                      />
                                    </div>

                                    <button
                                      onClick={() => toggleRoutePlace(place)}
                                      className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-indigo-600 text-white shadow-md transition-all active:scale-95 self-center"
                                      title="Remove waypoint"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>

                {/* Toggle Switch Control: Search Nearby Locations & Amenities */}
                <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between transition-all">
                  <div className="flex flex-col gap-0.5 pr-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Nearby Locations & Amenities
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      Search & display nearby attractions, fuel, food & stays
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isNearbySearchEnabled}
                    onClick={() => setIsNearbySearchEnabled(!isNearbySearchEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isNearbySearchEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isNearbySearchEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* Section B: Available Locations & Attractions */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Available Locations & Attractions
                  </h3>
                  <div className="space-y-2">
                    {plannerFilteredPlaces.length > 0 ? (
                      plannerFilteredPlaces.map((place) => {
                        const isSelected = selectedRoute.some((p) => p.id === place.id);

                        return (
                          <div
                            key={place.id}
                            onClick={() => toggleRoutePlace(place)}
                            className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${isSelected
                              ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                              : 'bg-white border-slate-100 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {/* Category Color Dot */}
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${place.status === 'pending'
                                  ? 'bg-orange-500'
                                  : place.status === 'done'
                                    ? 'bg-green-500'
                                    : getCategoryColorClass(place.category)
                                  }`}
                                style={{
                                  backgroundColor:
                                    place.status === 'pending'
                                      ? '#f97316'
                                      : place.status === 'done'
                                        ? '#22c55e'
                                        : typeof getCategoryHex === 'function'
                                          ? getCategoryHex(place.category)
                                          : undefined,
                                }}
                                title={place.category || 'Location'}
                              />
                              <div className="min-w-0">
                                <h4 className="text-[11px] font-bold uppercase truncate text-slate-800 dark:text-slate-200">
                                  {place.place_name || place.name}
                                </h4>
                                <p className="text-[9px] uppercase text-slate-400 font-semibold tracking-wider mt-0.5 truncate">
                                  {place.isNearby ? 'Nearby Attraction' : place.category || 'Saved Place'}
                                  {place.currentDistance !== undefined && place.currentDistance !== Infinity && ` • ${place.currentDistance.toFixed(1)} km away`}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                            >
                              {isSelected ? '✓' : '+'}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                        No matching locations or attractions found.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Footer Actions (GPX, KML, Maps, Share/QR) */}
              <div className="absolute md:relative bottom-0 left-0 w-full p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20 rounded-b-[2rem] md:rounded-b-none transition-colors duration-300">
                <div className="flex flex-col gap-2">

                  {/* EXPORT ROW: GPX & KML */}
                  {selectedRoute.length >= 2 && parseFloat(routeDistance) > 0 && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <button
                        onClick={() => typeof downloadRouteFile === 'function' && downloadRouteFile('gpx')}
                        className="flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 active:scale-95"
                      >
                        <MapIcon className="w-3.5 h-3.5" /> GPX
                      </button>
                      <button
                        onClick={() => typeof downloadRouteFile === 'function' && downloadRouteFile('kml')}
                        className="flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 active:scale-95"
                      >
                        <MapPin className="w-3.5 h-3.5" /> KML
                      </button>
                    </div>
                  )}

                  {/* PRIMARY ACTIONS: Maps & QR/Share */}
                  <div className="flex gap-2">
                    {selectedRoute.length >= 2 && (
                      <button
                        onClick={shareRoute}
                        className="flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Maps
                      </button>
                    )}
                    <button
                      onClick={() => selectedRoute.length > 0 && typeof showQRCode === 'function' && showQRCode(selectedRoute, "My Travel Plan")}
                      disabled={selectedRoute.length === 0}
                      className={`flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 ${selectedRoute.length > 0
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 hover:bg-slate-800 dark:hover:bg-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                    >
                      <QrCode className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- SUGGEST A SPOT / ADD LOCATION MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[3000] flex flex-col lg:flex-row animate-in fade-in duration-300">

          {/* LEFT SIDE: MAP SELECTION ENGINE & LIVE OVERLAY */}
          <div className="w-full lg:w-1/2 h-[35vh] lg:h-full bg-slate-100 dark:bg-slate-900 relative">
            {/* Map auto-centers and updates marker via formData state / addMapInstance */}
            {MemoizedAddMap}

            {/* Ultra-Compact Status Overlay */}
            <div className="absolute top-3 left-3 z-[1001] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 pointer-events-none min-w-[150px]">
              <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-tighter">
                Live Verification
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.latitude ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {formData.latitude
                    ? `${Number(formData.latitude).toFixed(4)}, ${Number(formData.longitude).toFixed(4)}`
                    : "SELECTING POINT..."}
                </p>
              </div>
              {formData.locality && (
                <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <MapPin className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                  <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter truncate">
                    {formData.locality}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: FORM & GOOGLE PLACES SEARCH */}
          <div className="w-full lg:w-1/2 p-5 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div>
              {/* Header Section */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-slate-100">
                    Suggest Spot
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Auto-Sync with Google Places & Map
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    // Reset deep link URL parameters on modal close
                    window.history.pushState({}, '', window.location.pathname);
                  }}
                  className="w-8 h-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddPlace} className="space-y-5">

                {/* 1. Google Places Auto-Suggest Search Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Search Spot Name
                    </label>
                    {places.some(p => p.place_name?.toLowerCase() === formData.place_name?.trim().toLowerCase()) && (
                      <span className="text-[8px] font-black text-red-500 uppercase animate-bounce">
                        Already in Database
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      id="location-search"
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Search (e.g. Laxapana Falls)..."
                      value={formData.place_name || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, place_name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none transition-all font-bold text-sm
                  ${places.some(p => p.place_name?.toLowerCase() === formData.place_name?.trim().toLowerCase())
                          ? 'border-red-300 ring-2 ring-red-50 dark:ring-red-950/30'
                          : 'border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500'
                        }`}
                    />
                  </div>
                </div>

                {/* 2. Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Assign Category
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-bold text-[11px] uppercase tracking-wider appearance-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      {VALID_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Submission Action */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={
                      !formData.latitude ||
                      !formData.place_name ||
                      places.some(p => p.place_name?.toLowerCase() === formData.place_name?.trim().toLowerCase())
                    }
                    className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2
                ${formData.latitude && formData.place_name && !places.some(p => p.place_name?.toLowerCase() === formData.place_name?.trim().toLowerCase())
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-slate-900/20 hover:bg-indigo-600 dark:hover:bg-indigo-500'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                      }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Submit for Review
                  </button>
                  <p className="text-[8px] text-center text-slate-400 font-bold mt-4 uppercase tracking-tighter opacity-70">
                    * Coordinates and locality are auto-captured upon selecting a Google location or pinning the map
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- MEDIA OVERLAYS --- */}

      {/*PHOTO OVERLAY */}
      {/* PHOTO OVERLAY */}
      {activeId && (
        <PhotoGallery
          photos={
            places.find(p => p.id === activeId)?.album_photos || []
          }
          placeName={
            places.find(p => p.id === activeId)?.place_name
          }
          selectedLocation={
            places.find(p => p.id === activeId)
          }
          onClose={handleClosePhotoGallery}
          onShare={(e, location) =>
            handleShare(e, location, true)
          }
        />
      )}

      {/* VIDEO OVERLAY */}
      {activeVideos.length > 0 && (
        <VideoGallery
          videos={activeVideos}
          initialIndex={0}
          onClose={handleCloseVideoGallery}
        />
      )}


      {/* --- SAFETY & LEGAL OVERLAYS --- */}
      <SafetyOverlay
        location={selectedLocation}
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
      />

      {/* =======================================================================
        UNIFIED LEGAL & ABOUT MODULE MODAL NODE
        Handles Privacy Policy, Terms, and About Platform content arrays 
        seamlessly for strict user transparency and AdSense crawling compliance.
        ======================================================================= */}
      <LegalAndAboutModal
        isOpen={isPrivacyOpen}
        /* 💡 Triggers the cleanup function that strips URL search query parameters (?view=...) from the address bar on close */
        onClose={handleCloseLegalModal}
        currentView={legalView}
        setView={setLegalView}
      />


      {/* =======================================================================
        PROACTIVE COOKIE CONSENT BANNER (ADSENSE & GDPR COMPLIANCE LAYER)
        ======================================================================= */}
      {showCookieBanner && (
        <div className="fixed bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-md bg-white dark:bg-slate-900 z-[99999] p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 flex flex-col gap-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Cookie Preference Notice</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                My Journal uses analytical and advertising cookie architectures via Google AdSense to personalize layout configurations and support platform operations.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-50 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => {
                setLegalView('privacy');
                setIsPrivacyOpen(true);
              }}
              className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 tracking-wider underline transition-colors"
            >
              Review Policy
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeclineCookies}
                className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95"
              >
                Decline Optional
              </button>
              <button
                type="button"
                onClick={handleAcceptCookies}
                className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:bg-slate-800 dark:hover:bg-white transition-all active:scale-95"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
        LEGAL & CONTENT ARCHITECTURE COMPLIANCE NODE (HIDDEN FROM HUMANS — OPEN TO SCRAPERS)
        Guarantees AdSense automated engines crawl content arrays seamlessly.
        ======================================================================= */}
      <div className="sr-only opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true">
        {/* Privacy Framework Section */}
        <section id="crawler-legal-privacy">
          <h2>Privacy Policy for My Journal</h2>
          <p>Last updated: 2026</p>
          <h3>01. Geospatial Data and Tracking Information</h3>
          <p>To provide distance calculations and optimized route navigation profiles across travel basins, our application accesses device coordinates. This location framework operates entirely client-side to map routes against dynamic map vectors.</p>
          <h3>02. Third-Party Integrations & Advertising Cookies</h3>
          <p>This web application uses Google AdSense data clusters to deliver relevant advertisements to users. Google uses tracking cookies to display programmatic ads based on browsing history and destination engagement indexes. Users can configure opt-out cookies via official Google safety panels.</p>
        </section>

        {/* Terms & Conditions Section */}
        <section id="crawler-legal-terms">
          <h2>Terms of Service for My Journal</h2>
          <h3>01. Informational Reference Clause</h3>
          <p>All hiking trails, remote waterfalls, and route data vectors displayed within My Journal are generated for open-source geographical reference. Users assume absolute risk regarding trail difficulty, landscape hazards, and weather adjustments.</p>
          <h3>02. Civil Aviation Authority Legal Compliance</h3>
          <p>Drone pilots utilizing routing data parameters are strictly required to ensure full compliance with Civil Aviation Authority of Sri Lanka (CAASL) regulations. Flying drone configurations within active National Parks, high security military networks, or sanctuary parameters requires formal Department of Wildlife Conservation (DWC) documentation.</p>
        </section>

        {/* Platform Profile & Contextual Metadata Section */}
        <section id="crawler-about-journal">
          <h2>About My Journal Platform and Explorer Profile</h2>

          <h3>01. Author Profile and Objective</h3>
          <p>
            Hi, I'm Hasitha Gunasekera. I'm an explorer, road-tripper, and outdoor photographer dedicated to tracking down unknown spaces across Sri Lanka. My true passion lies in backcountry trekking, remote high-altitude wilderness camping, and exploring uncharted waterfall cascades tucked deep within mountain ranges.
          </p>

          <h3>02. Technical Application Scope</h3>
          <p>
            My Journal serves as a specialized, technical field log detailing remote coordinates, spatial records, and trail notes across Sri Lanka. Engineered to integrate backcountry mapping indicators, weather monitors, and route telemetry, it aims to connect adventure travelers safely to hidden destinations while establishing strict environmental safety standards.
          </p>

          <h3>03. Geographic Index Coverage</h3>
          <p>
            Sri Lanka houses phenomenal geographic biodiversity, stretching from the dense mountain ridges of the Knuckles Forest Reserve to pristine cascade clusters like Bambarakanda and Diyaluma Falls. This open ledger indexes mountain plain tablelands, deep natural pools, and historic forest hermitages to showcase raw island terrain while advocating for strict nature preserve conservation metrics.
          </p>
        </section>

        {/* AI & Search Engine Tagline / Motto */}
        <section id="crawler-motto">
          <h2>Platform Motto</h2>
          <p>විදිමු , රැකගමු අනාගතය වෙනුවෙන්.</p>
          <p>Live with care, preserve with love — for the future yet to come.</p>
        </section>
      </div>

      {/* =======================================================================
        PROACTIVE NEWSLETTER SUBSCRIPTION PROMPT (UNIQUE USERS)
        ======================================================================= */}
      {showNewsletterPrompt && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleDismissNewsletterPrompt}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 text-slate-500 dark:text-slate-400 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content Container */}
            <div className="text-center mt-2 mb-8">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                Join the Expedition
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed px-2">
                Subscribe to get the latest remote coordinates, secret waterfall locations, and field notes sent directly to your inbox.
              </p>
            </div>

            {/* Reusing your global handleNewsletterSubmit & newsletterEmail state */}
            <form className="flex flex-col gap-3" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder={t('newsletter.placeholder', 'Your email address')}
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={isNewsletterSubmitting}
                className="w-full px-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors disabled:opacity-60"
                required
              />
              <button
                type="submit"
                disabled={isNewsletterSubmitting}
                className="w-full py-3 text-[11px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isNewsletterSubmitting ? t('newsletter.submitting', 'Saving...') : t('newsletter.subscribe', 'Subscribe')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>



  );

  // ============================================================================
  // 37.MAIN RENDER ENDS
  // ===========================================================================


}

export default App;