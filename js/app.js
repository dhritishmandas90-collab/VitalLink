/* ==========================================================
   VITALLINK GLOBAL APPLICATION CONTROLLER & DISPATCH ORCHESTRATION
   - Global Directory Search & Autocomplete Navigation
   - Contextual Emergency Queue (Scope-Aware & Filter-Aware)
   - Dynamic Blood Reserves Matrix & Viewport Synchronization
   - Multi-Region Operational Dispatch & Route Locking
   - Calibrated Medical Audio Acoustics & Accessibility
   ========================================================== */

/* ----------------------------------------------------------
   1. GLOBAL SEARCH CONTROLLER & DIRECTORY AUTOCOMPLETE
   ---------------------------------------------------------- */

let globalSearchDebounceTimer = null;

function handleGlobalSearchInput(val) {
  const clearBtn = document.getElementById('globalSearchClearBtn');
  const dropdown = document.getElementById('globalSearchDropdown');
  if (!dropdown) return;

  if (clearBtn) {
    clearBtn.style.display = val.trim() ? 'block' : 'none';
  }

  clearTimeout(globalSearchDebounceTimer);
  if (!val.trim()) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }

  globalSearchDebounceTimer = setTimeout(() => {
    const results = searchGlobalDirectory(val);
    renderGlobalSearchResults(results);
  }, 100);
}

function clearGlobalSearch() {
  const input = document.getElementById('globalSearchInput');
  const clearBtn = document.getElementById('globalSearchClearBtn');
  const dropdown = document.getElementById('globalSearchDropdown');
  if (input) input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }
}

