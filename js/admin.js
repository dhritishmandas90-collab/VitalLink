/* ==========================================================
   2. PLATFORM OWNER AUTHENTICATION & DATA AUDIT CONTROLS
   ========================================================== */
/* 2. PLATFORM OWNER AUTHENTICATION (SECURE - NO CREDENTIALS LEAKED) */
    function handleAdminPortalClick() {
      if (appState.adminLoggedIn) {
        switchPortal('admin');
      } else {
        openAdminAuthModal();
      }
    }

    function openAdminAuthModal() {
      if (typeof showEntryView === 'function') { showEntryView('login'); return; }
      const modal = document.getElementById('adminAuthModal');
      if (!modal) return;
      modal.classList.add('open');
      const userField = document.getElementById('adminUserField');
      if (userField && typeof userField.focus === 'function') {
        setTimeout(() => userField.focus(), 50);
      }
      if (typeof playTone === 'function') playTone(480, 'sine', 0.08);
    }

    function closeAdminAuthModal() {
      const modal = document.getElementById('adminAuthModal');
      if (modal) modal.classList.remove('open');
    }

    function quickFillDemoAdmin() {
      const u = document.getElementById('adminUserField');
      const p = document.getElementById('adminPassField');
      if (u) u.value = 'Dhritishman123';
      if (p) p.value = '123456789';
      if (typeof playTone === 'function') playTone(520, 'sine', 0.05);
      showToast('⚡ Demo Admin credentials filled (Dhritishman123). Click Access.');
    }

    function submitAdminLogin() {
      const uField = document.getElementById('adminUserField');
      const pField = document.getElementById('adminPassField');
      const u = uField ? uField.value.trim() : '';
      const p = pField ? pField.value : '';

      if (!u || !p) {
        if (typeof playTone === 'function') playTone(320, 'sawtooth', 0.1);
        showToast('⚠️ Please enter both owner username and password.', 'critical');
        return;
      }

      if (u === 'Dhritishman123' && p === '123456789') {
        appState.adminLoggedIn = true;
        appState.citizenLoggedIn = false;
        appState.currentCitizenDonor = null;
        closeAdminAuthModal();
        if (typeof playChime === 'function') playChime();
        showToast('🛡️ Welcome, Platform Owner Dhritishman Das! Super-Admin Console Unlocked.');
        const pill = document.getElementById('adminSessionPill');
        if (pill) pill.style.display = 'flex';
        if (pField) pField.value = '';
        switchPortal('admin');
      } else {
        if (pField) pField.value = '';
        if (typeof playAlarm === 'function') playAlarm();
        showToast('❌ Invalid Owner Credentials. Access denied.', 'critical');
      }
    }

    function adminLogout() {
      appState.adminLoggedIn = false;
      const pill = document.getElementById('adminSessionPill');
      if (pill) pill.style.display = 'none';
      if (typeof playTone === 'function') playTone(380, 'sine', 0.1);
      showToast('Platform Owner logged out.');
      if (typeof logoutEntry === 'function') logoutEntry();
      else switchPortal('ops');
    }

    function renderAdminKPIs() {
      const kpi = document.getElementById('kpiDonorsCount');
      if (kpi) kpi.textContent = appState.totalCitizenCount.toLocaleString();
    }

    /* 2B. PLATFORM OWNER USER DATA MANAGEMENT (DELETE & AUDIT RIGHTS) */
    function renderDonorsAuditTable(filterQuery = '') {
      const tbody = document.getElementById('donorsAuditTableBody');
      const countBadge = document.getElementById('adminAuditCountBadge');
      if (!tbody) return;

      const q = String(filterQuery || '').toLowerCase().trim();
      const esc = escapeHTML;
      const filtered = appState.registeredUsers.filter(u => 
        !q || 
        u.name.toLowerCase().includes(q) || 
        u.blood.toLowerCase().includes(q) || 
        u.sector.toLowerCase().includes(q) ||
        (u.donorId && u.donorId.toLowerCase().includes(q))
      );

      if (countBadge) {
        countBadge.textContent = `${filtered.length} of ${appState.registeredUsers.length} Citizens in Registry`;
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding: 1.5rem; font-size:0.75rem;">No citizen donor records found matching search.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(u => `
        <tr id="donor-row-${esc(u.id)}">
          <td>
            <div style="color:#fff; font-weight:700; font-size:0.8rem;">${esc(u.name)}</div>
            <div style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono);">${esc(u.donorId || '#ZK-ASM-REG')} • Reg: ${esc(u.date || 'Active')}</div>
          </td>
          <td>
            <span class="blood-badge ${String(u.blood).includes('-') ? 'critical' : 'needed'}">${esc(u.blood)}</span>
          </td>
          <td style="color:#cbd5e1; font-size:0.72rem;">${esc(u.sector)}</td>
          <td>
            <span style="color:${u.status === 'Verified' ? '#10b981' : '#f59e0b'}; font-weight:700; font-size:0.68rem; display:inline-flex; align-items:center; gap:4px;">
              <span class="status-dot-pulse" style="background:${u.status === 'Verified' ? '#10b981' : '#f59e0b'}; width:5px; height:5px;"></span>
              ${u.status === 'Verified' ? 'Verified' : 'Pending Check'}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-approve-user" onclick="toggleUserVerify('${esc(u.id)}')" title="Toggle verification status" aria-label="Toggle user verification">
              ${u.status === 'Verified' ? 'Revoke' : 'Approve'}
            </button>
            <button class="btn-delete-user" onclick="deleteUserData('${esc(u.id)}')" title="Permanently delete this user record" aria-label="Delete citizen data record">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete Record
            </button>
          </td>
        </tr>
      `).join('');
    }

    let adminSearchTimer = null;
    function filterAdminDonors() {
      clearTimeout(adminSearchTimer);
      adminSearchTimer = setTimeout(() => {
        const input = document.getElementById('adminUserSearchInput');
        renderDonorsAuditTable(input ? input.value : '');
      }, 120);
    }

    function toggleUserVerify(userId) {
  if (!appState.adminLoggedIn) {
    showToast('This action is restricted to the administrator.', 'critical');
    return false;
  }
      const user = appState.registeredUsers.find(u => u.id === userId);
      if (!user) return;
      user.status = user.status === 'Verified' ? 'Pending Check' : 'Verified';
      if (typeof persistEntryAccounts === 'function') persistEntryAccounts();
      renderDonorsAuditTable(document.getElementById('adminUserSearchInput')?.value || '');
      playTone(user.status === 'Verified' ? 640 : 400, 'sine', 0.08);
      showToast(`Donor "${user.name}" status updated to ${user.status}.`);
    }

    const pendingDeletes = new Set();
    function deleteUserData(userId) {
  if (!appState.adminLoggedIn) {
    showToast('This action is restricted to the administrator.', 'critical');
    return false;
  }
      const user = appState.registeredUsers.find(u => u.id === userId);
      if (!user || pendingDeletes.has(userId)) return;

      const confirmed = confirm(
        `⚠️ PLATFORM OWNER PRIVILEGE: Permanent Data Erasure\n\n` +
        `Are you sure you want to permanently delete the user data for:\n` +
        `• Name: ${user.name}\n` +
        `• Blood Group: ${user.blood}\n` +
        `• Sector: ${user.sector}\n` +
        `• Donor ID: ${user.donorId}\n\n` +
        `This will permanently purge this citizen's medical clearance, donor card, and contact history from the VitalLink platform. This action is irreversible.`
      );

      if (!confirmed) return;
      pendingDeletes.add(userId);

      // Animate row removal smoothly
      const row = document.getElementById(`donor-row-${userId}`);
      if (row) {
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        row.style.background = 'rgba(255, 0, 60, 0.25)';
      }

      setTimeout(() => {
        if (!appState.adminLoggedIn) { pendingDeletes.delete(userId); return; }
        appState.registeredUsers = appState.registeredUsers.filter(u => u.id !== userId);
        appState.totalCitizenCount = Math.max(0, appState.totalCitizenCount - 1);
        pendingDeletes.delete(userId);
        if (typeof forgetCitizenCredentials === 'function') forgetCitizenCredentials(userId);
        renderAdminKPIs();

        // An erased record cannot keep an active session
        if (appState.currentCitizenDonor && appState.currentCitizenDonor.userId === userId) {
          appState.currentCitizenDonor = null;
          appState.citizenLoggedIn = false;
          if (typeof renderCitizenPortalState === 'function') renderCitizenPortalState();
        }

        renderDonorsAuditTable(document.getElementById('adminUserSearchInput')?.value || '');
        playAlarm();
        showToast(`🗑️ User data for "${user.name}" permanently purged from VitalLink by Platform Owner.`, 'critical');
      }, 250);
    }

