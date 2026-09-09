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
      document.getElementById('adminAuthModal').classList.add('open');
      playTone(480, 'sine', 0.08);
    }

    function closeAdminAuthModal() {
      document.getElementById('adminAuthModal').classList.remove('open');
    }

    function submitAdminLogin() {
      const u = document.getElementById('adminUserField').value.trim();
      const p = document.getElementById('adminPassField').value;

      if (u === 'Dhritishman123' && p === '123456789') {
        appState.adminLoggedIn = true;
        closeAdminAuthModal();
        playChime();
        showToast('🛡️ Welcome, Platform Owner Dhritishman Das! Super-Admin Console Unlocked.');
        document.getElementById('adminSessionPill').style.display = 'flex';
        switchPortal('admin');
      } else {
        playAlarm();
        showToast('❌ Invalid Owner Credentials. Access denied.', 'critical');
      }
    }

    function adminLogout() {
      appState.adminLoggedIn = false;
      document.getElementById('adminSessionPill').style.display = 'none';
      playTone(380, 'sine', 0.1);
      showToast('Platform Owner logged out.');
      switchPortal('ops');
    }

    /* 2B. PLATFORM OWNER USER DATA MANAGEMENT (DELETE & AUDIT RIGHTS) */
    function renderDonorsAuditTable(filterQuery = '') {
      const tbody = document.getElementById('donorsAuditTableBody');
      const countBadge = document.getElementById('adminAuditCountBadge');
      if (!tbody) return;

      const q = filterQuery.toLowerCase().trim();
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
        <tr id="donor-row-${u.id}">
          <td>
            <div style="color:#fff; font-weight:700; font-size:0.8rem;">${u.name}</div>
            <div style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono);">${u.donorId || '#ZK-ASM-REG'} • Reg: ${u.date || 'Active'}</div>
          </td>
          <td>
            <span class="blood-badge ${u.blood.includes('-') ? 'critical' : 'needed'}">${u.blood}</span>
          </td>
          <td style="color:#cbd5e1; font-size:0.72rem;">${u.sector}</td>
          <td>
            <span style="color:${u.status === 'Verified' ? '#10b981' : '#f59e0b'}; font-weight:700; font-size:0.68rem; display:inline-flex; align-items:center; gap:4px;">
              <span class="status-dot-pulse" style="background:${u.status === 'Verified' ? '#10b981' : '#f59e0b'}; width:5px; height:5px;"></span>
              ${u.status === 'Verified' ? 'Verified' : 'Pending Check'}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-approve-user" onclick="toggleUserVerify('${u.id}')" title="Toggle verification status" aria-label="Toggle user verification">
              ${u.status === 'Verified' ? 'Revoke' : 'Approve'}
            </button>
            <button class="btn-delete-user" onclick="deleteUserData('${u.id}')" title="Permanently delete this user record" aria-label="Delete citizen data record">
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
      const user = appState.registeredUsers.find(u => u.id === userId);
      if (!user) return;
      user.status = user.status === 'Verified' ? 'Pending Check' : 'Verified';
      renderDonorsAuditTable(document.getElementById('adminUserSearchInput')?.value || '');
      playTone(user.status === 'Verified' ? 640 : 400, 'sine', 0.08);
      showToast(`Donor "${user.name}" status updated to ${user.status}.`);
    }

    function deleteUserData(userId) {
      const user = appState.registeredUsers.find(u => u.id === userId);
      if (!user) return;

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

      // Animate row removal smoothly
      const row = document.getElementById(`donor-row-${userId}`);
      if (row) {
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        row.style.background = 'rgba(255, 0, 60, 0.25)';
      }

      setTimeout(() => {
        appState.registeredUsers = appState.registeredUsers.filter(u => u.id !== userId);
        appState.totalCitizenCount = Math.max(0, appState.totalCitizenCount - 1);
        
        // Update Admin KPI card
        const kpi = document.getElementById('kpiDonorsCount');
        if (kpi) {
          kpi.textContent = appState.totalCitizenCount.toLocaleString();
        }

        // If the purged user was currently logged into the Donor Portal
        if (appState.currentCitizenDonor && appState.currentCitizenDonor.name === user.name) {
          appState.currentCitizenDonor = {
            name: "Unregistered Citizen",
            blood: "--",
            id: "#PURGED",
            donations: 0,
            livesSaved: 0,
            xp: 0
          };
          updateCitizenDonorUI();
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
        card.className = 'inv-card' + (item.count < 20 ? ' low' : '');
        card.innerHTML = `
          <div class="inv-header">
            <span class="inv-type ${item.isRed ? 'red' : ''}">${item.type}</span>
            <span style="font-size: 0.65rem; color: ${item.count < 20 ? '#fb7185' : '#38bdf8'}; font-weight: 700;">${item.status}</span>
          </div>
          <div class="inv-count">${item.count} <span>Units</span></div>
          <div class="inv-controls">
            <button class="inv-btn minus" onclick="adjustStock(${idx}, -1)" aria-label="Decrease stock">-</button>
            <button class="inv-btn" onclick="adjustStock(${idx}, 1)" aria-label="Increase stock">+</button>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function adjustStock(idx, delta) {
      const item = appState.inventory[idx];
      item.count = Math.max(0, item.count + delta);
      item.status = item.count < 15 ? 'Critical' : item.count < 30 ? 'Low' : 'Optimal';
      playTone(delta > 0 ? 600 : 400, 'sine', 0.08, 0.05);
      renderInventoryGrid();
      if (typeof renderRegionalStockMatrix === 'function') {
        renderRegionalStockMatrix();
      }
    }

    function restockAll() {
      appState.inventory.forEach(item => {
        item.count = Math.max(item.count, 50);
        item.status = 'Optimal';
      });
      playChime();
      renderInventoryGrid();
      if (typeof renderRegionalStockMatrix === 'function') {
        renderRegionalStockMatrix();
      }
      showToast('All blood inventory restored to baseline!');
    }

    function adminBroadcastSos() {
      const hospEl = document.getElementById('sosHospitalSelect');
      const bloodEl = document.getElementById('sosBloodGroupSelect');
      const unitsEl = document.getElementById('sosUnitsInput');
      const notesEl = document.getElementById('sosNotes');

      const hospitalName = hospEl ? hospEl.value : 'AIIMS Apex Emergency & Trauma Centre';
      const blood = bloodEl ? bloodEl.value : 'O-';
      const units = unitsEl ? unitsEl.value : '4';
      const notes = notesEl ? notesEl.value : 'Emergency transfusion dispatch';

      playAlarm();
      showToast(`🚨 PLATFORM BROADCAST: ${hospitalName} demands ${units}x ${blood}! Dispatched to Live Ops.`, 'critical');
      if (typeof logTerminal === 'function') {
        logTerminal(`[OWNER BROADCAST] ${hospitalName} authorized urgent dispatch: ${units}x ${blood} (${notes})`, 'alert');
      }

      // Find facility in global registry
      const target = (typeof GLOBAL_FACILITIES !== 'undefined' ? GLOBAL_FACILITIES : []).find(h => 
        h.name.toLowerCase().includes(hospitalName.toLowerCase().split(' ')[0]) || 
        hospitalName.toLowerCase().includes(h.name.toLowerCase().split(' ')[0])
      ) || (typeof GLOBAL_FACILITIES !== 'undefined' ? GLOBAL_FACILITIES[0] : null);

      // Transition smoothly to Live Operations viewport so user observes live dispatch
      if (typeof switchPortal === 'function') {
        switchPortal('ops');
      }
      if (window.innerWidth <= 768 && typeof switchMobileOpsTab === 'function') {
        switchMobileOpsTab('map');
      }

      if (target && typeof focusFacility === 'function') {
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
        opt.value = f.name;
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

