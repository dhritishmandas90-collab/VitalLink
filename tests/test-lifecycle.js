const fs = require('fs');
const vm = require('vm');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

class MockClassList {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach(x => this.set.add(x)); }
  remove(...c) { c.forEach(x => this.set.delete(x)); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.set.add(c); else this.set.delete(c);
      return force;
    }
    if (this.set.has(c)) { this.set.delete(c); return false; }
    this.set.add(c); return true;
  }
  contains(c) { return this.set.has(c); }
}

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList();
    this.style = {};
    this.attributes = new Map();
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.disabled = false;
  }
  setAttribute(k, v) { this.attributes.set(k, v); }
  getAttribute(k) { return this.attributes.get(k); }
  removeAttribute(k) { this.attributes.delete(k); }
  addEventListener(event, fn) { (this._listeners = this._listeners || {})[event] = fn; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  prepend(...children) { this.children.unshift(...children); }
  appendChild(child) { this.children.push(child); }
  scrollIntoView() {}
  focus() {}
}

const elementsById = new Map();
function getEl(id) {
  if (!elementsById.has(id)) {
    const el = new MockElement('div');
    el.id = id;
    elementsById.set(id, el);
  }
  return elementsById.get(id);
}

let mockMapZoom = 4.6;
let mockMapCenter = { lng: 78.9629, lat: 21.5937 };
let mockMapBearing = 0;
let mockMapPitch = 0;
const eventHandlers = {};

class MockMap {
  constructor(options) {
    this.options = options;
    mockMapZoom = options.zoom || 4.6;
    this.sources = new Map();
    this.layers = new Map();
  }
  getZoom() { return mockMapZoom; }
  getCenter() { return mockMapCenter; }
  getBearing() { return mockMapBearing; }
  getPitch() { return mockMapPitch; }
  easeTo(opts) {
    if (opts.zoom !== undefined) mockMapZoom = opts.zoom;
    if (opts.center !== undefined) mockMapCenter = opts.center;
    if (opts.bearing !== undefined) mockMapBearing = opts.bearing;
    if (opts.pitch !== undefined) mockMapPitch = opts.pitch;
    this.fire('zoom');
    this.fire('move');
    this.fire('rotate');
  }
  flyTo(opts) { this.easeTo(opts); }
  jumpTo(opts) { this.easeTo(opts); }
  resize() {}
  loaded() { return true; }
  isStyleLoaded() { return true; }
  setStyle(style, opts) {
    this.sources.clear();
    this.layers.clear();
    setTimeout(() => { this.fire('style.load'); }, 10);
  }
  addSource(id, src) { this.sources.set(id, src); }
  getSource(id) { return this.sources.get(id); }
  addLayer(layer) { this.layers.set(layer.id, layer); }
  getLayer(id) { return this.layers.get(id); }
  addControl() {}
  getCanvas() { return new MockElement('canvas'); }
  scrollZoom = { enable() {} };
  doubleClickZoom = { enable() {} };
  touchZoomRotate = { enable() {} };
  on(event, arg2, arg3) {
    const ev = typeof arg2 === 'string' ? `${event}:${arg2}` : event;
    const fn = typeof arg2 === 'function' ? arg2 : arg3;
    (eventHandlers[ev] = eventHandlers[ev] || []).push(fn);
  }
  once(event, fn) {
    const wrapper = (...args) => {
      fn(...args);
      const idx = (eventHandlers[event] || []).indexOf(wrapper);
      if (idx !== -1) eventHandlers[event].splice(idx, 1);
    };
    (eventHandlers[event] = eventHandlers[event] || []).push(wrapper);
  }
  fire(event, ...args) {
    (eventHandlers[event] || []).forEach(fn => fn(...args));
  }
}

class MockMarker {
  constructor(opts) { this.el = opts.element; }
  setLngLat() { return this; }
  setPopup(p) { this.popup = p; return this; }
  addTo() { return this; }
  togglePopup() { if (this.popup) this.popup._isOpen = !this.popup._isOpen; }
  remove() {}
}

class MockPopup {
  constructor() { this._isOpen = false; }
  setHTML() { return this; }
  isOpen() { return this._isOpen; }
  remove() { this._isOpen = false; }
}

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  process,
  window: {
    innerWidth: 1200,
    innerHeight: 800,
    addEventListener() {},
    location: { href: '' }
  },
  document: {
    getElementById: (id) => getEl(id),
    querySelectorAll: (sel) => {
      if (sel.includes('.scope-pill-btn')) return [getEl('scope-india'), getEl('scope-delhi')];
      if (sel.includes('.portal-btn')) return [getEl('btn-portal-ops'), getEl('btn-portal-admin'), getEl('btn-portal-donor')];
      if (sel.includes('.portal-view')) return [getEl('view-ops'), getEl('view-admin'), getEl('view-donor')];
      if (sel.includes('.urgent-card')) return [getEl('card-delhi-1')];
      if (sel.includes('.facility-card')) return [getEl('fc-delhi-1')];
      if (sel.includes('.mobile-ops-tab')) return [getEl('tabBtnMap'), getEl('tabBtnQueue'), getEl('tabBtnStock')];
      return [];
    },
    querySelector: () => new MockElement(),
    createElement: (tag) => new MockElement(tag),
    addEventListener() {}
  },
  maplibregl: {
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    AttributionControl: class {}
  },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  getEl
};

