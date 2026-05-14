---
phase: "02-gps-address-autofill"
plan: "02-01"
milestone: "v3.0"
type: "feature"
wave: 1
depends_on: ["v2.0 Phase 1 — CheckoutPage exists (shipped)"]
files_modified:
  - src/lib/useGeoAddress.ts (CREATE)
  - src/components/CheckoutPage.tsx (MODIFY — add GPS button + autofill logic)
autonomous: true
must_haves:
  truths:
    - GPS only fires on explicit button tap — NEVER on page load
    - Reverse geocode is client-side only — no coords reach Convex or any proprietary server
    - Nominatim (OpenStreetMap, free, no API key) is the reverse geocode provider
    - Cache TTL is 7 days; key is `twc_geo_address` in localStorage
    - Form validation is unchanged — autofill just pre-populates values
  artifacts:
    - src/lib/useGeoAddress.ts with full hook implementation
    - CheckoutPage shows "Use my location" button; cached address shows "Use saved location" + clear option
---

# Plan: GPS Address Autofill at Checkout

## Goal

Let customers fill their delivery address with one tap instead of typing — using the browser's Geolocation API + Nominatim reverse geocoding. Cached for 7 days so repeat customers see it instantly.

---

## Task 1 — Create `src/lib/useGeoAddress.ts`

**Files:** `src/lib/useGeoAddress.ts` (CREATE)

**Steps:**

1. Define the cached address shape:
   ```ts
   interface GeoAddress {
     address1: string;  // house_number + road
     address2: string;  // neighbourhood / suburb
     city: string;      // city / town / village
     state: string;     // state
     pincode: string;   // postcode
   }
   interface CachedGeoAddress {
     address: GeoAddress;
     cachedAt: number;  // Unix ms timestamp
   }
   ```

2. Constants:
   ```ts
   const CACHE_KEY = "twc_geo_address";
   const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
   ```

3. Helper `loadCache(): GeoAddress | null`:
   ```ts
   try {
     const raw = localStorage.getItem(CACHE_KEY);
     if (!raw) return null;
     const parsed: CachedGeoAddress = JSON.parse(raw);
     if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
       localStorage.removeItem(CACHE_KEY);
       return null;
     }
     return parsed.address;
   } catch { return null; }
   ```

4. Helper `saveCache(address: GeoAddress)`:
   ```ts
   localStorage.setItem(CACHE_KEY, JSON.stringify({ address, cachedAt: Date.now() }));
   ```

5. Helper `mapNominatimToAddress(data: any): GeoAddress`:
   - `a = data.address`
   - `address1 = [a.house_number, a.road].filter(Boolean).join(" ") || a.pedestrian || a.footway || ""`
   - `address2 = a.neighbourhood || a.suburb || a.quarter || ""`
   - `city = a.city || a.town || a.village || a.county || ""`
   - `state = a.state || ""`
   - `pincode = a.postcode || ""`
   - return the object

6. Export `useGeoAddress()` hook:
   ```ts
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
               { headers: { "User-Agent": "brewmatch-ai/3.0 (contact: support@thirdwavecoffee.in)" } }
             );
             if (!res.ok) throw new Error("Geocoding service unavailable.");
             const data = await res.json();
             const mapped = mapNominatimToAddress(data);
             saveCache(mapped);
             setAddress(mapped);
           } catch (err) {
             setError("Could not determine your address. Please enter it manually.");
           } finally {
             setLoading(false);
           }
         },
         (err) => {
           setLoading(false);
           if (err.code === err.PERMISSION_DENIED) {
             setError("Location permission denied. Please enter your address manually.");
           } else {
             setError("Could not access your location. Please enter your address manually.");
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
   ```

7. Imports at top: `import { useState, useCallback } from "react"`.

---

## Task 2 — Update `src/components/CheckoutPage.tsx`

**Files:** `src/components/CheckoutPage.tsx` (MODIFY)

**Steps:**

1. Add import: `import { useGeoAddress } from "../lib/useGeoAddress"`.
2. Add `MapPin, Loader2` to the existing lucide-react import.
3. Inside the component function, call: `const { loading: geoLoading, error: geoError, address: geoAddress, requestLocation, clearCache } = useGeoAddress();`

4. **Effect to apply autofill** when `geoAddress` changes (and was triggered by button tap):
   ```ts
   const geoApplied = useRef(false);
   // On first mount: if cached address exists, pre-fill silently
   useEffect(() => {
     if (geoAddress && !geoApplied.current) {
       setForm(f => ({
         ...f,
         address1: geoAddress.address1 || f.address1,
         address2: geoAddress.address2 || f.address2,
         city: geoAddress.city || f.city,
         state: geoAddress.state || f.state,
         pincode: geoAddress.pincode || f.pincode,
       }));
       geoApplied.current = true;
     }
   }, [geoAddress]);
   ```

5. **"Use my location" button** — place it above the Address section label:
   ```tsx
   {typeof navigator !== "undefined" && "geolocation" in navigator && (
     <div className="flex items-center gap-2 mb-3">
       {geoAddress ? (
         <>
           <button
             type="button"
             onClick={requestLocation}
             className="flex items-center gap-1.5 text-xs font-medium text-natural-accent underline underline-offset-2"
           >
             <MapPin className="w-3.5 h-3.5" />
             Update location
           </button>
           <span className="text-natural-muted text-xs">·</span>
           <button
             type="button"
             onClick={clearCache}
             className="text-xs text-natural-muted hover:text-red-500 transition-colors"
           >
             Clear saved address
           </button>
         </>
       ) : (
         <button
           type="button"
           onClick={requestLocation}
           disabled={geoLoading}
           className="flex items-center gap-1.5 text-xs font-medium text-natural-accent hover:underline underline-offset-2 disabled:opacity-60"
         >
           {geoLoading ? (
             <Loader2 className="w-3.5 h-3.5 animate-spin" />
           ) : (
             <MapPin className="w-3.5 h-3.5" />
           )}
           {geoLoading ? "Detecting location…" : "Use my location"}
         </button>
       )}
     </div>
   )}
   {geoError && (
     <p className="text-red-500 text-xs mb-3">{geoError}</p>
   )}
   ```

6. No other changes to form state, validation, or submission logic.

---

## Verification

- [ ] "Use my location" button appears on checkout page (desktop + mobile)
- [ ] Clicking it triggers browser permission dialog
- [ ] On allow: all 5 address fields populate within 2 s
- [ ] Populated fields are editable after autofill
- [ ] Second visit (cache valid): address auto-fills on mount, button reads "Update location"
- [ ] "Clear saved address" removes cache and resets to empty fields
- [ ] On permission deny: friendly error message, manual entry still functional
- [ ] No GPS call on page load — only on button tap
- [ ] No coords reach any server other than Nominatim
