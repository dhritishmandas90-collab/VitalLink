/* ==========================================================
   3. CITIZEN & DONOR HUB (GATE, RECOMMENDATIONS & SEARCH)
   ========================================================== */

/* 3A. SESSION & CREDENTIAL MODEL
   Credentials live in a module-private map (never in appState, never rendered in the admin table).
   PROTOTYPE ONLY: this is client-side; entry.js retains accounts in sessionStorage for this tab. Real authentication must be server-side
   with a proper password hash (bcrypt/argon2); FNV-1a below is only a non-reversible placeholder. */

const citizenCredentialStore = new Map(); // userId -> { identifierHashes: Set<string>, passHash: string }
const CREDENTIAL_SALT = 'vitallink-proto-v1';
const MIN_PASSWORD_LENGTH = 6;

function fnv1aHash(text) {
  let h = 0x811c9dc5;
  const str = CREDENTIAL_SALT + '|' + String(text);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// Phones compare on their last 10 digits so "+91 98765 43210" and "9876543210" match
function normalizeIdentifier(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (!value) return '';
  if (value.includes('@')) return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 7) return digits.slice(-10);
  return value;
}

function isPlausiblePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isPlausibleEmail(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || '').trim());
}

function storeCitizenCredentials(userId, identifiers, password) {
  const identifierHashes = new Set(
    identifiers.map(normalizeIdentifier).filter(Boolean).map(fnv1aHash)
  );
  citizenCredentialStore.set(userId, { identifierHashes, passHash: fnv1aHash(password) });
  if (typeof persistEntryAccounts === 'function') persistEntryAccounts();
}

function forgetCitizenCredentials(userId) {
  citizenCredentialStore.delete(userId);
  if (typeof persistEntryAccounts === 'function') persistEntryAccounts();
}

function citizenIdentifierInUse(identifier) {
  const hash = fnv1aHash(normalizeIdentifier(identifier));
  for (const cred of citizenCredentialStore.values()) {
    if (cred.identifierHashes.has(hash)) return true;
  }
  return appState.registeredUsers.some(u => normalizeIdentifier(u.donorId) === normalizeIdentifier(identifier));
}

function identifierInUse(identifier) {
  return normalizeIdentifier(identifier) === normalizeIdentifier('Dhritishman123') || citizenIdentifierInUse(identifier) ||
    (typeof hospitalIdentifierInUse === 'function' && hospitalIdentifierInUse(identifier));
}

// Returns the registry record only when identifier AND password match. Never falls back to another user.
function authenticateCitizen(identifier, password) {
  const norm = normalizeIdentifier(identifier);
  if (!norm || !password) return null;
  const idHash = fnv1aHash(norm);
  const passHash = fnv1aHash(password);

  for (const [userId, cred] of citizenCredentialStore.entries()) {
    const donorIdMatch = (() => {
      const rec = appState.registeredUsers.find(u => u.id === userId);
      return rec && rec.donorId && rec.donorId.toLowerCase() === String(identifier).trim().toLowerCase();
    })();
    if ((cred.identifierHashes.has(idHash) || donorIdMatch) && cred.passHash === passHash) {
      return appState.registeredUsers.find(u => u.id === userId) || null;
    }
  }
  return null;
}

let userIdSequence = 0;
function generateUserId() {
  userIdSequence += 1;
  return `usr-${Date.now().toString(36)}-${userIdSequence}`;
}

