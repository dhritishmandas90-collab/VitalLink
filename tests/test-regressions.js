/**
 * VitalLink regression suite — one assertion group per bug confirmed in the Sep 2026 browser audit.
 * Zero dependencies: a minimal DOM + MapLibre mock inside a vm context.
 * Unlike the older suites, the map mock reports isStyleLoaded() === false (tiles still loading),
 * which is the real-world condition that previously deleted layers after a basemap switch.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
let passed = 0;
// Values created inside the vm context have a different Array prototype, so compare structurally via JSON
const sameJSON = (actual, expected, msg) => assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected), msg);
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/* ---------------- minimal DOM ---------------- */
class ClassList {
  constructor() { this.s = new Set(); }
  add(...c) { c.forEach(x => this.s.add(x)); }
  remove(...c) { c.forEach(x => this.s.delete(x)); }
  contains(c) { return this.s.has(c); }
  toggle(c, force) {
    const on = force === undefined ? !this.s.has(c) : !!force;
    if (on) this.s.add(c); else this.s.delete(c);
    return on;
  }
}
class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.classList = new ClassList();
    this.style = {};
    this.dataset = {};
    this.attrs = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.disabled = false;
    this.options = [];
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener() {}
  appendChild(c) { this.children.push(c); if (c.tagName === 'OPTION') this.options.push(c); return c; }
  prepend(c) { this.children.unshift(c); }
  removeChild(c) { this.children = this.children.filter(x => x !== c); }
  get lastChild() { return this.children[this.children.length - 1]; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  scrollIntoView() {}
  focus() {}
  remove() {}
}
const byId = new Map();
const getEl = id => { if (!byId.has(id)) byId.set(id, new El()); return byId.get(id); };

/* ---------------- MapLibre mock with realistic style lifecycle ---------------- */
const handlers = {};
class MockMap {
  constructor() { this.sources = new Map(); this.layers = new Map(); this.zoom = 4.6; }
  on(ev, a, b) { const k = typeof a === 'string' ? `${ev}:${a}` : ev; (handlers[k] = handlers[k] || []).push(typeof a === 'function' ? a : b); }
  once(ev, fn) { const w = (...x) => { handlers[ev] = handlers[ev].filter(h => h !== w); fn(...x); }; (handlers[ev] = handlers[ev] || []).push(w); }
  fire(ev, ...x) { (handlers[ev] || []).slice().forEach(h => h(...x)); }
  loaded() { return false; }
  isStyleLoaded() { return false; } // tiles never "finish" — the condition that exposed the bug
  setStyle() { this.styleChanges = (this.styleChanges || 0) + 1; this.sources.clear(); this.layers.clear(); setTimeout(() => this.fire('style.load'), 5); }
  addSource(id, src) { this.sources.set(id, { ...src, setData(d) { this.data = d; } }); }
  getSource(id) { return this.sources.get(id); }
  addLayer(l) { this.layers.set(l.id, l); }
  getLayer(id) { return this.layers.get(id); }
  queryRenderedFeatures() { return []; }
  getZoom() { return this.zoom; } getCenter() { return { lng: 78, lat: 21 }; }
  getBearing() { return 0; } getPitch() { return 0; }
  easeTo(o) { if (o.zoom !== undefined) this.zoom = o.zoom; } flyTo(o) { this.easeTo(o); } jumpTo(o) { this.easeTo(o); }
  resize() {} addControl() {} getCanvas() { return new El('canvas'); }
  scrollZoom = { enable() {} }; doubleClickZoom = { enable() {} }; touchZoomRotate = { enable() {} };
}
class MockPopup { constructor() { this.open = false; } setHTML() { return this; } isOpen() { return this.open; } remove() { this.open = false; } }
class MockMarker { constructor(o) { this.el = o.element; } setLngLat() { return this; } setPopup(p) { this.p = p; return this; } addTo() { return this; } togglePopup() { this.p.open = !this.p.open; } remove() {} }

