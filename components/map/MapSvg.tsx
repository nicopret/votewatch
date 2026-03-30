"use client";

import { useMemo } from "react";
import { partyColors } from "@/lib/party-colors";
import { designTokens } from "@/lib/design-tokens";
import { buildProjectedConstituencyPaths } from "@/lib/map/buildProjectedConstituencyPaths";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

export function MapSvg({
  features,
  hoveredId,
  selectedId,
  highlightedIds = [],
  onHover,
  onLeave,
  onSelect,
  onPointerMove,
}: {
  features: JoinedConstituencyMapFeature[];
  hoveredId: string | null;
  selectedId: string | null;
  highlightedIds?: string[];
  onHover: (id: string) => void;
  onLeave: () => void;
  onSelect: (id: string) => void;
  onPointerMove: (position: { x: number; y: number }) => void;
}) {
  const { width, height, paths } = useMemo(
    () =>
      buildProjectedConstituencyPaths({
        features,
        width: 1280,
        minHeight: 820,
        padding: 8,
      }),
    [features],
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="UK parliamentary constituency map"
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full"
      onPointerLeave={onLeave}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        onPointerMove({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
      }}
    >
      <title>VoteWatch constituency map</title>
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="18"
        fill="#FFFFFF"
      />
      {paths.map(({ id, feature, path }) => {
        const isSelected = id === selectedId;
        const isHovered = id === hoveredId;
        const isHighlighted = highlightedIds.includes(id);
        const fill =
          feature.party === "unknown"
            ? designTokens.colors.surfaceMuted
            : partyColors[feature.party];
        const fillOpacity = isSelected ? 1 : isHovered || isHighlighted ? 0.94 : 0.82;
        const filter = isSelected
          ? "brightness(1.06) saturate(1.08)"
          : isHovered || isHighlighted
            ? "brightness(1.08)"
            : undefined;

        return (
          <path
            key={id}
            d={path}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={designTokens.colors.border}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            style={{ filter }}
            className="cursor-pointer transition-[fill-opacity,filter] duration-150"
            onPointerEnter={() => onHover(id)}
            onClick={() => onSelect(id)}
          />
        );
      })}
    </svg>
  );
}
