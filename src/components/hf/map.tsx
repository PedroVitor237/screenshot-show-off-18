// Mapa carregado somente no navegador (Leaflet). Fallback textual quando os tiles falham.
import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useScenario } from "@/lib/hf/scenario-store";
import { Card, CardContent } from "@/components/ui/card";

export interface MapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

const LeafletMap = lazy(() => import("./map-leaflet"));

export function AreaMap({
  points,
  onPick,
  picked,
  height = 360,
}: {
  points: MapPoint[];
  onPick?: (lat: number, lng: number) => void;
  picked?: { latitude: number; longitude: number } | null;
  height?: number;
}) {
  const s = useScenario();
  const [tileError, setTileError] = useState(false);

  if (s.tiles === "fail" || tileError) {
    return (
      <Card className="rounded-card shadow-soft" role="status">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <MapPin className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">Mapa de demonstração</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Não foi possível carregar os blocos do mapa. As coordenadas das áreas continuam
            disponíveis na lista ao lado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ClientOnly
      fallback={
        <div
          className="flex items-center justify-center rounded-card border bg-secondary text-sm text-muted-foreground"
          style={{ height }}
          role="status"
        >
          Carregando mapa…
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center rounded-card border bg-secondary text-sm text-muted-foreground" style={{ height }} role="status">
            Carregando mapa…
          </div>
        }
      >
        <LeafletMap points={points} onPick={onPick} picked={picked} height={height} onTileError={() => setTileError(true)} />
      </Suspense>
    </ClientOnly>
  );
}
