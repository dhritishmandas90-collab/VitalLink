/* ==========================================================
   VITALLINK GLOBAL CARTOGRAPHIC ENGINE (MAPLIBRE GL JS)
   - Professional Multi-Scale GIS Engine (World 1.5 to Street 18.0)
   - Decoupled State Management: Lifecycle, Viewport, Layers, User Location
   - Resilient WebGL GeoJSON Point Clustering & Expansion
   - High-Accuracy GPS Geolocation with Pulse Marker & Permissions Fallback
   - Smart Auto-Fit Bounds with Responsive Viewport Padding
   - Google Maps Clamped Zoom Capacity Limits (Silent Boundary Rejection)
   - Zero-Flash Basemap Style Switching (OSM Streets ↔ Esri Satellite)
   - Responsive Touch-Optimized Mobile Bottom Sheet & Canvas Deselection
   - Robust Coordinate Sanitization & Lifecycle Event Cleanup
   ========================================================== */

// ----------------------------------------------------------
// 1. CENTRALIZED MAP STATE ARCHITECTURE
// ----------------------------------------------------------

const mapInstanceState = {
  instance: null,
  isInitialized: false,
  isLoaded: false,
  currentType: 'streets',
  isSwitching: false,
  targetType: 'streets',
  switchRequestId: 0,
  resizeObserver: null
};

const mapViewportState = {
  center: [78.9629, 21.5937], // India National Operations Center
  zoom: 4.6,
  bearing: 0,
  pitch: 0,
  minZoom: 1.5,
  maxZoom: 18.0
};

const userLocationState = {
  status: 'idle', // 'idle' | 'locating' | 'located' | 'error' | 'denied'
  coords: null,
  accuracy: 0,
  marker: null,
  timestamp: 0
};

// Global Clamped Zoom Capacity Limits (Google Maps Behavior)
const MAP_MIN_ZOOM = mapViewportState.minZoom;
const MAP_MAX_ZOOM = mapViewportState.maxZoom;
const CLUSTER_THRESHOLD_ZOOM = 7.5;

// Backward-compatible variable aliases
let maplibreMap = null;
let isMapLibreLoaded = false;
let currentMapType = 'streets';
let styleSwitchRequestId = 0;
let isSwitchingStyle = false;
let targetMapType = 'streets';
let clusterInteractionsAttached = false;

// Operational Dispatch Route Coordinates
let activeRouteCoordinates = [
  [77.2185, 28.6250], // Central Delhi Node
  [77.2089, 28.5672]  // AIIMS Apex Emergency
];

// Marker Registries for Programmatic Interaction
const hospitalMarkers = {};
const donorMarkers = {};
let activeHighlightedFacilityId = null;

// ----------------------------------------------------------
// 2. DATA SANITIZATION & GEOMETRIC VALIDATION
// ----------------------------------------------------------

function isValidCoordinate(lng, lat) {
  return typeof lng === 'number' && typeof lat === 'number' &&
    !isNaN(lng) && !isNaN(lat) &&
    lng >= -180 && lng <= 180 &&
    lat >= -90 && lat <= 90;
}

/* ----------------------------------------------------------
   3. BASEMAP STYLE SPECIFICATIONS (WORLDWIDE COVERAGE)
   ---------------------------------------------------------- */

// OpenStreetMap High-Precision Global Cartographic Raster Tiles
const maplibreOsmStyle = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 18
    }
  ]
};

// Esri World Imagery High-Resolution Satellite & Global Aerial Reconnaissance
const maplibreSatelliteStyle = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution: 'Imagery &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics'
    },
    'esri-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 18
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 18
    },
    {
      id: 'esri-labels-layer',
      type: 'raster',
      source: 'esri-labels',
      minzoom: 0,
      maxzoom: 18,
      paint: {
        'raster-opacity': 0.85
      }
    }
  ]
};

/* ----------------------------------------------------------
   4. MAP FEEDBACK & NOTIFICATION HELPERS
   ---------------------------------------------------------- */

function showMapLoading(text = 'Synchronizing Global Cartography...') {
  const el = document.getElementById('mapLoadingIndicator');
  if (el) {
    const txt = document.getElementById('mapLoadingText');
    if (txt) txt.textContent = text;
    el.classList.add('visible');
    el.setAttribute('aria-hidden', 'false');
  }
}

function hideMapLoading() {
  const el = document.getElementById('mapLoadingIndicator');
  if (el) {
    el.classList.remove('visible');
    el.setAttribute('aria-hidden', 'true');
  }
}

function showMapError(msg) {
  const banner = document.getElementById('mapErrorBanner');
  const txt = document.getElementById('mapErrorText');
  if (banner && txt) {
    txt.textContent = msg;
    banner.style.display = 'inline-flex';
  }
}

function dismissMapError() {
  const banner = document.getElementById('mapErrorBanner');
  if (banner) banner.style.display = 'none';
}

function retryMapBasemap() {
  dismissMapError();
  setMapType('streets');
  if (maplibreMap) {
    maplibreMap.resize();
  }
}

/* ----------------------------------------------------------
   3. GEOJSON GENERATION FOR GLOBAL CLUSTERING
   ---------------------------------------------------------- */

function generateFacilitiesGeoJSON(facilities = GLOBAL_FACILITIES) {
  return {
    type: 'FeatureCollection',
    features: facilities
      .filter(f => f && isValidCoordinate(f.lng, f.lat))
      .map(f => ({
        type: 'Feature',
        properties: {
          id: f.id,
          name: f.name,
          type: f.type,
          city: f.city,
          country: f.country,
          state: f.state,
          emergencyNeed: f.emergencyNeed,
          urgency: f.urgency,
          unitsNeeded: f.unitsNeeded,
          verificationStatus: f.verificationStatus,
          lastUpdated: f.lastUpdated
        },
        geometry: {
          type: 'Point',
          coordinates: [f.lng, f.lat]
        }
      }))
  };
}

/* ----------------------------------------------------------
   4. PERSISTENT OPERATIONAL LAYERS & CLUSTERING
   ---------------------------------------------------------- */

