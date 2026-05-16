import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  lat: number;
  lon: number;
  count: number;
  label: string;
  source?: string;
}

interface VisitorMapProps {
  points: MapPoint[];
}

function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    const west = Math.min(...lons);
    const east = Math.max(...lons);
    if (south === north && west === east) {
      map.setView([south, west], 11);
    } else {
      map.fitBounds(
        [
          [south, west],
          [north, east],
        ],
        { padding: [40, 40], maxZoom: 11 }
      );
    }
  }, [map, points]);
  return null;
}

export function VisitorMap({ points }: VisitorMapProps) {
  const maxCount = points.reduce((m, p) => Math.max(m, p.count), 1);
  return (
    <div className="rounded-3xl overflow-hidden border border-stone-100 shadow-sm bg-white" style={{ height: 420 }}>
      <MapContainer
        center={[20, 78]}
        zoom={4}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToPoints points={points} />
        {points.map((p, i) => {
          const radius = 6 + Math.round((p.count / maxCount) * 18);
          const color = p.source === "gps" ? "#5A5A40" : "#a16207";
          return (
            <CircleMarker
              key={`${p.lat}|${p.lon}|${i}`}
              center={[p.lat, p.lon]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.55, weight: 1.5 }}
            >
              <Tooltip direction="top" offset={[0, -radius]} opacity={1}>
                <div style={{ fontSize: 12 }}>
                  <strong>{p.label}</strong>
                  <br />
                  {p.count} visit{p.count > 1 ? "s" : ""} · {p.source === "gps" ? "GPS" : "IP"}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
