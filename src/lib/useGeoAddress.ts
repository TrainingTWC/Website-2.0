import { useState, useCallback } from "react";

interface GeoAddress {
  address1: string; // house_number + road
  address2: string; // neighbourhood / suburb
  city: string;     // city / town / village
  state: string;    // state
  pincode: string;  // postcode
}

interface CachedGeoAddress {
  address: GeoAddress;
  cachedAt: number;
}

const CACHE_KEY = "twc_geo_address";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadCache(): GeoAddress | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedGeoAddress = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.address;
  } catch {
    return null;
  }
}

function saveCache(address: GeoAddress) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ address, cachedAt: Date.now() }));
}

function mapNominatimToAddress(data: Record<string, unknown>): GeoAddress {
  const a = (data.address ?? {}) as Record<string, string>;
  return {
    address1:
      [a.house_number, a.road].filter(Boolean).join(" ") ||
      a.pedestrian ||
      a.footway ||
      "",
    address2: a.neighbourhood || a.suburb || a.quarter || "",
    city: a.city || a.town || a.village || a.county || "",
    state: a.state || "",
    pincode: a.postcode || "",
  };
}

export function useGeoAddress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<GeoAddress | null>(() => loadCache());

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent":
                  "brewmatch-ai/3.0 (contact: support@thirdwavecoffee.in)",
              },
            }
          );
          if (!res.ok) throw new Error("Geocoding service unavailable.");
          const data: Record<string, unknown> = await res.json();
          const mapped = mapNominatimToAddress(data);
          saveCache(mapped);
          setAddress(mapped);
        } catch {
          setError("Could not determine your address. Please enter it manually.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location permission denied. Please enter your address manually."
          );
        } else {
          setError(
            "Could not access your location. Please enter your address manually."
          );
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setAddress(null);
    setError(null);
  }, []);

  return { loading, error, address, requestLocation, clearCache };
}
