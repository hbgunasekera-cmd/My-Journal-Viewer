import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createRoot } from 'react-dom/client';
import { QRCodeSVG } from 'qrcode.react'; // <--- Added this line

// --- Leaflet Imports ---
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// --- Icon Imports ---
import {
  Play, Pause, ChevronLeft, ChevronRight, SlidersHorizontal,
  Share2, Plus, ChevronDown, Heart, MessageCircle,
  Image as ImageIcon, BookOpen, MapPin, Send,
  Navigation, RefreshCw, Search, Minus, QrCode, AlertCircle,
  Camera, Video, Info, Map as MapIcon,
  X, CheckCircle2, Info as InfoIcon
} from 'lucide-react';

// --- Leaflet Marker Fix ---
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Configuration
const SUPABASE_URL = 'https://vpslgikpaintiuayajmx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rsbN_QlROV14EEzYjl9dTQ_Jxl-ra44';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const WEATHER_KEY = 'f757a5fe02ebcf28154b642fa5e7738d';

// Constants
const DEFAULT_LOCATION = { lat: 7.0777, lng: 79.8924 };
const VALID_CATEGORIES = ["Waterfall", "Mountain", "Trail", "Viewpoint", "Beach", "Park", "Plateaus", "Reserved Forest", "Monastery", "Archaeology", "Reservoir", "Pool", "Stream", "Location"];


const GoogleBottomAd = () => {
  const adRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Only push if the ad slot is empty and script is loaded
        if (window.adsbygoogle && adRef.current?.innerHTML.trim() === "") {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        console.error("AdSense Error:", e);
      }
    }, 500); // 500ms safety delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="my-8 flex justify-center w-full min-h-[100px] overflow-hidden bg-slate-50/50 rounded-xl">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-1964470435370150"
        data-ad-slot="6165048740"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

/**
 * SEO & Performance Helpers
 */
