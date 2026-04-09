import type { ConstituencyBoundaryMapRecord } from "@/lib/data/models";
import { getContextualConstituencyMap } from "@/lib/map/getContextualConstituencyMap";

export function ConstituencyBoundaryMap({
  boundaryMap,
  constituencyName,
  constituencyCode,
}: {
  boundaryMap: ConstituencyBoundaryMapRecord | null;
  constituencyName: string;
  constituencyCode: string;
}) {
  if (!boundaryMap) {
    return (
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)] p-6">
        <p className="text-sm font-medium">Boundary map unavailable</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
          The official constituency geometry could not be matched for this page, so the map
          area falls back cleanly without breaking the section layout.
        </p>
      </div>
    );
  }

  const contextMap = getContextualConstituencyMap({
    selectedId: boundaryMap.id,
    width: boundaryMap.width,
    height: boundaryMap.height,
  });

  return (
    <div>
      <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]">
        <svg
          viewBox={`0 0 ${boundaryMap.width} ${boundaryMap.height}`}
          role="img"
          aria-labelledby={`boundary-map-title-${boundaryMap.id} boundary-map-desc-${boundaryMap.id}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto min-h-[260px] w-full sm:min-h-[320px]"
        >
          <title id={`boundary-map-title-${boundaryMap.id}`}>
            {constituencyName} constituency boundary map
          </title>
          <desc id={`boundary-map-desc-${boundaryMap.id}`}>
            {contextMap?.description ??
              `An SVG rendering of the official Westminster constituency boundary for ${constituencyName} (${constituencyCode}).`}
          </desc>
          <rect
            x="0"
            y="0"
            width={boundaryMap.width}
            height={boundaryMap.height}
            fill="var(--color-surface-muted)"
          />
          {contextMap ? (
            <g transform={contextMap.transform}>
              {contextMap.paths.map((feature) => (
                <path
                  key={feature.id}
                  d={feature.path}
                  fill={feature.fill}
                  stroke={feature.stroke}
                  strokeWidth={feature.strokeWidth}
                  vectorEffect="non-scaling-stroke"
                >
                  <title>{feature.name}</title>
                </path>
              ))}
            </g>
          ) : (
            <path
              d={boundaryMap.path}
              fill="rgba(26, 31, 44, 0.16)"
              stroke="var(--color-text)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>
      {contextMap ? (
        <p className="mt-3 text-xs leading-5 text-[color:var(--color-text-secondary)]">
          {contextMap.caption}
        </p>
      ) : null}
    </div>
  );
}