function ensureOperationalLayers() {
  if (!maplibreMap || !maplibreMap.isStyleLoaded()) return;

  try {
    // A. GeoJSON Clustering Source & Layers for Global/National Scale
    if (!maplibreMap.getSource('facilities-cluster-source')) {
      maplibreMap.addSource('facilities-cluster-source', {
        type: 'geojson',
        data: generateFacilitiesGeoJSON(),
        cluster: true,
        clusterMaxZoom: 7,
        clusterRadius: 45
      });

      // Cluster Circle Layer
      if (!maplibreMap.getLayer('facility-clusters')) {
        maplibreMap.addLayer({
          id: 'facility-clusters',
          type: 'circle',
          source: 'facilities-cluster-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#0284c7', // Sky blue for smaller clusters (< 5)
              5,
              '#d97706', // Amber for medium clusters (5-10)
              10,
              '#e11d48'  // Crimson for large clusters (> 10)
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              16,
              5,
              20,
              10,
              25
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
      }

      // Cluster Count Text Layer
      if (!maplibreMap.getLayer('facility-cluster-count')) {
        maplibreMap.addLayer({
          id: 'facility-cluster-count',
          type: 'symbol',
          source: 'facilities-cluster-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 11
          },
          paint: {
            'text-color': '#ffffff'
          }
        });
      }

      // Click on cluster zooms in smoothly (attached once to avoid duplicate bindings)
      if (!clusterInteractionsAttached) {
        clusterInteractionsAttached = true;
        maplibreMap.on('click', 'facility-clusters', (e) => {
          const features = maplibreMap.queryRenderedFeatures(e.point, { layers: ['facility-clusters'] });
          if (!features || !features[0]) return;
          const clusterId = features[0].properties.cluster_id;
          const source = maplibreMap.getSource('facilities-cluster-source');
          if (source && typeof source.getClusterExpansionZoom === 'function') {
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              maplibreMap.easeTo({
                center: features[0].geometry.coordinates,
                zoom: Math.max(zoom || 8, 8.5),
                duration: 380
              });
            });
          }
        });

        maplibreMap.on('mouseenter', 'facility-clusters', () => {
          maplibreMap.getCanvas().style.cursor = 'pointer';
        });
        maplibreMap.on('mouseleave', 'facility-clusters', () => {
          maplibreMap.getCanvas().style.cursor = '';
        });
      }
    }

    // B. Emergency Dispatch Route GeoJSON & Layers
    const coords = activeRouteCoordinates;
    if (coords && coords.length >= 2) {
      const s = coords[0];
      const e = coords[1];
      const midLng = (s[0] + e[0]) / 2 + 0.003;
      const midLat = (s[1] + e[1]) / 2 - 0.004;

      const routeGeoJSON = {
        type: 'Feature',
        properties: { name: 'Emergency Dispatch Transit Line' },
        geometry: {
          type: 'LineString',
          coordinates: [s, [midLng, midLat], e]
        }
      };

      const existingSource = maplibreMap.getSource('dispatch-route');
      if (existingSource && typeof existingSource.setData === 'function') {
        existingSource.setData(routeGeoJSON);
      } else if (!existingSource) {
        maplibreMap.addSource('dispatch-route', {
          type: 'geojson',
          data: routeGeoJSON
        });
      }

      if (!maplibreMap.getLayer('dispatch-route-casing')) {
        maplibreMap.addLayer({
          id: 'dispatch-route-casing',
          type: 'line',
          source: 'dispatch-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#0284c7',
            'line-width': 7,
            'line-opacity': 0.35,
            'line-blur': 2
          }
        });
      }

      if (!maplibreMap.getLayer('dispatch-route-line')) {
        maplibreMap.addLayer({
          id: 'dispatch-route-line',
          type: 'line',
          source: 'dispatch-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#38bdf8',
            'line-width': 3,
            'line-opacity': 0.95,
            'line-dasharray': [2, 1.5]
          }
        });
      }
    }

  } catch (err) {
    console.warn('Operational layers synchronization notice:', err);
  }
}

function updateMapLibreRoute(startLngLat, endLngLat) {
  if (!maplibreMap) return;

  if (startLngLat && endLngLat) {
    activeRouteCoordinates = [startLngLat, endLngLat];
  }

  if (!maplibreMap.isStyleLoaded()) {
    return;
  }

  ensureOperationalLayers();
}

/* ----------------------------------------------------------
   5. ASYNC BASEMAP SWITCHING (PRESERVING GLOBAL CAMERA)
   ---------------------------------------------------------- */

function updateMapClusterVisibility() {
  if (!maplibreMap) return;
  const zoom = maplibreMap.getZoom();
  const mapEl = document.getElementById('maplibreMap');
  if (mapEl) {
    if (zoom < 7) {
      mapEl.classList.add('markers-clustered');
    } else {
      mapEl.classList.remove('markers-clustered');
    }
  }
}

function setMapType(type) {
  const satBtn = document.getElementById('btnModeSatellite');
  const streetBtn = document.getElementById('btnModeStreets');

  if (type === 'satellite') {
    if (satBtn) satBtn.classList.add('active');
    if (streetBtn) streetBtn.classList.remove('active');
  } else {
    if (streetBtn) streetBtn.classList.add('active');
    if (satBtn) satBtn.classList.remove('active');
  }

  if (currentMapType === type && !isSwitchingStyle) {
    return;
  }
  if (isSwitchingStyle && targetMapType === type) {
    return;
  }
  targetMapType = type;

  const requestId = ++styleSwitchRequestId;
  isSwitchingStyle = true;

  // Preserve exact global camera coordinates
  let savedCamera = null;
  if (maplibreMap) {
    savedCamera = {
      center: maplibreMap.getCenter(),
      zoom: maplibreMap.getZoom(),
      bearing: maplibreMap.getBearing(),
      pitch: maplibreMap.getPitch()
    };
  }

  const label = type === 'satellite' ? 'Satellite Imagery' : 'Street Basemap';
  showMapLoading(`Loading ${label}...`);
  dismissMapError();

  if (maplibreMap) {
    const targetStyle = (type === 'satellite') ? maplibreSatelliteStyle : maplibreOsmStyle;
    
    // Safety timeout to prevent permanent lock if style loading is stalled
    const switchTimeout = setTimeout(() => {
      if (requestId === styleSwitchRequestId && isSwitchingStyle) {
        isSwitchingStyle = false;
        hideMapLoading();
      }
    }, 4500);

    maplibreMap.setStyle(targetStyle, { diff: false });

    maplibreMap.once('style.load', () => {
      clearTimeout(switchTimeout);
      if (requestId !== styleSwitchRequestId) {
        return;
      }

      currentMapType = type;
      appState.mapMode = type;
      isSwitchingStyle = false;
      hideMapLoading();

      // Ensure camera position remains anchored
      if (savedCamera) {
        maplibreMap.jumpTo(savedCamera);
      }

      // Re-mount user location marker if active
      if (userLocationState.marker && userLocationState.coords) {
        try {
          userLocationState.marker.addTo(maplibreMap);
        } catch (e) {
          // Benign if already attached
        }
      }

      ensureOperationalLayers();
      updateZoomButtonsState();
      updateCompassOrientation();
      updateMapClusterVisibility();

      if (typeof logTerminal === 'function') {
        logTerminal(`[BASEMAP] Switched to ${type === 'satellite' ? 'Satellite' : 'Street'} Layer`, 'highlight');
      }
    });
  } else {
    currentMapType = type;
    appState.mapMode = type;
    isSwitchingStyle = false;
    hideMapLoading();
  }
}

