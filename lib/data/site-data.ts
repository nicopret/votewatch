import constituencyData from "@/data/generated/constituencies.json";
import constituencyMap from "@/data/maps/constituencies.geo.json";
import type { ConstituencyCollection, SimpleFeatureCollection } from "@/lib/types";

export function getConstituencyCollection(): ConstituencyCollection {
  return constituencyData as ConstituencyCollection;
}

export function getConstituencyMap(): SimpleFeatureCollection {
  return constituencyMap as SimpleFeatureCollection;
}