const sandbox = {
  console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
  Intl, Date, Math, JSON,
  window: { innerWidth: 1280, innerHeight: 800, addEventListener() {}, location: { hash: '' }, history: { state: null, pushState() {}, replaceState() {} } },
  document: {
    getElementById: getEl,
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: t => new El(t),
    addEventListener() {},
    activeElement: { tagName: 'BODY' }
  },
  navigator: {},
  confirm: () => true,
  maplibregl: { Map: MockMap, Marker: MockMarker, Popup: MockPopup, AttributionControl: class {} }
};
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);
['js/state.js', 'js/map.js', 'js/admin.js', 'js/donor.js', 'js/app.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(rootDir, f), 'utf8'), sandbox, { filename: f })
);
const W = sandbox.window;
const run = code => vm.runInContext(code, sandbox);

console.log('================================================================');
console.log('>>> VITALLINK REGRESSION SUITE');
console.log('================================================================');

/* ---------------- synchronous checks ---------------- */
check('Both basemaps remain visible at the maximum supported zoom', () => {
  run('[maplibreOsmStyle, maplibreSatelliteStyle]').forEach(style => {
    style.layers.forEach(layer => assert.ok(layer.maxzoom === undefined || layer.maxzoom > 18));
  });
});

check('Every facility name resolves to itself (first-word matching misrouted 7/40)', () => {
  const bad = W.GLOBAL_FACILITIES.filter(f => W.resolveFacility(f.name).id !== f.id);
  sameJSON(bad.map(f => f.id), []);
});

check('All legacy aliases resolve (kol-1 was dangling)', () => {
  ['delhi-1', 'delhi-2', 'mumbai-1', 'mumbai-2', 'blr-1', 'ghy-1', 'gmch-hosp-guwahati', 'ghy-2', 'kol-1', 'kol-2']
    .forEach(a => assert.ok(W.getFacilityById(a), `alias ${a}`));
});

check('Dispatch targets the requested facility, persists, and cannot double-deduct', () => {
  W.appState.adminLoggedIn = true;
  const inv = W.appState.inventory.find(i => i.type === 'O-');
  const before = inv.count;
  assert.strictEqual(W.dispatchRequest('aiims-guwahati', 'O-', 'Test'), true);
  assert.ok(W.appState.dispatchedFacilityIds.has('aiims-guwahati'));
  assert.ok(!W.appState.dispatchedFacilityIds.has('aiims-delhi'));
  assert.strictEqual(W.getActiveHighlightedFacilityId(), 'aiims-guwahati');
  assert.strictEqual(W.dispatchRequest('aiims-guwahati', 'O-', 'Test'), false);
  assert.strictEqual(inv.count, before - 2);
  assert.strictEqual(W.dispatchRequest('not-a-real-facility', 'O-'), false);
});

check('Dispatched ticket survives a queue re-render', () => {
  run("appState.currentScopeId = 'guwahati'; setBloodGroupFilter('all');");
  assert.ok(getEl('contextualEmergenciesContainer').innerHTML.includes('✓ Dispatched'));
});

check('Focusing an alias highlights the canonical facility', () => {
  W.focusFacility('delhi-1');
  assert.strictEqual(W.getActiveHighlightedFacilityId(), 'aiims-delhi');
});

check('Unknown citizen login is rejected (used to sign in as registeredUsers[0])', () => {
  getEl('gateLoginUser').value = '9999999999';
  getEl('gateLoginPass').value = 'whatever';
  assert.strictEqual(W.submitGateLogin(), false);
  assert.strictEqual(W.appState.citizenLoggedIn, false);
});

check('Register -> logout -> login by phone signs in the same record; wrong password fails', () => {
  getEl('gateRegName').value = 'Test Citizen';
  getEl('gateRegBlood').value = 'B+';
  getEl('gateRegSector').value = 'Bhangagarh, Guwahati';
  getEl('gateRegPhone').value = '+91 98765 43210';
  getEl('gateRegPass').value = 'secret1';
  assert.strictEqual(W.submitGateRegister(), true);
  const userId = W.appState.currentCitizenDonor.userId;
  W.citizenLogout();

  getEl('gateLoginUser').value = '9876543210';
  getEl('gateLoginPass').value = 'wrong-pass';
  assert.strictEqual(W.submitGateLogin(), false);

  getEl('gateLoginUser').value = '98765-43210';
  getEl('gateLoginPass').value = 'secret1';
  assert.strictEqual(W.submitGateLogin(), true);
  assert.strictEqual(W.appState.currentCitizenDonor.userId, userId);
});