function setMapMode(mode) {
  setMapType(mode);
}

/* ----------------------------------------------------------
   6. CLAMPED GOOGLE MAPS STYLE ZOOM & COMPASS CONTROLS
   ---------------------------------------------------------- */

function updateZoomButtonsState() {
  if (!maplibreMap) return;
  const currentZoom = maplibreMap.getZoom();
  const btnIn = document.getElementById('btnZoomIn');
  const btnOut = document.getElementById('btnZoomOut');

  if (btnIn) {
    if (currentZoom >= MAP_MAX_ZOOM - 0.05) {
      btnIn.disabled = true;
      btnIn.classList.add('disabled');
      btnIn.setAttribute('aria-disabled', 'true');
    } else {
      btnIn.disabled = false;
      btnIn.classList.remove('disabled');
      btnIn.setAttribute('aria-disabled', 'false');
    }
  }

  if (btnOut) {
    if (currentZoom <= MAP_MIN_ZOOM + 0.05) {
      btnOut.disabled = true;
      btnOut.classList.add('disabled');
      btnOut.setAttribute('aria-disabled', 'true');
    } else {
      btnOut.disabled = false;
      btnOut.classList.remove('disabled');
      btnOut.setAttribute('aria-disabled', 'false');
    }
  }

  updateMapClusterVisibility();
}

function handleMapZoomIn() {
  if (!maplibreMap) return;
  const currentZoom = maplibreMap.getZoom();

  if (currentZoom >= MAP_MAX_ZOOM - 0.05) {
    // Strictly do not accept command when at maximum capacity (Google Maps behavior)
    updateZoomButtonsState();
    return;
  }

  // Smoothly step to next integer zoom level, strictly clamped
  const targetZoom = Math.min(MAP_MAX_ZOOM, Math.floor(currentZoom) + 1);
  maplibreMap.easeTo({
    zoom: targetZoom,
    duration: 220
  });
  if (typeof playTone === 'function') playTone(580, 'sine', 0.03);
}

function handleMapZoomOut() {
  if (!maplibreMap) return;
  const currentZoom = maplibreMap.getZoom();

  if (currentZoom <= MAP_MIN_ZOOM + 0.05) {
    // Strictly do not accept command when at minimum capacity (Google Maps behavior)
    updateZoomButtonsState();
    return;
  }

  // Smoothly step to previous integer zoom level, strictly clamped
  const targetZoom = Math.max(MAP_MIN_ZOOM, Math.ceil(currentZoom) - 1);
  maplibreMap.easeTo({
    zoom: targetZoom,
    duration: 220
  });
  if (typeof playTone === 'function') playTone(460, 'sine', 0.03);
}

function handleResetBearing() {
  if (!maplibreMap) return;
  const bearing = maplibreMap.getBearing();
  const pitch = maplibreMap.getPitch();
  if (Math.abs(bearing) < 0.1 && Math.abs(pitch) < 0.1) return;

  maplibreMap.easeTo({
    bearing: 0,
    pitch: 0,
    duration: 320
  });
  if (typeof playTone === 'function') playTone(520, 'sine', 0.04);
}

function updateCompassOrientation() {
  if (!maplibreMap) return;
  const compass = document.getElementById('compassIcon');
  if (compass) {
    const bearing = maplibreMap.getBearing();
    compass.style.transform = `rotate(${-bearing}deg)`;
  }
}

/* ----------------------------------------------------------
   7. GEOGRAPHIC SCOPE CONTROLLER & WORLDWIDE JUMPS
   ---------------------------------------------------------- */

function setGeographicScope(scopeKey) {
  const scope = GEOGRAPHIC_SCOPES[scopeKey];
  if (!scope) return;
  appState.currentScopeId = scopeKey;

  // Immediate tactile feedback on scope buttons
  document.querySelectorAll('.scope-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scope === scopeKey);
  });

  // Update Breadcrumb & Context Indicator
  const breadcrumbEl = document.getElementById('geoBreadcrumbText');
  if (breadcrumbEl) {
    breadcrumbEl.textContent = scope.breadcrumb;
  }
  const scopeBadge = document.getElementById('geoScopeBadge');
  if (scopeBadge) {
    scopeBadge.textContent = scope.badge;
  }

  // Smooth transit to the selected region
  if (maplibreMap) {
    maplibreMap.flyTo({
      center: scope.center,
      zoom: scope.zoom,
      pitch: scopeKey === 'world' || scopeKey === 'india' ? 0 : 32,
      bearing: 0,
      duration: 1200,
      essential: true
    });
  }

  // Synchronize contextual panels
  if (typeof renderContextualEmergencies === 'function') {
    renderContextualEmergencies();
  }
  if (typeof renderRegionalStockMatrix === 'function') {
    renderRegionalStockMatrix();
  }
  if (typeof renderFacilityDirectoryList === 'function') {
    renderFacilityDirectoryList();
  }
  if (typeof renderHospitalStockSearch === 'function') {
    renderHospitalStockSearch();
  }
  if (typeof updateSmartRecommendation === 'function') {
    updateSmartRecommendation();
  }
  if (typeof renderAdminKPIs === 'function') {
    renderAdminKPIs();
  }
  if (typeof filterMapFacilities === 'function') {
    filterMapFacilities(appState.activeFacilityTypeFilter, appState.activeBloodFilter);
  }

  if (typeof playTone === 'function') playTone(520, 'sine', 0.06);
  if (typeof logTerminal === 'function') {
    logTerminal(`[SCOPE] Shifted operational viewport to ${scope.name}`, 'highlight');
  }
}

/* ----------------------------------------------------------
   8. INDIVIDUAL FACILITY MARKERS & HIGH-RESOLUTION PINS
   ---------------------------------------------------------- */

