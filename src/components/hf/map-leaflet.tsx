// SOMENTE NAVEGADOR: nunca importar este módulo em rotas SSR — use map.tsx (lazy + ClientOnly).
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "./map";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onPick }: { onPick?: ((lat: number, lng: number) => void) | undefined }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const b = L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(b.pad(0.3), { maxZoom: 12 });
  }, [points, map]);
  return null;
}

export default function LeafletMap({
  points,
  onPick,
  picked,
  height,
  onTileError,
}: {
  points: MapPoint[];
  onPick?: ((lat: number, lng: number) => void) | undefined;
  picked?: { latitude: number; longitude: number } | null | undefined;
  height: number;
  onTileError: () => void;
}) {
  const center: [number, number] = points[0]
    ? [points[0].latitude, points[0].longitude]
    : [-14.2, -51.9]; // centro aproximado do Brasil
  return (
    <div className="overflow-hidden rounded-card border shadow-soft" style={{ height }}>
      <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: onTileError }}
        />
        <ClickHandler onPick={onPick} />
        <FitBounds points={points} />
        {points.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={icon}>
            <Popup>{p.name}</Popup>
          </Marker>
        ))}
        {picked ? <Marker position={[picked.latitude, picked.longitude]} icon={icon} /> : null}
      </MapContainer>
    </div>
  );
}
