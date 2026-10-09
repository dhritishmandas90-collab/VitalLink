/* Login-first prototype shell. This is UI routing, not server authorization. */
const ENTRY_STORAGE_KEY = 'vitallink-flow-accounts-v1';
let entryStorageAvailable = true;
let entryRestoring = false;

function entryEl(id) { return document.getElementById(id); }
function setEntryFeedback(message = '', error = false) {
  const el = entryEl('entryFeedback');
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
  el.classList.toggle('is-error', error);
  el.setAttribute('role', error ? 'alert' : 'status');
}
function entryHasSession() { return appState.adminLoggedIn || (appState.citizenLoggedIn && !!appState.currentCitizenDonor); }
function entrySetHash(hash, replace = false) {
  if (window.location.hash === hash) return;
  try { window.history[replace ? 'replaceState' : 'pushState']({ entry: hash.slice(1) }, '', hash); } catch (_) {}
}
function showEntryView(view = 'login', message = '', replace = false) {
  if (entryHasSession()) { switchPortal(appState.adminLoggedIn ? 'admin' : 'donor', false); return; }
  const register = view === 'register';
  entryEl('appShell').hidden = true;
  entryEl('appShell').setAttribute('inert', '');
  entryEl('entryView').hidden = false;
  entryEl('entryLoginForm').hidden = register;
  entryEl('entryRegisterForm').hidden = !register;
  entryEl('entryDemoPanel').hidden = register;
  entryEl('entryTitle').textContent = register ? 'Create your account.' : 'Sign in to VitalLink.';
  entryEl('entrySubtitle').textContent = register ? 'Create your citizen account. Then sign in to get started.' : 'Access your citizen dashboard or administrator console.';
  entryEl('entryStepNumber').textContent = register ? '02' : '01';
  entryEl('entryStepLabel').textContent = register ? 'JOIN THE NETWORK' : 'YOUR ACCOUNT';
  appState.currentPortal = 'login';
  entryEl('entryPassword').value = '';
  entryEl('entryPassword').type = 'password';
  entryEl('entryPasswordToggle').textContent = 'Show';
  entryEl('entryPasswordToggle').setAttribute('aria-label', 'Show password');
  entryEl('entryPasswordToggle').setAttribute('aria-pressed', 'false');
  entryEl('entryNewPassword').value = '';
  entryEl('entryConfirmPassword').value = '';
  document.querySelectorAll('.modal-backdrop.open').forEach(el => el.classList.remove('open'));
  setEntryFeedback(message);
  entrySetHash(register ? '#register' : '#login', replace);
  entryEl('entryView').scrollTop = 0;
  entryEl('entryTitle').focus({ preventScroll: true });
}
function guardEntryRoute(portalId) {
  if (!entryHasSession()) { showEntryView('login', '', true); return false; }
  if (portalId !== 'donor' && !appState.adminLoggedIn) {
    showToast('This account opens the citizen dashboard. Operations and administrative actions require an admin account.', 'critical');
    entrySetHash('#portal=donor', true);
    return false;
  }
  if (portalId === 'donor' && appState.adminLoggedIn) {
    entrySetHash('#portal=admin', true);
    return false;
  }
  entryEl('entryView').hidden = true;
  entryEl('appShell').hidden = false;
  entryEl('appShell').removeAttribute('inert');
  entryEl('btn-portal-admin').hidden = !appState.adminLoggedIn;
  ['btn-portal-ops', 'triggerSosBtn', 'opsSearch', 'opsScopeBar'].forEach(id => { entryEl(id).hidden = !appState.adminLoggedIn; });
  entryEl('btn-portal-donor').hidden = !appState.citizenLoggedIn;
  entryEl('adminSessionPill').style.display = appState.adminLoggedIn ? 'flex' : 'none';
  return true;
}
function enterCitizenDashboard() {
  const region = appState.currentCitizenDonor && appState.currentCitizenDonor.scopeId;
  if (region && GEOGRAPHIC_SCOPES[region]) setGeographicScope(region);
  switchPortal('donor');
}
function submitEntryLogin() {
  const identifier = entryEl('entryIdentifier').value.trim();
  const password = entryEl('entryPassword').value;
  if (!identifier || !password) { setEntryFeedback('Enter your account details and password.', true); return false; }
  // Fail closed for identifiers duplicated by older prototype versions.
  if (typeof hospitalIdentifierInUse === 'function' && hospitalIdentifierInUse(identifier)) {
    const matches = hospitalAccounts.filter(a => hospitalIdentifiers(a).includes(normalizeIdentifier(identifier)));
    if (matches.length > 1 || citizenIdentifierInUse(identifier) || normalizeIdentifier(identifier) === normalizeIdentifier('Dhritishman123')) {
      entryEl('entryPassword').value = '';
      setEntryFeedback('This sign-in identifier matches multiple accounts. Use a unique account name, mobile number or email.', true);
      return false;
    }
  }
  if (typeof loginHospital === 'function' && loginHospital(identifier, password)) return true;
  if (identifier === 'Dhritishman123') {
    entryEl('adminUserField').value = identifier;
    entryEl('adminPassField').value = password;
    submitAdminLogin();
    entryEl('entryPassword').value = '';
    if (!appState.adminLoggedIn) { setEntryFeedback('The account details or password are incorrect. Please try again.', true); return false; }
    setEntryFeedback();
    return true;
  }
  const record = authenticateCitizen(identifier, password);
  entryEl('entryPassword').value = '';
  if (!record) { setEntryFeedback('The account details or password are incorrect. New here? Create an account first.', true); return false; }
  setEntryFeedback();
  startCitizenSession(record);
  return true;
}
function submitEntryRegister() {
  if (typeof registerHospital === 'function' && entryEl('entryAccountRole') && entryEl('entryAccountRole').value === 'hospital') return registerHospital();
  const name = entryEl('entryName').value.trim();
  const blood = entryEl('entryBlood').value;
  const email = entryEl('entryEmail').value.trim();
  const phone = entryEl('entryPhone').value.trim();
  const scopeId = entryEl('entryRegion').value;
  const password = entryEl('entryNewPassword').value;
  if (!isPlausibleEmail(email)) { setEntryFeedback('Enter a valid email address.', true); return false; }
  if (!isPlausiblePhone(phone)) { setEntryFeedback('Enter a valid mobile number.', true); return false; }
  const error = validateRegistration({ name, blood, identifiers: [email, phone], password });
  if (error) { setEntryFeedback(error, true); return false; }
  if (password !== entryEl('entryConfirmPassword').value) { setEntryFeedback('The passwords do not match.', true); return false; }
  if (!GEOGRAPHIC_SCOPES[scopeId]) { setEntryFeedback('Choose a region.', true); return false; }
  const record = addCitizenRecord({ name, blood, sector: GEOGRAPHIC_SCOPES[scopeId].label || GEOGRAPHIC_SCOPES[scopeId].name || scopeId, scopeId });
  storeCitizenCredentials(record.id, [email, phone], password);
  entryEl('entryRegisterForm').reset();
  entryEl('entryIdentifier').value = email;
  showEntryView('login', entryStorageAvailable ? 'Account created. Sign in below to open your citizen dashboard.' : 'Account created for this page session. Browser storage is unavailable; sign in now before reloading.');
  entryEl('entryPassword').focus();
  return true;
}
function logoutEntry() {
  appState.adminLoggedIn = false;
  appState.citizenLoggedIn = false;
  appState.currentCitizenDonor = null;
  entryEl('adminSessionPill').style.display = 'none';
  entryEl('entryIdentifier').value = '';
  if (typeof deselectActiveFacility === 'function') deselectActiveFacility();
  renderCitizenPortalState();
  showEntryView('login', 'You have signed out.', true);
}
function fillEntryDemo(role) {
  if (role === 'hospital') { entryEl('entryIdentifier').value = 'City Hospital'; entryEl('entryPassword').value = 'hospital123'; setEntryFeedback('Hospital demo is ready. Select Sign in to continue.'); return; }
  if (role !== 'citizen') return;
  entryEl('entryIdentifier').value = DEMO_CITIZEN_USERNAME;
  entryEl('entryPassword').value = DEMO_CITIZEN_PASSWORD;
  setEntryFeedback(`${role === 'admin' ? 'Admin' : 'Citizen'} demo is ready. Select Sign in to continue.`);
}
function toggleEntryPassword() {
  const field = entryEl('entryPassword');
  const show = field.type === 'password';
  field.type = show ? 'text' : 'password';
  entryEl('entryPasswordToggle').textContent = show ? 'Hide' : 'Show';
  entryEl('entryPasswordToggle').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  entryEl('entryPasswordToggle').setAttribute('aria-pressed', String(show));
}
function persistEntryAccounts() {
  if (entryRestoring) return;
  try {
    const credentials = Array.from(citizenCredentialStore, ([id, value]) => [id, { identifierHashes: Array.from(value.identifierHashes), passHash: value.passHash }]);
    window.sessionStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify({ version: 1, users: appState.registeredUsers, credentials, totalCitizenCount: appState.totalCitizenCount }));
    entryStorageAvailable = true;
  } catch (_) { entryStorageAvailable = false; }
}
function restoreEntryAccounts() {
  entryRestoring = true;
  try {
    const raw = window.sessionStorage.getItem(ENTRY_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !Array.isArray(saved.users) || !Array.isArray(saved.credentials)) return;
    const validUsers = saved.users.every(u => u && typeof u.id === 'string' && typeof u.name === 'string' && typeof u.sector === 'string' && BLOOD_GROUPS.includes(u.blood));
    const validCredentials = saved.credentials.every(c => Array.isArray(c) && typeof c[0] === 'string' && c[1] && Array.isArray(c[1].identifierHashes) && c[1].identifierHashes.every(h => typeof h === 'string') && typeof c[1].passHash === 'string');
    if (!validUsers || !validCredentials) return;
    saved.users.forEach(u => {
      u.appointments = Array.isArray(u.appointments) ? u.appointments.filter(a => a && typeof a.facilityId === 'string' && typeof a.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.date)).map(a => ({ facilityId: a.facilityId, date: a.date })) : [];
    });
    appState.registeredUsers = saved.users;
    appState.totalCitizenCount = Number.isFinite(saved.totalCitizenCount) ? saved.totalCitizenCount : saved.users.length;
    citizenCredentialStore.clear();
    saved.credentials.forEach(([id, c]) => citizenCredentialStore.set(id, { identifierHashes: new Set(c.identifierHashes), passHash: c.passHash }));
  } catch (_) { entryStorageAvailable = false; }
  finally { entryRestoring = false; }
}
function handleEntryNavigation() {
  if (typeof hospitalSession !== 'undefined' && hospitalSession) { showHospitalDashboard(); return; }
  if (!entryHasSession()) { showEntryView(window.location.hash === '#register' ? 'register' : 'login', '', true); return; }
  const match = window.location.hash.match(/^#portal=(ops|admin|donor)$/);
  const portal = match ? match[1] : (appState.adminLoggedIn ? 'admin' : 'donor');
  if ((portal !== 'donor' && !appState.adminLoggedIn) || (portal === 'donor' && !appState.citizenLoggedIn)) {
    switchPortal(appState.adminLoggedIn ? 'admin' : 'donor', false);
    entrySetHash(appState.adminLoggedIn ? '#portal=admin' : '#portal=donor', true);
  } else { switchPortal(portal, false); entrySetHash(`#portal=${portal}`, true); }
}
function initializeEntryFlow() {
  restoreEntryAccounts();
  // Migrate only the retired seeded demo; preserve all user-created accounts.
  const retiredDemo = appState.registeredUsers.find(user => user.id === 'usr-6' && ['Ananya Sen', 'Rohan Mehta', 'Dhiman'].includes(user.name));
  if (retiredDemo) {
    retiredDemo.name = 'Dhiman';
    retiredDemo.blood = 'B+';
    storeCitizenCredentials(retiredDemo.id, [DEMO_CITIZEN_EMAIL, DEMO_CITIZEN_USERNAME, retiredDemo.donorId], DEMO_CITIZEN_PASSWORD);
  }
  const select = entryEl('entryRegion');
  select.innerHTML = '';
  Object.entries(GEOGRAPHIC_SCOPES).filter(([id]) => id !== 'world').forEach(([id, scope]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = scope.label || scope.name || id;
    select.appendChild(option);
  });
  select.value = 'guwahati';
  appState.adminLoggedIn = false;
  appState.citizenLoggedIn = false;
  appState.currentCitizenDonor = null;
  showEntryView(window.location.hash === '#register' ? 'register' : 'login', '', true);
}
window.addEventListener('hashchange', handleEntryNavigation);