check('Duplicate phone registration is refused', () => {
  W.citizenLogout();
  getEl('gateRegName').value = 'Someone Else';
  getEl('gateRegPhone').value = '9876543210';
  getEl('gateRegPass').value = 'secret2';
  assert.strictEqual(W.submitGateRegister(), false);
});

check('Advertised demo citizen (Dhiman) actually logs in as Dhiman', () => {
  W.quickFillDemoUser();
  assert.strictEqual(W.submitUserLogin(), true);
  assert.strictEqual(W.appState.currentCitizenDonor.name, 'Dhiman');
  W.citizenLogout();
});

check('Recommendations are ABO/Rh compatible and Accept acts on the displayed facility', () => {
  W.quickFillCitizen('Jiten Barman', 'B+', 'Paltan Bazaar, Guwahati', 'guwahati');
  ['world', 'india', 'guwahati', 'delhi', 'london'].forEach(scope => {
    W.appState.currentScopeId = scope;
    W.BLOOD_GROUPS.forEach(g => {
      W.appState.currentCitizenDonor.blood = g;
      const t = W.resolveSmartRecommendationTarget();
      if (t) assert.ok(W.canDonateTo(g, t.emergencyNeed), `${g} -> ${t.emergencyNeed} @ ${scope}`);
    });
  });
  W.appState.currentScopeId = 'guwahati';
  W.appState.currentCitizenDonor.blood = 'O-';
  W.updateSmartRecommendation();
  const shown = W.appState.smartRecommendationTargetId;
  assert.ok(shown);
  W.appState.dispatchedFacilityIds.delete(shown);
  const invBefore = JSON.stringify(W.appState.inventory);
  W.acceptSmartRecommendation();
  assert.ok(!W.appState.dispatchedFacilityIds.has(shown));
  assert.strictEqual(getEl('schedFacility').value, shown);
  assert.strictEqual(JSON.stringify(W.appState.inventory), invBefore, 'donor match must not deduct central reserve');
});

check('Ops "All" blood pill no longer empties the Citizen stock search; search respects scope', () => {
  run("setBloodGroupFilter('all'); appState.currentScopeId = 'guwahati'; setBloodFilter('ALL');");
  const cards = (getEl('hospitalStockResultsGrid').innerHTML.match(/hospital-stock-card/g) || []).length;
  const expected = W.GLOBAL_FACILITIES.filter(f => f.scopeId === 'guwahati').length;
  assert.strictEqual(cards, expected);
  run("setBloodFilter('B+');");
  assert.strictEqual(W.appState.donorStockBloodFilter, 'B+');
  assert.ok(W.isAllFilter(W.appState.activeBloodFilter), 'donor filter must not change Ops filter');
});

check('User-entered names are escaped in the admin audit table (stored XSS)', () => {
  W.citizenLogout();
  getEl('gateRegName').value = '<img src=x onerror="alert(1)">';
  getEl('gateRegBlood').value = 'O+';
  getEl('gateRegPhone').value = '9123456780';
  getEl('gateRegPass').value = 'secret3';
  W.submitGateRegister();
  const html = getEl('donorsAuditTableBody').innerHTML;
  assert.ok(!html.includes('<img src=x'), 'raw tag rendered');
  assert.ok(html.includes('&lt;img src=x'));
});

check('Admin erase request accepted for the logged-in citizen', () => {
  const userId = W.appState.currentCitizenDonor.userId;
  W.appState.adminLoggedIn = true;
  W.deleteUserData(userId);
  // deletion completes after the 250 ms row animation; asserted in the async block below
  W.__pendingEraseUser = userId;
});

