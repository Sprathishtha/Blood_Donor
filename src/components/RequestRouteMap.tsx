import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinates } from '../utils/geospatial';

interface Props {
  hospitalLocation: Coordinates;
  donorLocation: Coordinates;
}

export function RequestRouteMap({ hospitalLocation, donorLocation }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(ref.current).setView(
        [hospitalLocation.latitude, hospitalLocation.longitude],
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
        mapRef.current
      );
    }

    const map = mapRef.current;

    map.eachLayer((l: any) => {
      if (!l._url) map.removeLayer(l);
    });

    const h = L.marker([hospitalLocation.latitude, hospitalLocation.longitude]);
    const d = L.marker([donorLocation.latitude, donorLocation.longitude]);
    const line = L.polyline([
      [hospitalLocation.latitude, hospitalLocation.longitude],
      [donorLocation.latitude, donorLocation.longitude],
    ]);

    h.addTo(map);
    d.addTo(map);
    line.addTo(map);

    map.fitBounds(line.getBounds(), { padding: [20, 20] });
  }, [hospitalLocation, donorLocation]);

  return <div ref={ref} className="h-60 w-full" />;
}