const auditLocationName = (name) => {
  if (!name) return "Unnamed Location";
  return String(name).replace(/[^a-zA-Z0-9\s\-'\.]/g, '').trim();
};

const getOptimizedUrl = (url, width, quality = 70) => {
  if (url?.includes('supabase.co') && !url.includes('?')) {
    return `${url}?width=${width}&quality=${quality}&format=webp`;
  }
  return url;
};

/**
 * Icon & UI Components
 */
const IconMap = {
  'camera': Camera,
  'video': Video,
  'map': MapIcon,
  'book-open': BookOpen,
  'image': ImageIcon
};

// Create a small helper component for dynamic icons
const RenderDynamicIcon = ({ iconName, className }) => {
  const IconComponent = IconMap[iconName] || Info;
  return <IconComponent className={className} />;
};

const updateSEO = (place) => {
  // 1. Setup Defaults
  const defaultTitle = "My Journal | Travel Sri Lanka";
  const defaultDesc = "Discover hidden waterfalls, mountain treks, and cinematic 4K drone footage of Sri Lanka's most remote destinations.";
  const defaultImg = "https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/My%20Journal%20Logo.png";

  // 2. Logic Check: Ensure place is a valid object
  const hasPlace = place && typeof place === 'object' && place.place_name;

  const title = hasPlace ? `${place.place_name} | My Journal` : defaultTitle;

  // Refined Description Logic
  let description = defaultDesc;
  if (hasPlace) {
    if (place.ai_article?.story) {
      description = place.ai_article.story.substring(0, 155).trim() + "...";
    } else if (place.description) {
      description = place.description;
    }
  }

  // --- URL CLEANING LOGIC ---
  // Ensure we have a valid absolute URL and encode spaces to %20
  let rawImageUrl = hasPlace ? (place.cover_photo_url || place.image_url || defaultImg) : defaultImg;
  
  // 1. Make sure it's an absolute URL
  if (rawImageUrl && !rawImageUrl.startsWith('http')) {
    rawImageUrl = window.location.origin + (rawImageUrl.startsWith('/') ? '' : '/') + rawImageUrl;
  }
  
  // 2. Encode spaces (CRITICAL for Facebook 'Invalid URL' error)
  const imageUrl = rawImageUrl.replace(/\s/g, '%20');

  // Authoritative URL
  const shareUrl = hasPlace
    ? `${window.location.origin}${window.location.pathname}?place=${encodeURIComponent(place.place_name)}`
    : window.location.origin;

  // 3. Update Browser Tab Title
  document.title = title;

  // 4. Update/Create Meta Tags for Social Crawlers
  const metaTags = {
    'og:title': title,
    'og:description': description,
    'og:image': imageUrl, // Now cleaned and encoded
    'og:url': shareUrl,
    'og:type': hasPlace ? 'article' : 'website',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': imageUrl,
    'twitter:card': 'summary_large_image'
  };

  Object.entries(metaTags).forEach(([prop, content]) => {
    let el = document.querySelector(`meta[property="${prop}"]`) ||
             document.querySelector(`meta[name="${prop}"]`);

    if (!el) {
      el = document.createElement('meta');
      if (prop.startsWith('og:')) el.setAttribute('property', prop);
      else el.setAttribute('name', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content || "");
  });

  // 5. Canonical Link Logic
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', shareUrl);
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance.current);

    // --- NEW: Pass the Leaflet instance back to App.jsx so Autocomplete can use it ---
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
  }, [initialCoords, onLocationSelect, onMapReady]); // Added dependencies

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const PhotoGallery = React.memo(({ photos, onClose, placeName }) => {
  const [activeIndex, setActiveIndex] = React.useState(null);
  const [isSlideshowActive, setIsSlideshowActive] = React.useState(false);

  const preventCopy = (e) => {
    e.preventDefault();
    return false;
  };

  // Handle body scroll locking & initial icon render
  React.useEffect(() => {
    const scrollY = window.scrollY;
    document.body.classList.add('modal-open');
    if (window.lucide) window.lucide.createIcons();
    return () => {
      document.body.classList.remove('modal-open');
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Slideshow Logic
  React.useEffect(() => {
    let timer;
    if (isSlideshowActive && activeIndex !== null) {
      timer = setTimeout(() => {
        nextImage();
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isSlideshowActive, activeIndex]);

  // Icon Refresh Logic - Ensures Lucide re-scans the DOM when state changes
  React.useEffect(() => {
    if (window.lucide) {
      const timeoutId = setTimeout(() => window.lucide.createIcons(), 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isSlideshowActive, activeIndex]);

  // Keyboard Navigation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeIndex === null) return;
      if (e.key === 'ArrowRight') { nextImage(); setIsSlideshowActive(false); }
      if (e.key === 'ArrowLeft') { prevImage(e); setIsSlideshowActive(false); }
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === ' ') {
        e.preventDefault();
        setIsSlideshowActive(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const nextImage = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const prevImage = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (!photos || photos.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-white/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-200 select-none"
      style={{ height: '100dvh' }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={preventCopy}
    >
      {/* HEADER */}
      <header className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
        <div>
          <h3 className="text-grey font-black uppercase tracking-widest text-xs">
            {placeName ? `${placeName} Gallery` : 'Location Gallery'}
          </h3>
          <p className="text-[10px] text-indigo-400 font-bold uppercase">{photos.length} Total Images</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Gallery"
          className="w-12 h-12 flex items-center justify-center bg-slate-500 hover:bg-rose-500 text-white rounded-full transition-all shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* MAIN GRID */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((url, i) => (
            <article
              key={i}
              onClick={() => setActiveIndex(i)}
              className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-800 border border-white/5 shadow-2xl cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
            >
              <img
                src={getOptimizedUrl(url, 400, 60)}
                className="w-full h-full object-cover select-none pointer-events-none"
                loading="lazy"
                alt={`${placeName || 'Adventure'} - Image ${i + 1}`}
              />
            </article>
          ))}
        </div>
      </main>

      {/* FULL-SCREEN OVERLAY */}
      {activeIndex !== null && (
        <div className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-2xl flex flex-col animate-in zoom-in-95 duration-200" onContextMenu={preventCopy}>
          {isSlideshowActive && <div className="absolute top-0 left-0 h-1 bg-indigo-500 z-[12001] animate-[progress_5s_linear_infinite]"></div>}

          <div className="absolute top-6 right-6 flex gap-3 z-[12000]">
            <button
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isSlideshowActive
                ? 'bg-indigo-600 text-white shadow-lg' // Active state
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200' // Inactive (Off-white) state
                }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsSlideshowActive(!isSlideshowActive);
              }}
              aria-label={isSlideshowActive ? "Pause Slideshow" : "Start Slideshow"}
            >
              {/* We use a key here to trigger the CSS animation (like fade-in) 
       whenever the icon toggles.
    */}
              <span key={isSlideshowActive ? 'pause' : 'play'}>
                {isSlideshowActive ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </span>
            </button>
            <button
              className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all"
              onClick={() => setActiveIndex(null)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white rounded-full transition-all z-[12000]"
            onClick={(e) => { prevImage(e); setIsSlideshowActive(false); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white rounded-full transition-all z-[12000]"
            onClick={(e) => { nextImage(e); setIsSlideshowActive(false); }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="flex-1 w-full flex items-center justify-center p-4" onClick={() => setActiveIndex(null)}>
            <div className="relative w-fit h-fit" onClick={(e) => e.stopPropagation()}>
              <img
                key={photos[activeIndex]}
                src={getOptimizedUrl(photos[activeIndex], 1200, 85)}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500"
                alt={`${placeName || 'Gallery'} featured view`}
                fetchpriority="high"
              />
              {/* Signature Watermark */}
              <div className="absolute bottom-6 right-6 pointer-events-none select-none">
                <div className="flex flex-col items-end drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  <span className="text-[10px] md:text-xs font-light tracking-[0.4em] text-white/70 uppercase border-b border-white/30 pb-0.5">
                    My Journal
                  </span>
                  <div className="w-4 h-[0.5px] bg-white/30 mt-0.5"></div>
                </div>
              </div>
            </div>
          </div>

          <footer className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 px-6 py-2 rounded-full border border-white/10 z-[12000]">
            <p className="text-white text-[10px] font-black tracking-[0.2em] uppercase">{activeIndex + 1} / {photos.length}</p>
          </footer>
        </div>
      )}

      <style>{`
                @keyframes progress { from { width: 0%; } to { width: 100%; } }
                .modal-open { overflow: hidden !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
    </div>
  );
});

const VideoGallery = React.memo(({ videos, onClose }) => {
  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    // DYNAMIC SCRIPT LOADING FIX
    const scriptId = 'tiktok-embed-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If script exists, re-process the embeds
      if (window.instgrm) window.instgrm.Embeds.process();
    }

    if (window.lucide) window.lucide.createIcons();

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getTikTokId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const matches = url.match(/\/video\/(\d+)/);
    return matches ? matches[1] : null;
  };

  // Flatten and clean the video list
  const videoList = (Array.isArray(videos) ? videos : [videos])
    .flatMap(item => (typeof item === 'string' ? item.split(',') : item))
    .map(s => s.trim())
    .filter(s => s !== "");

  if (videoList.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/98 backdrop-blur-3xl flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
        <div>
          <h3 className="text-white font-black uppercase tracking-widest text-xs">Video Journal</h3>
          <p className="text-[10px] text-indigo-400 font-bold uppercase">{videoList.length} Clips Loaded</p>
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {videoList.map((url, i) => {
            const videoId = getTikTokId(url);
            if (!videoId) return null;

            return (
              <div key={i} className="relative aspect-[9/16] rounded-[2rem] overflow-hidden bg-black border border-white/5 shadow-2xl">
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${videoId}`}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div>
            );
          })}
        </div>
        <div className="h-24"></div>
      </div>
    </div>
  );
});

function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- CONSOLIDATED MAP COMPONENT ---
const MapComponent = ({
  places,
  userCoords,
  selectedRoute,
  hoveredPlaceId,
  setHoveredPlaceId,
  fetchAttractions,
  setRouteDistance,
  setRouteData,
  mapInstanceRef
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routingControl = useRef(null);
  const markerRegistryRef = useRef({});
  const currentRouteIdsRef = useRef("");
  const tempMarkerRef = useRef(null);
  const [showQR, setShowQR] = useState(false);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
        worldCopyJump: true
      }).setView([userCoords?.lat || 7.8731, userCoords?.lng || 80.7718], 10);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance.current);


      if (mapInstanceRef) mapInstanceRef.current = mapInstance.current;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        if (mapInstanceRef) mapInstanceRef.current = null; // Clean up
        markerRegistryRef.current = {};
        currentRouteIdsRef.current = "";
      }
    };
  }, []);

  // 2. Map Click Handler
  useEffect(() => {
    if (!mapInstance.current) return;

    const onMapClick = (e) => {
      const { lat, lng } = e.latlng;
      if (fetchAttractions) fetchAttractions(lat, lng);

      if (tempMarkerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(tempMarkerRef.current);
      }

      tempMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 2,
        fillOpacity: 0.5
      }).addTo(mapInstance.current);
    };

    mapInstance.current.on('click', onMapClick);
    return () => {
      if (mapInstance.current) mapInstance.current.off('click', onMapClick);
    };
  }, [fetchAttractions]);

  // 3. Handle Markers & Hover States
  useEffect(() => {
    if (!mapInstance.current) return;

    places.forEach(place => {
      const isHovered = hoveredPlaceId === place.id;
      const isSelected = selectedRoute.find(p => p.id === place.id);
      const markerColor = isHovered ? "#3b82f6" : isSelected ? "#ef4444" : place.status === 'done' ? "#10b981" : "#f97316";

      if (!markerRegistryRef.current[place.id]) {
        const marker = L.circleMarker([place.latitude, place.longitude], {
          radius: 6,
          fillColor: markerColor,
          color: "#fff",
          weight: 2,
          fillOpacity: 1
        }).addTo(mapInstance.current);

        marker.bindTooltip(place.place_name, { direction: 'top', offset: [0, -5] });

        marker.on('click', () => {
          if (setHoveredPlaceId) setHoveredPlaceId(place.id);
          const lat = parseFloat(place.latitude);
          const lng = parseFloat(place.longitude);
          if (fetchAttractions) fetchAttractions(lat, lng);
        });
        markerRegistryRef.current[place.id] = marker;
      } else {
        const marker = markerRegistryRef.current[place.id];
        marker.setStyle({ fillColor: markerColor, radius: isHovered ? 9 : 6 });
        if (isHovered || isSelected) marker.bringToFront();
      }
    });
  }, [places, selectedRoute, hoveredPlaceId, setHoveredPlaceId, fetchAttractions]);

  // --- 4. Handle Routing & Legend Suppression (Hardened) ---

  useEffect(() => {
    // Basic safety check: ensure the map exists
    if (!mapInstance.current) return;

    // Create a signature to check if the route has actually changed
    const routeSignature = selectedRoute.map(p => p.id).join(',');

    if (currentRouteIdsRef.current !== routeSignature) {
      currentRouteIdsRef.current = routeSignature;

      if (selectedRoute.length > 0 && userCoords) {
        const waypoints = [
          L.latLng(userCoords.lat, userCoords.lng),
          ...selectedRoute.map(p => L.latLng(p.latitude, p.longitude))
        ];

        if (routingControl.current) {
          // If the control already exists, just update the points
          routingControl.current.setWaypoints(waypoints);
        } else {
          // Initialize the Routing Control
          routingControl.current = L.Routing.control({
            waypoints,
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            lineOptions: {
              styles: [{ color: '#ef4444', weight: 6, opacity: 0.8 }]
            },
            createMarker: () => null, // Hide the default A/B markers
            addWaypoints: false,
            show: false, // Initial instruction panel hide
            fitSelectedRoutes: true
          }).on('routesfound', (e) => {
            const route = e.routes[0];
            const distance = (route.summary.totalDistance / 1000).toFixed(1);

            // 1. Update the UI distance
            if (setRouteDistance) setRouteDistance(distance);

            // 2. CRITICAL FIX: Share route coordinates with App.jsx
            // This allows toggleNearby (Food/Gas/Hotels) to find points along the path
            if (setRouteData) {
              setRouteData({
                coordinates: route.coordinates,
                distance: distance,
                duration: Math.round(route.summary.totalTime / 60)
              });
            }
          }).addTo(mapInstance.current);

          // SLEDGEHAMMER HIDE FOR LEGEND:
          // getContainer() is the standard way to grab the HTML element
          const container = routingControl.current.getContainer();
          if (container) {
            container.style.display = 'none';
          }
        }
      } else if (routingControl.current) {
        // CLEANUP: Prevent "_map is null" crash during unmounting
        if (mapInstance.current) {
          try {
            mapInstance.current.removeControl(routingControl.current);
          } catch (e) {
            console.warn("Routing cleanup suppressed to avoid Leaflet race condition.");
          }
        }
        routingControl.current = null;
        if (setRouteDistance) setRouteDistance(0);
        if (setRouteData) setRouteData(null);
      }
    }
  }, [selectedRoute, userCoords, setRouteDistance, setRouteData]);

  return <div ref={mapRef} className="h-full w-full z-0" />;
};