check('KPI renders from state (was a hard-coded 1,284)', () => {
  W.renderAdminKPIs();
  assert.strictEqual(getEl('kpiDonorsCount').textContent, W.appState.totalCitizenCount.toLocaleString());
});

check('Inventory status is derived from count consistently', () => {
  W.adjustStock(0, -1000);
  assert.strictEqual(W.appState.inventory[0].count, 0);
  assert.strictEqual(W.appState.inventory[0].status, 'Critical Deficit');
  W.restockAll();
  W.appState.inventory.forEach(i => assert.strictEqual(i.status, 'Optimal'));
});

/* ---------------- async checks (timers / map lifecycle) ---------------- */
setTimeout(() => {
  check('Admin erasing the logged-in citizen ends that session (after animation)', () => {
    assert.ok(!W.appState.registeredUsers.some(u => u.id === W.__pendingEraseUser));
    assert.strictEqual(W.appState.citizenLoggedIn, false);
    assert.strictEqual(W.appState.currentCitizenDonor, null);
  });

  W.initMapLibre();
  W.appState.currentPortal = 'ops';
  const map = run('maplibreMap');
  map.fire('load');
  check('Operational layers mount on load even while tiles are loading', () => {
    assert.ok(map.getLayer('facility-clusters'));
    assert.ok(map.getLayer('dispatch-route-line'));
  });

  check('Zoomed-out isolated facilities are visible and selectable', () => {
    const layer = map.getLayer('facility-unclustered');
    assert.ok(layer);
    sameJSON(layer.filter, ['!', ['has', 'point_count']]);
    assert.strictEqual(layer.source, 'facilities-cluster-source');
    assert.strictEqual(layer.maxzoom, run('DOM_MARKER_MIN_ZOOM'));
    map.zoom = 7.99;
    run('updateMapClusterVisibility()');
    assert.ok(getEl('maplibreMap').classList.contains('markers-clustered'));
    map.zoom = 8;
    run('updateMapClusterVisibility()');
    assert.ok(!getEl('maplibreMap').classList.contains('markers-clustered'));
    map.fire('click:facility-unclustered', { features: [{ properties: { id: 'aiims-delhi' } }] });
    assert.strictEqual(W.getActiveHighlightedFacilityId(), 'aiims-delhi');
  });

  check('Retry forces a style reload even when Streets is already selected', () => {
    const before = map.styleChanges || 0;
    W.retryMapBasemap();
    assert.strictEqual(map.styleChanges, before + 1);
  });

  W.setMapType('satellite');
  setTimeout(() => {
    check('Basemap switch re-adds clusters + route (they previously vanished permanently)', () => {
      assert.strictEqual(W.appState.mapMode, 'satellite');
      assert.ok(map.getLayer('facility-clusters'), 'clusters missing after switch');
      assert.ok(map.getLayer('facility-unclustered'), 'isolated points missing after switch');
      assert.strictEqual(handlers['click:facility-unclustered'].length, 1, 'duplicate click handlers');
      assert.ok(map.getLayer('dispatch-route-line'), 'route missing after switch');
    });

    check('Cluster source honours active filters after a style switch', () => {
      W.setFacilityTypeFilter('blood_bank');
      const data = map.getSource('facilities-cluster-source').data;
      assert.ok(data.features.length > 0);
      assert.ok(data.features.every(ft => /blood/i.test(ft.properties.type)));
      W.setFacilityTypeFilter('all');
    });

    check('Route origin is the nearest donor node, not the first in the list', () => {
      W.focusFacility('gmch-bloodbank');
      const route = map.getSource('dispatch-route').data.geometry.coordinates;
      const f = W.getFacilityById('gmch-bloodbank');
      const nearest = W.findNearestDonorNode(f);
      sameJSON(route[0], [nearest.lng, nearest.lat]);
      sameJSON(route[2], [f.lng, f.lat]);
    });

    console.log('================================================================');
    console.log(`>>> ALL ${passed} REGRESSION CHECKS PASSED`);
    console.log('================================================================');
    process.exit(0);
  }, 40);
}, 400);
