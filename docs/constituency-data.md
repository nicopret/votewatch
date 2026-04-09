# Constituency Data Pipeline

VoteWatch keeps constituency enrichment in generated JSON so the app stays static-first and easy to rebuild.

## Sources used

- UK Parliament election results candidacies CSV
  - `https://electionresults.parliament.uk/general-elections/6/candidacies.csv`
- UK Parliament recent by-election pages and candidate-results CSVs
  - discovered from `https://electionresults.parliament.uk/elections`
  - current-parliament by-election pages are staged in `sources/constituencies/recent-by-elections.json`
- ONS Westminster constituency population workbook
  - `https://www.ons.gov.uk/file?uri=%2Faboutus%2Ftransparencyandgovernance%2Ffreedomofinformationfoi%2Fpopulationdensityby2024westminsterparliamentaryconstituencies%2Ffoi20263363westminsterparliamentaryconstituenciesmid2021tomid2024.xlsx`
- ONS July 2024 constituency GeoJSON
  - staged via the existing ArcGIS Hub download in `scripts/data/download/download-constituency-geojson.ts`

## Generated outputs

- `data/generated/constituency-profiles.json`
  - rich constituency profile used by constituency pages
  - stores `electionEvents[]`, the selected latest `election`, and `previousGeneralElection`
- `data/generated/constituency-boundary-maps.json`
  - precomputed per-constituency SVG boundary paths for constituency detail pages
- `data/generated/constituencies.json`
  - lightweight constituency summary used across the app

## How matching works

1. Prefer official constituency geographic code.
2. Fall back to a normalized constituency-name key via `constituencyLookupKey(...)`.
3. Missing matches are logged as warnings during the build instead of failing the whole import.
4. Ambiguous normalized-name matches are rejected rather than guessed.

## How to rerun

Download authoritative sources:

```bash
npm run data:download:real
```

Download recent by-elections only:

```bash
npm run data:download:recent-by-elections
```

Rebuild generated data:

```bash
npm run data:build:step1
```

Boundary-only rebuild:

```bash
npm run data:build:constituency-boundary-maps
```

Validate outputs:

```bash
npm run data:validate:all
```

## Extending later

- Add new source connectors under `scripts/data/download/`.
- Extend `scripts/data/transform/build-constituency-profiles.ts` with a new normalization block.
- Extend `scripts/data/transform/build-constituency-boundary-maps.ts` if you want richer map output such as simplified geometries, context outlines, or labels.
- Keep optional fields nullable so incomplete upstream coverage does not break the page.
- The UI reads only from generated JSON through `lib/data/constituencies.ts`, so frontend changes should not fetch raw source data directly.