function App() {

  // --- 1. Core Data & UI State ---
  const [places, setPlaces] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('All');
  const [statusFilter, setStatusFilter] = useState('done');
  const [sortBy, setSortBy] = useState('recent');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [ViewingArticle, setViewingArticle] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingData, setSharingData] = useState(null);

  // --- 2. Adventure Engine & Planner State ---
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isEngineOpen, setIsEngineOpen] = useState(false);
  const [plannerSearch, setPlannerSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);

  // --- 3. Social & Interactions ---
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [NewCommentText, setNewCommentText] = useState('');
  const [notifications, setNotifications] = useState([]);


  // --- 4. Navigation & FAB (Floating Action Button) ---
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [isSocialExpanded, setIsSocialExpanded] = useState(false);
  const [isAddExpanded, setIsAddExpanded] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // --- 5. Add Location & Form State ---
  const [isAddOpen, setIsAddOpen] = useState(false); // Standardized camelCase
  const [addMapInstance, setAddMapInstance] = useState(null);
  const [formData, setFormData] = useState({
    place_name: '',
    district: '',
    latitude: '',
    longitude: '',
    map_url: '',
    image_url: 'https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/My%20Journal%20Logo.png',
    status: 'backlog',
    category: 'Waterfall'
  });

  // --- 6. Media & Weather State ---
  const [weatherData, setWeatherData] = useState({});
  const [activeGallery, setActiveGallery] = useState(null);
  const [activeGalleryId, setActiveGalleryId] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // --- 7. Map Controls & Nearby Logic ---
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [toggles, setToggles] = useState({
    lodging: false,
    gas_station: false,
    restaurant: false
  });
  const [qrUrl, setQrUrl] = useState(null);


  // --- 8. Refs (Non-Rendering Storage) ---
  const mapRef = useRef(null);
  const addMapRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const markerRegistryRef = useRef({});
  const routingControlRef = useRef(null);
  const currentRouteIdsRef = useRef("");
  const autocompleteRef = useRef(null);
  const nearbyMarkersRef = useRef([]);

  // --- 9. Optimized Values (Debounced) ---
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedPlannerSearch = useDebounce(plannerSearch, 300);


  // --- 1. CORE INITIALIZATION & ICON OBSERVER ---
  useEffect(() => {
    const watchId = getUserLocation();
    fetchPlaces();
    fetchInteractions();
    logVisit('Main Page');

    // Initial Lucide icon render
    if (window.lucide) window.lucide.createIcons();

    // Mobile-Optimized Icon Management (MutationObserver)
    const targetNode = document.body;
    let iconTimer;

    const observer = new MutationObserver((mutations) => {
      const hasNewIcons = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
          node.nodeType === 1 && (node.querySelector('[data-lucide]') || node.hasAttribute('data-lucide'))
        )
      );

      if (hasNewIcons) {
        clearTimeout(iconTimer);
        iconTimer = setTimeout(() => {
          observer.disconnect();
          if (window.lucide) window.lucide.createIcons();
          observer.observe(targetNode, { childList: true, subtree: true });
        }, 50);
      }
    });

    observer.observe(targetNode, { childList: true, subtree: true });

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      observer.disconnect();
      clearTimeout(iconTimer);
    };
  }, []);

  // --- 2. UI, SEO & DEEP LINKING ---
  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [filterTag, debouncedSearch, statusFilter]);

  // Re-render icons specifically for notifications
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [notifications]);

  // Handle Deep Linking (Opening specific places via URL)
 useEffect(() => {

  if (places.length > 0) {
    const urlParams = new URLSearchParams(window.location.search);
    const placeFromUrl = urlParams.get('place');

    if (placeFromUrl) {
      // Decode the URL parameter and find the matching place (case-insensitive for safety)
      const decodedPlaceName = decodeURIComponent(placeFromUrl);
      const target = places.find(
        p => p.place_name.toLowerCase() === decodedPlaceName.toLowerCase()
      );

      if (target) {
        // 1. Open the UI components
        setViewingArticle(target);
        setIsArticleOpen(true);

        // 2. Update SEO for Search Engines and Social Media Crawlers
        updateSEO(target);
      } else {
        // Fallback: If place in URL doesn't exist, reset to home SEO
        updateSEO(null);
      }
    } else {
      // 3. Reset SEO to defaults if no specific place is requested
      updateSEO(null);
    }
  }
}, [places]); 

  useEffect(() => {

    updateSEO(ViewingArticle);

  }, [ViewingArticle]);

  // --- 3. ADD LOCATION LOGIC (CONSOLIDATED & STABILIZED) ---

  const handleLocationSelect = useCallback((lat, lng, dist) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      district: dist || prev.district
    }));
  }, []);

  /**
   * RENDER LOGIC:
   * We use 'MapWidget' as the variable name to avoid conflict with the 
   * browser's 'window.Map' constructor.
   */
  const MemoizedAddMap = useMemo(() => (
    <Suspense fallback={<div className="w-full h-full bg-slate-200 animate-pulse" />}>
      <MapSelectionComponent
        onMapReady={(map) => setAddMapInstance(map)}
        onLocationSelect={handleLocationSelect}
      />
    </Suspense>
  ), [handleLocationSelect]);

  /**
   * AUTOCOMPLETE LOGIC:
   * Syncs Google Search results with the Leaflet map instance and places a visual marker.
   */
  useEffect(() => {
    if (isAddOpen) {
      let autocompleteInstance = null;

      const initAutocomplete = async () => {
        if (!window.google || !window.google.maps) return;

        try {
          const { Autocomplete } = await google.maps.importLibrary("places");
          const input = document.getElementById('location-search');
          if (!input) return;

          autocompleteInstance = new Autocomplete(input, {
            fields: ["address_components", "geometry", "name", "url"],
            componentRestrictions: { country: "lk" }
          });

          autocompleteInstance.addListener("place_changed", () => {
            const place = autocompleteInstance.getPlace();
            if (!place.geometry || !place.geometry.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            const components = place.address_components || [];
            const locality = components.find(c => c.types.includes("administrative_area_level_2"))?.long_name ||
              components.find(c => c.types.includes("locality"))?.long_name || "";

            // 1. Update form data state
            setFormData(prev => ({
              ...prev,
              place_name: place.name,
              latitude: parseFloat(lat.toFixed(6)),
              longitude: parseFloat(lng.toFixed(6)),
              district: locality,
              map_url: place.url
            }));

            // 2. Map Visual Sync: Fly to location AND drop the yellow marker
            if (addMapInstance) {
              addMapInstance.flyTo([lat, lng], 16, {
                animate: true,
                duration: 1.5
              });

              // Clear existing temporary markers from previous searches
              if (tempMarkerRef.current) {
                addMapInstance.removeLayer(tempMarkerRef.current);
              }

              // Create the signature yellow circle marker at the search result
              tempMarkerRef.current = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: '#facc15', // Yellow-400
                color: '#ca8a04',     // Yellow-600 border
                weight: 3,
                fillOpacity: 1
              }).addTo(addMapInstance);
            }
          });
        } catch (err) {
          console.error("Autocomplete init error:", err);
        }
      };

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
      };
    }
  }, [isAddOpen, addMapInstance]);

  // --- 4. PLANNER & WEATHER ENGINE LOGIC ---
  useEffect(() => {
    if (isPlannerOpen && places.length > 0) {
      logVisit('Plan Function');

      const filteredForWeather = places.filter(place => {
        const search = (debouncedPlannerSearch || "").toLowerCase();
        if (!search) return place.status === 'done' || place.status === 'pending';

        const name = (place.place_name || "").toLowerCase();
        const district = (place.district || "").toLowerCase();
        const cat = (place.category || "").toLowerCase();

        return (place.status === 'done' || place.status === 'pending') &&
          (name.includes(search) || district.includes(search) || cat.includes(search));
      });

      if (filteredForWeather.length > 0) {
        fetchRouteWeather(filteredForWeather);
      }
    }
  }, [isPlannerOpen, debouncedPlannerSearch, places]);

  // --- CONSOLIDATED DATA PIPELINE (Distance -> Filter -> Sort -> Paginate) ---

  /** * STEP 1: Enrich data with distances
   * We do this first so the sorting logic has access to 'currentDistance'
   */
  const placesWithDistance = useMemo(() => {
    return places.map(place => ({
      ...place,
      currentDistance: userCoords
        ? calculateDistance(userCoords.lat, userCoords.lng, place.latitude, place.longitude)
        : Infinity
    }));
  }, [places, userCoords]);

  /** * STEP 2: Filter and Sort
   * Combines status, category, search, and the chosen sort method
   */
  const filteredPlaces = useMemo(() => {
    // 2a. Apply Filters
    const filtered = placesWithDistance.filter(place => {
      const matchesStatus = place.status === statusFilter;
      const matchesCategory = filterTag === 'All' || place.category === filterTag;
      const search = (debouncedSearch || "").toLowerCase();

      if (!search) return matchesStatus && matchesCategory;

      const searchableText = [
        place.place_name,
        place.district,
        place.locality,
        place.category
      ].join(' ').toLowerCase();

      return matchesStatus && matchesCategory && searchableText.includes(search);
    });

    // 2b. Apply Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'recent') return b.id - a.id;

      if (sortBy === 'distance') {
        return (a.currentDistance || Infinity) - (b.currentDistance || Infinity);
      }

      return (a.place_name || "").localeCompare(b.place_name || "");
    });
  }, [placesWithDistance, statusFilter, filterTag, debouncedSearch, sortBy]);

  /** * STEP 3: Pagination Slice
   * Slices the final sorted/filtered list based on infinite scroll visibleCount
   */
  const displayedPlaces = useMemo(() => {
    return filteredPlaces.slice(0, visibleCount);
  }, [filteredPlaces, visibleCount]);

  // Add a ref for the sentinel
  const sentinelRef = useRef(null);

  useEffect(() => {
    // Define the observer
    const observer = new IntersectionObserver(
      (entries) => {
        // If the sentinel is visible AND we have more to load
        if (entries[0].isIntersecting && visibleCount < filteredPlaces.length) {
          console.log("Sentinel triggered: Loading more...");
          setVisibleCount((prev) => prev + 20);
        }
      },
      {
        root: null, // use the viewport
        rootMargin: '400px', // Start loading 400px BEFORE the user reaches the bottom
        threshold: 0
      }
    );

    // Start observing
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    // Cleanup
    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [visibleCount, filteredPlaces.length]);

  // --- HELPER FUNCTIONS & EFFECTS ---

  /** * Notification Handler 
   */
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  /** * Data Fetching from Supabase
   */
  const fetchPlaces = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('travel_bucket_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaces(data || []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
      showToast("Failed to load locations", "error");
    }
  }, [showToast]);

  // Initial Data Load
  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  /**
     * TOGGLE NEARBY PLACES (Modern Implementation)
     * Uses Google Places (New) with the Inline Bootstrap Loader.
     */
  const toggleNearby = async (type) => {
    const isTurningOn = !toggles[type];
    setToggles(prev => ({ ...prev, [type]: isTurningOn }));

    // 1. Handle Turning Off: Remove markers
    if (!isTurningOn) {
      nearbyMarkersRef.current = nearbyMarkersRef.current.filter(item => {
        if (item.type === type) {
          if (mapRef.current) mapRef.current.removeLayer(item.marker);
          return false;
        }
        return true;
      });
      return;
    }

    // 2. Data Bridge Check
    if (!routeData || !routeData.coordinates) {
      showToast("Please plan a route first!", "error");
      setToggles(prev => ({ ...prev, [type]: false }));
      return;
    }

    try {
      await google.maps.importLibrary("places");
      // Use the stable PlacesService from index.html
      const service = new google.maps.places.PlacesService(document.createElement('div'));

      const coords = routeData.coordinates;
      const sampleRate = Math.max(1, Math.floor(coords.length / 15));
      const pointsToSearch = coords.filter((_, index) => index % sampleRate === 0);

      const colors = { lodging: '#3b82f6', gas_station: '#eab308', restaurant: '#a855f7' };

      pointsToSearch.forEach((point) => {
        service.nearbySearch({
          location: new google.maps.LatLng(point.lat, point.lng),
          radius: '5000',
          type: type
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && mapRef.current) {
            results.forEach(place => {
              const isHighQuality = place.rating >= 4.0 && (place.user_ratings_total || 0) >= 20;
              const needsFiltering = type === 'restaurant' || type === 'lodging';

              if (!needsFiltering || isHighQuality) {
                const dot = L.circleMarker([place.geometry.location.lat(), place.geometry.location.lng()], {
                  radius: 6,
                  fillColor: colors[type],
                  color: "#fff",
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 1
                }).addTo(mapRef.current) // Successfully adds to the exposed map
                  .bindPopup(`
                    <div class="p-1 font-sans">
                        <b class="text-slate-900 block">${place.name}</b>
                        <span class="text-xs text-slate-500 block">${place.vicinity || ''}</span>
                        ${place.rating ? `
                            <div class="flex items-center mt-1 gap-1">
                                <span class="text-amber-500 text-xs font-bold">★ ${place.rating}</span>
                                <span class="text-[10px] text-slate-400">(${place.user_ratings_total} reviews)</span>
                            </div>
                        ` : ''}
                    </div>
                  `);
                nearbyMarkersRef.current.push({ type, marker: dot });
              }
            });
          }
        });
      });
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch nearby locations", "error");
      setToggles(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleReset = () => {
    setPlannerSearch('');
    setSelectedRoute([]);
    setRouteDistance(0);
    setNearbyAttractions([]);
    nearbyMarkersRef.current.forEach(m => mapRef.current.removeLayer(m.marker));
    nearbyMarkersRef.current = [];
    setToggles({ lodging: false, gas_station: false, restaurant: false });
  };

  // --- Scroll Handler Fix ---
  const handleScroll = useCallback((e) => {

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 150;

    if (isNearBottom && visibleCount < filteredPlaces.length) {
      setVisibleCount(prev => prev + 20);
    }

  }, [visibleCount, filteredPlaces.length]);


  // 2. Weather Fetching Logic (Optimized for Speed)
  const fetchRouteWeather = async (waypoints) => {
    // ONLY fetch if we don't already have this location's data in state
    const fetchList = waypoints.filter(wp => !weatherData[wp.place_name]);

    if (fetchList.length === 0) return;

    try {
      // Fetch all needed weather data concurrently
      const weatherPromises = fetchList.map(async (wp) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${wp.latitude}&lon=${wp.longitude}&units=metric&appid=${WEATHER_KEY}`
        );
        const data = await response.json();

        if (data.list && data.list.length >= 9) {
          return {
            name: wp.place_name,
            data: {
              current: Math.round(data.list[0].main.temp),
              currentCond: data.list[0].weather[0].main,
              nextDay: Math.round(data.list[8].main.temp),
              nextCond: data.list[8].weather[0].main
            }
          };
        }
        return null;
      });

      // Wait for all fetches to complete
      const results = await Promise.all(weatherPromises);

      // Build the new state object
      const newWeatherData = {};
      results.forEach(res => {
        if (res) newWeatherData[res.name] = res.data;
      });

      // Batch update state once
      if (Object.keys(newWeatherData).length > 0) {
        setWeatherData(prev => ({ ...prev, ...newWeatherData }));
      }
    } catch (error) {

    }
  };


  // Updated Weather Helper - Returns raw SVG content
  const WeatherIcon = ({ condition, className = "w-3 h-3 text-blue-500" }) => {
    const getSvgContent = (cond) => {
      const c = (cond || '').toLowerCase();
      if (c.includes('clear') || c.includes('sun')) {
        // Sun Icon
        return <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />;
      }
      if (c.includes('rain') || c.includes('drizzle')) {
        // Cloud Rain Icon
        return <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M16 14v6m-4-6v6m-4-6v6" />;
      }
      if (c.includes('thunderstorm') || c.includes('lightning')) {
        // Cloud Lightning Icon
        return <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9M13 11l-4 6h6l-4 6" />;
      }
      // Default: Cloud Icon (for clouds, mist, haze, fog, etc.)
      return <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />;
    };

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {getSvgContent(condition)}
      </svg>
    );
  };


  const handleAlbumClick = (albumUrl) => {
    if (!albumUrl) {
      showToast("No album link available for this location.");
      return;
    }
    window.open(albumUrl, '_blank');
  };

  const fetchInteractions = async () => {
    const { data: likeData } = await supabaseClient.from('location_likes').select('location_id');
    const likeCounts = likeData?.reduce((acc, curr) => {
      acc[curr.location_id] = (acc[curr.location_id] || 0) + 1;
      return acc;
    }, {});
    setLikes(likeCounts || {});

    const { data: commentData } = await supabaseClient.from('location_comments').select('*').order('created_at', { ascending: true });
    const grouped = commentData?.reduce((acc, curr) => {
      if (!acc[curr.location_id]) acc[curr.location_id] = [];
      acc[curr.location_id].push(curr);
      return acc;
    }, {});
    setComments(grouped || {});
  };

  const getInteractionMetadata = async () => {
    const providers = [
      'https://ipapi.co/json/',
      'https://demo.ip-api.com/json/?fields=city,country',
      'https://api.db-ip.com/v2/free/self'
    ];

    for (const url of providers) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return {
            city: data.city || 'Unknown',
            // Added data.countryName to catch the DB-IP provider response
            country: data.country_name || data.countryName || data.country || 'Unknown'
          };
        }
      } catch (e) {

      }
    }
    return { city: 'Unknown', country: 'Unknown' };
  };

  const handleLike = async (locationId) => {
    const meta = await getInteractionMetadata();
    const { error } = await supabaseClient
      .from('location_likes')
      .insert([{
        location_id: locationId,
        country: meta.country,
        city: meta.city
      }]);
    if (!error) setLikes(prev => ({ ...prev, [locationId]: (prev[locationId] || 0) + 1 }));
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

    if (error) {

      return;
    }

    if (data && data.length > 0) {
      setComments(prev => ({
        ...prev,
        [locationId]: [...(prev[locationId] || []), data[0]]
      }));
    }
  };

  const handleShare = async (e, place) => {

  if (e) e.stopPropagation();
  if (!place) return;

  // 1. GENERATE SHARE CONTENT
  // Ensure this URL format matches the one handled by your useEffect/updateSEO logic
  const url = `${window.location.origin}${window.location.pathname}?place=${encodeURIComponent(place.place_name)}`;
  const shareText = `Check out this amazing spot on My Journal: ${place.place_name} ${url}`;

  // 2. BULLETPROOF COPY LOGIC
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (fallbackErr) {
        return false;
      }
    }
  };

  // Perform the copy operation immediately for the best user experience
  const copied = await copyToClipboard(shareText);
  if (copied) {
    showToast("Link & details copied!", "success");
  }

  // 3. MOBILE NATIVE SHARE (Opens System Share Sheet)
  if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: `${place.place_name} | My Journal`,
        text: `Check out this amazing spot on My Journal: ${place.place_name}`,
        url: url
      });
      return; // Exit if native share was successful
    } catch (err) {
      // User cancelled or share failed; proceed to desktop modal fallback
    }
  }

  // 4. DESKTOP MODAL FALLBACK
  // This opens your custom UI for users on browsers that don't support native sharing
  setSharingData({
    name: place.place_name,
    url: url,
    text: `Check out this amazing spot on My Journal: ${place.place_name}`
  });
  setIsShareModalOpen(true);
};

  const logVisit = async (path = 'Main Page') => {
    // 1. Environment Check
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
      return;
    }

    // 2. SECRET URL ACTIVATION
    // If you visit yoursite.com/?mode=owner, it sets the token automatically
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'owner') {
      localStorage.setItem('owner_auth_token', 'owner');
      console.log("Owner mode activated via URL.");
    }

    // 3. Owner Exclusion Check
    const ownerToken = localStorage.getItem('owner_auth_token');
    if (ownerToken === 'owner') {
      return; // Exit immediately, no logging happens
    }

    // 4. IMMEDIATE LOCK (For actual visitors)
    if (path === 'Main Page') {
      if (sessionStorage.getItem('visit_logged')) return;
      sessionStorage.setItem('visit_logged', 'true');
    }

    // 5. Fetch Geographic Data
    let geo = null;
    const providers = ['https://ipapi.co/json/', 'https://api.db-ip.com/v2/free/self'];

    for (const url of providers) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          geo = {
            ip: data.ip || data.query || data.ipAddress || '',
            country: data.country_name || data.countryName || data.country || 'Unknown',
            region: data.region_name || data.stateProv || data.region || 'Unknown',
            city: data.city || 'Unknown'
          };
          break;
        }
      } catch (e) { }
    }

    if (!geo || !geo.ip) {
      if (path === 'Main Page') sessionStorage.removeItem('visit_logged');
      return;
    }

    // 6. Submit to Database
    const ua = navigator.userAgent;
    const { error } = await supabaseClient
      .from('page_visits')
      .insert([{
        page_path: path,
        user_agent: ua,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        ip_address: geo.ip
      }]);

    if (error && path === 'Main Page') {
      sessionStorage.removeItem('visit_logged');
    }
  };


  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setUserCoords(DEFAULT_LOCATION);
      return;
    }


    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(newCoords);

      },
      (err) => {

        if (!userCoords) setUserCoords(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
    return watchId;
  };

  const toggleRoutePlace = (place) => {
    setSelectedRoute(prev => {
      // 1. Add or remove the place from the selection pool
      const isSelected = prev.find(p => p.id === place.id);
      const selectionPool = isSelected
        ? prev.filter(p => p.id !== place.id)
        : [...prev, place];

      if (selectionPool.length === 0) return [];
      if (!userCoords) return selectionPool; // Fallback if GPS is off

      // 2. Sequential Reordering (Nearest Neighbor)
      const optimizedRoute = [];
      let remainingOptions = [...selectionPool];

      // Always start the calculation from the user's current position
      let currentPoint = { lat: userCoords.lat, lng: userCoords.lng };

      while (remainingOptions.length > 0) {
        let nearestIndex = 0;
        let shortestDistance = Infinity;

        for (let i = 0; i < remainingOptions.length; i++) {
          const distance = calculateDistance(
            currentPoint.lat,
            currentPoint.lng,
            remainingOptions[i].latitude,
            remainingOptions[i].longitude
          );

          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestIndex = i;
          }
        }

        // Move the closest location found to the optimized list
        const nextStop = remainingOptions.splice(nearestIndex, 1)[0];
        optimizedRoute.push(nextStop);

        // Update current point to the location we just "arrived" at
        currentPoint = { lat: nextStop.latitude, lng: nextStop.longitude };
      }

      return optimizedRoute;
    });
  };

  const fetchAttractions = async (lat, lng) => {
    if (isNaN(lat) || isNaN(lng)) return;

    try {
      const { PlacesService, PlacesServiceStatus } = await google.maps.importLibrary("places");
      if (!window.placesService) {
        window.placesService = new PlacesService(document.createElement('div'));
      }

      const naturalKeywords = [
        'waterfall', 'viewpoint', 'peak', 'mountain', 'forest',
        'park', 'reserve', 'monastery', 'temple', 'ancient',
        'archaeology', 'reservoir', 'lake', 'dam', 'river', 'church',
        'kovil', 'vihara', 'shrine', 'mosque', 'ella', 'falls',
        'bridge', 'point', 'view', 'world', 'rock', 'cave', 'beach', 'lagoon', 'archaeological', 'arboretum', 'botanical', 'conservation'
      ];

      window.placesService.nearbySearch({
        location: new google.maps.LatLng(lat, lng),
        radius: 5000,
        type: 'tourist_attraction'
      }, (results, status) => {
        if (status === PlacesServiceStatus.OK) {
          const filteredResults = results.filter(place => {
            const name = place.name.toLowerCase();
            const types = place.types || [];

            // 1. HARD BLOCK: Only for explicit commercial categories
            const isCommercial = types.some(t =>
              [
                'store', 'restaurant', 'lodging', 'hotel', 'cafe', 'bar',
                'shopping_mall', 'taxi_stand', 'transit_station', 'bus_station',
                'gas_station', 'car_repair', 'finance', 'bank', 'atm'
              ].includes(t)
            );

            // 2. CHECK: Does it match our Nature/Holy keywords?
            const matchesKeyword = naturalKeywords.some(keyword => name.includes(keyword));

            // 3. CHECK: Is it a Nature/Holy metadata type?
            const isNaturalOrHoly = types.some(t =>
              [
                'park', 'natural_feature', 'landmark', 'place_of_worship',
                'church', 'hindu_temple', 'mosque'
              ].includes(t)
            );

            // LOGIC: 
            // - Always discard if it's a Commercial/Business type (Hotel, Cafe, etc.)
            // - Then, accept it IF it matches a keyword OR has a natural metadata type.
            return !isCommercial && (matchesKeyword || isNaturalOrHoly);
          });

          setNearbyAttractions(filteredResults.slice(0, 8).map(place => ({
            id: place.place_id,
            name: place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            image: place.photos ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 }) : 'https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/My%20Journal%20Logo.png',
            rating: place.rating
          })));
        } else {
          setNearbyAttractions([]);
        }
      });
    } catch (e) { }
  };


  const handleSelectSuggestion = (attr) => {
    // 1. Convert attraction to your app's location format
    const newLocation = {
      id: attr.id,
      place_name: attr.name,
      latitude: attr.lat, // Note: Ensure your fetchAttractions stores these
      longitude: attr.lng
    };

    // 2. Add to route
    setSelectedRoute(prev => {
      if (prev.find(p => p.id === newLocation.id)) return prev;
      return [...prev, newLocation];
    });

    // 3. Open the planner so the user sees the new route
    setIsPlannerOpen(true);
  };

  const shareRoute = () => {
    if (selectedRoute.length < 2) return;

    const origin = `${selectedRoute[0].latitude},${selectedRoute[0].longitude}`;
    const destination = `${selectedRoute[selectedRoute.length - 1].latitude},${selectedRoute[selectedRoute.length - 1].longitude}`;
    const waypoints = selectedRoute.slice(1, -1)
      .map(p => `${p.latitude},${p.longitude}`)
      .join('|');

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, '_blank');
  };







  const handleAddPlace = async (e) => {
    e.preventDefault();

    // 1. DUPLICATE VALIDATION (Check against existing live list)
    const isDuplicate = places.some(place =>
      place.place_name.toLowerCase() === formData.place_name.trim().toLowerCase() ||
      (place.latitude === parseFloat(formData.latitude) &&
        place.longitude === parseFloat(formData.longitude))
    );

    if (isDuplicate) {
      showToast("This spot is already in the Journal!", "error");
      return;
    }

    // 2. SUBMIT TO PENDING_APPROVALS
    try {
      const { error } = await supabaseClient
        .from('pending_approvals')
        .insert([{
          place_name: formData.place_name,
          district: formData.district,
          latitude: formData.latitude,
          longitude: formData.longitude,
          map_url: formData.map_url,
          image_url: formData.image_url,
          category: formData.category,
          status: 'pending'
        }]);

      if (error) throw error;

      // 3. SUCCESS FEEDBACK
      showToast("Success! Spot submitted for review.", "success");
      setIsAddOpen(false);

      // Reset form for next time
      setFormData({
        place_name: "",
        category: "Location",
        latitude: null,
        longitude: null,
        district: "",
        map_url: ""
      });

    } catch (err) {
      console.error("Submission error:", err);
      showToast("Failed to submit: " + err.message, "error");
    }
  };





  // 1. CORRECTED URL GENERATOR
  // Uses the standard Google Maps direction format for multiple waypoints
  const generateGoogleMapsUrl = (points) => {
    if (!points || points.length === 0) return "";
    const baseUrl = "https://www.google.com/maps/dir/";
    const stops = points.map(p => `${p.latitude},${p.longitude}`).join('/');
    return `${baseUrl}${stops}`;
  };

  // 2. CORRECTED QR MODAL
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

    // FIXED INITIALIZATION: Use the imported QRCodeSVG and createRoot
    setTimeout(() => {
      const qrContainer = document.getElementById("qrcode-canvas");
      if (qrContainer) {
        // 1. Clear any placeholder content
        qrContainer.innerHTML = '';

        // 2. Initialize a React root on the target div
        const root = createRoot(qrContainer);

        // 3. Render the SVG component with high error correction (level="H")
        root.render(
          <QRCodeSVG
            value={universalUrl}
            size={200}
            bgColor="#f8fafc"
            fgColor="#0f172a"
            level="H"
            includeMargin={false}
          />
        );
      }
    }, 50);

    // Modal Actions
    modal.querySelector('#close-qr-btn').onclick = () => overlay.remove();

    modal.querySelector('#copy-link-btn').onclick = () => {
      navigator.clipboard.writeText(universalUrl);
      // Directly notifying the user since 'showToast' might be out of scope
      alert("Link copied to clipboard!");
    };

    modal.querySelector('#whatsapp-modal-btn').onclick = () => {
      const text = encodeURIComponent(`Check out my travel route: ${universalUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    };
  };



  // --- Advertisement Loader ---
  useEffect(() => {
    // Check if the script is already present to avoid multiple loads
    const scriptId = 'adsterra-invoke-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.dataset.cfasync = "false";
      script.src = "https://pl29174284.profitablecpmratenetwork.com/023accb7675231a6241cd0771cc13617/invoke.js";

      // Append to head or body
      document.body.appendChild(script);
    }
  }, []);

  const PrivacyModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Privacy Policy</h2>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <section>
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-2">Introduction</h3>
              <p>Welcome to <strong>My Journal - Viewer</strong>. We value your privacy and are committed to protecting the information you share while using our adventure planning platform.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-2">Information Collection</h3>
              <p>To provide accurate distance calculations and travel routing, we may access your device's approximate location. We also collect usage data (IP addresses and browser types) to optimize our performance on devices like iPhones and desktop browsers.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-2">Google AdSense & Cookies</h3>
              <p>This site uses Google AdSense to display advertisements. Google uses cookies (such as the DART cookie) to serve ads based on your visit to this site and other sites on the Internet. You may opt out of personalized advertising by visiting Google's Ad Settings.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-2">Third-Party Services</h3>
              <p>We use <strong>Supabase</strong> for secure data storage and <strong>Vercel</strong> for hosting. These services may collect logs necessary for technical stability and security.</p>
            </section>

            <section>
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-2">Contact</h3>
              <p>For any questions regarding this policy or our data practices, please reach out via the official "My Journal" social media channels.</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    );
  };

  const clearSelectedRoute = () => {
    if (window.confirm("Are you sure you want to clear all selected locations?")) {
      setSelectedRoute([]);
    }
  };


  return (

    <div className="h-full flex flex-col max-w-7xl mx-auto">

      {/* --- CONSOLIDATED HEADER & NAVIGATION AREA --- */}
      <div className="flex flex-col w-full bg-white md:bg-transparent">

        {/* 1. HEADER SECTION */}
        <header className="p-4 md:px-10 md:pt-8 md:pb-4 flex justify-between items-center bg-white md:bg-transparent border-b md:border-none">

          {/* LEFT SIDE: Logo & Identity */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Logo Container */}
            <div className="shrink-0 w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden p-1.5">
              <img
                src="https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/My%20Journal%20Logo.png"
                alt="My Journal Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Identity Text */}
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-800 leading-none">
                My Journal
              </h1>
              <p className="mt-2 text-slate-500 text-xs sm:text-sm font-medium leading-tight max-w-[200px] sm:max-w-none">
                Exploring nature, one destination at a time.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: Toggle Button & Hub Controls */}
          <div className="flex items-center gap-2">

            {/* Filters Toggle - Visible on ALL screens and positioned on the RIGHT */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all hover:bg-slate-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
              <span>{isFilterOpen ? 'Close' : 'Filters'}</span>
            </button>

            {/* Standardized Dual Hub System (Fixed positioning) */}
            {!isAddOpen && !isPlannerOpen && !isArticleOpen && !isShareModalOpen && (
              <div className="fixed bottom-4 right-3 z-[4000] flex flex-col items-end gap-2 max-w-[140px]">
                {/* HUB 1: SOCIAL HUB */}
                <div className="flex flex-col items-end gap-2">
                  <div className={`flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-100 transition-all duration-400 ${isSocialOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-90 pointer-events-none'}`}>
                    <a href="https://web.facebook.com/profile.php?id=61571059524746" target="_blank" rel="noreferrer" className="p-2.5 bg-[#1877F2] text-white rounded-xl hover:scale-105 transition-transform shadow-md outline-none select-none">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a href="https://www.tiktok.com/@hbgunasekera" target="_blank" rel="noreferrer" className="p-2.5 bg-black text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                      <Video className="w-4 h-4" />
                    </a>
                  </div>
                  <button
                    onClick={() => { setIsSocialOpen(!isSocialOpen); setIsEngineOpen(false); }}
                    className={`w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300 rounded-full ${isSocialOpen ? 'bg-white text-slate-900 border border-slate-100' : 'bg-slate-900 text-white'}`}
                  >
                    {isSocialOpen ? <X className="w-5 h-5" /> : <Share2 className="w-6 h-6" />}
                  </button>
                </div>

                {/* HUB 2: ENGINE HUB */}
                <div className="flex flex-col items-end gap-2">
                  <div className={`flex flex-col gap-2 transition-all duration-400 ${isEngineOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-90 pointer-events-none'}`}>
                    <button onClick={() => { setIsAddOpen(true); setIsEngineOpen(false); }} className="flex items-center justify-end gap-2 bg-white text-slate-900 p-1.5 pr-2 rounded-2xl shadow-lg border border-slate-100 whitespace-nowrap">
                      <span className="font-black uppercase text-[8px] tracking-tighter ml-2">Add</span>
                      <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Plus className="w-4 h-4" /></div>
                    </button>
                    <button onClick={() => { setIsPlannerOpen(true); setIsEngineOpen(false); }} className="flex items-center justify-end gap-2 bg-white text-slate-900 p-1.5 pr-2 rounded-2xl shadow-lg border border-slate-100 whitespace-nowrap">
                      <span className="font-black uppercase text-[8px] tracking-tighter ml-2">Plan</span>
                      <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white"><MapIcon className="w-6 h-6" /></div>
                    </button>
                  </div>
                  <div className="relative">
                    {!isEngineOpen && <div className="absolute inset-0 bg-slate-900 rounded-full animate-ping opacity-20"></div>}
                    <button
                      onClick={() => { setIsEngineOpen(!isEngineOpen); setIsSocialOpen(false); }}
                      className={`relative w-14 h-14 shadow-xl flex items-center justify-center transition-all duration-500 rounded-full ${isEngineOpen ? 'bg-white text-slate-900 border border-slate-100' : 'bg-slate-900 text-white'}`}
                    >
                      {isEngineOpen ? <X className="w-6 h-6 text-red-500" /> : (
                        <div className="flex flex-col items-center pointer-events-none">
                          <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                          </svg>
                          <span className="text-[6px] font-black uppercase mt-0.5">Engine</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 2. SEARCH, FILTER & SORT BLOCK */}
        {/* Behavior: Strictly toggled by isFilterOpen on ALL screens */}
        <div className={`
    ${isFilterOpen ? 'flex' : 'hidden'} 
    flex-col bg-white p-5 mx-4 md:mx-10 rounded-3xl shadow-xl border border-slate-100 mb-6 transition-all duration-300 relative z-[50]
  `}>
          <div className="flex flex-col md:flex-row gap-3 mb-4 w-full">
            {/* Search Input */}
            <div className="flex-[2] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search destinations..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 font-bold text-[11px] outline-none border border-transparent focus:border-slate-200 transition-all text-slate-800"
              />
            </div>

            {/* Sort Function */}
            <div className="relative flex-1">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-900 rounded-xl px-4 py-3 text-[10px] font-black uppercase appearance-none focus:outline-none shadow-lg shadow-slate-900/20 cursor-pointer"
              >
                <option value="recent">Newest First</option>
                <option value="distance">Nearest First</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-100/50 pointer-events-none" />
            </div>
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-2 w-full pt-2 border-t border-slate-50">
            {['All', ...VALID_CATEGORIES].map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all active:scale-95 ${filterTag === tag
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-20 scrollable-list">
        {/* 1. Main Grid: Location Cards & Adsterra */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pt-2">
          {displayedPlaces.map(place => (
            <article
              key={place.id}
              className="group relative rounded-[2rem] bg-white border border-slate-100 overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-xl"
            >
              <header className="h-40 md:h-48 w-full relative bg-slate-100 overflow-hidden">
                {place.cover_photo_url && (
                  <img
                    src={getOptimizedUrl(place.cover_photo_url, 600, 75)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    alt={`Scenic view of ${place.place_name}`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider shadow-sm ${place.status === 'done' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
                    {place.status === 'done' ? '✨ Visited' : '⏳ Bucket List'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 pr-4">
                  <h3 className="text-white text-xs md:text-sm font-extrabold uppercase tracking-tight">
                    {auditLocationName(place.place_name)}
                  </h3>
                </div>
              </header>

              <main className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">
                      {place.locality || 'Explore'}
                    </span>
                  </div>
                  <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 text-[8px] font-black uppercase shrink-0">
                    {place.category}
                  </span>
                </div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {userCoords ? `${calculateDistance(userCoords.lat, userCoords.lng, place.latitude, place.longitude).toFixed(1)} KM AWAY` : "Location Access Required"}
                </div>

                {place.status !== 'pending' && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                    <button onClick={(e) => { e.stopPropagation(); handleLike(place.id); }} className="flex items-center gap-1.5 group outline-none select-none pr-2">
                      <div className="p-2 rounded-full group-hover:bg-rose-50 transition-colors">
                        <Heart className={`w-4 h-4 ${likes[place.id] ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{likes[place.id] || 0}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setViewingArticle(place); setIsArticleOpen(true); }} className="flex items-center gap-1.5 group outline-none select-none pr-2">
                      <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
                        <MessageCircle className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{(comments[place.id] || []).length}</span>
                    </button>
                    <button onClick={(e) => handleShare(e, place)} className="flex items-center gap-1.5 group outline-none select-none">
                      <div className="p-2 rounded-full group-hover:bg-emerald-50 transition-colors">
                        <Share2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                      </div>
                    </button>
                  </div>
                )}

                <footer className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-100/60">
                  {place.google_maps_url && (
                    <button onClick={() => window.open(place.google_maps_url, '_blank')} className="flex flex-col items-center justify-center py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-90 transition-all border border-slate-100/50">
                      <MapIcon className="w-6 h-6" />
                      <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Maps</span>
                    </button>
                  )}
                  {place.album_photos && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveId(place.id); }} className="flex flex-col items-center justify-center py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100/50">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Gallery</span>
                    </button>
                  )}
                  {place.ai_article?.story && (
                    <button onClick={() => { setViewingArticle(place); setIsArticleOpen(true); }} className="flex flex-col items-center justify-center py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100/50">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Read</span>
                    </button>
                  )}
                </footer>
              </main>
            </article>
          ))}

          {/* ADSTERRA GRID ITEM */}
          <div className="group relative rounded-[2rem] bg-slate-50/50 border border-dashed border-slate-200 overflow-hidden flex items-center justify-center p-4 min-h-[300px]">
            <div id="container-023accb7675231a6241cd0771cc13617" className="w-full h-full flex items-center justify-center"></div>
            <div className="absolute top-4 right-4">
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Sponsored</span>
            </div>
          </div>
        </div>

        {/* 2. THE SENTINEL & LOADING SPINNER */}
        <div ref={sentinelRef} className="w-full flex justify-center items-center py-12">
          {visibleCount < filteredPlaces.length && (
            <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />
          )}
        </div>

        {/* 3. GOOGLE AD & FOOTER */}
        <div className="w-full max-w-5xl mx-auto px-4">
          <GoogleBottomAd />
        </div>

        <footer className="py-10 text-center border-t border-slate-100 mt-10">
          <button onClick={() => setIsPrivacyOpen(true)} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors">
            Privacy Policy & Terms
          </button>
          <p className="text-[9px] text-slate-300 uppercase mt-2 font-medium">
            © {new Date().getFullYear()} My Journal by Hasitha Gunasekera
          </p>
        </footer>

        {/* 4. SHARE DIALOG (Fixed positioning prevents scroll issues) */}
        {isShareModalOpen && sharingData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsShareModalOpen(false)}
            ></div>

            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Share Journey</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{sharingData.name}</p>
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
                    showToast("Link ready to paste!", "success");
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

      {isArticleOpen && ViewingArticle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => {
            setIsArticleOpen(false);
            setViewingArticle(null);
          }}></div>

          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header Image */}
            <div className="relative h-48 w-full shrink-0">
              <img src={ViewingArticle.cover_photo_url} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button
                onClick={() => {
                  setIsArticleOpen(false);
                  setViewingArticle(null);
                }}
                className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto scrollable-list no-scrollbar">
              {/* Meta Row */}
              <div className="flex items-center justify-between mb-4">
                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  {ViewingArticle.category}
                </span>
                <div className="flex items-center gap-2">

                  {/* Share Button (Updated to trigger Custom Dialog) */}
                  <button
                    onClick={() => handleShare(null, ViewingArticle)}
                    className="p-2 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 rounded-xl transition-colors border border-slate-100 group"
                    title="Share this location"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" />
                  </button>

                  <button
                    onClick={() => window.open(ViewingArticle.google_maps_url || `https://www.google.com/maps?q=${ViewingArticle.latitude},${ViewingArticle.longitude}`, '_blank')}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {ViewingArticle.status !== 'pending' && (
                    <button
                      onClick={() => handleLike(ViewingArticle.id)}
                      className="flex items-center gap-2 bg-slate-50 hover:bg-rose-50 px-4 py-2 rounded-2xl border border-slate-100 transition-all"
                    >
                      <Heart
                        className={`w-4 h-4 ${likes[ViewingArticle.id] ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
                      />
                      <span className="text-[10px] font-black text-slate-900">
                        {likes[ViewingArticle.id] || 0}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI JOURNAL CONTENT */}
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-4 leading-tight tracking-tight">
                  {ViewingArticle.ai_article?.title || ViewingArticle?.place_name}
                </h2>

                <div className="prose prose-slate">
                  <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                    {ViewingArticle.ai_article?.story || "Journey details are being prepared..."}
                  </p>
                </div>

                {ViewingArticle.ai_article?.specs && (
                  <div className="mt-6 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 italic">
                    <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Technical Specs & Access</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {ViewingArticle.ai_article.specs}
                    </p>
                  </div>
                )}
              </div>

              {/* DISCUSSION SECTION */}
              <div className="border-t border-slate-100 pt-8">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <MessageCircle className="w-3 h-3" />
                  Discussion ({comments[ViewingArticle.id]?.length || 0})
                </h4>

                <div className="space-y-4 mb-8">
                  {comments[ViewingArticle.id]?.map((c, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-700 font-semibold mb-2">{c.comment_text}</p>
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
                        <div className="mt-4 pt-4 border-t border-slate-200/60">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-tighter">Author Response</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-600 leading-relaxed italic">"{c.reply_text}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* INPUT SECTION */}
                <div className="relative sticky bottom-0 bg-white pt-2">
                  <input
                    type="text"
                    value={NewCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add your trail note..."
                    className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl px-5 py-4 text-xs font-bold transition-all outline-none pr-12"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && NewCommentText.trim()) {
                        const text = NewCommentText;
                        setNewCommentText('');
                        await submitComment(ViewingArticle.id, text);
                      }
                    }}
                  />
                  <button
                    onClick={() => { if (NewCommentText.trim()) submitComment(ViewingArticle.id, NewCommentText); setNewCommentText(''); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 mt-1"
                  >
                    <Send className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <button onClick={() => {
                setIsArticleOpen(false);
                setViewingArticle(null);
              }} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-colors">Close Journal</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ROUTE PLANNER MODAL --- */}
      {isPlannerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"
            onClick={() => setIsPlannerOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

            {/* LEFT SIDE: MAP ENGINE */}
            <div className="h-[40vh] md:h-full md:w-[60%] bg-slate-100 relative z-0 shrink-0 overflow-hidden">
              <MapComponent
                places={places}
                userCoords={userCoords}
                selectedRoute={selectedRoute}
                hoveredPlaceId={hoveredPlaceId}
                setHoveredPlaceId={setHoveredPlaceId}
                fetchAttractions={fetchAttractions}
                setRouteDistance={setRouteDistance}
                setRouteData={setRouteData}
                toggles={toggles}
                mapInstanceRef={mapRef}
              />

              {/* Floating Map Label */}
              <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-900">Interactive Route Engine</p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: SELECTION PANEL */}
            <div className="flex-1 flex flex-col min-w-0 bg-white z-10 border-t md:border-t-0 md:border-l border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none rounded-t-[2rem] md:rounded-t-none -mt-6 md:mt-0 overflow-hidden">

              {/* 1. Header Section */}
              <div className="p-5 pb-3 border-b border-slate-100 bg-white shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 leading-none truncate">Route Planner</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">
                        {selectedRoute.length} Stops Selected
                      </span>
                      {selectedRoute.length > 0 && parseFloat(routeDistance) > 0 && (
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                          <Navigation className="w-2.5 h-2.5" />
                          {routeDistance} KM
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedRoute.length > 0 && (
                      <button onClick={handleReset} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-full active:rotate-180 transition-transform duration-500" title="Reset Route">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setIsPlannerOpen(false)} className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by name or category..."
                    value={plannerSearch}
                    onChange={(e) => setPlannerSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 2. Utility Toggles */}
              <div className="flex gap-2 p-3 bg-white border-b border-slate-50 overflow-x-auto no-scrollbar shrink-0">
                {[
                  { id: 'lodging', label: 'Hotels', icon: 'bed', color: 'bg-blue-500' },
                  { id: 'gas_station', label: 'Fuel Station', icon: 'fuel', color: 'bg-yellow-500' },
                  { id: 'restaurant', label: 'Food & Dining', icon: 'utensils', color: 'bg-purple-500' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => toggleNearby(type.id)}
                    className={`flex-1 min-w-[110px] py-2 rounded-lg text-[9px] font-black uppercase transition-all border flex items-center justify-center gap-2 
                ${toggles[type.id] ? `${type.color} border-transparent text-white shadow-md` : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {/* Note: Ensure RenderDynamicIcon is defined or use specific Lucide icons */}
                    <MapPin className="w-3 h-3" /> {type.label}
                  </button>
                ))}
              </div>

              {/* 3. Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                {/* Nearby Suggestions Section */}
                {nearbyAttractions.length > 0 && (
                  <div className="p-4 bg-indigo-50/30 border-b border-indigo-100/50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Discover Nearby</h4>
                      <button onClick={() => setNearbyAttractions([])} className="text-[8px] font-black text-rose-400 uppercase">Dismiss</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                      {nearbyAttractions.map((attr) => (
                        <div
                          key={attr.id}
                          onClick={() => typeof handleSelectSuggestion === 'function' && handleSelectSuggestion(attr)}
                          className="min-w-[130px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 active:scale-95 transition-transform cursor-pointer"
                        >
                          <img src={attr.image} className="h-16 w-full object-cover" alt={attr.name} />
                          <div className="p-2">
                            <h5 className="text-[9px] font-black text-slate-800 line-clamp-1 uppercase tracking-tighter">{attr.name}</h5>
                            <span className="text-[8px] font-bold text-amber-500 flex items-center gap-1">★ {attr.rating || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Cards List */}
                <div className="p-4 space-y-2">
                  {(() => {
                    const search = (plannerSearch || "").toLowerCase();
                    const filtered = places
                      .filter(place =>
                        (place.status === 'done' || place.status === 'pending') &&
                        (place.place_name.toLowerCase().includes(search) || place.category.toLowerCase().includes(search))
                      )
                      .map(place => ({
                        ...place,
                        dist: userCoords ? calculateDistance(userCoords.lat, userCoords.lng, place.latitude, place.longitude) : Infinity
                      }))
                      .sort((a, b) => a.dist - b.dist);

                    if (filtered.length === 0) return (
                      <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-widest">No matching locations</div>
                    );

                    return filtered.map(place => {
                      const isSelected = selectedRoute.find(p => p.id === place.id);
                      const weather = weatherData ? weatherData[place.place_name] : null;
                      return (
                        <div key={place.id} className={`flex items-center p-3 rounded-2xl border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500/20' : 'border-slate-100 bg-white'}`}>
                          <div className="flex-1 min-w-0 pr-2 cursor-pointer" onClick={() => toggleRoutePlace(place)}>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${place.status === 'pending' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                              <span className="text-[10px] font-black uppercase truncate text-slate-900">{place.place_name}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-2">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{place.category} • {place.dist.toFixed(1)} km</span>
                              {weather && (
                                <div className="flex flex-wrap gap-1.5">
                                  <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
                                    <span className="text-[7px] font-black text-blue-400 uppercase">Now</span>
                                    <span className="text-[8px] font-black text-blue-600 uppercase">{weather.current}°C</span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                                    <span className="text-[7px] font-black text-indigo-400 uppercase">Tmrw</span>
                                    <span className="text-[8px] font-black text-indigo-600 uppercase">{weather.nextDay}°C</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button onClick={() => toggleRoutePlace(place)} className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                            {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 4. Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-white shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                <div className="flex gap-2">
                  {selectedRoute.length >= 2 && (
                    <button
                      onClick={shareRoute}
                      className="flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  )}
                  <button
                    onClick={() => selectedRoute.length > 0 && typeof showQRCode === 'function' && showQRCode(selectedRoute, "My Travel Plan")}
                    disabled={selectedRoute.length === 0}
                    className={`flex-[2] py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 ${selectedRoute.length > 0 ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    <QrCode className="w-3.5 h-3.5" /> Generate QR
                  </button>
                </div>
              </div>
            </div> {/* End Panel */}
          </div> {/* End Modal Container */}
        </div> // End Fixed Inset
      )}

      {/* --- SUGGEST A SPOT / ADD LOCATION MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-white z-[3000] flex flex-col lg:flex-row animate-in fade-in duration-300">

          {/* LEFT SIDE: MAP SELECTION ENGINE */}
          <div className="w-full lg:w-1/2 h-[25vh] lg:h-full bg-slate-100 relative">

            {/* The map will now auto-center on formData.latitude/longitude changes */}
            {MemoizedAddMap}

            {/* Ultra-Compact Status Overlay */}
            <div className="absolute top-3 left-3 z-[1001] bg-white/95 backdrop-blur-md p-3 rounded-lg shadow-xl border border-slate-200 pointer-events-none min-w-[140px]">
              <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-tighter">Live Verification</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.latitude ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <p className="text-[10px] font-black text-slate-900 tabular-nums">
                  {formData.latitude ? `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}` : "SELECTING POINT..."}
                </p>
              </div>
              {formData.district && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-2 h-2 text-indigo-500" />
                  <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">
                    {formData.district}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: FORM DATA */}
          <div className="w-full lg:w-1/2 p-5 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter italic">Suggest Spot</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Auto-Sync with Google Places & Map
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100"
              >
                <X className="w-4 h-4 text-slate-900" />
              </button>
            </div>

            <form onSubmit={handleAddPlace} className="space-y-4">

              {/* 1. Location Search with Live Duplicate Alert */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Search Spot Name</label>
                  {places.some(p => p.place_name.toLowerCase() === formData.place_name?.trim().toLowerCase()) && (
                    <span className="text-[8px] font-black text-red-500 uppercase animate-bounce">Already in Database</span>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    id="location-search"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Search (e.g. Laxapana Falls)..."
                    value={formData.place_name || ""}
                    onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 outline-none transition-all font-bold text-sm
                ${places.some(p => p.place_name.toLowerCase() === formData.place_name?.trim().toLowerCase())
                        ? 'border-red-200 ring-2 ring-red-50'
                        : 'border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                  />
                </div>
              </div>

              {/* 2. Category Selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign Category</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none font-bold text-[11px] uppercase tracking-wider appearance-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {["Waterfall", "Mountain", "Trail", "Viewpoint", "Beach", "Park", "Archaeology", "Reservoir", "Location"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 3. Submission Action - Routes to pending_approvals */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!formData.latitude || !formData.place_name || places.some(p => p.place_name.toLowerCase() === formData.place_name?.trim().toLowerCase())}
                  className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2
              ${formData.latitude && formData.place_name && !places.some(p => p.place_name.toLowerCase() === formData.place_name?.trim().toLowerCase())
                      ? 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-indigo-600'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Submit for Review
                </button>
                <p className="text-[8px] text-center text-slate-400 font-bold mt-4 uppercase tracking-tighter opacity-60">
                  * Coordinates and District are captured upon Google Selection
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeId && (
        <PhotoGallery
          key={activeId}
          photos={places.find(p => p.id === activeId)?.album_photos || []}
          onClose={() => setActiveId(null)}
        />
      )}

      {activeVideoId && (
        <VideoGallery
          key={activeVideoId}
          videos={places.find(p => p.id === activeVideoId)?.tiktok_urls || []}
          onClose={() => setActiveVideoId(null)}
        />
      )}

      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {/* Toast Notification Container */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-[90%] max-w-md">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-300 ${n.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
              n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                'bg-white border-slate-100 text-slate-800'
              }`}
          >
            {n.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {n.type === 'info' && <Info className="w-5 h-5" />}

            <p className="text-sm font-semibold">{n.message}</p>

            <button
              onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
              className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;