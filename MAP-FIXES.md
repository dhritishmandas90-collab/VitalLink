# Map fixes — 8 October 2026

- Kept Streets and Satellite raster layers visible at zoom 18. Tile sources still cap requests at zoom 18; layer visibility extends beyond the camera limit because MapLibre layer maxzoom is exclusive.
- Added clickable isolated facility points below zoom 8. These share the filtered cluster source and hand over to detailed DOM markers at zoom 8.
- Preserved isolated points and their click handling across basemap switches.
- Made Retry force a Streets reload, including when Streets is already selected, and retry initialization if the map is unavailable.
- Honoured basemap choices made before initialization.

Validation: npm test and npm run check pass, including 23 regression checks. The original map fails the new maximum-zoom regression. Tests use a mocked DOM/MapLibre lifecycle; live browser rendering and external tile availability were not verified.

Manual browser checks: open index.html; zoom to 18 in Streets and Satellite; filter facilities at low zoom and select an isolated blue point; toggle basemaps; click Retry after a network interruption. Routes and camera position should remain intact.

Reference: https://maplibre.org/maplibre-style-spec/layers/#maxzoom