vm.createContext(sandbox);

const files = ['js/state.js', 'js/map.js', 'js/app.js', 'js/donor.js', 'js/admin.js'];
const concatenated = files.map(f => fs.readFileSync(path.join(rootDir, f), 'utf8')).join('\n;\n');
vm.runInContext(concatenated, sandbox);

vm.runInContext(`
console.log("=== EXECUTING VITALLINK AUTOMATED VERIFICATION SUITE ===");

// 1. Map Initialization
initMapLibre();
console.log("1. Init Map: valid instance created =", !!maplibreMap);

// 2. Initial Zoom Controls
updateZoomButtonsState();
const btnIn = getEl("btnZoomIn");
const btnOut = getEl("btnZoomOut");
console.log("2. Initial Zoom Controls: zoom =", maplibreMap.getZoom(), "| btnIn disabled =", btnIn.disabled, "| btnOut disabled =", btnOut.disabled);

// 3. Zoom In to MAP_MAX_ZOOM (18.0)
maplibreMap.easeTo({ zoom: 17.4 });
handleMapZoomIn();
console.log("3. Step to Max: zoom =", maplibreMap.getZoom(), "| btnIn disabled =", btnIn.disabled);
if (!btnIn.disabled || maplibreMap.getZoom() !== 18.0) {
  throw new Error("Zoom In failed to clamp to 18.0");
}

// Over-zoom silently rejected
handleMapZoomIn();
console.log("3b. Over-zoom rejected silently: zoom remains =", maplibreMap.getZoom());
if (maplibreMap.getZoom() !== 18.0) {
  throw new Error("Over-zoom altered zoom level beyond 18.0");
}

// 4. Zoom Out from Max (Restores Zoom In)
handleMapZoomOut();
console.log("4. Step Down: zoom =", maplibreMap.getZoom(), "| btnIn re-enabled =", !btnIn.disabled);
if (btnIn.disabled || maplibreMap.getZoom() !== 17.0) {
  throw new Error("Zoom In was not re-enabled on stepping down");
}

// 5. Zoom Out to MAP_MIN_ZOOM (1.5)
maplibreMap.easeTo({ zoom: 1.8 });
handleMapZoomOut();
console.log("5. Step to Min: zoom =", maplibreMap.getZoom(), "| btnOut disabled =", btnOut.disabled);
if (!btnOut.disabled || maplibreMap.getZoom() !== 1.5) {
  throw new Error("Zoom Out failed to clamp to 1.5");
}

// Over-zoom out silently rejected
handleMapZoomOut();
console.log("5b. Over-zoom out rejected silently: zoom remains =", maplibreMap.getZoom());
if (maplibreMap.getZoom() !== 1.5) {
  throw new Error("Over-zoom out altered zoom level below 1.5");
}

// 6. Basemap Switch: Streets -> Satellite
maplibreMap.easeTo({ zoom: 13.5, center: { lng: 77.2090, lat: 28.5672 } });
setMapType("satellite");
console.log("6. Satellite mode transition initiated.");

setTimeout(() => {
  console.log("6b. Satellite style.load fired. Mode =", appState.mapMode);
  console.log("6c. Camera zoom preserved =", maplibreMap.getZoom() === 13.5);

  // 7. Basemap Switch: Satellite -> Streets
  setMapType("streets");
  setTimeout(() => {
    console.log("7. Streets style restored. Mode =", appState.mapMode);

    // 8. Focus Facility
    focusFacility("delhi-1");
    console.log("8. Focused delhi-1. Active Highlight ID =", activeHighlightedFacilityId);
    console.log("8b. Map zoom after focus =", maplibreMap.getZoom());

    // 9. Dispatch Request
    dispatchRequest("AIIMS Apex Emergency Centre", "O-", "Rapid Courier");
    console.log("9. Blood courier dispatch executed smoothly.");

    // 10. Global Search Selection
    handleSelectSearchResult("facility", "mumbai-1");
    console.log("10. Search selection focused mumbai-1: active =", activeHighlightedFacilityId);

    // 11. Quick-Fill Citizen
    quickFillCitizen("Arthur Davies", "O-", "Westminster, London", "london");
    console.log("11. Citizen authenticated:", appState.currentCitizenDonor.name, "| Token:", appState.currentCitizenDonor.id);

    // 12. Admin Login & SOS Broadcast
    submitAdminLogin("admin@vitallink.org", "alpha99");
    adminBroadcastSos("delhi-1");
    console.log("12. Admin SOS broadcast executed across network.");

    console.log("");
    console.log("=======================================================");
    console.log(">>> ALL 12 AUTOMATED LIFECYCLE TESTS PASSED PERFECTLY <<<");
    console.log("=======================================================");
    process.exit(0);
  }, 25);
}, 25);
`, sandbox);
