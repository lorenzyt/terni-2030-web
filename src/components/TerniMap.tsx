import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { MapCanvasProps } from "@/lib/map-types";

const MapCanvas = lazy(() => import("./MapCanvas"));

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-2 text-sm text-muted-foreground">
      Caricamento mappa di Terni…
    </div>
  );
}

export function TerniMap(props: MapCanvasProps) {
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <MapCanvas {...props} />
      </Suspense>
    </ClientOnly>
  );
}