/* 7. INVENTORY MATRIX */
    function renderInventoryGrid() {
      const grid = document.getElementById('inventoryGrid');
      if (!grid) return;
      grid.innerHTML = '';
      appState.inventory.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'inv-card' + (item.isRed ? ' low' : '');
        card.innerHTML = `
          <div class="inv-header">
            <span class="inv-type ${item.isRed ? 'red' : ''}">${item.type}</span>
            <span style="font-size: 0.65rem; color: ${item.isRed ? '#fb7185' : '#38bdf8'}; font-weight: 700;">${item.status}</span>
          </div>
          <div class="inv-count">${item.count} <span>Units</span></div>
          <div class="inv-controls">
            <button class="inv-btn minus" onclick="adjustStock(${idx}, -1)" aria-label="Decrease ${item.type} stock" ${item.count <= 0 ? 'disabled' : ''}>-</button>
            <button class="inv-btn" onclick="adjustStock(${idx}, 1)" aria-label="Increase ${item.type} stock">+</button>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function adjustStock(idx, delta) {
  if (!appState.adminLoggedIn) {
    showToast('This action is restricted to the administrator.', 'critical');
    return false;
  }
      const item = appState.inventory[idx];
      const step = Number(delta);
      if (!item || !Number.isFinite(step)) return;
      item.count = Math.max(0, item.count + step);
      applyInventoryStatus(item);
      playTone(delta > 0 ? 600 : 400, 'sine', 0.08, 0.05);
      renderInventoryGrid();
      if (typeof renderRegionalStockMatrix === 'function') {
        renderRegionalStockMatrix();
      }
    }

    function restockAll() {
  if (!appState.adminLoggedIn) {
    showToast('This action is restricted to the administrator.', 'critical');
    return false;
  }
      appState.inventory.forEach(item => {
        item.count = Math.max(item.count, INVENTORY_BASELINE_UNITS);
        applyInventoryStatus(item);
      });
      playChime();
      renderInventoryGrid();
      if (typeof renderRegionalStockMatrix === 'function') {
        renderRegionalStockMatrix();
      }
      showToast('All blood inventory restored to baseline!');
    }

    function adminBroadcastSos() {
  if (!appState.adminLoggedIn) {
    showToast('This action is restricted to the administrator.', 'critical');
    return false;
  }
      const hospEl = document.getElementById('sosHospitalSelect');
      const bloodEl = document.getElementById('sosBloodGroupSelect');
      const unitsEl = document.getElementById('sosUnitsInput');
      const notesEl = document.getElementById('sosNotes');

      const target = resolveFacility(hospEl ? hospEl.value : '');
      if (!target) {
        showToast('⚠️ Select a verified facility before broadcasting.', 'critical');
        return;
      }
      const blood = bloodEl && BLOOD_GROUPS.includes(bloodEl.value) ? bloodEl.value : target.emergencyNeed;
      const units = parseInt(unitsEl ? unitsEl.value : '', 10);
      if (!Number.isInteger(units) || units < 1 || units > 25) {
        showToast('⚠️ Units must be a whole number between 1 and 25.', 'critical');
        return;
      }
      const notes = (notesEl && notesEl.value.trim()) || 'Emergency transfusion dispatch';

      playAlarm();
      showToast(`🚨 PLATFORM BROADCAST: ${target.name} demands ${units}x ${blood}! Dispatched to Live Ops.`, 'critical');
      if (typeof logTerminal === 'function') {
        logTerminal(`[OWNER BROADCAST] ${target.name} authorized urgent dispatch: ${units}x ${blood} (${notes})`, 'alert');
      }

      if (typeof switchPortal === 'function') {
        switchPortal('ops');
      }
      if (window.innerWidth <= 768 && typeof switchMobileOpsTab === 'function') {
        switchMobileOpsTab('map');
      }

      if (typeof focusFacility === 'function') {
        // Map container needs the post-switch reflow before flyTo computes a sensible camera
        setTimeout(() => {
          focusFacility(target.id);
        }, 150);
      }
    }

    // Dynamic population of hospital dropdown in Platform Owner console
    function populateAdminHospitalSelect() {
      const select = document.getElementById('sosHospitalSelect');
      if (!select || typeof GLOBAL_FACILITIES === 'undefined') return;

      select.innerHTML = '';
      
      // Group by country / region
      const indiaGroup = document.createElement('optgroup');
      indiaGroup.label = '🇮🇳 India National Network';
      const globalGroup = document.createElement('optgroup');
      globalGroup.label = '🌐 International Healthcare Hubs';

      GLOBAL_FACILITIES.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.name} (${f.city})`;
        if (f.country === 'India') {
          indiaGroup.appendChild(opt);
        } else {
          globalGroup.appendChild(opt);
        }
      });

      select.appendChild(indiaGroup);
      select.appendChild(globalGroup);
    }

