export function parseLatLngFromUrl(raw: string): { lat: number; lng: number } | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");

    // Google Maps: has @lat,lng,zoom or q=lat,lng
    if (host.includes("google.")) {
      const at = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(u.pathname + u.search);
      if (at) return { lat: Number(at[1]!), lng: Number(at[2]!) };
      const q = u.searchParams.get("q") || u.searchParams.get("query");
      if (q) {
        const m = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/.exec(q);
        if (m) return { lat: Number(m[1]!), lng: Number(m[2]!) };
      }
    }

    // OpenStreetMap: mlat/mlon params or map=zoom/lat/lon
    if (host.includes("openstreetmap.org")) {
      const mlat = u.searchParams.get("mlat");
      const mlon = u.searchParams.get("mlon");
      if (mlat && mlon) return { lat: Number(mlat), lng: Number(mlon) };
      const map = u.searchParams.get("map");
      if (map) {
        const parts = map.split("/");
        if (parts.length >= 3) {
          const lat = Number(parts[1]);
          const lng = Number(parts[2]);
          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        }
      }
    }

    // Apple Maps: ll=lat,lng
    if (host.includes("apple.com")) {
      const ll = u.searchParams.get("ll");
      if (ll) {
        const [latStr, lngStr] = ll.split(",");
        const lat = Number(latStr);
        const lng = Number(lngStr);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function staticMapPreviewFromUrl(raw: string, width = 640, height = 320, zoom = 14): string | null {
  const ll = parseLatLngFromUrl(raw);
  if (!ll) return null;
  const w = Math.max(64, Math.min(1024, Math.floor(width)));
  const h = Math.max(64, Math.min(1024, Math.floor(height)));
  const z = Math.max(0, Math.min(18, Math.floor(zoom)));
  const base = "https://staticmap.openstreetmap.de/staticmap.php";
  const url = `${base}?center=${ll.lat},${ll.lng}&zoom=${z}&size=${w}x${h}&markers=${ll.lat},${ll.lng},lightblue1`;
  return url;
}