function mountFacilityDOMMarkers() {
  if (!maplibreMap) return;

  // Clean up any existing markers to avoid duplicate DOM elements or memory leaks
  Object.keys(hospitalMarkers).forEach(id => {
    if (hospitalMarkers[id] && hospitalMarkers[id].marker) {
      hospitalMarkers[id].marker.remove();
    }
    delete hospitalMarkers[id];
  });
  Object.keys(donorMarkers).forEach(id => {
    if (donorMarkers[id] && donorMarkers[id].marker) {
      donorMarkers[id].marker.remove();
    }
    delete donorMarkers[id];
  });

  GLOBAL_FACILITIES.forEach(f => {
    if (!f || !isValidCoordinate(f.lng, f.lat)) {
      console.warn('Skipping facility with invalid coordinates:', f && f.id);
      return;
    }

    const el = document.createElement('div');
    const isCritical = f.urgency === 'critical';
    const isBloodBank = f.type.toLowerCase().includes('blood') || f.name.toLowerCase().includes('blood');

    el.className = `custom-marker-hosp-wrap ${isBloodBank ? 'is-bloodbank' : 'is-hospital'}`;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${f.name} - ${isBloodBank ? 'Blood Bank' : 'Hospital'}`);

    if (isBloodBank) {
      el.innerHTML = `
        <div class="custom-marker-hosp bloodbank-pin" title="${f.name} (Blood Bank)">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </div>
        <div class="marker-tag bloodbank-tag">🩸 BLOOD BANK</div>
      `;
    } else {
      el.innerHTML = `
        <div class="custom-marker-hosp ${isCritical ? 'critical' : 'urgent'}" title="${f.name}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <div class="marker-tag hospital-tag">${f.city.toUpperCase().slice(0, 3)} HOSP</div>
      `;
    }

    const popupHTML = isBloodBank ? `
      <div class="map-popup-card">
        <div class="map-popup-header">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <span class="map-popup-badge blood-bank">🩸 REGIONAL BLOOD BANK</span>
            <span class="badge-trust-verified">✓ ${f.verificationStatus}</span>
          </div>
          <h4 class="map-popup-title">${f.name}</h4>
          <div class="map-popup-sub">📍 ${f.city}, ${f.country} • Regional Blood Depository</div>
        </div>
        <div class="map-popup-body">
          <div class="map-popup-stat">
            <span class="map-popup-label">Target Need</span>
            <span class="blood-badge ${isCritical ? 'critical' : 'needed'}" style="font-size:0.7rem; padding: 2px 7px;">${f.emergencyNeed} (${f.unitsNeeded} Units)</span>
          </div>
          <div style="margin: 6px 0 3px 0;">
            <div style="font-size: 0.64rem; color: var(--text-muted); margin-bottom: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Available Bank Reserves</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; font-size: 0.65rem; font-family: var(--font-mono); text-align: center;">
              <span style="background: rgba(255,255,255,0.04); padding: 2px 0; border-radius: 3px; border: 1px solid var(--border-subtle);"><strong style="color:#fb7185;">O-</strong> ${f.stock ? f.stock['O-'] || 0 : 0}</span>
              <span style="background: rgba(255,255,255,0.04); padding: 2px 0; border-radius: 3px; border: 1px solid var(--border-subtle);"><strong style="color:#34d399;">O+</strong> ${f.stock ? f.stock['O+'] || 0 : 0}</span>
              <span style="background: rgba(255,255,255,0.04); padding: 2px 0; border-radius: 3px; border: 1px solid var(--border-subtle);"><strong style="color:#38bdf8;">A+</strong> ${f.stock ? f.stock['A+'] || 0 : 0}</span>
              <span style="background: rgba(255,255,255,0.04); padding: 2px 0; border-radius: 3px; border: 1px solid var(--border-subtle);"><strong style="color:#fbbf24;">B+</strong> ${f.stock ? f.stock['B+'] || 0 : 0}</span>
            </div>
          </div>
          <div class="map-popup-stat" style="font-size:0.65rem; color:var(--text-muted); margin-top: 4px;">
            <span>Data Freshness</span>
            <span>${f.lastUpdated}</span>
          </div>
        </div>
        <button class="dispatch-btn popup-dispatch-btn" style="width: 100%; margin-top: 6px; justify-content: center;" onclick="dispatchRequest('${f.name.replace(/'/g, "\\'")}', '${f.emergencyNeed}', 'Rapid Cold-Chain Van')">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Request Blood Bank Allocation
        </button>
      </div>
    ` : `
      <div class="map-popup-card">
        <div class="map-popup-header">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <span class="map-popup-badge ${isCritical ? 'critical' : 'urgent'}">
              ${isCritical ? 'CRITICAL SHORTAGE' : 'SURGICAL NEED'}
            </span>
            <span class="badge-trust-verified">✓ ${f.verificationStatus}</span>
          </div>
          <h4 class="map-popup-title">${f.name}</h4>
          <div class="map-popup-sub">📍 ${f.city}, ${f.country} • ${f.emergencyStatus}</div>
        </div>
        <div class="map-popup-body">
          <div class="map-popup-stat">
            <span class="map-popup-label">Target Blood</span>
            <span class="blood-badge ${isCritical ? 'critical' : 'needed'}" style="font-size:0.7rem; padding: 2px 7px;">${f.emergencyNeed}</span>
          </div>
          <div class="map-popup-stat">
            <span class="map-popup-label">Immediate Deficit</span>
            <span class="map-popup-value" style="color: ${isCritical ? '#fb7185' : '#fbbf24'}; font-weight:800; font-family: var(--font-mono);">${f.unitsNeeded} Units</span>
          </div>
          <div class="map-popup-stat" style="font-size:0.65rem; color:var(--text-muted);">
            <span>Data Freshness</span>
            <span>${f.lastUpdated}</span>
          </div>
        </div>
        <button class="dispatch-btn popup-dispatch-btn" style="width: 100%; margin-top: 6px; justify-content: center;" onclick="dispatchRequest('${f.name.replace(/'/g, "\\'")}', '${f.emergencyNeed}', 'Rapid Courier')">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Dispatch Blood Courier
        </button>
      </div>
    `;

    const popup = new maplibregl.Popup({
      offset: 24,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '280px'
    }).setHTML(popupHTML);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([f.lng, f.lat])
      .setPopup(popup)
      .addTo(maplibreMap);

    hospitalMarkers[f.id] = {
      marker: marker,
      popup: popup,
      element: el,
      data: f
    };

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      focusFacility(f.id);
    });
  });

  // Plot Global Privacy-Preserving Donor Nodes
  GLOBAL_DONORS.forEach(d => {
    if (!d || !isValidCoordinate(d.lng, d.lat)) {
      console.warn('Skipping donor node with invalid coordinates:', d && d.id);
      return;
    }

    const el = document.createElement('div');
    el.className = 'custom-marker-donor-wrap';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${d.name} - Anonymous Donor Node`);

    el.innerHTML = `
      <div class="custom-marker-donor" title="${d.name}">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      </div>
      <div class="marker-tag-donor">${d.blood}</div>
    `;

    const popup = new maplibregl.Popup({
      offset: 20,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '260px'
    }).setHTML(`
      <div class="map-popup-card">
        <div class="map-popup-header">
          <span class="map-popup-badge verified">VERIFIED DONOR HUB</span>
          <h4 class="map-popup-title">${d.name}</h4>
          <div class="map-popup-sub">Token ID: <code style="color:#38bdf8; font-family:var(--font-mono);">${d.donorId}</code></div>
        </div>
        <div class="map-popup-body">
          <div class="map-popup-stat">
            <span class="map-popup-label">Donor Blood Group</span>
            <span class="blood-badge needed" style="font-size: 0.7rem; padding: 2px 7px;">${d.blood}</span>
          </div>
          <div class="map-popup-stat">
            <span class="map-popup-label">Privacy Clearance</span>
            <span style="color:#34d399; font-weight:700; font-size:0.72rem;">● Zero Data Leakage</span>
          </div>
        </div>
      </div>
    `);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([d.lng, d.lat])
      .setPopup(popup)
      .addTo(maplibreMap);

    donorMarkers[d.id] = {
      marker: marker,
      popup: popup,
      element: el,
      data: d
    };
  });

  updateMapClusterVisibility();
  if (typeof filterMapFacilities === 'function') {
    filterMapFacilities(appState.activeFacilityTypeFilter, appState.activeBloodFilter);
  }
}

