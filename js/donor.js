/* ==========================================================
   3. CITIZEN & DONOR HUB (GATE, RECOMMENDATIONS & SEARCH)
   ========================================================== */
/* 3. CITIZEN & DONOR HUB ARCHITECTURE (LOGIN GATE, SMART RECOMMENDATIONS & DISCOVERY) */
    function handleDonorPortalClick() {
      switchPortal('donor');
      renderCitizenPortalState();
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

      if (tab === 'register') {
        regBtn.classList.add('active');
        logBtn.classList.remove('active');
        regForm.style.display = 'flex';
        logForm.style.display = 'none';
      } else {
        logBtn.classList.add('active');
        regBtn.classList.remove('active');
        logForm.style.display = 'flex';
        regForm.style.display = 'none';
      }
      playTone(450, 'sine', 0.06);
    }

    function submitGateRegister() {
      const name = document.getElementById('gateRegName').value.trim();
      const blood = document.getElementById('gateRegBlood').value;
      const sector = document.getElementById('gateRegSector').value;
      const phone = document.getElementById('gateRegPhone').value.trim();
      const pass = document.getElementById('gateRegPass').value;

      if (!name) {
        showToast('Please enter your full name.', 'critical');
        return;
      }

      const randomNum = Math.floor(100 + Math.random() * 900);
      const tokenId = `#ZK-ASM-${randomNum}-GHY`;

      appState.currentCitizenDonor = {
        name: name,
        blood: blood,
        sector: sector,
        id: tokenId,
        donations: 0,
        livesSaved: 0,
        xp: 1000
      };
      appState.citizenLoggedIn = true;

      // Add to registered users registry for Platform Owner oversight
      const newUser = {
        id: 'usr-' + Date.now(),
        name: name,
        blood: blood,
        sector: sector,
        donorId: tokenId,
        status: 'Verified',
        date: 'Today',
        unitsDonated: 0
      };
      appState.registeredUsers.unshift(newUser);
      appState.totalCitizenCount += 1;

      const kpi = document.getElementById('kpiDonorsCount');
      if (kpi) kpi.textContent = appState.totalCitizenCount.toLocaleString();
      renderDonorsAuditTable();

      renderCitizenPortalState();
      playChime();
      showToast(`🎉 Welcome, ${name}! Encrypted profile created under Zero Data Leakage protection.`);
    }

    function submitGateLogin() {
      const userIdent = document.getElementById('gateLoginUser').value.trim();
      const pass = document.getElementById('gateLoginPass').value;

      // Check registered users or default to realistic citizen
      let matched = appState.registeredUsers.find(u => 
        u.name.toLowerCase().includes(userIdent.toLowerCase()) || 
        (u.donorId && u.donorId.toLowerCase() === userIdent.toLowerCase())
      );

      if (!matched && appState.registeredUsers.length > 0) {
        matched = appState.registeredUsers[0];
      }

      const name = matched ? matched.name : (userIdent || 'Arjun Verma');
      const blood = matched ? matched.blood : 'B+';
      const sector = matched ? matched.sector : 'Bhangagarh, Guwahati';
      const tokenId = matched ? matched.donorId : '#ZK-ASM-772-GHY';

      appState.currentCitizenDonor = {
        name: name,
        blood: blood,
        sector: sector,
        id: tokenId,
        donations: 4,
        livesSaved: 12,
        xp: 15000
      };
      appState.citizenLoggedIn = true;

      renderCitizenPortalState();
      playChime();
      showToast(`🔓 Welcome back, ${name} (${blood})! Donor Hub unlocked.`);
    }

    function quickFillCitizen(name, blood, sector, scopeId) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const prefix = scopeId ? scopeId.slice(0, 3).toUpperCase() : 'NET';
      const tokenId = `#ZK-${prefix}-${randomNum}`;

      appState.currentCitizenDonor = {
        name: name,
        blood: blood,
        sector: sector,
        scopeId: scopeId || appState.currentScopeId || 'india',
        id: tokenId,
        donations: blood === 'O-' ? 8 : 3,
        livesSaved: blood === 'O-' ? 24 : 9,
        xp: blood === 'O-' ? 32000 : 12000
      };
      appState.citizenLoggedIn = true;

      // Ensure user is in directory
      if (!appState.registeredUsers.some(u => u.name === name)) {
        appState.registeredUsers.unshift({
          id: 'usr-' + Date.now(),
          name: name,
          blood: blood,
          sector: sector,
          donorId: tokenId,
          status: 'Verified',
          date: 'Active',
          unitsDonated: blood === 'O-' ? 8 : 3
        });
        renderDonorsAuditTable();
      }

      renderCitizenPortalState();
      playChime();
      showToast(`⚡ Profile loaded: ${name} (${blood}) • Zero-Leak Session active.`);
    }

    function citizenLogout() {
      appState.citizenLoggedIn = false;
      appState.currentCitizenDonor = null;
      renderCitizenPortalState();
      playTone(380, 'sine', 0.1);
      showToast('🔒 Citizen session logged out. Data encrypted and closed.');
    }

    function selfDeleteCitizenData() {
      if (!appState.currentCitizenDonor) return;
      const citizenName = appState.currentCitizenDonor.name;

      const confirmed = confirm(
        `⚠️ ZERO-LEAK PRIVILEGE: Right to Erasure / Delete My Data\n\n` +
        `Are you sure you want to permanently delete your citizen donor profile for "${citizenName}"?\n\n` +
        `This will permanently purge your digital donor card, blood group records, and medical appointment tokens from the VitalLink database. This action is irreversible.`
      );

      if (!confirmed) return;

      // Purge from registered users list
      appState.registeredUsers = appState.registeredUsers.filter(u => u.name !== citizenName);
      appState.totalCitizenCount = Math.max(0, appState.totalCitizenCount - 1);
      const kpi = document.getElementById('kpiDonorsCount');
      if (kpi) kpi.textContent = appState.totalCitizenCount.toLocaleString();
      renderDonorsAuditTable();

      appState.currentCitizenDonor = null;
      appState.citizenLoggedIn = false;
      renderCitizenPortalState();

      playAlarm();
      showToast(`🗑️ Your citizen profile has been permanently purged under Zero-Leak Right to Erasure.`, 'critical');
    }

    function updateCitizenDonorUI() {
      if (!appState.currentCitizenDonor) return;
      const c = appState.currentCitizenDonor;

      const authName = document.getElementById('authCitizenName');
      if (authName) authName.textContent = c.name;
      const authBlood = document.getElementById('authCitizenBlood');
      if (authBlood) authBlood.textContent = c.blood;
      const authToken = document.getElementById('authCitizenToken');
      if (authToken) authToken.textContent = c.id;

      const cardName = document.getElementById('donorCardName');
      if (cardName) cardName.textContent = c.name;
      const cardBlood = document.getElementById('donorCardBlood');
      if (cardBlood) cardBlood.textContent = c.blood;
      const cardTier = document.getElementById('donorCardTier');
      if (cardTier) cardTier.textContent = `Verified Citizen • ${c.sector || (c.city ? `${c.city}, ${c.country}` : 'Global Network')}`;
      const cardCouncil = document.getElementById('donorCardCouncil');
      if (cardCouncil) {
        cardCouncil.textContent = c.scopeId && typeof GEOGRAPHIC_SCOPES !== 'undefined' && GEOGRAPHIC_SCOPES[c.scopeId] ?
          `Blood Transfusion Authority • ${GEOGRAPHIC_SCOPES[c.scopeId].name}` :
          'Global Blood Transfusion Network';
      }
      const cardBadge = document.getElementById('donorCardBadgeId');
      if (cardBadge) cardBadge.textContent = `DONOR ID: ${c.id}`;
      const cardDonations = document.getElementById('donorDonationsCount');
      if (cardDonations) cardDonations.textContent = c.donations;
      const cardLives = document.getElementById('donorLivesSaved');
      if (cardLives) cardLives.textContent = c.livesSaved;
      const cardXp = document.getElementById('donorXpScore');
      if (cardXp) cardXp.textContent = (c.donations >= 5 ? 'Priority Universal Donor' : c.donations >= 2 ? 'Active Regular Donor' : 'Verified Registered Citizen');
    }

    /* 3B. CITIZEN CARD TOKEN MANAGEMENT */
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

    /* 3C. SMART AUTOMATED RECOMMENDATION ENGINE */
    function updateSmartRecommendation() {
      const container = document.getElementById('smartRecommendationContent');
      if (!container) return;

      const c = appState.currentCitizenDonor;
      const blood = c ? c.blood : 'O-';
      const scopedFacilities = typeof getFacilitiesForScope === 'function' ? getFacilitiesForScope(appState.currentScopeId) : GLOBAL_FACILITIES;
      
      // Find facility in current scope with matching urgent need or critical status
      let target = scopedFacilities.find(f => f.emergencyNeed === blood && f.urgency === 'critical');
      if (!target) target = scopedFacilities.find(f => f.urgency === 'critical');
      if (!target) target = scopedFacilities.find(f => f.emergencyNeed === blood);
      if (!target && scopedFacilities.length > 0) target = scopedFacilities[0];
      if (!target) target = GLOBAL_FACILITIES[0];

      const isCritical = target.urgency === 'critical';
      const badgeClass = blood.includes('-') ? 'critical' : 'needed';

      container.innerHTML = `
        <div style="display: flex; gap: 0.85rem; align-items: center;">
          <div class="blood-badge-avatar ${badgeClass}">${blood}</div>
          <div>
            <div style="font-size: 0.88rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 6px;">
              <span class="status-dot-pulse" style="background: ${isCritical ? 'var(--color-danger)' : 'var(--color-primary)'};"></span>
              ${isCritical ? 'Urgent Transfusion Shortage' : 'Transfusion Reserve Priority'}: ${target.name}
            </div>
            <div style="font-size: 0.72rem; color: #cbd5e1; margin-top: 3px; line-height: 1.4;">
              📍 ${target.city}, ${target.country} • ${target.emergencyStatus}. Transfusion bank requests <strong style="color:${isCritical ? '#fb7185' : '#38bdf8'};">${target.unitsNeeded} units of ${target.emergencyNeed}</strong>. Your ${blood} profile is matched with top priority for immediate dispatch routing (${target.dist || 'Direct Transit Corridor'}).
            </div>
          </div>
        </div>
      `;
    }

    function acceptSmartRecommendation() {
      const c = appState.currentCitizenDonor;
      const blood = c ? c.blood : 'O-';
      const scopedFacilities = typeof getFacilitiesForScope === 'function' ? getFacilitiesForScope(appState.currentScopeId) : GLOBAL_FACILITIES;
      let target = scopedFacilities.find(f => f.emergencyNeed === blood && f.urgency === 'critical');
      if (!target) target = scopedFacilities.length > 0 ? scopedFacilities[0] : GLOBAL_FACILITIES[0];

      dispatchRequest(target.name, blood, 'Rapid Courier 2B');
      playChime();
      showToast(`⚡ Match Accepted! Ambulance Courier 2B dispatched to connect you with ${target.name}.`, 'critical');
    }

    /* 3D. LIVE BLOOD DISCOVERY & HOSPITAL STOCK SEARCH */
    function setBloodFilter(filter) {
      appState.activeBloodFilter = filter;
      document.querySelectorAll('.blood-filter-btn').forEach(btn => {
        const text = String(btn.textContent || '').trim();
        btn.classList.toggle('active', text.includes(filter) || (filter === 'ALL' && text.toLowerCase().includes('all')));
      });
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
      const filter = appState.activeBloodFilter;

      // Unify with GLOBAL_FACILITIES across India and Global Hubs
      const facilities = (typeof GLOBAL_FACILITIES !== 'undefined' ? GLOBAL_FACILITIES : []).filter(h => {
        const matchesScope = appState.currentScopeId === 'world' ? true : (appState.currentScopeId === 'india' ? h.country === 'India' : h.scopeId === appState.currentScopeId);
        const matchesQuery = !q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q) || h.country.toLowerCase().includes(q) || (h.type && h.type.toLowerCase().includes(q));
        const matchesBlood = filter === 'ALL' ? true : (h.stock && h.stock[filter] !== undefined);
        return matchesQuery && matchesBlood;
      });

      if (facilities.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.75rem;">No medical centres found matching search criteria in current scope.</div>`;
        return;
      }

      grid.innerHTML = facilities.map(h => {
        let stockDisplay = '';
        let isLow = false;

        if (filter === 'ALL') {
          const totalUnits = h.stock ? Object.values(h.stock).reduce((a, b) => a + b, 0) : 0;
          stockDisplay = `<span style="color: #fff; font-weight: 800;">${totalUnits} Units Total</span> • Central Facility Stock`;
        } else {
          const units = (h.stock && h.stock[filter] !== undefined) ? h.stock[filter] : 0;
          isLow = units < 8;
          stockDisplay = `<span style="color: ${isLow ? '#fb7185' : '#34d399'}; font-weight: 800; font-size: 0.88rem;">${units} Units of ${filter}</span> ${isLow ? '(CRITICAL DEFICIT)' : '(AVAILABLE)'}`;
        }

        return `
          <div class="hospital-stock-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div style="font-weight: 800; color: #fff; font-size: 0.82rem;">${h.name}</div>
                <span style="font-size: 0.65rem; color: #38bdf8; font-weight: 700; background: rgba(14,165,233,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(14,165,233,0.25);">${h.dist || 'Verified Node'}</span>
              </div>
              <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 6px;">📍 ${h.city}, ${h.country} • ${h.emergencyStatus}</div>
              <div style="font-size: 0.72rem; margin: 4px 0;">
                ${stockDisplay}
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
              <button class="dispatch-btn" style="background: rgba(225, 29, 72, 0.15); border-color: rgba(225, 29, 72, 0.4); color: #fb7185; font-size: 0.68rem; padding: 5px 10px;" onclick="requestHospitalBlood('${h.name.replace(/'/g, "\\'")}', '${filter === 'ALL' ? (appState.currentCitizenDonor?.blood || 'O-') : filter}')">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                Request Units
              </button>
              <button class="btn-approve-user" style="font-size: 0.68rem; padding: 5px 10px;" onclick="selectFacilityToSchedule('${h.name.replace(/'/g, "\\'")}')">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Schedule Donation
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function selectFacilityToSchedule(facilityName) {
      const select = document.getElementById('schedFacility');
      if (select) {
        let found = false;
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].text.toLowerCase().includes(facilityName.split(' ')[0].toLowerCase())) {
            select.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          const opt = document.createElement('option');
          opt.value = facilityName;
          opt.textContent = facilityName;
          select.prepend(opt);
          select.selectedIndex = 0;
        }
        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      playTone(550, 'sine', 0.08);
      showToast(`Selected "${facilityName}" for donation appointment.`);
    }

    function requestHospitalBlood(hospName, bloodGroup) {
      playAlarm();
      showToast(`🚨 Emergency Blood Request Dispatched to ${hospName} for ${bloodGroup} units! Priority transport alerted.`, 'critical');
      if (typeof logTerminal === 'function') {
        logTerminal(`[PATIENT REQUEST] Priority supply order sent to ${hospName} (${bloodGroup})`, 'alert');
      }
      
      const hosp = GLOBAL_FACILITIES.find(h => hospName.toLowerCase().includes(h.name.toLowerCase().split(' ')[0]) || h.name.toLowerCase().includes(hospName.toLowerCase().split(' ')[0]));
      if (hosp && typeof focusFacility === 'function') {
        focusFacility(hosp.id);
      }
    }

/* 8. CITIZEN ACTIONS & APPOINTMENT BOOKING */
    function acceptDonorMatch(hospitalName) {
      playChime();
      if (appState.currentCitizenDonor) {
        appState.currentCitizenDonor.donations = (appState.currentCitizenDonor.donations || 0) + 1;
        appState.currentCitizenDonor.livesSaved = (appState.currentCitizenDonor.livesSaved || 0) + 3;
        updateCitizenDonorUI();
      }
      if (typeof renderRegionalStockMatrix === 'function') {
        renderRegionalStockMatrix();
      }

      const btn = document.getElementById('btnAcceptMatch');
      if (btn) {
        btn.textContent = '✓ Match Confirmed — Courier En-Route';
        btn.style.background = '#10b981';
      }

      showToast(`🎉 Match Confirmed! Priority courier dispatched for donor transport.`);
      if (typeof logTerminal === 'function') {
        logTerminal(`[DONOR MATCH] ${appState.currentCitizenDonor?.name || 'Citizen'} accepted dispatch for ${hospitalName}`, 'highlight');
      }

      const hosp = GLOBAL_FACILITIES.find(h => hospitalName.toLowerCase().includes(h.name.toLowerCase().split(' ')[0]));
      if (hosp && typeof focusFacility === 'function') {
        focusFacility(hosp.id);
      }
    }

    function bookAppointment() {
      const facilityEl = document.getElementById('schedFacility');
      const dateEl = document.getElementById('schedDate');
      const facilityName = facilityEl ? facilityEl.value : 'Selected Medical Centre';
      const appointmentDate = dateEl ? dateEl.value : 'Upcoming Slot';

      playChime();
      showToast(`✓ Appointment Confirmed at ${facilityName} for ${appointmentDate}! QR Pass Generated.`);
      if (typeof logTerminal === 'function') {
        logTerminal(`[APPOINTMENT] Verified donation scheduled at ${facilityName} (${appointmentDate})`, 'highlight');
      }
    }

/* 9. MODAL AUTHENTICATION HANDLERS (SEAMLESS CITIZEN REGISTRATION & LOGIN) */
    function openUserAuthModal() {
      const modal = document.getElementById('userAuthModal');
      if (modal) modal.classList.add('open');
      playTone(480, 'sine', 0.08);
    }

    function closeUserAuthModal() {
      const modal = document.getElementById('userAuthModal');
      if (modal) modal.classList.remove('open');
    }

    function switchAuthTab(tab) {
      const regTab = document.getElementById('tabRegister');
      const logTab = document.getElementById('tabLogin');
      const regForm = document.getElementById('formRegister');
      const logForm = document.getElementById('formLogin');

      if (tab === 'register') {
        if (regTab) regTab.classList.add('active');
        if (logTab) logTab.classList.remove('active');
        if (regForm) regForm.style.display = 'flex';
        if (logForm) logForm.style.display = 'none';
      } else {
        if (logTab) logTab.classList.add('active');
        if (regTab) regTab.classList.remove('active');
        if (logForm) logForm.style.display = 'flex';
        if (regForm) regForm.style.display = 'none';
      }
      playTone(450, 'sine', 0.06);
    }

    function submitUserRegister() {
      const name = document.getElementById('regName')?.value.trim() || 'Tanvi Kulkarni';
      const blood = document.getElementById('regBlood')?.value || 'O-';
      const randomNum = Math.floor(100 + Math.random() * 900);
      const tokenId = `#ZK-NAT-${randomNum}`;

      appState.currentCitizenDonor = {
        name: name,
        blood: blood,
        sector: 'National Health Sector',
        id: tokenId,
        donations: 1,
        livesSaved: 3,
        xp: 1500
      };
      appState.citizenLoggedIn = true;

      appState.registeredUsers.unshift({
        id: 'usr-' + Date.now(),
        name: name,
        blood: blood,
        sector: 'National Registry',
        donorId: tokenId,
        status: 'Verified',
        date: 'Today',
        unitsDonated: 1
      });
      appState.totalCitizenCount += 1;

      closeUserAuthModal();
      switchPortal('donor');
      renderCitizenPortalState();
      playChime();
      showToast(`🎉 Welcome, ${name}! Certified donor credentials activated under Zero Data Leakage.`);
    }

    function submitUserLogin() {
      const email = document.getElementById('loginEmail')?.value.trim() || 'ananya@vitallink.org';
      const matched = appState.registeredUsers.find(u => u.name.toLowerCase().includes(email.toLowerCase())) || appState.registeredUsers[0];

      appState.currentCitizenDonor = {
        name: matched ? matched.name : 'Ananya Sen',
        blood: matched ? matched.blood : 'A+',
        sector: matched ? matched.sector : 'Registered Medical Hub',
        id: matched ? matched.donorId : '#ZK-NAT-402',
        donations: 4,
        livesSaved: 12,
        xp: 12000
      };
      appState.citizenLoggedIn = true;

      closeUserAuthModal();
      switchPortal('donor');
      renderCitizenPortalState();
      playChime();
      showToast(`🔓 Welcome back, ${appState.currentCitizenDonor.name} (${appState.currentCitizenDonor.blood})! Citizen Portal active.`);
    }

    function quickFillDemoUser() {
      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPass');
      if (emailInput) emailInput.value = 'ananya.sen@vitallink.org';
      if (passInput) passInput.value = '••••••••••••';
      playTone(520, 'sine', 0.05);
      showToast('⚡ Demo credentials filled (Ananya Sen, A+). Click Sign In.');
    }
