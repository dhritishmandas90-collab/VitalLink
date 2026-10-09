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
['js/state.js', 'js/map.js', 'js/admin.js', 'js/donor.js', 'js/app.js', 'js/entry.js', 'js/hospital.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(rootDir, f), 'utf8'), sandbox, { filename: f })
);
const W = sandbox.window;
const run = code => vm.runInContext(code, sandbox);


return { W, run, getEl, storage };
}
function hospitalForm(a, overrides={}) {
 const fields={entryAccountRole:'hospital',entryName:'QA Hospital',entryEmail:'qa@example.com',entryPhone:'+91 98765 12345',entryNewPassword:'sample123',entryConfirmPassword:'sample123',...overrides};
 Object.entries(fields).forEach(([k,v])=>a.getEl(k).value=v);
 a.getEl('entryBlood').parentElement={hidden:false};
}
function citizen(a){a.run("startCitizenSession(authenticateCitizen('Dhiman','123456789'))");}
function book(a){a.getEl('schedFacility').value='aiims-delhi';const date=new Date();date.setDate(date.getDate()+2);a.getEl('schedDate').value=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');return a.run('bookAppointment()');}
check('Hospital registration supports normalized phone, email and name login; no raw password persists',()=>{
 const a=makeApp();hospitalForm(a);assert.strictEqual(a.run('registerHospital()'),true);
 for(const id of ['9876512345',' QA@EXAMPLE.COM ','qa hospital']) {assert.strictEqual(a.run(`loginHospital(${JSON.stringify(id)},'sample123')`),true);a.run('logoutHospital()');}
 assert.strictEqual(a.run("loginHospital('QA Hospital','wrong')"),false);
 const raw=a.storage.get('vitallink-hospitals-v1');assert.ok(!raw.includes('sample123'));assert.ok(!raw.includes('"password"'));
 const reloaded=makeApp(a.storage);assert.strictEqual(reloaded.run("loginHospital('9876512345','sample123')"),true);
});
check('Hospital email case variants and normalized duplicate phone/name are rejected',()=>{
 const a=makeApp();hospitalForm(a);a.run('registerHospital()');
 for(const fields of [{entryEmail:'QA@EXAMPLE.COM',entryPhone:'9876512346',entryName:'Another'}, {entryEmail:'other@example.com',entryPhone:'9876512345',entryName:'Another'}, {entryEmail:'other@example.com',entryPhone:'9876512346',entryName:'qa hospital'}]) {
 hospitalForm(a,fields);assert.strictEqual(a.run('registerHospital()'),false);
 }
});
check('Citizen, administrator and hospital identifiers cannot collide at registration',()=>{
 const a=makeApp();
 for(const fields of [{entryEmail:'dhiman@vitallink.org'},{entryName:'Dhiman'},{entryName:'Dhritishman123'}]){hospitalForm(a,fields);assert.strictEqual(a.run('registerHospital()'),false);}
 hospitalForm(a);assert.strictEqual(a.run('registerHospital()'),true);
 assert.ok(a.run("validateRegistration({name:'Test',blood:'B+',identifiers:['QA@EXAMPLE.COM'],password:'sample123'})"));
 assert.ok(a.run("validateRegistration({name:'Test',blood:'B+',identifiers:['9876512345'],password:'sample123'})"));
});
check('Legacy plaintext passwords migrate without losing requests',()=>{
 const storage=new Map([['vitallink-hospitals-v1',JSON.stringify({accounts:[{name:'Legacy',email:'Legacy@example.com',password:'legacy123'}],requests:[{id:1,hospital:'Legacy',blood:'B+',units:2,note:'test',status:'Open'}]})]]);
 const a=makeApp(storage);assert.strictEqual(a.run("loginHospital('legacy@example.com','legacy123')"),true);
 assert.strictEqual(a.run('hospitalRequests.length'),1);assert.ok(!storage.get('vitallink-hospitals-v1').includes('legacy123'));
});
check('Legacy duplicate and cross-role identifiers fail closed instead of opening wrong account',()=>{
 const storage=new Map([['vitallink-hospitals-v1',JSON.stringify({accounts:[{name:'One',email:'duplicate@example.com',password:'sample123'},{name:'Two',email:'DUPLICATE@example.com',password:'sample123'},{name:'Collision',email:'dhiman@vitallink.org',password:'123456789'}],requests:[]})]]);
 const a=makeApp(storage);
 for(const id of ['duplicate@example.com','dhiman@vitallink.org']) {a.getEl('entryIdentifier').value=id;a.getEl('entryPassword').value=id.startsWith('dhiman')?'123456789':'sample123';assert.strictEqual(a.run('submitEntryLogin()'),false);assert.strictEqual(a.run('hospitalSession'),null);assert.ok(a.getEl('entryFeedback').textContent.includes('multiple accounts'));}
 assert.strictEqual(a.run("loginHospital('One','sample123')"),true);
});
check('Booking preserves completed-donation statistics and survives logout and reload',()=>{
 const a=makeApp();citizen(a);const before=JSON.stringify([a.W.appState.currentCitizenDonor.donations,a.W.appState.currentCitizenDonor.livesSaved,a.W.appState.currentCitizenDonor.xp]);
 assert.strictEqual(book(a),true);assert.strictEqual(JSON.stringify([a.W.appState.currentCitizenDonor.donations,a.W.appState.currentCitizenDonor.livesSaved,a.W.appState.currentCitizenDonor.xp]),before);
 a.run('logoutEntry()');citizen(a);assert.strictEqual(a.W.appState.currentCitizenDonor.appointments.length,1);assert.strictEqual(book(a),false);
 const b=makeApp(a.storage);b.run('initializeEntryFlow()');citizen(b);assert.strictEqual(b.W.appState.currentCitizenDonor.appointments.length,1);assert.strictEqual(book(b),false);
});
check('Impossible appointment dates are rejected',()=>{
 const a=makeApp();citizen(a);a.getEl('schedFacility').value='aiims-delhi';a.getEl('schedDate').value='2099-02-31';assert.strictEqual(a.run('bookAppointment()'),false);
});
check('Storage failure gives hospital registration and request warning',()=>{
 const a=makeApp();a.W.sessionStorage.setItem=()=>{throw new Error('blocked')};hospitalForm(a);assert.strictEqual(a.run('registerHospital()'),true);assert.ok(a.getEl('entryFeedback').textContent.includes('storage is unavailable'));
 a.run("loginHospital('QA Hospital','sample123')");a.getEl('hospitalBlood').value='B+';a.getEl('hospitalUnits').value='2';a.getEl('hospitalNote').value='Sample';a.run('createHospitalRequest()');assert.ok(a.getEl('hospitalWorkspace').innerHTML.includes('Changes are temporary'));
});
check('Request lifecycle, validation, ownership and escaping remain intact',()=>{
 const a=makeApp();a.run("loginHospital('City Hospital','hospital123')");a.getEl('hospitalBlood').value='B+';a.getEl('hospitalUnits').value='2';a.getEl('hospitalNote').value='<script>example</script>';a.run('createHospitalRequest()');a.run('createHospitalRequest()');
 assert.strictEqual(a.run('hospitalRequests.length'),2);assert.notStrictEqual(a.run('hospitalRequests[0].id'),a.run('hospitalRequests[1].id'));assert.ok(a.getEl('hospitalRows').innerHTML.includes('&lt;script&gt;'));
 a.run('toggleHospitalRequest(hospitalRequests[0].id)');assert.strictEqual(a.run('hospitalRequests[0].status'),'Closed');a.run('toggleHospitalRequest(hospitalRequests[0].id)');assert.strictEqual(a.run('hospitalRequests[0].status'),'Open');
 for(const units of ['0','-1','1.5','1001']){a.getEl('hospitalUnits').value=units;a.run('createHospitalRequest()');}assert.strictEqual(a.run('hospitalRequests.length'),2);
 a.run("hospitalSession={name:'Other'};toggleHospitalRequest(hospitalRequests[0].id)");assert.strictEqual(a.run('hospitalRequests[0].status'),'Open');
});
check('Malformed hospital records do not break login',()=>{
 const a=makeApp(new Map([['vitallink-hospitals-v1',JSON.stringify({accounts:[null,{}, {name:1,password:123}],requests:[null,{}]})]]));assert.strictEqual(a.run("loginHospital('nobody','sample123')"),false);assert.strictEqual(a.run('hospitalRequests.length'),0);
});
check('Hospital requests survive reload with status and ownership intact',()=>{
 const a=makeApp();a.run("loginHospital('City Hospital','hospital123')");a.getEl('hospitalBlood').value='O-';a.getEl('hospitalUnits').value='3';a.getEl('hospitalNote').value='Reload test';a.run('createHospitalRequest();toggleHospitalRequest(hospitalRequests[0].id)');
 const b=makeApp(a.storage);assert.strictEqual(b.run('hospitalSession'),null);b.run("loginHospital('City Hospital','hospital123')");assert.strictEqual(b.run('hospitalRequests[0].status'),'Closed');assert.strictEqual(b.run('hospitalRequests[0].units'),3);assert.ok(b.getEl('hospitalRows').innerHTML.includes('Reload test'));
});
check('Appointment storage failure leaves a visible warning',()=>{
 const a=makeApp();citizen(a);a.W.sessionStorage.setItem=()=>{throw new Error('blocked')};a.run("showToast = message => { window.qaNotice = message; }");assert.strictEqual(book(a),true);assert.ok(a.W.qaNotice.includes('lost on reload'));
});
console.log(`ALL ${passed} QA FIX CHECKS PASSED`);
process.exit(0);