function filterMapFacilities(typeFilter = appState.activeFacilityTypeFilter, bloodFilter = appState.activeBloodFilter) {
  const norm = str => String(str || '').toLowerCase().replace(/[\s_-]+/g, '');
  const isTypeAll = !typeFilter || typeFilter.toLowerCase() === 'all';
  const isBloodAll = !bloodFilter || bloodFilter.toLowerCase() === 'all';

  // 1. Update DOM markers for facilities
  Object.values(hospitalMarkers).forEach(entry => {
    if (!entry || !entry.element || !entry.data) return;
    const f = entry.data;

    const matchesType = isTypeAll ? true : norm(f.type).includes(norm(typeFilter));
    const matchesBlood = isBloodAll ? true : (f.emergencyNeed === bloodFilter || (f.stock && f.stock[bloodFilter] > 0));
    const isMatch = matchesType && matchesBlood;

    const isBloodBank = f.type.toLowerCase().includes('blood') || f.name.toLowerCase().includes('blood');

    if (typeFilter && norm(typeFilter).includes('blood')) {
      if (isBloodBank && matchesBlood) {
        entry.element.classList.remove('dimmed-marker');
        entry.element.classList.add('highlight-bloodbank');
        entry.element.style.display = '';
        entry.element.style.zIndex = '60';
      } else {
        entry.element.classList.remove('highlight-bloodbank');
        entry.element.classList.add('dimmed-marker');
        entry.element.style.zIndex = '1';
      }
    } else if (isMatch) {
      entry.element.classList.remove('dimmed-marker', 'highlight-bloodbank');
      entry.element.style.display = '';
      entry.element.style.zIndex = '';
    } else {
      entry.element.classList.add('dimmed-marker');
      entry.element.classList.remove('highlight-bloodbank');
      entry.element.style.zIndex = '1';
    }
  });

  // 2. Dim donor markers when user specifically filters for blood banks
  Object.values(donorMarkers).forEach(entry => {
    if (!entry || !entry.element) return;
    if (typeFilter && norm(typeFilter).includes('blood')) {
      entry.element.classList.add('dimmed-marker');
    } else {
      entry.element.classList.remove('dimmed-marker');
    }
  });

  // 3. Update MapLibre cluster source with filtered dataset
  if (maplibreMap && maplibreMap.getSource('facilities-cluster-source')) {
    const filteredFacilities = GLOBAL_FACILITIES.filter(f => {
      const matchesType = isTypeAll ? true : norm(f.type).includes(norm(typeFilter));
      const matchesBlood = isBloodAll ? true : (f.emergencyNeed === bloodFilter || (f.stock && f.stock[bloodFilter] > 0));
      return matchesType && matchesBlood;
    });
    try {
      maplibreMap.getSource('facilities-cluster-source').setData({
        type: 'FeatureCollection',
        features: filteredFacilities.map(f => ({
          type: 'Feature',
          properties: {
            id: f.id,
            name: f.name,
            type: f.type,
            city: f.city,
            country: f.country,
            state: f.state,
            emergencyNeed: f.emergencyNeed,
            urgency: f.urgency,
            unitsNeeded: f.unitsNeeded,
            verificationStatus: f.verificationStatus,
            lastUpdated: f.lastUpdated
          },
          geometry: {
            type: 'Point',
            coordinates: [f.lng, f.lat]
          }
        }))
      });
    } catch (e) {
      // Benign if source is re-attaching
    }
  }

  // 4. Synchronize map-level buttons
  document.querySelectorAll('.map-facility-btn').forEach(btn => {
    const btnType = btn.dataset.type || 'all';
    btn.classList.toggle('active', btnType === typeFilter || (btnType === 'all' && isTypeAll));
  });
}

function locateNearestBloodBank() {
  const norm = str => String(str || '').toLowerCase().replace(/[\s_-]+/g, '');
  const bloodBanks = GLOBAL_FACILITIES.filter(f => norm(f.type).includes('blood') || norm(f.name).includes('blood'));
  if (bloodBanks.length === 0) return;

  let target = null;
  // If user is currently inspecting a specific city/metro scope, find the blood bank in this scope
  if (appState.currentScopeId && appState.currentScopeId !== 'world' && appState.currentScopeId !== 'india') {
    target = bloodBanks.find(b => b.scopeId === appState.currentScopeId);
  }

  // Otherwise, find the closest blood bank to current map camera center
  if (!target && maplibreMap) {
    const center = maplibreMap.getCenter();
    let minDist = Infinity;
    bloodBanks.forEach(b => {
      const d = Math.hypot(b.lng - (center.lng || 0), b.lat - (center.lat || 0));
      if (d < minDist) {
        minDist = d;
        target = b;
      }
    });
  }

  if (!target) target = bloodBanks[0];
  if (target) {
    setFacilityTypeFilter('blood_bank');
    focusFacility(target.id);
  }
}

