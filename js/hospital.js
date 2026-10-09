/* Browser-only prototype authentication. Hashes are placeholders, not server security. */
let hospitalSession = null;
let hospitalStorageAvailable = true;
let hospitalAccounts = [{name:'City Hospital',passHash:fnv1aHash('hospital123')}];
let hospitalRequests = [];
function hospitalIdentifiers(account) {
  return [account.name, account.email, account.phone].filter(Boolean).map(normalizeIdentifier);
}
function hospitalIdentifierInUse(identifier) {
  return hospitalAccounts.some(a => hospitalIdentifiers(a).includes(normalizeIdentifier(identifier)));
}
function persistHospitals() {
  try {
    window.sessionStorage.setItem('vitallink-hospitals-v1', JSON.stringify({accounts:hospitalAccounts,requests:hospitalRequests}));
    hospitalStorageAvailable = true;
  } catch (_) { hospitalStorageAvailable = false; }
  return hospitalStorageAvailable;
}
try {
  const saved = JSON.parse(window.sessionStorage.getItem('vitallink-hospitals-v1') || 'null');
  if (saved && Array.isArray(saved.accounts) && Array.isArray(saved.requests)) {
    hospitalAccounts = saved.accounts.filter(a => a && typeof a.name === 'string' && a.name.trim() && (typeof a.passHash === 'string' || typeof a.password === 'string')).map(a => ({
      name:a.name.trim(), email:typeof a.email === 'string' ? normalizeIdentifier(a.email) : '',
      phone:typeof a.phone === 'string' ? normalizeIdentifier(a.phone) : '',
      passHash:typeof a.passHash === 'string' ? a.passHash : fnv1aHash(a.password)
    }));
    hospitalRequests = saved.requests.filter(r => r && Number.isSafeInteger(r.id) && typeof r.hospital === 'string' && BLOOD_GROUPS.includes(r.blood) && Number.isInteger(r.units) && r.units >= 1 && r.units <= 1000 && ['Open','Closed'].includes(r.status) && typeof r.note === 'string');
    // Rewrite legacy records without raw passwords while preserving accounts and requests.
    persistHospitals();
  }
} catch (_) { hospitalStorageAvailable = false; }
function updateEntryAccountRole(){const hospital=entryEl('entryAccountRole').value==='hospital';entryEl('entryBlood').required=!hospital;entryEl('entryBlood').parentElement.hidden=hospital;entryEl('entryName').placeholder=hospital?'Hospital name':'Your full name';}
function loginHospital(identifier,password) {
  const matches = hospitalAccounts.filter(a => hospitalIdentifiers(a).includes(normalizeIdentifier(identifier)));
  if (matches.length !== 1 || citizenIdentifierInUse(identifier) || normalizeIdentifier(identifier) === normalizeIdentifier('Dhritishman123') || !password || matches[0].passHash !== fnv1aHash(password)) return false;
  hospitalSession = matches[0];
  appState.adminLoggedIn = false; appState.citizenLoggedIn = false; appState.currentCitizenDonor = null;
  hospitalSearch = ''; hospitalStatus = 'All';
  entryEl('entryPassword').value = ''; showHospitalDashboard(); return true;
}
function registerHospital() {
  const name=entryEl('entryName').value.trim(),email=normalizeIdentifier(entryEl('entryEmail').value),phone=normalizeIdentifier(entryEl('entryPhone').value),password=entryEl('entryNewPassword').value;
  if(!name || name.length>80 || !isPlausibleEmail(email) || !isPlausiblePhone(entryEl('entryPhone').value) || password.length<MIN_PASSWORD_LENGTH) {
    setEntryFeedback('Enter a hospital name of up to 80 characters, valid email and phone, and a password of at least 6 characters.',true);return false;
  }
  if(password!==entryEl('entryConfirmPassword').value){setEntryFeedback('The passwords do not match.',true);return false;}
  if([name,email,phone].some(identifierInUse)){setEntryFeedback('An account with this name, email or mobile number already exists. Use unique account details.',true);return false;}
  hospitalAccounts.push({name,email,phone,passHash:fnv1aHash(password)});
  const saved=persistHospitals();entryEl('entryRegisterForm').reset();updateEntryAccountRole();entryEl('entryIdentifier').value=email;
  showEntryView('login',saved?'Hospital account created. Sign in to open your hospital dashboard.':'Hospital account created for this page session. Browser storage is unavailable; the account will be lost on reload. Sign in now.');return true;
}
function hospitalText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
let hospitalTheme = 'dark';
try { if(localStorage.getItem('vitallink-hospital-theme')==='light') hospitalTheme='light'; } catch (_) {}
function applyHospitalTheme(){
 const panel=entryEl('hospitalWorkspace');panel.dataset.theme=hospitalTheme;
 const toggle=entryEl('hospitalThemeToggle');
 if(toggle){const light=hospitalTheme==='light';toggle.innerHTML=hospitalIcon(light?'moon':'sun')+'<span>'+(light?'Dark':'Light')+' theme</span>';toggle.setAttribute('aria-label','Switch to '+(light?'dark':'light')+' theme');toggle.setAttribute('aria-pressed',String(light));}
}
function toggleHospitalTheme(){hospitalTheme=hospitalTheme==='dark'?'light':'dark';try{localStorage.setItem('vitallink-hospital-theme',hospitalTheme);}catch(_){}applyHospitalTheme();}
let hospitalSearch = '';
let hospitalStatus = 'All';
function hospitalIcon(name){const paths={sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',moon:'M20 15a8 8 0 0 1-11-11 9 9 0 1 0 11 11Z',clock:'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',check:'M8 12l3 3 5-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',plus:'M12 5v14M5 12h14',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',drop:'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(paths[name]||paths.grid).split(' M').map((d,i)=>`<path d="${i?'M':''}${d}"/>`).join('')}</svg>`;}
function hospitalGo(id){entryEl(id).scrollIntoView({behavior:'smooth',block:'start'});if(id==='hospitalNew')entryEl('hospitalBlood').focus();}
function showHospitalDashboard(){
 entryEl('entryView').hidden=true;entryEl('appShell').hidden=true;entryEl('appShell').setAttribute('inert','');
 let panel=entryEl('hospitalWorkspace');if(!panel){panel=document.createElement('main');panel.id='hospitalWorkspace';document.body.appendChild(panel);}panel.hidden=false;
 const requests=hospitalRequests.filter(r=>r.hospital===hospitalSession.name),open=requests.filter(r=>r.status==='Open'),units=open.reduce((sum,r)=>sum+Number(r.units),0),closed=requests.filter(r=>r.status==='Closed').length;
 const groups=BLOOD_GROUPS.map(b=>({blood:b,units:open.filter(r=>r.blood===b).reduce((sum,r)=>sum+Number(r.units),0)})),max=Math.max(1,...groups.map(g=>g.units));
 panel.innerHTML=`<aside class="hp-sidebar"><a class="hp-brand" href="#hospital">${hospitalIcon('drop')}<span>VitalLink<small>HOSPITAL PORTAL</small></span></a><p class="hp-nav-label">WORKSPACE</p><nav aria-label="Hospital navigation"><button class="hp-nav active" onclick="hospitalGo('hospitalOverview')">${hospitalIcon('grid')}Overview</button><button class="hp-nav" onclick="hospitalGo('hospitalRecords')">${hospitalIcon('list')}Blood requests <span>${requests.length}</span></button><button class="hp-nav" onclick="hospitalGo('hospitalNew')">${hospitalIcon('plus')}New request</button></nav><div class="hp-sidebar-bottom"><span class="hp-avatar">H</span><div><strong>${hospitalText(hospitalSession.name)}</strong><small>Hospital workspace</small></div></div><button class="hp-signout" onclick="logoutHospital()">Sign out ↗</button></aside>
 <div class="hp-main"><header class="hp-topbar"><label class="hp-search">${hospitalIcon('search')}<input id="hospitalSearch" type="search" placeholder="Search blood group or note…" aria-label="Search blood requests" value="${hospitalText(hospitalSearch)}" oninput="hospitalSearch=this.value;renderHospitalRows()"></label><div class="hp-top-actions"><button id="hospitalThemeToggle" class="hp-theme-toggle" type="button" onclick="toggleHospitalTheme()" aria-label="Switch to light theme"></button><details class="hp-notifications"><summary aria-label="Notifications">${hospitalIcon('bell')}</summary><div class="hp-popover"><strong>Notifications</strong><p>No live notifications are connected.</p><small>Review open requests below.</small></div></details><details class="hp-profile"><summary><span class="hp-avatar">H</span><span>${hospitalText(hospitalSession.name)}<small>Hospital account</small></span></summary><div class="hp-popover"><strong>${hospitalText(hospitalSession.name)}</strong><p>${hospitalText(hospitalSession.email||'Hospital demo account')}</p><button class="hp-secondary" onclick="logoutHospital()">Sign out</button></div></details></div></header>
 <div class="hp-content" id="hospitalOverview"><div class="hp-page-heading"><div><p class="hp-eyebrow">BLOOD COORDINATION</p><h1>Hospital overview</h1><p>Manage blood requests for ${hospitalText(hospitalSession.name)}.</p></div><button class="hp-primary" onclick="hospitalGo('hospitalNew')">${hospitalIcon('plus')}New blood request</button></div>
 <div class="hp-kpis">${[['Open requests',open.length,'Awaiting coordination'],['Units requested',units,'Across open requests'],['Closed requests',closed,'Marked closed by your team'],['Total requests',requests.length,'All request records']].map((k,i)=>`<section class="hp-card hp-kpi"><div><span>${k[0]}</span><span class="hp-kpi-icon">${hospitalIcon(i===1?'drop':'list')}</span></div><strong>${k[1]}</strong><small>${k[2]}</small></section>`).join('')}</div>
 <div class="hp-grid"><section class="hp-card hp-demand"><div class="hp-section-heading"><div><h2>Open demand by blood group</h2><p>Units requested · current open requests</p></div><span class="hp-info">${units} units</span></div><div class="hp-chart" role="img" aria-label="${groups.map(g=>g.blood+': '+g.units+' units').join(', ')}">${groups.map(g=>`<div class="hp-chart-column"><strong>${g.units}</strong><div class="hp-bar-track"><div class="hp-bar" style="height:${g.units/max*100}%"></div></div><span>${g.blood}</span></div>`).join('')}</div><div class="hp-chart-caption"><span class="hp-dot"></span>${units?'Open requests only; closed requests are excluded.':'No open demand. Create a request to see it here.'}</div></section>
 <section class="hp-card hp-new" id="hospitalNew"><h2>New blood request</h2><p>Add the blood group and units needed.</p><form onsubmit="event.preventDefault();createHospitalRequest()"><div class="hp-form-grid"><div><label for="hospitalBlood">Blood group</label><select id="hospitalBlood">${BLOOD_GROUPS.map(b=>`<option>${b}</option>`).join('')}</select></div><div><label for="hospitalUnits">Units needed</label><input id="hospitalUnits" type="number" min="1" max="1000" required value="1"></div></div><label for="hospitalNote">Request note <span>(optional)</span></label><input id="hospitalNote" maxlength="200" placeholder="Add a reference or coordination note"><button class="hp-primary" type="submit">${hospitalIcon('plus')}Create request</button></form></section></div>
 <section class="hp-card hp-records" id="hospitalRecords"><div class="hp-section-heading"><div><h2>Blood requests</h2><p>Review and update your hospital’s requests.</p></div><label class="hp-filter">Status <select id="hospitalStatus" onchange="hospitalStatus=this.value;renderHospitalRows()">${['All','Open','Closed'].map(s=>`<option${hospitalStatus===s?' selected':''}>${s}</option>`).join('')}</select></label></div><div class="hp-table-wrap"><table><caption class="hp-sr-only">Your hospital blood requests</caption><thead><tr><th scope="col">Blood group</th><th scope="col">Units needed</th><th scope="col">Request note</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody id="hospitalRows"></tbody></table></div><div id="hospitalResultCount" class="hp-table-footer" aria-live="polite"></div></section>
 <footer class="hp-disclaimer"><span class="hp-info">Prototype</span> ${hospitalStorageAvailable ? 'Requests stay in this browser tab.' : 'Browser storage is unavailable. Changes are temporary and will be lost on reload.'} No real notifications are sent.</footer></div></div>`;
 applyHospitalTheme();renderHospitalRows();entrySetHash('#hospital',true);
}
function renderHospitalRows(){
 const all=hospitalRequests.filter(r=>r.hospital===hospitalSession.name),query=hospitalSearch.trim().toLowerCase();
 const rows=all.filter(r=>(hospitalStatus==='All'||r.status===hospitalStatus)&&`${r.blood} ${r.note} ${r.status}`.toLowerCase().includes(query));
 entryEl('hospitalRows').innerHTML=rows.length?rows.map(r=>`<tr><td><span class="hp-blood">${hospitalText(r.blood)}</span></td><td><strong>${r.units}</strong> <span class="hp-muted">units</span></td><td class="hp-note">${hospitalText(r.note)||'<span class="hp-muted">No note added</span>'}</td><td><span class="hp-status ${r.status==='Open'?'hp-open':'hp-closed'}">${hospitalIcon(r.status==='Open'?'clock':'check')}${hospitalText(r.status)}</span></td><td><button class="hp-secondary" aria-label="${r.status==='Open'?'Close':'Reopen'} ${hospitalText(r.blood)} request for ${r.units} units" onclick="toggleHospitalRequest(${r.id})">${r.status==='Open'?'Close request':'Reopen'}</button></td></tr>`).join(''):`<tr><td colspan="5" class="hp-empty"><strong>${all.length?'No matching requests':'No blood requests yet'}</strong><p>${all.length?'Try a different search or status filter.':'Use the form above to create your first blood request.'}</p></td></tr>`;
 entryEl('hospitalResultCount').textContent=`Showing ${rows.length} of ${all.length} requests`;
}
function createHospitalRequest(){if(!hospitalSession)return;const units=Number(entryEl('hospitalUnits').value);if(!Number.isInteger(units)||units<1||units>1000||!BLOOD_GROUPS.includes(entryEl('hospitalBlood').value))return;hospitalRequests.push({id:Math.max(Date.now(), ...hospitalRequests.map(r=>r.id+1)),hospital:hospitalSession.name,blood:entryEl('hospitalBlood').value,units,note:entryEl('hospitalNote').value,status:'Open'});persistHospitals();showHospitalDashboard();}
function toggleHospitalRequest(id){if(!hospitalSession)return;const r=hospitalRequests.find(r=>r.id===id&&r.hospital===hospitalSession.name);if(r){r.status=r.status==='Open'?'Closed':'Open';persistHospitals();showHospitalDashboard();}}
function logoutHospital(){hospitalSession=null;entryEl('hospitalWorkspace').hidden=true;showEntryView('login','You have signed out.',true);}
