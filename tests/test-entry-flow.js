const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const rootDir = path.resolve(__dirname, '..');
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('  ✓ ' + name); }
function makeApp(storage = new Map()) {
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
  reset() { byId.forEach(el => { if (el.tagName === 'INPUT') el.value = ''; }); }
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
sandbox.window.sessionStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
sandbox.window.history.pushState = sandbox.window.history.replaceState = (state, unused, hash) => { sandbox.window.history.state = state; sandbox.window.location.hash = hash; };
vm.createContext(sandbox);
['js/state.js', 'js/map.js', 'js/admin.js', 'js/donor.js', 'js/app.js', 'js/entry.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(rootDir, f), 'utf8'), sandbox, { filename: f })
);
const W = sandbox.window;
const run = code => vm.runInContext(code, sandbox);


return { W, run, getEl, storage };
}
let app = makeApp();
let { W, run, getEl } = app;
const value = (id, v) => { getEl(id).value = v; };
const registerFields = () => {
  value('entryName', 'Flow Test Citizen'); value('entryBlood', 'B+');
  value('entryEmail', 'flow@example.com'); value('entryPhone', '9876501234');
  value('entryRegion', 'guwahati'); value('entryNewPassword', 'test-flow-pass');
  value('entryConfirmPassword', 'test-flow-pass');
};
console.log('VITALLINK LOGIN-FIRST FLOW');
check('Initial visit is login, with dashboard hidden and inert', () => {
  W.location.hash = '#portal=admin'; run('initializeEntryFlow()');
  assert.strictEqual(W.appState.currentPortal, 'login');
  assert.strictEqual(W.location.hash, '#login');
  assert.strictEqual(getEl('appShell').hidden, true);
  assert.strictEqual(getEl('appShell').getAttribute('inert'), '');
  assert.strictEqual(run('maplibreMap'), null);
});
check('Guest direct links and shortcuts cannot expose dashboards', () => {
  ['ops', 'donor', 'admin'].forEach(portal => {
    W.switchPortal(portal); assert.strictEqual(W.appState.currentPortal, 'login');
    assert.strictEqual(getEl('appShell').hidden, true);
  });
});
check('Register page has a separate back-to-login path', () => {
  run("showEntryView('register')"); assert.strictEqual(getEl('entryRegisterForm').hidden, false);
  assert.strictEqual(W.location.hash, '#register');
  run("showEntryView('login')"); assert.strictEqual(getEl('entryRegisterForm').hidden, true);
});
check('Registration rejects password mismatch without creating an account', () => {
  registerFields(); value('entryConfirmPassword', 'mismatch');
  const before = W.appState.registeredUsers.length;
  assert.strictEqual(run('submitEntryRegister()'), false);
  assert.strictEqual(W.appState.registeredUsers.length, before);
});
check('Registration returns to login and does not open a session', () => {
  registerFields(); assert.strictEqual(run('submitEntryRegister()'), true);
  assert.strictEqual(W.appState.citizenLoggedIn, false);
  assert.strictEqual(W.appState.adminLoggedIn, false);
  assert.strictEqual(W.location.hash, '#login');
  assert.strictEqual(getEl('entryIdentifier').value, 'flow@example.com');
  assert.strictEqual(getEl('entryNewPassword').value, '');
  assert.ok(getEl('entryFeedback').textContent.includes('Account created'));
});
check('Duplicate account registration is rejected', () => {
  registerFields(); assert.strictEqual(run('submitEntryRegister()'), false);
  assert.ok(getEl('entryFeedback').textContent.includes('already exists'));
});
check('Incorrect citizen password keeps login visible', () => {
  value('entryIdentifier', 'flow@example.com'); value('entryPassword', 'wrong');
  assert.strictEqual(run('submitEntryLogin()'), false);
  assert.strictEqual(getEl('appShell').hidden, true);
});
check('Citizen sign-in opens their dashboard and hides Admin Panel', () => {
  value('entryPassword', 'test-flow-pass'); assert.strictEqual(run('submitEntryLogin()'), true);
  assert.strictEqual(W.appState.currentPortal, 'donor');
  assert.strictEqual(W.appState.currentCitizenDonor.name, 'Flow Test Citizen');
  assert.strictEqual(getEl('appShell').hidden, false);
  assert.strictEqual(getEl('entryView').hidden, true);
  assert.strictEqual(getEl('btn-portal-admin').hidden, true);
  assert.strictEqual(getEl('appShell').getAttribute('inert'), undefined);
});
check('Citizen cannot navigate into Admin Panel via a pasted hash', () => {
  W.location.hash = '#portal=admin'; run('handleEntryNavigation()');
  assert.strictEqual(W.appState.currentPortal, 'donor');
  assert.strictEqual(W.location.hash, '#portal=donor');
});
check('Citizen cannot enter Operations; all operational header controls are hidden', () => {
  W.switchPortal('ops'); assert.strictEqual(W.appState.currentPortal, 'donor');
  assert.strictEqual(run('maplibreMap'), null);
  ['btn-portal-ops', 'triggerSosBtn', 'opsSearch', 'opsScopeBar'].forEach(id => assert.strictEqual(getEl(id).hidden, true));
  W.location.hash = '#portal=ops'; run('handleEntryNavigation()');
  assert.strictEqual(W.appState.currentPortal, 'donor'); assert.strictEqual(W.location.hash, '#portal=donor');
});
check('Citizen cannot dispatch, broadcast, edit inventory, verify, or erase others', () => {
  const before = JSON.stringify({ inventory: W.appState.inventory, users: W.appState.registeredUsers, dispatches: Array.from(W.appState.dispatchedFacilityIds) });
  const user = W.appState.registeredUsers[0];
  ['dispatchRequest("aiims-delhi", "O-")', 'simulateEmergency()', 'adminBroadcastSos()', 'adjustStock(0, 10)', 'restockAll()', `toggleUserVerify('${user.id}')`, `deleteUserData('${user.id}')`].forEach(code => assert.strictEqual(run(code), false));
  assert.strictEqual(JSON.stringify({ inventory: W.appState.inventory, users: W.appState.registeredUsers, dispatches: Array.from(W.appState.dispatchedFacilityIds) }), before);
});
check('Citizen recommendations select a facility without dispatching or crediting a donation', () => {
  W.appState.currentCitizenDonor.blood = 'O-'; W.updateSmartRecommendation();
  const before = W.appState.currentCitizenDonor.donations;
  const dispatched = W.appState.dispatchedFacilityIds.size;
  W.acceptSmartRecommendation();
  assert.strictEqual(W.appState.dispatchedFacilityIds.size, dispatched);
  assert.strictEqual(W.appState.currentCitizenDonor.donations, before);
});
check('The public demo helper cannot fill owner credentials', () => {
  value('entryIdentifier', ''); value('entryPassword', '');
  run("fillEntryDemo('admin')");
  assert.strictEqual(getEl('entryIdentifier').value, ''); assert.strictEqual(getEl('entryPassword').value, '');
});
check('Citizen logout ends the session and Back cannot expose a dashboard', () => {
  W.citizenLogout(); assert.strictEqual(W.appState.currentCitizenDonor, null);
  W.location.hash = '#portal=donor'; run('handleEntryNavigation()');
  assert.strictEqual(W.location.hash, '#login'); assert.strictEqual(getEl('appShell').hidden, true);
});
check('Accounts survive a reload in this tab; authenticated sessions do not', () => {
  app = makeApp(app.storage); ({ W, run, getEl } = app); run('initializeEntryFlow()');
  assert.strictEqual(W.appState.citizenLoggedIn, false);
  value('entryIdentifier', '+91 98765 01234'); value('entryPassword', 'test-flow-pass');
  assert.strictEqual(run('submitEntryLogin()'), true);
  assert.strictEqual(W.appState.currentCitizenDonor.name, 'Flow Test Citizen');
  run('logoutEntry()');
});
check('Invalid owner password is rejected', () => {
  value('entryIdentifier', 'Dhritishman123'); value('entryPassword', 'incorrect');
  assert.strictEqual(run('submitEntryLogin()'), false); assert.strictEqual(W.appState.adminLoggedIn, false);
});
check('Owner sign-in opens Admin Panel with an exclusive admin session', () => {
  value('entryIdentifier', 'Dhritishman123'); value('entryPassword', '123456789'); assert.strictEqual(run('submitEntryLogin()'), true);
  assert.strictEqual(W.appState.adminLoggedIn, true); assert.strictEqual(W.appState.citizenLoggedIn, false);
  assert.strictEqual(W.appState.currentPortal, 'admin'); assert.strictEqual(getEl('btn-portal-donor').hidden, true);
});
check('Owner retains Operations and inventory actions', () => {
  W.switchPortal('ops'); assert.strictEqual(W.appState.currentPortal, 'ops'); assert.ok(run('maplibreMap'));
  assert.strictEqual(getEl('btn-portal-ops').hidden, false); assert.strictEqual(getEl('triggerSosBtn').hidden, false);
  const before = W.appState.inventory[0].count; W.adjustStock(0, 1); assert.strictEqual(W.appState.inventory[0].count, before + 1);
});
check('Owner logout returns to the shared login page', () => {
  W.adminLogout(); assert.strictEqual(W.appState.currentPortal, 'login');
  assert.strictEqual(getEl('appShell').hidden, true); assert.strictEqual(W.appState.adminLoggedIn, false);
});
check('Citizen demo follows normal sign-in and opens the right record', () => {
  run("fillEntryDemo('citizen')"); assert.strictEqual(W.appState.citizenLoggedIn, false);
  assert.strictEqual(run('submitEntryLogin()'), true);
  assert.strictEqual(W.appState.currentCitizenDonor.name, 'Dhiman');
  run('logoutEntry()');
});
check('Unavailable browser storage allows registration with an honest notice', () => {
  W.sessionStorage.setItem = () => { throw new Error('Storage unavailable'); };
  registerFields(); value('entryEmail', 'offline@example.com'); value('entryPhone', '9876509876');
  assert.strictEqual(run('submitEntryRegister()'), true);
  assert.ok(getEl('entryFeedback').textContent.includes('storage is unavailable'));
});
check('Corrupt stored account data does not crash initialization', () => {
  const broken = makeApp(new Map([['vitallink-flow-accounts-v1', '{broken']]));
  broken.run('initializeEntryFlow()');
  assert.strictEqual(broken.W.appState.currentPortal, 'login');
});
check('Retired demo migrates on reload without removing registered citizens', () => {
  const legacy = makeApp();
  legacy.run("appState.registeredUsers.find(u => u.id === 'usr-6').name = 'Ananya Sen'; storeCitizenCredentials('usr-6', ['ananya.sen@vitallink.org'], DEMO_CITIZEN_PASSWORD)");
  legacy.run("const extra = addCitizenRecord({ name: 'Keep This Citizen', blood: 'O+', sector: 'Delhi', scopeId: 'delhi' }); storeCitizenCredentials(extra.id, ['keep@example.com'], 'sample123')");
  const migrated = makeApp(legacy.storage);
  migrated.run('initializeEntryFlow()');
  assert.strictEqual(migrated.run("authenticateCitizen('ananya.sen@vitallink.org', DEMO_CITIZEN_PASSWORD)"), null);
  assert.strictEqual(migrated.run("authenticateCitizen(DEMO_CITIZEN_EMAIL, DEMO_CITIZEN_PASSWORD).name"), 'Dhiman');
  assert.strictEqual(migrated.run("authenticateCitizen('Dhiman', '123456789').name"), 'Dhiman');
  assert.strictEqual(migrated.run("authenticateCitizen('keep@example.com', 'sample123').name"), 'Keep This Citizen');
  const again = makeApp(migrated.storage); again.run('initializeEntryFlow()');
  assert.strictEqual(again.run("authenticateCitizen(DEMO_CITIZEN_EMAIL, DEMO_CITIZEN_PASSWORD).name"), 'Dhiman');
});
console.log(`ALL ${passed} LOGIN-FIRST CHECKS PASSED`);
process.exit(0);