if (typeof window !== 'undefined') {
  window.handleAdminPortalClick = handleAdminPortalClick;
  window.openAdminAuthModal = openAdminAuthModal;
  window.closeAdminAuthModal = closeAdminAuthModal;
  window.submitAdminLogin = submitAdminLogin;
  window.quickFillDemoAdmin = quickFillDemoAdmin;
  window.adminLogout = adminLogout;
  window.renderDonorsAuditTable = renderDonorsAuditTable;
  window.filterAdminDonors = filterAdminDonors;
  window.toggleUserVerify = toggleUserVerify;
  window.deleteUserData = deleteUserData;
  window.renderInventoryGrid = renderInventoryGrid;
  window.adjustStock = adjustStock;
  window.restockAll = restockAll;
  window.adminBroadcastSos = adminBroadcastSos;
  window.populateAdminHospitalSelect = populateAdminHospitalSelect;
  window.renderAdminKPIs = renderAdminKPIs;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleAdminPortalClick,
    openAdminAuthModal,
    closeAdminAuthModal,
    submitAdminLogin,
    quickFillDemoAdmin,
    adminLogout,
    renderDonorsAuditTable,
    filterAdminDonors,
    toggleUserVerify,
    deleteUserData,
    renderInventoryGrid,
    adjustStock,
    restockAll,
    adminBroadcastSos,
    populateAdminHospitalSelect,
    renderAdminKPIs
  };
}

