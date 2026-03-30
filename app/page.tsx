import constituenciesData from "@/data/generated/constituencies.json";
import mpsData from "@/data/generated/mps.json";
import searchIndexData from "@/data/generated/search-index.json";
import mapData from "@/data/maps/constituencies.geo.json";
import { PageShell } from "@/components/layout/page-shell";
import { ConstituencyExplorer } from "@/components/map/ConstituencyExplorer";
import type {
  ConstituenciesFile,
  ConstituencyGeoJson,
  MPsFile,
  SearchIndexFile,
} from "@/lib/data/models";
import { joinConstituencyMapData } from "@/lib/map/joinConstituencyMapData";

export default function HomePage() {
  const mapDataBundle = joinConstituencyMapData({
    constituencies: constituenciesData as ConstituenciesFile,
    mps: (mpsData as MPsFile).items,
    searchIndex: (searchIndexData as SearchIndexFile).items,
    geoJson: mapData as ConstituencyGeoJson,
  });

  return (
    <PageShell wide>
      <ConstituencyExplorer features={mapDataBundle.features} />
    </PageShell>
  );
}
