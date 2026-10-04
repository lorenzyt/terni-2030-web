import type { ReactNode } from "react";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  glow?: boolean;
  popup: ReactNode;
};

export type MapCanvasProps = {
  center: [number, number];
  zoom?: number;
  pins: MapPin[];
  onMapClick?: ((lat: number, lng: number) => void) | undefined;
  className?: string;
};