function generateDonorToken(scopeId) {
  const prefix = scopeId && GEOGRAPHIC_SCOPES[scopeId] ? scopeId.slice(0, 3).toUpperCase() : 'NET';
  let token;
  do {
    token = `#ZK-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
  } while (appState.registeredUsers.some(u => u.donorId === token));
  return token;
}

function addCitizenRecord({ name, blood, sector, scopeId, unitsDonated = 0, date = 'Today' }) {
  const record = {
    id: generateUserId(),
    name,
    blood,
    sector,
    scopeId: scopeId || null,
    donorId: generateDonorToken(scopeId),
    status: 'Verified',
    date,
    unitsDonated
  };
  appState.registeredUsers.unshift(record);
  appState.totalCitizenCount += 1;
  if (typeof renderAdminKPIs === 'function') renderAdminKPIs();
  if (typeof renderDonorsAuditTable === 'function') {
    renderDonorsAuditTable(document.getElementById('adminUserSearchInput')?.value || '');
  }
  return record;
}

function startCitizenSession(record, stats = {}) {
  appState.currentCitizenDonor = {
    userId: record.id,
    name: record.name,
    blood: record.blood,
    sector: record.sector,
    scopeId: record.scopeId || stats.scopeId || null,
    id: record.donorId,
    donations: stats.donations ?? record.unitsDonated ?? 0,
    livesSaved: stats.livesSaved ?? (record.unitsDonated || 0) * 3,
    xp: stats.xp ?? 1000,
    appointments: Array.isArray(record.appointments) ? record.appointments.map(a => ({ ...a })) : []
  };
  appState.adminLoggedIn = false;
  appState.citizenLoggedIn = true;
  renderCitizenPortalState();
  if (typeof enterCitizenDashboard === 'function') enterCitizenDashboard();
}

function validateRegistration({ name, blood, identifiers, password }) {
  if (!name) return 'Please enter your full name.';
  if (name.length > 80) return 'Name must be 80 characters or fewer.';
  if (!BLOOD_GROUPS.includes(blood)) return 'Please select a valid blood group.';
  if (!password || password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (identifiers.some(identifierInUse)) return 'An account with this mobile number or email already exists. Please sign in.';
  return null;
}

/* 3B. PORTAL GATE */
    function handleDonorPortalClick() {
      switchPortal('donor');
    }

    function renderCitizenPortalState() {
      const gateView = document.getElementById('donorGateView');
      const dashView = document.getElementById('donorDashboardView');
      if (!gateView || !dashView) return;

      if (appState.citizenLoggedIn && appState.currentCitizenDonor) {
        gateView.style.display = 'none';
        dashView.style.display = 'grid';
        updateCitizenDonorUI();
        updateSmartRecommendation();
        syncDonorBloodFilterButtons();
        renderHospitalStockSearch();
      } else {
        gateView.style.display = 'flex';
        dashView.style.display = 'none';
      }
    }

    function switchGateTab(tab) {
      const regBtn = document.getElementById('btnGateTabRegister');
      const logBtn = document.getElementById('btnGateTabLogin');
      const regForm = document.getElementById('gateRegisterForm');
      const logForm = document.getElementById('gateLoginForm');
      if (!regBtn || !logBtn || !regForm || !logForm) return;

      const isRegister = tab === 'register';
      regBtn.classList.toggle('active', isRegister);
      logBtn.classList.toggle('active', !isRegister);
      regForm.style.display = isRegister ? 'flex' : 'none';
      logForm.style.display = isRegister ? 'none' : 'flex';
      playTone(450, 'sine', 0.06);
    }

    function submitGateRegister() {
      const name = (document.getElementById('gateRegName')?.value || '').trim();
      const blood = document.getElementById('gateRegBlood')?.value || '';
      const sector = document.getElementById('gateRegSector')?.value || 'Guwahati';
      const phone = (document.getElementById('gateRegPhone')?.value || '').trim();
      const pass = document.getElementById('gateRegPass')?.value || '';

      if (!isPlausiblePhone(phone)) {
        showToast('Please enter a valid mobile number.', 'critical');
        return false;
      }
      const error = validateRegistration({ name, blood, identifiers: [phone], password: pass });
      if (error) {
        showToast(error, 'critical');
        return false;
      }

      const record = addCitizenRecord({ name, blood, sector, scopeId: 'guwahati' });
      storeCitizenCredentials(record.id, [phone], pass);
      const passField = document.getElementById('gateRegPass');
      if (passField) passField.value = '';

      startCitizenSession(record, { donations: 0, livesSaved: 0, xp: 1000 });
      playChime();
      showToast(`🎉 Welcome, ${name}! Encrypted profile created under Zero Data Leakage protection.`);
      return true;
    }

    function submitGateLogin() {
      const userIdent = (document.getElementById('gateLoginUser')?.value || '').trim();
      const passField = document.getElementById('gateLoginPass');
      const pass = passField ? passField.value : '';

      if (!userIdent || !pass) {
        showToast('Please enter your registered mobile/email and password.', 'critical');
        return false;
      }

      const record = authenticateCitizen(userIdent, pass);
      if (passField) passField.value = '';
      if (!record) {
        if (typeof playAlarm === 'function') playAlarm();
        showToast('❌ Invalid credentials. Check your mobile/email and password, or use a Quick Test Profile.', 'critical');
        return false;
      }

      startCitizenSession(record);
      playChime();
      showToast(`🔓 Welcome back, ${record.name} (${record.blood})! Donor Hub unlocked.`);
      return true;
    }

    // Demo presets: reuse an existing registry record by exact name so the session and the admin row agree
    function quickFillCitizen(name, blood, sector, scopeId) {
      if (!name || !BLOOD_GROUPS.includes(blood)) return;
      // Match on name AND blood group: the seed registry already holds an O- "Jiten Barman", and reusing him
      // for the B+ preset silently changed the demo profile's blood group
      let record = appState.registeredUsers.find(u =>
        u.name.toLowerCase() === String(name).toLowerCase() && u.blood === blood);
      const isUniversal = blood === 'O-';
      if (!record) {
        record = addCitizenRecord({
          name, blood, sector, scopeId: scopeId || appState.currentScopeId || 'india',
          unitsDonated: isUniversal ? 8 : 3, date: 'Active'
        });
      }
      startCitizenSession(record, {
        scopeId: scopeId || record.scopeId,
        donations: isUniversal ? 8 : 3,
        livesSaved: isUniversal ? 24 : 9,
        xp: isUniversal ? 32000 : 12000
      });
      playChime();
      showToast(`⚡ Profile loaded: ${record.name} (${record.blood}) • Zero-Leak Session active.`);
    }

    function citizenLogout() {
      if (typeof logoutEntry === 'function') { logoutEntry(); return; }
      appState.citizenLoggedIn = false;
      appState.currentCitizenDonor = null;
      renderCitizenPortalState();
      playTone(380, 'sine', 0.1);
      showToast('🔒 Citizen session logged out. Data encrypted and closed.');
    }

    function selfDeleteCitizenData() {
      const c = appState.currentCitizenDonor;
      if (!c) return;

      const confirmed = confirm(
        `⚠️ ZERO-LEAK PRIVILEGE: Right to Erasure / Delete My Data\n\n` +
        `Are you sure you want to permanently delete your citizen donor profile for "${c.name}"?\n\n` +
        `This will permanently purge your digital donor card, blood group records, and medical appointment tokens from the VitalLink database. This action is irreversible.`
      );
      if (!confirmed) return;

      // Erase by record id: two citizens can share a name
      const before = appState.registeredUsers.length;
      appState.registeredUsers = appState.registeredUsers.filter(u => u.id !== c.userId);
      if (appState.registeredUsers.length < before) {
        appState.totalCitizenCount = Math.max(0, appState.totalCitizenCount - 1);
      }
      forgetCitizenCredentials(c.userId);
      if (typeof renderAdminKPIs === 'function') renderAdminKPIs();
      renderDonorsAuditTable(document.getElementById('adminUserSearchInput')?.value || '');

      appState.currentCitizenDonor = null;
      appState.citizenLoggedIn = false;
      renderCitizenPortalState();
      if (typeof logoutEntry === 'function') logoutEntry();

      playAlarm();
      showToast(`🗑️ Your citizen profile has been permanently purged under Zero-Leak Right to Erasure.`, 'critical');
    }

    function updateCitizenDonorUI() {
      if (!appState.currentCitizenDonor) return;
      const c = appState.currentCitizenDonor;
      const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      };

      setText('authCitizenName', c.name);
      setText('authCitizenBlood', c.blood);
      setText('authCitizenToken', c.id);
      setText('donorCardName', c.name);
      setText('donorCardBlood', c.blood);
      setText('donorCardTier', `Verified Citizen • ${c.sector || 'Global Network'}`);
      setText('donorCardCouncil', c.scopeId && GEOGRAPHIC_SCOPES[c.scopeId]
        ? `Blood Transfusion Authority • ${GEOGRAPHIC_SCOPES[c.scopeId].name}`
        : 'Global Blood Transfusion Network');
      setText('donorCardBadgeId', `DONOR ID: ${c.id}`);
      setText('donorDonationsCount', c.donations);
      setText('donorLivesSaved', c.livesSaved);
      setText('donorXpScore', c.donations >= 5 ? 'Priority Universal Donor' : c.donations >= 2 ? 'Active Regular Donor' : 'Verified Registered Citizen');
    }

    function copyCitizenToken() {
      if (!appState.currentCitizenDonor) return;
      const token = appState.currentCitizenDonor.id;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(token).then(() => {
          showToast(`📋 Copied Token ID: ${token}`);
          playTone(720, 'sine', 0.08);
        }).catch(() => {
          showToast(`Token ID: ${token}`);
        });
      } else {
        showToast(`Token ID: ${token}`);
      }
    }

/* 3C. SMART RECOMMENDATION ENGINE (ABO/Rh COMPATIBLE) */
    const URGENCY_RANK = { critical: 0, urgent: 1, needed: 2, optimal: 3 };
    const acceptedMatchFacilityIds = new Set();
    const ACCEPT_BUTTON_HTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Accept Recommendation — Dispatch Courier`;

    // Single resolver used by both display and accept, so the button always acts on the facility shown
    function resolveSmartRecommendationTarget() {
      const c = appState.currentCitizenDonor;
      if (!c || !BLOOD_GROUPS.includes(c.blood)) return null;
      const candidates = getFacilitiesForScope(appState.currentScopeId, 'ALL', 'ALL')
        .filter(f => f.urgency !== 'optimal' && canDonateTo(c.blood, f.emergencyNeed))
        .sort((a, b) => {
          const byUrgency = (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9);
          if (byUrgency !== 0) return byUrgency;
          // Exact-group need first: it preserves universal O- stock for patients who have no alternative
          return (a.emergencyNeed === c.blood ? 0 : 1) - (b.emergencyNeed === c.blood ? 0 : 1);
        });
      return candidates[0] || null;
    }

    function setAcceptButtonState(state) {
      const btn = document.getElementById('btnAcceptSmartMatch');
      if (!btn) return;
      btn.style.background = '';
      if (state === 'accepted') {
        btn.textContent = '✓ Match Confirmed — Priority Courier En-Route';
        btn.style.background = '#10b981';
        btn.disabled = true;
      } else if (state === 'none') {
        btn.textContent = 'No compatible request in this region';
        btn.disabled = true;
      } else {
        btn.innerHTML = ACCEPT_BUTTON_HTML;
        btn.disabled = false;
      }
    }

    function updateSmartRecommendation() {
      const container = document.getElementById('smartRecommendationContent');
      if (!container) return;

      const c = appState.currentCitizenDonor;
      const target = resolveSmartRecommendationTarget();
      appState.smartRecommendationTargetId = target ? target.id : null;

      if (!appState.citizenLoggedIn || !c || !target) {
        const scope = GEOGRAPHIC_SCOPES[appState.currentScopeId];
        container.innerHTML = `
          <div style="font-size: 0.78rem; color: #cbd5e1; line-height: 1.4;">
            No open shortages in <strong>${escapeHTML(scope ? scope.name : 'this region')}</strong> that a
            <strong>${escapeHTML(c ? c.blood : '--')}</strong> donor can safely supply right now.
            Switch region in Live Operations to see other requests.
          </div>
        `;
        setAcceptButtonState('none');
        return;
      }

      const isCritical = target.urgency === 'critical';
      const badgeClass = c.blood.includes('-') ? 'critical' : 'needed';

      container.innerHTML = `
        <div style="display: flex; gap: 0.85rem; align-items: center;">
          <div class="blood-badge-avatar ${badgeClass}">${escapeHTML(c.blood)}</div>
          <div>
            <div style="font-size: 0.88rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 6px;">
              <span class="status-dot-pulse" style="background: ${isCritical ? 'var(--color-danger)' : 'var(--color-primary)'};"></span>
              ${isCritical ? 'Urgent Transfusion Shortage' : 'Transfusion Reserve Priority'}: ${escapeHTML(target.name)}
            </div>
            <div style="font-size: 0.72rem; color: #cbd5e1; margin-top: 3px; line-height: 1.4;">
              📍 ${escapeHTML(target.city)}, ${escapeHTML(target.country)} • ${escapeHTML(target.emergencyStatus)}. Requests
              <strong style="color:${isCritical ? '#fb7185' : '#38bdf8'};">${target.unitsNeeded} units of ${escapeHTML(target.emergencyNeed)}</strong>.
              Your ${escapeHTML(c.blood)} donation is compatible with this request (${escapeHTML(target.dist || 'Direct Transit Corridor')}).
            </div>
          </div>
        </div>
      `;
      setAcceptButtonState(acceptedMatchFacilityIds.has(target.id) ? 'accepted' : 'ready');
    }

    function acceptSmartRecommendation() {
      const c = appState.currentCitizenDonor;
      const target = getFacilityById(appState.smartRecommendationTargetId);
      if (!appState.citizenLoggedIn || !c || !target) {
        updateSmartRecommendation();
        return;
      }
      if (acceptedMatchFacilityIds.has(target.id)) return;
      acceptedMatchFacilityIds.add(target.id);

      setAcceptButtonState('accepted');
      selectFacilityToSchedule(target.id);
      showToast(`Donation centre selected: ${target.name}. Choose a date to book your appointment.`);

    }

/* 3D. LIVE BLOOD DISCOVERY & HOSPITAL STOCK SEARCH (own filter state, never touches the Ops map filter) */
    function syncDonorBloodFilterButtons() {
      const filter = appState.donorStockBloodFilter;
      document.querySelectorAll('.blood-filter-btn').forEach(btn => {
        const btnBlood = btn.dataset?.blood || String(btn.textContent || '').trim().split(' ')[0];
        const isActive = isAllFilter(filter) ? isAllFilter(btnBlood) || btnBlood.toLowerCase() === 'all' : btnBlood === filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function setBloodFilter(filter) {
      appState.donorStockBloodFilter = isAllFilter(filter) || !BLOOD_GROUPS.includes(filter) ? 'ALL' : filter;
      syncDonorBloodFilterButtons();
      renderHospitalStockSearch();
      playTone(520, 'sine', 0.05);
    }

    function filterHospitalStock() {
      renderHospitalStockSearch();
    }

    function renderHospitalStockSearch() {
      const grid = document.getElementById('hospitalStockResultsGrid');
      if (!grid) return;

      const q = (document.getElementById('bloodSearchInput')?.value || '').toLowerCase().trim();
      const filter = appState.donorStockBloodFilter;
      const lc = v => String(v || '').toLowerCase();

      const facilities = GLOBAL_FACILITIES.filter(h => {
        const matchesScope = facilityMatchesScope(h, appState.currentScopeId);
        const matchesQuery = !q || lc(h.name).includes(q) || lc(h.city).includes(q) || lc(h.country).includes(q) || lc(h.type).includes(q);
        return matchesScope && matchesQuery;
      });

      if (facilities.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.75rem;">No medical centres found matching search criteria in current scope.</div>`;
        return;
      }

      const requestGroup = isAllFilter(filter) ? (appState.currentCitizenDonor?.blood || 'O-') : filter;

      grid.innerHTML = facilities.map(h => {
        let stockDisplay;
        if (isAllFilter(filter)) {
          const totalUnits = h.stock ? Object.values(h.stock).reduce((a, b) => a + b, 0) : 0;
          stockDisplay = `<span style="color: #fff; font-weight: 800;">${totalUnits} Units Total</span> • Central Facility Stock`;
        } else {
          const units = (h.stock && h.stock[filter]) || 0;
          const isLow = units < 8;
          stockDisplay = `<span style="color: ${isLow ? '#fb7185' : '#34d399'}; font-weight: 800; font-size: 0.88rem;">${units} Units of ${filter}</span> ${isLow ? '(CRITICAL DEFICIT)' : '(AVAILABLE)'}`;
        }

        return `
          <div class="hospital-stock-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div style="font-weight: 800; color: #fff; font-size: 0.82rem;">${escapeHTML(h.name)}</div>
                <span style="font-size: 0.65rem; color: #38bdf8; font-weight: 700; background: rgba(14,165,233,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(14,165,233,0.25);">${escapeHTML(h.dist || 'Verified Node')}</span>
              </div>
              <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 6px;">📍 ${escapeHTML(h.city)}, ${escapeHTML(h.country)} • ${escapeHTML(h.emergencyStatus)}</div>
              <div style="font-size: 0.72rem; margin: 4px 0;">${stockDisplay}</div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-danger" style="font-size: 0.68rem; padding: 5px 10px;" type="button" aria-label="Request blood units from ${escapeHTML(h.name)}" onclick="requestHospitalBlood('${h.id}', '${requestGroup}')">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                Request Units
              </button>
              <button class="btn btn-primary" style="font-size: 0.68rem; padding: 5px 10px;" type="button" aria-label="Schedule blood donation at ${escapeHTML(h.name)}" onclick="selectFacilityToSchedule('${h.id}')">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Schedule Donation
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function selectFacilityToSchedule(facilityRef) {
      const f = resolveFacility(facilityRef);
      const select = document.getElementById('schedFacility');
      if (!f || !select) return;
      if (!Array.from(select.options || []).some(o => o.value === f.id)) {
        populateScheduleOptions();
      }
      select.value = f.id;
      if (typeof select.scrollIntoView === 'function') select.scrollIntoView({ behavior: 'smooth', block: 'center' });
      playTone(550, 'sine', 0.08);
      showToast(`Selected "${f.name}" for donation appointment.`);
    }

    function requestHospitalBlood(facilityRef, bloodGroup) {
      if (!appState.citizenLoggedIn || !appState.currentCitizenDonor) return false;
      const f = resolveFacility(facilityRef);
      if (!f) {
        showToast('⚠️ Request failed: facility not found.', 'critical');
        return;
      }
      const group = BLOOD_GROUPS.includes(bloodGroup) ? bloodGroup : f.emergencyNeed;
      const citizen = appState.currentCitizenDonor;
      citizen.bloodRequests = citizen.bloodRequests || [];
      if (!citizen.bloodRequests.some(request => request.facilityId === f.id && request.group === group)) {
        citizen.bloodRequests.push({ facilityId: f.id, group, status: 'draft' });
      }
      showToast(`Demo request saved for ${group} at ${f.name}. No dispatch or notification has been sent.`);
      return true;
    }

/* 3E. APPOINTMENT BOOKING */
    function toLocalISODate(d) {
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    // Options are generated from real data and the real calendar; hard-coded dates went stale
    function populateScheduleOptions(daysAhead = 7) {
      const facilitySelect = document.getElementById('schedFacility');
      if (facilitySelect && typeof document.createElement === 'function') {
        const previous = facilitySelect.value;
        facilitySelect.innerHTML = '';
        const groups = [
          { label: '🇮🇳 India National Network', items: GLOBAL_FACILITIES.filter(f => f.country === 'India') },
          { label: '🌐 International Healthcare Hubs', items: GLOBAL_FACILITIES.filter(f => f.country !== 'India') }
        ];
        groups.forEach(g => {
          const og = document.createElement('optgroup');
          og.label = g.label;
          g.items.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${f.name} (${f.city})`;
            og.appendChild(opt);
          });
          facilitySelect.appendChild(og);
        });
        if (previous && getFacilityById(previous)) facilitySelect.value = previous;
      }

      const dateSelect = document.getElementById('schedDate');
      if (dateSelect && typeof document.createElement === 'function') {
        const previous = dateSelect.value;
        dateSelect.innerHTML = '';
        const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        for (let i = 1; i <= daysAhead; i++) {
          const d = new Date();
          d.setHours(12, 0, 0, 0);
          d.setDate(d.getDate() + i);
          const opt = document.createElement('option');
          opt.value = toLocalISODate(d);
          opt.textContent = (i === 1 ? 'Tomorrow · ' : '') + fmt.format(d);
          dateSelect.appendChild(opt);
        }
        if (previous) dateSelect.value = previous;
      }
    }

    function bookAppointment() {
      const c = appState.currentCitizenDonor;
      if (!appState.citizenLoggedIn || !c) {
        showToast('Please sign in to book a donation appointment.', 'critical');
        return false;
      }
      const facility = resolveFacility(document.getElementById('schedFacility')?.value);
      const dateValue = document.getElementById('schedDate')?.value || '';

      if (!facility) {
        showToast('Please choose a donation centre.', 'critical');
        return false;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !Number.isFinite(new Date(dateValue + 'T12:00:00').getTime()) || toLocalISODate(new Date(dateValue + 'T12:00:00')) !== dateValue || dateValue <= toLocalISODate(new Date())) {
        showToast('Please choose an upcoming appointment date.', 'critical');
        return false;
      }

      c.appointments = c.appointments || [];
      if (c.appointments.some(a => a.facilityId === facility.id && a.date === dateValue)) {
        showToast(`You already have an appointment at ${facility.name} on that date.`);
        return false;
      }
      c.appointments.push({ facilityId: facility.id, date: dateValue });

      const record = appState.registeredUsers.find(u => u.id === c.userId);
      if (record) record.appointments = c.appointments.map(a => ({ ...a }));
      if (typeof persistEntryAccounts === 'function') persistEntryAccounts();
      updateCitizenDonorUI();

      playChime();
      showToast(`✓ Appointment Confirmed at ${facility.name} for ${dateValue}!${typeof entryStorageAvailable !== 'undefined' && !entryStorageAvailable ? ' Browser storage is unavailable; this booking will be lost on reload.' : ''}`);
      logTerminal(`[APPOINTMENT] Verified donation scheduled at ${facility.name} (${dateValue})`, 'highlight');
      return true;
    }

/* 3F. MODAL AUTHENTICATION (alternate entry point; shares the gate's validation and session logic) */
    function openUserAuthModal() {
      if (typeof showEntryView === 'function') { showEntryView('login'); return; }
      const modal = document.getElementById('userAuthModal');
      if (modal) modal.classList.add('open');
      playTone(480, 'sine', 0.08);
    }

    function closeUserAuthModal() {
      const modal = document.getElementById('userAuthModal');
      if (modal) modal.classList.remove('open');
    }

    function switchAuthTab(tab) {
      const isRegister = tab === 'register';
      document.getElementById('tabRegister')?.classList.toggle('active', isRegister);
      document.getElementById('tabLogin')?.classList.toggle('active', !isRegister);
      const regForm = document.getElementById('formRegister');
      const logForm = document.getElementById('formLogin');
      if (regForm) regForm.style.display = isRegister ? 'flex' : 'none';
      if (logForm) logForm.style.display = isRegister ? 'none' : 'flex';
      playTone(450, 'sine', 0.06);
    }

    function submitUserRegister() {
      const name = (document.getElementById('regName')?.value || '').trim();
      const blood = document.getElementById('regBlood')?.value || '';
      const phone = (document.getElementById('regPhone')?.value || '').trim();
      const email = (document.getElementById('regEmail')?.value || '').trim();
      const pass = document.getElementById('regPass')?.value || '';

      if (!isPlausiblePhone(phone)) {
        showToast('Please enter a valid mobile number.', 'critical');
        return false;
      }
      if (!isPlausibleEmail(email)) {
        showToast('Please enter a valid email address.', 'critical');
        return false;
      }
      const error = validateRegistration({ name, blood, identifiers: [phone, email], password: pass });
      if (error) {
        showToast(error, 'critical');
        return false;
      }

      const record = addCitizenRecord({ name, blood, sector: 'National Registry', scopeId: 'india' });
      storeCitizenCredentials(record.id, [phone, email], pass);

      closeUserAuthModal();
      startCitizenSession(record, { donations: 0, livesSaved: 0, xp: 1000 });
      switchPortal('donor');
      playChime();
      showToast(`🎉 Welcome, ${name}! Certified donor credentials activated under Zero Data Leakage.`);
      return true;
    }

    function submitUserLogin() {
      const ident = (document.getElementById('loginEmail')?.value || '').trim();
      const passField = document.getElementById('loginPass');
      const pass = passField ? passField.value : '';
      if (!ident || !pass) {
        showToast('Please enter your registered email/mobile and password.', 'critical');
        return false;
      }
      const record = authenticateCitizen(ident, pass);
      if (passField) passField.value = '';
      if (!record) {
        if (typeof playAlarm === 'function') playAlarm();
        showToast('❌ Invalid credentials.', 'critical');
        return false;
      }
      closeUserAuthModal();
      startCitizenSession(record, { donations: 4, livesSaved: 12, xp: 12000 });
      switchPortal('donor');
      playChime();
      showToast(`🔓 Welcome back, ${record.name} (${record.blood})! Citizen Portal active.`);
      return true;
    }

    const DEMO_CITIZEN_USERNAME = 'Dhiman';
    const DEMO_CITIZEN_EMAIL = 'dhiman@vitallink.org';
    const DEMO_CITIZEN_PASSWORD = '123456789';
    (function seedDemoCitizenCredentials() {
      const demoCitizen = appState.registeredUsers.find(u => u.id === 'usr-6');
      if (demoCitizen) storeCitizenCredentials(demoCitizen.id, [DEMO_CITIZEN_EMAIL, DEMO_CITIZEN_USERNAME, demoCitizen.donorId], DEMO_CITIZEN_PASSWORD);
    })();

    function quickFillDemoUser() {
      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPass');
      if (emailInput) emailInput.value = DEMO_CITIZEN_EMAIL;
      if (passInput) passInput.value = DEMO_CITIZEN_PASSWORD;
      if (typeof playTone === 'function') playTone(520, 'sine', 0.05);
      showToast('⚡ Demo credentials filled (Dhiman, B+). Click Sign In.');
    }

const selectHospitalForDonation = selectFacilityToSchedule;

if (typeof window !== 'undefined') {
  window.handleDonorPortalClick = handleDonorPortalClick;
  window.renderCitizenPortalState = renderCitizenPortalState;
  window.switchGateTab = switchGateTab;
  window.submitGateRegister = submitGateRegister;
  window.submitGateLogin = submitGateLogin;
  window.quickFillCitizen = quickFillCitizen;
  window.citizenLogout = citizenLogout;
  window.selfDeleteCitizenData = selfDeleteCitizenData;
  window.forgetCitizenCredentials = forgetCitizenCredentials;
  window.copyCitizenToken = copyCitizenToken;
  window.updateCitizenDonorUI = updateCitizenDonorUI;
  window.updateSmartRecommendation = updateSmartRecommendation;
  window.resolveSmartRecommendationTarget = resolveSmartRecommendationTarget;
  window.acceptSmartRecommendation = acceptSmartRecommendation;
  window.setBloodFilter = setBloodFilter;
  window.renderHospitalStockSearch = renderHospitalStockSearch;
  window.filterHospitalStock = filterHospitalStock;
  window.selectFacilityToSchedule = selectFacilityToSchedule;
  window.selectHospitalForDonation = selectHospitalForDonation;
  window.requestHospitalBlood = requestHospitalBlood;
  window.populateScheduleOptions = populateScheduleOptions;
  window.bookAppointment = bookAppointment;
  window.openUserAuthModal = openUserAuthModal;
  window.closeUserAuthModal = closeUserAuthModal;
  window.switchAuthTab = switchAuthTab;
  window.submitUserRegister = submitUserRegister;
  window.submitUserLogin = submitUserLogin;
  window.quickFillDemoUser = quickFillDemoUser;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleDonorPortalClick,
    renderCitizenPortalState,
    switchGateTab,
    submitGateRegister,
    submitGateLogin,
    quickFillCitizen,
    citizenLogout,
    selfDeleteCitizenData,
    forgetCitizenCredentials,
    copyCitizenToken,
    updateCitizenDonorUI,
    updateSmartRecommendation,
    resolveSmartRecommendationTarget,
    acceptSmartRecommendation,
    setBloodFilter,
    renderHospitalStockSearch,
    filterHospitalStock,
    selectFacilityToSchedule,
    selectHospitalForDonation,
    requestHospitalBlood,
    populateScheduleOptions,
    bookAppointment,
    openUserAuthModal,
    closeUserAuthModal,
    switchAuthTab,
    submitUserRegister,
    submitUserLogin,
    quickFillDemoUser
  };
}