function renderGlobalSearchResults(results) {
  const dropdown = document.getElementById('globalSearchDropdown');
  if (!dropdown) return;

  if (results.length === 0) {
    dropdown.innerHTML = `
      <div class="search-empty-state">
        No locations or medical centres matching query.
      </div>
    `;
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = results.map(r => `
    <div class="search-result-item" role="option" onclick="handleSelectSearchResult('${r.resultType}', '${r.resultType === 'scope' ? r.scope.id : r.facility.id}')">
      <div class="result-icon-col">
        ${r.resultType === 'scope' ? '🌍' : (r.facility.type.toLowerCase().includes('blood') ? '🩸' : '🏥')}
      </div>
      <div class="result-text-col">
        <div class="result-title">${escapeHTML(r.title)}</div>
        <div class="result-subtitle">${escapeHTML(r.subtitle)}</div>
      </div>
      <span class="result-tag">${r.resultType === 'scope' ? 'REGION' : 'FACILITY'}</span>
    </div>
  `).join('');

  dropdown.style.display = 'block';
}

function handleSelectSearchResult(type, id) {
  clearGlobalSearch();

  if (appState.currentPortal !== 'ops' && typeof switchPortal === 'function') {
    switchPortal('ops');
  }

  if (type === 'scope') {
    if (typeof setGeographicScope === 'function') {
      setGeographicScope(id);
    }
  } else if (type === 'facility') {
    const f = typeof getFacilityById === 'function' ? getFacilityById(id) : GLOBAL_FACILITIES.find(item => item.id === id);
    if (f && typeof focusFacility === 'function') {
      focusFacility(f.id);
    }
  }
}

// Close dropdown on click outside
document.addEventListener('click', (e) => {
  const searchContainer = document.querySelector('.global-search-container');
  const dropdown = document.getElementById('globalSearchDropdown');
  if (dropdown && searchContainer && !searchContainer.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

/* ----------------------------------------------------------
   2. SCOPE-AWARE CONTEXTUAL EMERGENCY QUEUE
   ---------------------------------------------------------- */

function setFacilityTypeFilter(type) {
  appState.activeFacilityTypeFilter = type;
  document.querySelectorAll('.filter-type-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset?.type === type);
  });
  document.querySelectorAll('.map-facility-btn').forEach(btn => {
    const btnType = btn.dataset?.type || 'all';
    btn.classList.toggle('active', btnType === type || (btnType === 'all' && (!type || type === 'all')));
  });
  renderContextualEmergencies();
  renderFacilityDirectoryList();
  if (typeof filterMapFacilities === 'function') {
    filterMapFacilities(type, appState.activeBloodFilter);
  }
  if (typeof playTone === 'function') playTone(480, 'sine', 0.04);
}

function setBloodGroupFilter(blood) {
  appState.activeBloodFilter = isAllFilter(blood) ? 'ALL' : blood;
  document.querySelectorAll('.filter-blood-pill').forEach(btn => {
    const btnBlood = btn.dataset?.blood;
    btn.classList.toggle('active', isAllFilter(btnBlood) ? isAllFilter(blood) : btnBlood === blood);
  });
  renderContextualEmergencies();
  renderRegionalStockMatrix();
  if (typeof filterMapFacilities === 'function') {
    filterMapFacilities(appState.activeFacilityTypeFilter, blood);
  }
  if (typeof playTone === 'function') playTone(500, 'sine', 0.04);
}

function renderContextualEmergencies() {
  const container = document.getElementById('contextualEmergenciesContainer');
  const countBadge = document.getElementById('emergencyCountBadge');
  if (!container) return;

  const facilities = getFacilitiesForScope(appState.currentScopeId, appState.activeFacilityTypeFilter, appState.activeBloodFilter);
  // Sort critical first
  const emergencies = facilities.filter(f => f.urgency === 'critical' || f.urgency === 'urgent' || f.urgency === 'needed');

  if (countBadge) {
    countBadge.textContent = `${emergencies.length} Active`;
  }

  if (emergencies.length === 0) {
    container.innerHTML = `
      <div class="empty-queue-notice">
        <div style="font-size:1.1rem; margin-bottom:4px;">✓</div>
        <div style="font-weight:700; color:#fff;">Nominal Inventory Levels</div>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">No critical blood deficits recorded in current operational scope.</div>
      </div>
    `;
    return;
  }

  const activeId = typeof window !== 'undefined' ? window.activeHighlightedFacilityId : null;
  container.innerHTML = emergencies.map(f => {
    const isCritical = f.urgency === 'critical';
    const isUrgent = f.urgency === 'urgent';
    const severity = isCritical ? 'critical' : (isUrgent ? 'urgent' : 'needed');
    const badgeLabel = `${f.emergencyNeed} ${severity.toUpperCase()}`;
    const isDispatched = appState.dispatchedFacilityIds.has(f.id);
    const dispatchAriaLabel = `Dispatch ${f.emergencyNeed} blood to ${f.name} — ${severity} priority`;
    const metaHtml = isDispatched
      ? `<span style="color:var(--color-success); font-weight:700;">● Courier En Route (ETA &lt; 6m)</span>`
      : `Deficit: ${f.unitsNeeded} Units • ETA ${f.eta}`;

    return `
      <div class="urgent-card urgency-${severity} ${f.id === activeId ? 'active' : ''} ${isDispatched ? 'is-dispatched' : ''}" id="card-${f.id}" onclick="focusFacility('${f.id}')" data-urgency="${severity}">
        <div class="urgent-card-header">
          <div>
            <div class="urgent-hosp-name">${f.name}</div>
            <div class="urgent-hosp-sub">📍 ${f.city} • ${f.dist}</div>
          </div>
          <span class="blood-badge ${severity}">${badgeLabel}</span>
        </div>
        <div class="urgent-progress"><div class="progress-bar-fill" style="width: ${isCritical ? '88%' : (isUrgent ? '60%' : '35%')}; background-color: ${isCritical ? 'var(--color-danger)' : (isUrgent ? 'var(--color-warning)' : 'var(--color-primary)')};"></div></div>
        <div class="urgent-card-footer">
          <span class="urgent-need-meta" id="meta-${f.id}">${metaHtml}</span>
          <button class="dispatch-btn dispatch-btn--${severity} ${isDispatched ? 'dispatched' : ''}" id="btn-dispatch-${f.id}" type="button" aria-label="${dispatchAriaLabel}" data-urgency="${severity}" ${isDispatched ? 'disabled' : ''} onclick="event.stopPropagation(); dispatchRequest('${f.id}', '${f.emergencyNeed}', 'Rapid Courier 4A')">
            ${isDispatched ? '✓ Dispatched' : 'Dispatch'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Backward compatibility alias for focusUrgent
function focusUrgent(id) {
  if (typeof focusFacility === 'function') {
    focusFacility(id);
  }
}

/* ----------------------------------------------------------
   3. MULTI-REGION OPERATIONAL DISPATCH & STATE SYNC
   ---------------------------------------------------------- */

// facilityRef: facility id (preferred), legacy alias, or exact facility name.
// options.deductInventory=false for donor-originated matches (a donation adds blood, it doesn't consume it).
function dispatchRequest(facilityRef, bloodGroup, vehicle = 'Rapid Courier 4A', options = {}) {
  if (!appState.adminLoggedIn) {
    showToast('This action is restricted to the administrator.', 'critical');
    return false;
  }
  const f = typeof resolveFacility === 'function' ? resolveFacility(facilityRef) : null;
  if (!f) {
    showToast('⚠️ Dispatch failed: facility not found in the verified registry.', 'critical');
    logTerminal(`[DISPATCH ERROR] Unknown facility reference: ${String(facilityRef)}`, 'alert');
    return false;
  }
  const group = BLOOD_GROUPS.includes(bloodGroup) ? bloodGroup : f.emergencyNeed;

  if (appState.dispatchedFacilityIds.has(f.id)) {
    showToast(`ℹ️ A courier is already en route to ${f.name}.`);
    if (typeof focusFacility === 'function') focusFacility(f.id);
    return false;
  }

  playChime();
  appState.dispatchedFacilityIds.add(f.id);

  if (options.deductInventory !== false) {
    const inv = appState.inventory.find(i => i.type === group);
    if (inv && inv.count > 0) {
      inv.count = Math.max(0, inv.count - 2);
      if (typeof applyInventoryStatus === 'function') applyInventoryStatus(inv);
    }
  }

  if (typeof focusFacility === 'function') focusFacility(f.id);

  renderContextualEmergencies();
  renderRegionalStockMatrix();
  if (typeof renderInventoryGrid === 'function') renderInventoryGrid();

  showToast(`⚡ Priority Courier ${vehicle} deployed for ${f.name} (${group})`, 'critical');
  logTerminal(`[DISPATCH] ${vehicle} assigned to ${f.name} (${group}) — Corridor Clearance Active`, 'highlight');

  if (window.innerWidth <= 768 && appState.currentPortal === 'ops') {
    switchMobileOpsTab('map');
  }
  return true;
}

function simulateEmergency() {
  if (!appState.adminLoggedIn) {
    showToast('This action is restricted to the administrator.', 'critical');
    return false;
  }
  playAlarm();
  const currentScope = (typeof GEOGRAPHIC_SCOPES !== 'undefined' && GEOGRAPHIC_SCOPES[appState.currentScopeId]) ? GEOGRAPHIC_SCOPES[appState.currentScopeId] : { name: 'National Network' };
  const facilities = typeof getFacilitiesForScope === 'function' ? getFacilitiesForScope(appState.currentScopeId) : GLOBAL_FACILITIES;
  const target = facilities.find(f => f.urgency === 'critical') || facilities[0] || GLOBAL_FACILITIES[0];

  showToast(`🚨 [DEMO SIMULATION] CRITICAL EMERGENCY SOS: ${target.name} requires ${target.emergencyNeed} units immediately!`, 'critical');
  if (typeof logTerminal === 'function') {
    logTerminal(`[CRITICAL SOS DEMO] Emergency simulation broadcast across ${currentScope.name}`, 'alert');
  }

  // Always transition to Live Operations so the user sees the critical incident
  if (typeof switchPortal === 'function') {
    switchPortal('ops');
  }
  if (window.innerWidth <= 768 && typeof switchMobileOpsTab === 'function') {
    switchMobileOpsTab('map');
  }

  if (target && typeof focusFacility === 'function') {
    focusFacility(target.id);
  }
}

/* ----------------------------------------------------------
   4. DYNAMIC REGIONAL BLOOD RESERVES MATRIX
   ---------------------------------------------------------- */

function renderRegionalStockMatrix() {
  const tbody = document.getElementById('stockTableBody');
  const totalLabel = document.getElementById('totalUnitsLabel');
  const scopeHeader = document.getElementById('stockMatrixScopeTitle');
  if (!tbody) return;

  const currentScope = GEOGRAPHIC_SCOPES[appState.currentScopeId] || GEOGRAPHIC_SCOPES['india'];
  if (scopeHeader) {
    scopeHeader.textContent = currentScope.name;
  }

  // Calculate scope-specific units or fall back to central reserves
  const facilities = getFacilitiesForScope(appState.currentScopeId);
  const bloodTotals = {
    'O-': 0, 'O+': 0, 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0
  };

  if (facilities.length > 0) {
    facilities.forEach(f => {
      if (f.stock) {
        Object.keys(f.stock).forEach(b => {
          if (bloodTotals[b] !== undefined) {
            bloodTotals[b] += f.stock[b];
          }
        });
      }
    });
  } else {
    appState.inventory.forEach(i => {
      bloodTotals[i.type] = i.count;
    });
  }

  let totalSum = 0;
  const bloodKeys = ['O-', 'O+', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  tbody.innerHTML = bloodKeys.map(b => {
    const count = bloodTotals[b];
    totalSum += count;

    const isOptimal = count >= 25;
    const isCritical = count < 8;
    const countColor = isCritical ? 'var(--text-danger)' : (count < 25 ? 'var(--text-warning)' : 'var(--text-primary)');

    /* Issue 7: Subtle dot indicator for Optimal state, reserving bold badges for deficits */
    const statusHtml = isOptimal
      ? `<span class="stock-status-optimal"><span class="status-dot-subtle"></span> Optimal</span>`
      : `<span class="blood-badge ${isCritical ? 'critical' : 'urgent'}">${isCritical ? 'Critical Deficit' : 'Low Reserve'}</span>`;

    /* Issue 6: Omit redundant 'Group' and 'Units' labels since columns already specify them
       Issue 8: Right-align reserves numbers for tabular place-value scanning */
    return `
      <tr>
        <td class="stock-group-cell">${b}</td>
        <td class="stock-units-cell" style="color:${countColor}; text-align:right; font-weight:700; font-family:var(--font-mono);">${count}</td>
        <td>${statusHtml}</td>
      </tr>
    `;
  }).join('');

  if (totalLabel) {
    totalLabel.textContent = `${totalSum.toLocaleString()} Units`;
  }
}

/* ----------------------------------------------------------
   5. VERIFIED FACILITY DIRECTORY IN CURRENT SCOPE
   ---------------------------------------------------------- */

function renderFacilityDirectoryList() {
  const container = document.getElementById('facilityDirectoryList');
  if (!container) return;

  const facilities = getFacilitiesForScope(appState.currentScopeId, appState.activeFacilityTypeFilter, appState.activeBloodFilter);

  if (facilities.length === 0) {
    container.innerHTML = `
      <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:1.2rem;">
        No verified medical facilities in current scope.
      </div>
    `;
    return;
  }

  const activeId = typeof window !== 'undefined' ? window.activeHighlightedFacilityId : null;
  container.innerHTML = facilities.slice(0, 6).map(f => `
    <div class="facility-card ${f.id === activeId ? 'active' : ''}" data-facility-id="${f.id}" onclick="focusFacility('${f.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();focusFacility('${f.id}');}" role="button" tabindex="0">
      <div class="facility-header">
        <span class="facility-name">${f.name}</span>
        <span class="badge-trust-verified">✓ Verified</span>
      </div>
      <div class="facility-meta">
        <!-- Issue 18: Move timestamp adjacent to location metadata instead of isolated corner -->
        <span>📍 ${f.city}, ${f.country} • <span class="facility-timestamp" style="color:var(--text-info); font-family:inherit;">${f.lastUpdated}</span></span>
      </div>
    </div>
  `).join('');
}

/* ----------------------------------------------------------
   6. PORTAL & RESPONSIVE TAB CONTROLLER
   ---------------------------------------------------------- */

function switchMobileOpsTab(tabId) {
  const opsView = document.getElementById('view-ops');
  if (!opsView) return;
  opsView.setAttribute('data-mobile-tab', tabId);

  document.querySelectorAll('.mobile-ops-tab').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  const activeBtn = document.getElementById('tabBtn' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
  }

  if (typeof playTone === 'function') playTone(500, 'sine', 0.05);

  if (tabId === 'map') {
    // Must wait for CSS display reflow to complete before resize().
    // 60ms was too short — map container dimensions were still stale.
    setTimeout(() => {
      if (typeof maplibreMap !== 'undefined' && maplibreMap) {
        maplibreMap.resize();
      }
    }, 200);
  }
}

const VALID_PORTALS = ['ops', 'admin', 'donor'];

function switchPortal(portalId, pushHistory = true) {
  if (typeof guardEntryRoute === 'function' && !guardEntryRoute(portalId)) return;
  // 1. Safe boundary fallback: fall back to ops on missing or invalid ID
  if (!portalId || !VALID_PORTALS.includes(portalId)) {
    portalId = 'ops';
  }

  // 2. Protect admin portal when unauthenticated
  if (portalId === 'admin' && !appState.adminLoggedIn) {
    if (typeof openAdminAuthModal === 'function') openAdminAuthModal();
    // Back/forward (or a pasted #portal=admin) must not leave the URL pointing at a portal we refused to show
    if (!pushHistory && typeof window !== 'undefined' && window.history && window.history.replaceState) {
      try {
        window.history.replaceState({ portal: appState.currentPortal }, '', `#portal=${appState.currentPortal}`);
      } catch (err) {}
    }
    return;
  }

  // 3. Synchronize application state
  appState.currentPortal = portalId;
  if (typeof playTone === 'function') playTone(520, 'sine', 0.08);

  // 4. Update navigation buttons & aria-selected
  document.querySelectorAll('.portal-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  const activeBtn = document.getElementById(`btn-portal-${portalId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
  }

  // 5. Hide inactive portals and reveal only selected portal
  document.querySelectorAll('.portal-view').forEach(view => view.classList.remove('active'));
  const activeView = document.getElementById(`view-${portalId}`);
  if (activeView) {
    activeView.classList.add('active');
  } else {
    // Failsafe: if target view is unexpectedly absent, restore ops
    const opsView = document.getElementById('view-ops');
    if (opsView) opsView.classList.add('active');
  }

  // 6. Synchronize browser URL hash and history state without recursive events
  if (pushHistory && typeof window !== 'undefined' && window.history && window.history.pushState) {
    try {
      const targetHash = `#portal=${portalId}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ portal: portalId }, '', targetHash);
      }
    } catch (err) {}
  }

  // 7. Portal-specific activations
  if (portalId === 'admin' && typeof renderAdminKPIs === 'function') {
    renderAdminKPIs();
  }
  if (portalId === 'ops') {
    if (typeof initMapLibre === 'function') initMapLibre();
    // Timeout genuinely required by MapLibre for container dimension recalculation after CSS reflow
    setTimeout(() => {
      if (typeof maplibreMap !== 'undefined' && maplibreMap) {
        maplibreMap.resize();
      }
    }, 150);
  } else if (portalId === 'donor') {
    if (typeof renderCitizenPortalState === 'function') {
      renderCitizenPortalState();
    }
  } else if (portalId === 'admin') {
    if (typeof renderDonorsAuditTable === 'function') {
      renderDonorsAuditTable();
    }
  }
}

/* ----------------------------------------------------------
   7. CALIBRATED MEDICAL AUDIO FEEDBACK (WEB AUDIO API)
   ---------------------------------------------------------- */

let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  // Browsers refuse to start audio before the first user gesture; creating the context early only logs warnings
  if (typeof navigator !== 'undefined' && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
}

function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.08) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function playChime() {
  playTone(659.25, 'sine', 0.14, 0.06);
  setTimeout(() => playTone(987.77, 'sine', 0.22, 0.06), 70);
}

function playAlarm() {
  playTone(480, 'triangle', 0.12, 0.08);
  setTimeout(() => playTone(360, 'sawtooth', 0.18, 0.07), 90);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('soundBtn');
  if (btn) {
    btn.textContent = soundEnabled ? '🔊' : '🔇';
    btn.setAttribute('aria-label', soundEnabled ? 'Sound Enabled' : 'Sound Muted');
  }
  showToast(soundEnabled ? 'Audio Feedback Enabled' : 'Audio Feedback Muted');
}

/* ----------------------------------------------------------
   8. REAL-TIME DISPATCH ACTIVITY LOGS & TELEMETRY
   ---------------------------------------------------------- */

function logTerminal(text, type = 'normal') {
  const feed = document.getElementById('terminalFeed');
  if (!feed) return;
  const line = document.createElement('div');
  line.className = 'feed-line' + (type === 'highlight' ? ' highlight' : type === 'alert' ? ' alert' : '');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  line.textContent = `[${time}] ${text}`;
  feed.prepend(line);
  if (feed.children.length > 8) feed.removeChild(feed.lastChild);
}

setInterval(() => {
  const el = document.getElementById('matchAccuracy');
  if (el) {
    const base = 98.4;
    const jitter = (Math.random() * 0.6 - 0.3).toFixed(1);
    el.textContent = (base + parseFloat(jitter)).toFixed(1) + '% Sync';
  }
}, 4500);

/* ----------------------------------------------------------
   9. TOAST NOTIFICATIONS
   ---------------------------------------------------------- */

function showToast(msg, type = 'normal') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'critical' ? ' critical' : '');
  toast.setAttribute('role', 'status');
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      if (toast && typeof toast.remove === 'function') toast.remove();
    }, 260);
  }, 3400);
}

/* ----------------------------------------------------------
   10. KEYBOARD SHORTCUTS & ACCESSIBILITY
   ---------------------------------------------------------- */

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return; // Ctrl+1..3 is browser tab switching
  const activeEl = document.activeElement;
  const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
  const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || !!(activeEl && activeEl.isContentEditable);

  if (e.key === 'Escape') {
    clearGlobalSearch();
    if (typeof closeAdminAuthModal === 'function') closeAdminAuthModal();
    if (typeof closeUserAuthModal === 'function') closeUserAuthModal();
    if (typeof dismissMapError === 'function') dismissMapError();
    return;
  }

  if (isInput) return;
  // Portal shortcuts must not fire behind an open dialog
  if (document.querySelector && document.querySelector('.modal-backdrop.open')) return;

  if (e.key === '1') {
    switchPortal('ops');
  } else if (e.key === '2') {
    if (typeof handleAdminPortalClick === 'function') handleAdminPortalClick();
  } else if (e.key === '3') {
    if (typeof handleDonorPortalClick === 'function') handleDonorPortalClick();
  } else if (e.key === 'm' || e.key === 'M') {
    toggleSound();
  } else if (e.key === '/') {
    e.preventDefault();
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) searchInput.focus();
  }
});

// Browser Back/Forward navigation support
window.addEventListener('popstate', (e) => {
  if (typeof handleEntryNavigation === 'function') { handleEntryNavigation(); return; }
  if (e.state && e.state.portal) {
    switchPortal(e.state.portal, false);
  } else if (typeof window !== 'undefined' && window.location.hash) {
    const match = window.location.hash.match(/portal=([a-z]+)/);
    if (match && match[1]) {
      switchPortal(match[1], false);
    }
  } else {
    switchPortal('ops', false);
  }
});

/* ----------------------------------------------------------
   11. LIFECYCLE INITIALIZATION
   ---------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', () => {
  if (typeof initializeEntryFlow !== 'function' && typeof initMapLibre === 'function') {
    initMapLibre();
  }
  renderContextualEmergencies();
  renderRegionalStockMatrix();
  renderFacilityDirectoryList();

  if (typeof renderInventoryGrid === 'function') {
    renderInventoryGrid();
  }
  if (typeof renderDonorsAuditTable === 'function') {
    renderDonorsAuditTable();
  }
  if (typeof renderCitizenPortalState === 'function') {
    renderCitizenPortalState();
  }
  if (typeof populateAdminHospitalSelect === 'function') {
    populateAdminHospitalSelect();
  }
  if (typeof renderAdminKPIs === 'function') {
    renderAdminKPIs();
  }
  if (typeof populateScheduleOptions === 'function') {
    populateScheduleOptions();
  }
  if (typeof syncScopeIndicators === 'function') {
    syncScopeIndicators(appState.currentScopeId);
  }

  if (typeof initializeEntryFlow === 'function') {
    initializeEntryFlow();
    return;
  }

  // Give the initial history entry a state so Back returns here cleanly
  if (window.history && window.history.replaceState && !window.history.state) {
    try {
      window.history.replaceState({ portal: 'ops' }, '', window.location.hash || '#portal=ops');
    } catch (err) {}
  }

  // Restore portal from URL hash if specified
  if (typeof window !== 'undefined' && window.location.hash) {
    const match = window.location.hash.match(/portal=([a-z]+)/);
    if (match && match[1] && ['ops', 'donor', 'admin'].includes(match[1])) {
      switchPortal(match[1], false);
    }
  }
});

if (typeof window !== 'undefined') {
  window.handleGlobalSearchInput = handleGlobalSearchInput;
  window.clearGlobalSearch = clearGlobalSearch;
  window.renderGlobalSearchResults = renderGlobalSearchResults;
  window.handleSelectSearchResult = handleSelectSearchResult;
  window.setFacilityTypeFilter = setFacilityTypeFilter;
  window.setBloodGroupFilter = setBloodGroupFilter;
  window.renderContextualEmergencies = renderContextualEmergencies;
  window.focusUrgent = focusUrgent;
  window.dispatchRequest = dispatchRequest;
  window.simulateEmergency = simulateEmergency;
  window.renderRegionalStockMatrix = renderRegionalStockMatrix;
  window.renderFacilityDirectoryList = renderFacilityDirectoryList;
  window.switchMobileOpsTab = switchMobileOpsTab;
  window.switchPortal = switchPortal;
  window.initAudio = initAudio;
  window.playTone = playTone;
  window.playChime = playChime;
  window.playAlarm = playAlarm;
  window.toggleSound = toggleSound;
  window.logTerminal = logTerminal;
  window.showToast = showToast;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleGlobalSearchInput,
    clearGlobalSearch,
    renderGlobalSearchResults,
    handleSelectSearchResult,
    setFacilityTypeFilter,
    setBloodGroupFilter,
    renderContextualEmergencies,
    focusUrgent,
    dispatchRequest,
    simulateEmergency,
    renderRegionalStockMatrix,
    renderFacilityDirectoryList,
    switchMobileOpsTab,
    switchPortal,
    initAudio,
    playTone,
    playChime,
    playAlarm,
    toggleSound,
    logTerminal,
    showToast
  };
}
