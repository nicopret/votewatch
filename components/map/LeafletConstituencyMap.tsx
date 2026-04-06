"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Path, LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import { partyColors } from "@/lib/party-colors";
import { designTokens } from "@/lib/design-tokens";
import { buildLeafletFeatureCollection, type LeafletConstituencyFeature } from "@/lib/map/buildLeafletFeatureCollection";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

function brightenColor(hex: string, amount: number) {
  const color = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) =>
    Math.min(
      255,
      Math.round(parseInt(color.slice(offset, offset + 2), 16) + 255 * amount),
    ),
  );

  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function getFeatureFill(feature: LeafletConstituencyFeature["properties"]) {
  return feature.party === "unknown"
    ? designTokens.colors.surfaceMuted
    : partyColors[feature.party];
}

function getStyleState({
  featureId,
  hoveredId,
  selectedId,
  highlightedIds,
}: {
  featureId: string;
  hoveredId: string | null;
  selectedId: string | null;
  highlightedIds: Set<string>;
}) {
  return {
    isSelected: featureId === selectedId,
    isHovered: featureId === hoveredId,
    isHighlighted: highlightedIds.has(featureId),
  };
}

function buildPathStyle(
  feature: LeafletConstituencyFeature["properties"],
  state: ReturnType<typeof getStyleState>,
) {
  const baseFill = getFeatureFill(feature);

  if (state.isSelected) {
    return {
      color: designTokens.colors.border,
      weight: 0.75,
      opacity: 1,
      fillColor: brightenColor(baseFill, 0.08),
      fillOpacity: 1,
    };
  }

  if (state.isHovered || state.isHighlighted) {
    return {
      color: designTokens.colors.border,
      weight: 0.75,
      opacity: 1,
      fillColor: brightenColor(baseFill, 0.05),
      fillOpacity: 0.95,
    };
  }

  return {
    color: designTokens.colors.border,
    weight: 0.75,
    opacity: 1,
    fillColor: baseFill,
    fillOpacity: 0.84,
  };
}

function FitBounds({
  featureCollection,
}: {
  featureCollection: ReturnType<typeof buildLeafletFeatureCollection>;
}) {
  const map = useMap();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize(false);

      const layer = L.geoJSON(featureCollection);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [8, 8],
          maxZoom: 12,
        });
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [featureCollection, map]);

  return null;
}

export function LeafletConstituencyMap({
  features,
  selectedId,
  highlightedIds = [],
  onSelect,
}: {
  features: JoinedConstituencyMapFeature[];
  selectedId: string | null;
  highlightedIds?: string[];
  onSelect: (id: string) => void;
}) {
  const featureCollection = useMemo(
    () => buildLeafletFeatureCollection(features),
    [features],
  );
  const highlightedSet = useMemo(() => new Set(highlightedIds), [highlightedIds]);
  const hoveredIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const highlightedIdsRef = useRef(highlightedSet);
  const layerByIdRef = useRef(
    new Map<string, { layer: Path; properties: LeafletConstituencyFeature["properties"] }>(),
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
    highlightedIdsRef.current = highlightedSet;

    for (const [featureId, entry] of layerByIdRef.current) {
      entry.layer.setStyle(
        buildPathStyle(
          entry.properties,
          getStyleState({
            featureId,
            hoveredId: hoveredIdRef.current,
            selectedId,
            highlightedIds: highlightedSet,
          }),
        ),
      );
    }
  }, [highlightedSet, selectedId]);

  return (
    <div className="votewatch-leaflet-map h-[1100px] w-full overflow-hidden rounded-[18px] bg-white md:h-[1250px] lg:h-[1500px] xl:h-[1650px]">
      <MapContainer
        className="h-full w-full"
        center={[54.5, -3.5]}
        zoom={6}
        zoomSnap={0.25}
        preferCanvas
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        worldCopyJump={false}
      >
        <FitBounds featureCollection={featureCollection} />
        <GeoJSON
          key={featureCollection.features.length}
          data={featureCollection}
          style={(feature) =>
            buildPathStyle(
              (feature as LeafletConstituencyFeature).properties,
              getStyleState({
                featureId: (feature as LeafletConstituencyFeature).properties.id,
                hoveredId: hoveredIdRef.current,
                selectedId,
                highlightedIds: highlightedSet,
              }),
            )
          }
          onEachFeature={(feature, layer) => {
            const typedFeature = feature as LeafletConstituencyFeature;
            const featureId = typedFeature.properties.id;
            const pathLayer = layer as Path;

            layerByIdRef.current.set(featureId, {
              layer: pathLayer,
              properties: typedFeature.properties,
            });

            layer.bindTooltip(
              `<div><strong>${typedFeature.properties.name}</strong></div><div>${typedFeature.properties.mpName}</div><div>${typedFeature.properties.partyLabel}</div>`,
              {
                sticky: true,
                direction: "top",
                className: "votewatch-map-tooltip",
                opacity: 1,
              },
            );

            layer.on({
              mouseover: (event: LeafletMouseEvent) => {
                hoveredIdRef.current = featureId;
                (event.target as Path).setStyle(
                  buildPathStyle(
                    typedFeature.properties,
                    getStyleState({
                      featureId,
                      hoveredId: featureId,
                      selectedId: selectedIdRef.current,
                      highlightedIds: highlightedIdsRef.current,
                    }),
                  ),
                );
              },
              mouseout: (event: LeafletMouseEvent) => {
                hoveredIdRef.current = null;
                (event.target as Path).setStyle(
                  buildPathStyle(
                    typedFeature.properties,
                    getStyleState({
                      featureId,
                      hoveredId: null,
                      selectedId: selectedIdRef.current,
                      highlightedIds: highlightedIdsRef.current,
                    }),
                  ),
                );
              },
              click: () => {
                onSelect(featureId);
              },
            });
          }}
        />
      </MapContainer>
    </div>
  );
}
