import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapCanvasProps } from "@/lib/map-types";

function pinIcon(color: string, glow?: boolean, imageUrl?: string, isPremium?: boolean) {
  if (imageUrl && isPremium) {
    return L.divIcon({
      className: "",
      html: `<div style="width:36px;height:36px;border-radius:50%;border:3px solid ${color};box-shadow:0 0 0 4px ${color}33${glow ? `,0 0 18px 4px ${color}aa` : ""};background-image:url('${imageUrl}');background-size:cover;background-position:center;"></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
  }
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:20px;height:20px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,.85);box-shadow:0 0 0 4px ${color}33${
      glow ? `,0 0 18px 4px ${color}aa` : ""
    }"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

function ClickHandler({
  onMapClick,
}: {
  onMapClick?: ((lat: number, lng: number) => void) | undefined;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapCanvas({
  center,
  zoom = 14,
  pins,
  onMapClick,
  className,
}: MapCanvasProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className={className ?? "h-full w-full"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      {pins.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={pinIcon(p.color, p.glow, p.imageUrl, p.isPremium)}
          title={p.label}
        >
          <Popup minWidth={240}>{p.popup}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