function focusFacility(facilityId) {
  activeHighlightedFacilityId = facilityId;

  // On mobile devices, ensure the user is switched directly to the map tab
  if (typeof switchMobileOpsTab === 'function' && window.innerWidth <= 768) {
    switchMobileOpsTab('map');
  }

  let f = typeof getFacilityById === 'function' ? getFacilityById(facilityId) : GLOBAL_FACILITIES.find(item => item.id === facilityId);
  const target = hospitalMarkers[facilityId] || (f ? hospitalMarkers[f.id] : null);
  if (!f && target && target.data) {
    f = target.data;
  }
  if (!f) return;

  // If facility belongs to another scope and we are in a single-city view, update scope indicators
  if (appState.currentScopeId !== f.scopeId && appState.currentScopeId !== 'world' && appState.currentScopeId !== 'india') {
    appState.currentScopeId = f.scopeId;
    document.querySelectorAll('.scope-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scope === f.scopeId);
    });
    const scope = GEOGRAPHIC_SCOPES[f.scopeId];
    if (scope) {
      const breadcrumbEl = document.getElementById('geoBreadcrumbText');
      if (breadcrumbEl) breadcrumbEl.textContent = scope.breadcrumb;
      const scopeBadge = document.getElementById('geoScopeBadge');
      if (scopeBadge) scopeBadge.textContent = scope.badge;
    }
    if (typeof renderContextualEmergencies === 'function') renderContextualEmergencies();
    if (typeof renderRegionalStockMatrix === 'function') renderRegionalStockMatrix();
    if (typeof renderFacilityDirectoryList === 'function') renderFacilityDirectoryList();
  }

  // Clear active highlights on all facility markers and set focused override
  Object.keys(hospitalMarkers).forEach(id => {
    const entry = hospitalMarkers[id];
    if (entry && entry.element) {
      entry.element.classList.toggle('marker-active', id === facilityId);
      entry.element.classList.toggle('marker-focused-override', id === facilityId);
    }
  });

  // Ensure only one popup is active at a time
  Object.values(hospitalMarkers).forEach(m => {
    if (m && m.popup && m.popup.isOpen() && m !== target) {
      m.popup.remove();
    }
  });
  Object.values(donorMarkers).forEach(d => {
    if (d && d.popup && d.popup.isOpen()) {
      d.popup.remove();
    }
  });

  if (maplibreMap) {
    maplibreMap.flyTo({
      center: [f.lng, f.lat],
      zoom: 14.5,
      pitch: 32,
      duration: 1000,
      essential: true
    });
  }

  // Desktop Popup vs Touch-Optimized Mobile Bottom Sheet
  if (target && target.popup) {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      showMobileFacilitySheet(f);
      if (target.popup.isOpen()) target.popup.remove();
    } else {
      if (!target.popup.isOpen()) {
        target.marker.togglePopup();
      }
      hideMobileFacilitySheet();
    }
  }

  // Update dispatch route to target facility from nearest donor station
  const donors = getDonorsForScope(f.scopeId);
  const origin = donors.length > 0 ? [donors[0].lng, donors[0].lat] : [f.lng - 0.02, f.lat + 0.02];
  updateMapLibreRoute(origin, [f.lng, f.lat]);

  // Highlight and scroll corresponding card in emergency queue
  document.querySelectorAll('.urgent-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById('card-' + facilityId);
  if (card) {
    card.classList.add('active');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Highlight matching card in facility directory if visible
  document.querySelectorAll('.facility-card').forEach(fc => {
    fc.classList.remove('active');
    if (fc.textContent.includes(f.name)) {
      fc.classList.add('active');
    }
  });
}

// Backward compatibility alias
function highlightHospitalMarker(facilityId) {
  focusFacility(facilityId);
}

function showMobileFacilitySheet(f) {
  const sheet = document.getElementById('mobileFacilitySheet');
  const content = document.getElementById('mobileFacilitySheetContent');
  if (!sheet || !content || !f) return;

  const isBloodBank = f.type.toLowerCase().includes('blood') || f.name.toLowerCase().includes('blood');
  const isCritical = f.urgency === 'critical';

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span class="map-popup-badge ${isBloodBank ? 'blood-bank' : (isCritical ? 'critical' : 'urgent')}">
        ${isBloodBank ? '🩸 REGIONAL BLOOD BANK' : (isCritical ? 'CRITICAL SHORTAGE' : 'HOSPITAL SURGICAL NEED')}
      </span>
      <button onclick="hideMobileFacilitySheet()" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer; padding:2px 6px;" aria-label="Close sheet">&times;</button>
    </div>
    <h3 style="font-size: 1rem; font-weight: 800; color: #ffffff; margin: 0 0 2px 0;">${f.name}</h3>
    <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 8px;">📍 ${f.address || (f.city + ', ' + f.country)} • ${f.phone || ''}</div>
    
    ${isBloodBank ? `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px; margin-bottom: 8px;">
        <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Available Bank Reserves</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; text-align: center; font-size: 0.72rem; font-family: var(--font-mono);">
          <span style="background: rgba(255,255,255,0.04); padding: 3px 0; border-radius: 3px;"><strong style="color:#fb7185;">O-</strong> ${f.stock ? f.stock['O-'] || 0 : 0}</span>
          <span style="background: rgba(255,255,255,0.04); padding: 3px 0; border-radius: 3px;"><strong style="color:#34d399;">O+</strong> ${f.stock ? f.stock['O+'] || 0 : 0}</span>
          <span style="background: rgba(255,255,255,0.04); padding: 3px 0; border-radius: 3px;"><strong style="color:#38bdf8;">A+</strong> ${f.stock ? f.stock['A+'] || 0 : 0}</span>
          <span style="background: rgba(255,255,255,0.04); padding: 3px 0; border-radius: 3px;"><strong style="color:#fbbf24;">B+</strong> ${f.stock ? f.stock['B+'] || 0 : 0}</span>
        </div>
      </div>
    ` : `
      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
        <span class="blood-badge ${isCritical ? 'critical' : 'needed'}" style="font-size: 0.75rem; padding: 3px 8px;">Need: ${f.emergencyNeed} (${f.unitsNeeded} Units)</span>
        <span style="font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center;">Data freshness: ${f.lastUpdated}</span>
      </div>
    `}
    
    <button class="dispatch-btn" style="width: 100%; justify-content: center; padding: 10px;" onclick="dispatchRequest('${f.name.replace(/'/g, "\\'")}', '${f.emergencyNeed}', '${isBloodBank ? 'Rapid Cold-Chain Van' : 'Rapid Courier'}')">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
      ${isBloodBank ? 'Request Blood Bank Allocation' : 'Dispatch Blood Courier'}
    </button>
  `;

  sheet.classList.add('visible');
  sheet.setAttribute('aria-hidden', 'false');
}

function hideMobileFacilitySheet() {
  const sheet = document.getElementById('mobileFacilitySheet');
  if (sheet) {
    sheet.classList.remove('visible');
    sheet.setAttribute('aria-hidden', 'true');
  }
}

function deselectActiveFacility() {
  activeHighlightedFacilityId = null;

  Object.keys(hospitalMarkers).forEach(id => {
    const entry = hospitalMarkers[id];
    if (entry && entry.element) {
      entry.element.classList.remove('marker-active', 'marker-focused-override');
    }
  });

  Object.values(hospitalMarkers).forEach(m => {
    if (m && m.popup && m.popup.isOpen()) m.popup.remove();
  });
  Object.values(donorMarkers).forEach(d => {
    if (d && d.popup && d.popup.isOpen()) d.popup.remove();
  });

  hideMobileFacilitySheet();

  document.querySelectorAll('.urgent-card').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.facility-card').forEach(fc => fc.classList.remove('active'));
}

function handleLocateUser() {
  const btn = document.getElementById('btnLocateUser');
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    showMapError('Geolocation is not supported by your browser environment.');
    return;
  }

  if (btn) {
    btn.classList.add('locating');
    btn.setAttribute('aria-busy', 'true');
  }
  userLocationState.status = 'locating';
  showMapLoading('Acquiring high-accuracy GPS coordinates...');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { longitude, latitude, accuracy } = pos.coords;
      if (!isValidCoordinate(longitude, latitude)) {
        hideMapLoading();
        if (btn) {
          btn.classList.remove('locating');
          btn.removeAttribute('aria-busy');
        }
        showMapError('Invalid coordinates received from GPS sensor.');
        return;
      }

      userLocationState.status = 'located';
      userLocationState.coords = [longitude, latitude];
      userLocationState.accuracy = accuracy || 50;
      userLocationState.timestamp = Date.now();

      hideMapLoading();
      if (btn) {
        btn.classList.remove('locating');
        btn.classList.add('active');
        btn.removeAttribute('aria-busy');
      }

      // Mount or update user location marker on map
      if (!userLocationState.marker && maplibreMap) {
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.setAttribute('title', 'Your Current Location');
        el.innerHTML = `
          <div class="user-location-core"></div>
          <div class="user-location-pulse"></div>
        `;
        userLocationState.marker = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(maplibreMap);
      } else if (userLocationState.marker) {
        userLocationState.marker.setLngLat([longitude, latitude]);
      }

      if (maplibreMap) {
        maplibreMap.flyTo({
          center: [longitude, latitude],
          zoom: Math.max(maplibreMap.getZoom(), 13.5),
          duration: 1000,
          essential: true
        });
      }

      if (typeof playTone === 'function') playTone(600, 'sine', 0.05);
      if (typeof logTerminal === 'function') {
        logTerminal(`[GPS] Acquired user position (±${Math.round(accuracy || 50)}m)`, 'highlight');
      }
    },
    (err) => {
      hideMapLoading();
      userLocationState.status = 'error';
      if (btn) {
        btn.classList.remove('locating');
        btn.removeAttribute('aria-busy');
      }

      let errorMsg = 'Unable to determine your current location.';
      if (err && err.code === 1) { // PERMISSION_DENIED
        errorMsg = 'Location access was denied. Enable location permissions in browser settings.';
        userLocationState.status = 'denied';
      } else if (err && err.code === 2) { // POSITION_UNAVAILABLE
        errorMsg = 'Location signal is currently unavailable.';
      } else if (err && err.code === 3) { // TIMEOUT
        errorMsg = 'Location request timed out. Please try again.';
      }

      showMapError(errorMsg);
      if (typeof playTone === 'function') playTone(300, 'sine', 0.08);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }
  );
}

function fitBoundsToVisibleFacilities() {
  if (!maplibreMap) return;
  const norm = str => String(str || '').toLowerCase().replace(/[\s_-]+/g, '');
  const activeType = appState.activeFacilityTypeFilter;
  const activeBlood = appState.activeBloodFilter;
  const isTypeAll = !activeType || activeType.toLowerCase() === 'all';
  const isBloodAll = !activeBlood || activeBlood.toLowerCase() === 'all';

  const visible = GLOBAL_FACILITIES.filter(f => {
    const matchesScope = (!appState.currentScopeId || appState.currentScopeId === 'world' || appState.currentScopeId === 'all')
      ? true
      : (appState.currentScopeId === 'india' ? f.country === 'India' : f.scopeId === appState.currentScopeId);
    const matchesType = isTypeAll ? true : norm(f.type).includes(norm(activeType));
    const matchesBlood = isBloodAll ? true : (f.emergencyNeed === activeBlood || (f.stock && f.stock[activeBlood] > 0));
    return matchesScope && matchesType && matchesBlood && isValidCoordinate(f.lng, f.lat);
  });

  if (visible.length === 0) return;

  if (visible.length === 1) {
    focusFacility(visible[0].id);
    return;
  }

  if (typeof maplibregl.LngLatBounds !== 'undefined') {
    const bounds = new maplibregl.LngLatBounds();
    visible.forEach(f => bounds.extend([f.lng, f.lat]));

    maplibreMap.fitBounds(bounds, {
      padding: { top: 70, bottom: 80, left: 70, right: 70 },
      maxZoom: 15,
      duration: 800,
      essential: true
    });
  } else {
    // Fallback if LngLatBounds is mocked
    maplibreMap.easeTo({
      center: [visible[0].lng, visible[0].lat],
      zoom: 12
    });
  }
  if (typeof playTone === 'function') playTone(540, 'sine', 0.04);
}

function handleToggleFullscreen() {
  const viewport = document.getElementById('viewport') || document.documentElement;
  const btn = document.getElementById('btnToggleFullscreen');

  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (viewport.requestFullscreen) {
      viewport.requestFullscreen().catch(() => {});
    } else if (viewport.webkitRequestFullscreen) {
      viewport.webkitRequestFullscreen();
    }
    if (btn) btn.classList.add('active');
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    if (btn) btn.classList.remove('active');
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('btnToggleFullscreen');
    if (btn) {
      btn.classList.toggle('active', !!document.fullscreenElement);
    }
    if (maplibreMap) {
      setTimeout(() => maplibreMap.resize(), 100);
    }
  });
}

/* ----------------------------------------------------------
   9. MAP INITIALIZATION & EVENT WIRING
   ---------------------------------------------------------- */

function initMapLibre() {
  try {
    if (typeof maplibregl === 'undefined') {
      setTimeout(initMapLibre, 250);
      return;
    }

    if (maplibreMap) {
      maplibreMap.resize();
      return;
    }

    // Initial view opens on India National Network (center: [78.9629, 21.5937], zoom: 4.6)
    // No restrictive maxBounds: map can freely pan and zoom across the entire world
    maplibreMap = new maplibregl.Map({
      container: 'maplibreMap',
      style: maplibreOsmStyle,
      center: [78.9629, 21.5937], // India National Operations Center
      zoom: 4.6,
      minZoom: MAP_MIN_ZOOM,       // Global hemisphere view
      maxZoom: MAP_MAX_ZOOM,       // Street/facility level
      pitch: 0,
      bearing: 0,
      attributionControl: false   // Custom compact attribution placed at bottom-left
    });

    // Clean, unobtrusive attribution placed at bottom-left (keeps bottom-right clean for zoom controls)
    maplibreMap.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    // Native cursor-centered zoom & multi-touch gestures
    maplibreMap.scrollZoom.enable();
    maplibreMap.doubleClickZoom.enable();
    maplibreMap.touchZoomRotate.enable();

    // Real-time synchronization of controls with map movement
    maplibreMap.on('zoom', updateZoomButtonsState);
    maplibreMap.on('zoomend', updateZoomButtonsState);
    maplibreMap.on('move', updateZoomButtonsState);
    maplibreMap.on('moveend', () => {
      updateZoomButtonsState();
      if (maplibreMap) {
        const center = maplibreMap.getCenter();
        if (center) {
          mapViewportState.center = [center.lng, center.lat];
        }
        mapViewportState.zoom = maplibreMap.getZoom();
        mapViewportState.bearing = maplibreMap.getBearing();
        mapViewportState.pitch = maplibreMap.getPitch();
      }
    });
    maplibreMap.on('rotate', updateCompassOrientation);
    updateZoomButtonsState();

    // Map surface click deselects active popup/card unless clicking interactive feature
    maplibreMap.on('click', (e) => {
      if (e.originalEvent && e.originalEvent.defaultPrevented) return;
      try {
        const clusterFeatures = maplibreMap.queryRenderedFeatures(e.point, { layers: ['facility-clusters', 'facility-unclustered-point'] });
        if (clusterFeatures && clusterFeatures.length > 0) return;
      } catch (err) {
        // Benign if layers not mounted
      }
      deselectActiveFacility();
    });

    // High-performance ResizeObserver observing container size changes
    if (typeof ResizeObserver !== 'undefined' && !mapInstanceState.resizeObserver) {
      const containerEl = document.getElementById('viewport') || document.getElementById('maplibreMap');
      if (containerEl) {
        let resizeRaf = null;
        mapInstanceState.resizeObserver = new ResizeObserver(() => {
          if (resizeRaf) cancelAnimationFrame(resizeRaf);
          resizeRaf = requestAnimationFrame(() => {
            if (maplibreMap) maplibreMap.resize();
          });
        });
        mapInstanceState.resizeObserver.observe(containerEl);
      }
    }

    mapInstanceState.instance = maplibreMap;
    mapInstanceState.isInitialized = true;

    // Resilient WebGL Context Recovery
    const canvas = maplibreMap.getCanvas();
    if (canvas) {
      canvas.addEventListener('webglcontextlost', (e) => {
        if (e) e.preventDefault();
        showMapLoading('Restoring Cartographic Graphics Context...');
      });
      canvas.addEventListener('webglcontextrestored', () => {
        hideMapLoading();
        if (maplibreMap) {
          maplibreMap.resize();
          ensureOperationalLayers();
        }
      });
    }

    // Filter out normal non-fatal tile aborts during rapid pan/zoom
    maplibreMap.on('error', (e) => {
      if (!e) return;
      const msg = e.error && e.error.message ? e.error.message.toLowerCase() : '';
      if (msg.includes('abort') || msg.includes('canceled') || msg.includes('404')) {
        return; // Standard benign tile lifecycle events
      }
      console.debug('MapLibre telemetry:', e);
    });

    function onMapReady() {
      isMapLibreLoaded = true;
      mapInstanceState.isLoaded = true;
      maplibreMap.resize();
      ensureOperationalLayers();
      mountFacilityDOMMarkers();
      updateZoomButtonsState();
      updateCompassOrientation();
    }

    if (maplibreMap.loaded() || maplibreMap.isStyleLoaded()) {
      onMapReady();
    } else {
      maplibreMap.on('load', onMapReady);
    }

    setTimeout(() => { if (maplibreMap) maplibreMap.resize(); }, 150);
    setTimeout(() => { if (maplibreMap) maplibreMap.resize(); }, 600);

  } catch (err) {
    console.error('MapLibre global initialization error:', err);
    showMapError('Map initialized in offline fallback mode.');
  }
}

// Global Keyboard Accessibility for Map Zoom (+/-)
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (appState.currentPortal !== 'ops') return;

  if (e.key === '+' || e.key === '=') {
    handleMapZoomIn();
  } else if (e.key === '-' || e.key === '_') {
    handleMapZoomOut();
  }
});

function onWindowResize() {
  if (maplibreMap) {
    maplibreMap.resize();
    updateZoomButtonsState();
  }
}

window.addEventListener('resize', onWindowResize);
window.addEventListener('orientationchange', () => {
  setTimeout(onWindowResize, 150);
});

if (typeof window !== 'undefined') {
  window.filterMapFacilities = filterMapFacilities;
  window.locateNearestBloodBank = locateNearestBloodBank;
  window.focusFacility = focusFacility;
  window.highlightHospitalMarker = highlightHospitalMarker;
  window.handleMapZoomIn = handleMapZoomIn;
  window.handleMapZoomOut = handleMapZoomOut;
  window.handleResetBearing = handleResetBearing;
  window.handleLocateUser = handleLocateUser;
  window.fitBoundsToVisibleFacilities = fitBoundsToVisibleFacilities;
  window.handleToggleFullscreen = handleToggleFullscreen;
  window.showMobileFacilitySheet = showMobileFacilitySheet;
  window.hideMobileFacilitySheet = hideMobileFacilitySheet;
  window.deselectActiveFacility = deselectActiveFacility;
  window.isValidCoordinate = isValidCoordinate;
  window.setMapType = setMapType;
  window.setMapMode = setMapMode;
  window.setGeographicScope = setGeographicScope;
  window.initMapLibre = initMapLibre;
  window.mapInstanceState = mapInstanceState;
  window.mapViewportState = mapViewportState;
  window.userLocationState = userLocationState;
}
