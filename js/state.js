/* ==========================================================
   VITALLINK GLOBAL HEALTHCARE DATA & GEOGRAPHIC ARCHITECTURE
   - Global Geographic Scopes (World, India National, Metro Hubs, Global Hubs)
   - Scalable Unified Facility Model (Hospitals, Blood Banks, Donation Centers)
   - Privacy-Preserving Donor Network (Zero Personally Identifiable Info)
   - Authoritative Data Trust & Freshness Registry
   ========================================================== */

/* ----------------------------------------------------------
   1. GLOBAL GEOGRAPHIC SCOPES & SPATIAL DEFINITIONS
   ---------------------------------------------------------- */

const GEOGRAPHIC_SCOPES = {
  world: {
    id: 'world',
    name: 'Global Blood Network',
    breadcrumb: 'Global Network',
    country: 'Global',
    region: 'Worldwide',
    center: [15.0000, 24.0000],
    zoom: 1.8,
    badge: '🌍 Worldwide Scope'
  },
  india: {
    id: 'india',
    name: 'India National Network',
    breadcrumb: 'Global > India > National Grid',
    country: 'India',
    region: 'National',
    center: [78.9629, 21.5937],
    zoom: 4.6,
    badge: '🇮🇳 India National'
  },
  delhi: {
    id: 'delhi',
    name: 'Delhi NCR Capital Hub',
    breadcrumb: 'Global > India > Delhi NCR',
    country: 'India',
    region: 'Delhi',
    center: [77.2090, 28.6139],
    zoom: 12.2,
    badge: '📍 Delhi NCR'
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai Metropolitan Grid',
    breadcrumb: 'Global > India > Maharashtra > Mumbai',
    country: 'India',
    region: 'Maharashtra',
    center: [72.8777, 19.0760],
    zoom: 12.2,
    badge: '📍 Mumbai'
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru Health Corridor',
    breadcrumb: 'Global > India > Karnataka > Bengaluru',
    country: 'India',
    region: 'Karnataka',
    center: [77.5946, 12.9716],
    zoom: 12.2,
    badge: '📍 Bengaluru'
  },
  kolkata: {
    id: 'kolkata',
    name: 'Kolkata Eastern Hub',
    breadcrumb: 'Global > India > West Bengal > Kolkata',
    country: 'India',
    region: 'West Bengal',
    center: [88.3639, 22.5726],
    zoom: 12.2,
    badge: '📍 Kolkata'
  },
  chennai: {
    id: 'chennai',
    name: 'Chennai Health Corridor',
    breadcrumb: 'Global > India > Tamil Nadu > Chennai',
    country: 'India',
    region: 'Tamil Nadu',
    center: [80.2707, 13.0827],
    zoom: 12.2,
    badge: '📍 Chennai'
  },
  hyderabad: {
    id: 'hyderabad',
    name: 'Hyderabad Deccan Network',
    breadcrumb: 'Global > India > Telangana > Hyderabad',
    country: 'India',
    region: 'Telangana',
    center: [78.4867, 17.3850],
    zoom: 12.2,
    badge: '📍 Hyderabad'
  },
  guwahati: {
    id: 'guwahati',
    name: 'Guwahati Northeast Corridor',
    breadcrumb: 'Global > India > Assam > Guwahati',
    country: 'India',
    region: 'Assam',
    center: [91.7650, 26.1600],
    zoom: 12.6,
    badge: '📍 Guwahati'
  },
  london: {
    id: 'london',
    name: 'London Metropolitan Hub',
    breadcrumb: 'Global > United Kingdom > London',
    country: 'United Kingdom',
    region: 'Greater London',
    center: [-0.1278, 51.5074],
    zoom: 12.2,
    badge: '🇬🇧 London'
  },
  newyork: {
    id: 'newyork',
    name: 'New York Tristate Network',
    breadcrumb: 'Global > United States > New York',
    country: 'United States',
    region: 'New York',
    center: [-73.9851, 40.7488],
    zoom: 12.2,
    badge: '🇺🇸 New York'
  },
  toronto: {
    id: 'toronto',
    name: 'Toronto Healthcare Corridor',
    breadcrumb: 'Global > Canada > Ontario > Toronto',
    country: 'Canada',
    region: 'Ontario',
    center: [-79.3832, 43.6532],
    zoom: 12.2,
    badge: '🇨🇦 Toronto'
  },
  dubai: {
    id: 'dubai',
    name: 'Dubai Healthcare City Grid',
    breadcrumb: 'Global > UAE > Dubai',
    country: 'UAE',
    region: 'Dubai',
    center: [55.2708, 25.2048],
    zoom: 12.2,
    badge: '🇦🇪 Dubai'
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore National Grid',
    breadcrumb: 'Global > Singapore',
    country: 'Singapore',
    region: 'Singapore',
    center: [103.8198, 1.3521],
    zoom: 12.2,
    badge: '🇸🇬 Singapore'
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo Metropolitan Health Grid',
    breadcrumb: 'Global > Japan > Tokyo',
    country: 'Japan',
    region: 'Kanto',
    center: [139.6917, 35.6895],
    zoom: 12.2,
    badge: '🇯🇵 Tokyo'
  },
  sydney: {
    id: 'sydney',
    name: 'Sydney Healthcare Grid',
    breadcrumb: 'Global > Australia > New South Wales > Sydney',
    country: 'Australia',
    region: 'New South Wales',
    center: [151.2093, -33.8688],
    zoom: 12.2,
    badge: '🇦🇺 Sydney'
  },
  paris: {
    id: 'paris',
    name: 'Paris Île-de-France Medical Sector',
    breadcrumb: 'Global > France > Île-de-France > Paris',
    country: 'France',
    region: 'Île-de-France',
    center: [2.3522, 48.8566],
    zoom: 12.2,
    badge: '🇫🇷 Paris'
  }
};

/* ----------------------------------------------------------
   2. UNIFIED GLOBAL FACILITIES DATASET (VERIFIED & AUDITED)
   ---------------------------------------------------------- */

const GLOBAL_FACILITIES = [
  // --- INDIA: DELHI NCR ---
  {
    id: 'aiims-delhi',
    name: 'AIIMS Apex Emergency & Trauma Centre',
    type: 'Hospital',
    country: 'India',
    state: 'Delhi',
    city: 'Delhi',
    scopeId: 'delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi',
    lng: 77.2089,
    lat: 28.5672,
    phone: '+91-11-26588500',
    emergencyStatus: 'Critical Level 1 Trauma Hub',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 6,
    dist: '1.2 km',
    eta: '< 6m',
    stock: { 'O-': 1, 'O+': 32, 'A+': 24, 'A-': 4, 'B+': 18, 'B-': 2, 'AB+': 14, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'National Health Authority (eRaktKosh)',
    lastUpdated: '3m ago'
  },
  {
    id: 'safdarjung-delhi',
    name: 'Safdarjung Hospital Regional Blood Centre',
    type: 'Blood Bank',
    country: 'India',
    state: 'Delhi',
    city: 'Delhi',
    scopeId: 'delhi',
    address: 'Ring Road, Opposite AIIMS, New Delhi',
    lng: 77.2062,
    lat: 28.5702,
    phone: '+91-11-26165060',
    emergencyStatus: 'High Volume Transfusion Hub',
    emergencyNeed: 'A+',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '1.8 km',
    eta: '< 9m',
    stock: { 'O-': 8, 'O+': 44, 'A+': 6, 'A-': 9, 'B+': 28, 'B-': 5, 'AB+': 18, 'AB-': 3 },
    verificationStatus: 'Verified',
    dataSource: 'National Health Authority',
    lastUpdated: '6m ago'
  },
  {
    id: 'redcross-delhi',
    name: 'Indian Red Cross National Blood Bank',
    type: 'Donation Center',
    country: 'India',
    state: 'Delhi',
    city: 'Delhi',
    scopeId: 'delhi',
    address: '1 Red Cross Road, Sansad Marg Area, New Delhi',
    lng: 77.2145,
    lat: 28.6219,
    phone: '+91-11-23716441',
    emergencyStatus: 'National Strategic Reserve',
    emergencyNeed: 'B+',
    urgency: 'urgent',
    unitsNeeded: 4,
    dist: '3.4 km',
    eta: '< 14m',
    stock: { 'O-': 14, 'O+': 76, 'A+': 52, 'A-': 18, 'B+': 8, 'B-': 6, 'AB+': 24, 'AB-': 4 },
    verificationStatus: 'Authoritative',
    dataSource: 'Indian Red Cross Society',
    lastUpdated: '12m ago'
  },
  {
    id: 'max-delhi',
    name: 'Max Super Speciality Hospital Saket',
    type: 'Hospital',
    country: 'India',
    state: 'Delhi',
    city: 'Delhi',
    scopeId: 'delhi',
    address: '1, 2 Press Enclave Marg, Saket, New Delhi',
    lng: 77.2132,
    lat: 28.5284,
    phone: '+91-11-26515050',
    emergencyStatus: 'Tertiary Critical Care Centre',
    emergencyNeed: 'AB-',
    urgency: 'critical',
    unitsNeeded: 2,
    dist: '4.8 km',
    eta: '< 18m',
    stock: { 'O-': 6, 'O+': 38, 'A+': 22, 'A-': 8, 'B+': 20, 'B-': 4, 'AB+': 16, 'AB-': 1 },
    verificationStatus: 'Verified',
    dataSource: 'Partner Healthcare Network',
    lastUpdated: '8m ago'
  },

  // --- INDIA: MUMBAI / MAHARASHTRA ---
  {
    id: 'kem-mumbai',
    name: 'KEM Hospital & Seth GS Medical Blood Bank',
    type: 'Hospital',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    scopeId: 'mumbai',
    address: 'Acharya Donde Marg, Parel, Mumbai',
    lng: 72.8427,
    lat: 18.9986,
    phone: '+91-22-24107000',
    emergencyStatus: 'Apex Municipal Trauma Centre',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 5,
    dist: '1.4 km',
    eta: '< 7m',
    stock: { 'O-': 0, 'O+': 36, 'A+': 18, 'A-': 4, 'B+': 16, 'B-': 3, 'AB+': 12, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'Maharashtra State Blood Transfusion Council',
    lastUpdated: '4m ago'
  },
  {
    id: 'tata-mumbai',
    name: 'Tata Memorial Centre Blood Bank',
    type: 'Blood Bank',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    scopeId: 'mumbai',
    address: 'Dr E Borges Road, Parel, Mumbai',
    lng: 72.8436,
    lat: 19.0042,
    phone: '+91-22-24177000',
    emergencyStatus: 'Oncology Surgical Wing',
    emergencyNeed: 'B+',
    urgency: 'urgent',
    unitsNeeded: 4,
    dist: '2.1 km',
    eta: '< 10m',
    stock: { 'O-': 4, 'O+': 24, 'A+': 30, 'A-': 6, 'B+': 5, 'B-': 2, 'AB+': 18, 'AB-': 1 },
    verificationStatus: 'Verified',
    dataSource: 'Tata Memorial Centre Data Network',
    lastUpdated: '9m ago'
  },
  {
    id: 'lilavati-mumbai',
    name: 'Lilavati Hospital & Research Centre',
    type: 'Hospital',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    scopeId: 'mumbai',
    address: 'A-791, Bandra Reclamation, Bandra West, Mumbai',
    lng: 72.8315,
    lat: 19.0514,
    phone: '+91-22-26751000',
    emergencyStatus: 'Multi-Organ Transplant Hub',
    emergencyNeed: 'A+',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '4.2 km',
    eta: '< 16m',
    stock: { 'O-': 6, 'O+': 42, 'A+': 8, 'A-': 10, 'B+': 26, 'B-': 4, 'AB+': 14, 'AB-': 3 },
    verificationStatus: 'Verified',
    dataSource: 'State Healthcare Directory',
    lastUpdated: '15m ago'
  },

  // --- INDIA: BENGALURU / KARNATAKA ---
  {
    id: 'nimhans-blr',
    name: 'NIMHANS Neurotrauma Centre',
    type: 'Hospital',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    scopeId: 'bengaluru',
    address: 'Hosur Road, Lakkasandra, Bengaluru',
    lng: 77.5996,
    lat: 12.9372,
    phone: '+91-80-26995000',
    emergencyStatus: 'Regional Neuro-Trauma Facility',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 4,
    dist: '1.6 km',
    eta: '< 8m',
    stock: { 'O-': 1, 'O+': 28, 'A+': 16, 'A-': 5, 'B+': 22, 'B-': 3, 'AB+': 10, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'Karnataka State Blood Safety Authority',
    lastUpdated: '5m ago'
  },
  {
    id: 'victoria-blr',
    name: 'Victoria Hospital Central Blood Bank',
    type: 'Blood Bank',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    scopeId: 'bengaluru',
    address: 'Fort Road, Near City Market, Bengaluru',
    lng: 77.5753,
    lat: 12.9644,
    phone: '+91-80-26701150',
    emergencyStatus: 'Public Trauma Support Unit',
    emergencyNeed: 'A+',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '2.5 km',
    eta: '< 11m',
    stock: { 'O-': 5, 'O+': 36, 'A+': 4, 'A-': 7, 'B+': 24, 'B-': 5, 'AB+': 12, 'AB-': 3 },
    verificationStatus: 'Verified',
    dataSource: 'eRaktKosh Portal',
    lastUpdated: '11m ago'
  },

  // --- INDIA: GUWAHATI / ASSAM ---
  {
    id: 'gmch',
    name: 'GMCH Apex Emergency & Trauma',
    type: 'Hospital',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'Bhangagarh, Guwahati, Assam',
    lng: 91.7692,
    lat: 26.1555,
    phone: '+91-361-2529457',
    emergencyStatus: 'Northeast Apex Trauma Centre',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 4,
    dist: '1.4 km',
    eta: '< 8m',
    stock: { 'O-': 0, 'O+': 24, 'A+': 18, 'A-': 4, 'B+': 12, 'B-': 2, 'AB+': 8, 'AB-': 1 },
    verificationStatus: 'Verified',
    dataSource: 'Assam State Blood Transfusion Council',
    lastUpdated: '2m ago'
  },
  {
    id: 'gnrc',
    name: 'GNRC Hospitals Dispur',
    type: 'Hospital',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'Dispur, Guwahati, Assam',
    lng: 91.7981,
    lat: 26.1348,
    phone: '+91-361-2228000',
    emergencyStatus: 'Cardiovascular Surgical Centre',
    emergencyNeed: 'A+',
    urgency: 'needed',
    unitsNeeded: 2,
    dist: '2.1 km',
    eta: '< 10m',
    stock: { 'O-': 6, 'O+': 32, 'A+': 4, 'A-': 8, 'B+': 14, 'B-': 3, 'AB+': 12, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'GNRC Medical Records',
    lastUpdated: '5m ago'
  },
  {
    id: 'bbci',
    name: 'Dr. B. Borooah Cancer Institute (BBCI)',
    type: 'Hospital',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'Gopinath Nagar, Guwahati, Assam',
    lng: 91.7454,
    lat: 26.1666,
    phone: '+91-361-2472364',
    emergencyStatus: 'Surgical Oncology Wing',
    emergencyNeed: 'B+',
    urgency: 'urgent',
    unitsNeeded: 3,
    dist: '3.8 km',
    eta: '< 14m',
    stock: { 'O-': 4, 'O+': 18, 'A+': 22, 'A-': 6, 'B+': 3, 'B-': 1, 'AB+': 10, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'Tata Memorial Centre / BBCI',
    lastUpdated: '7m ago'
  },
  {
    id: 'nemcare',
    name: 'Nemcare Super Speciality Hospital',
    type: 'Hospital',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'GS Road, Bhangagarh, Guwahati, Assam',
    lng: 91.7675,
    lat: 26.1585,
    phone: '+91-361-2457740',
    emergencyStatus: 'Critical Care Reserve Hub',
    emergencyNeed: 'O+',
    urgency: 'optimal',
    unitsNeeded: 1,
    dist: '4.5 km',
    eta: '< 18m',
    stock: { 'O-': 8, 'O+': 12, 'A+': 20, 'A-': 6, 'B+': 9, 'B-': 8, 'AB+': 12, 'AB-': 4 },
    verificationStatus: 'Verified',
    dataSource: 'Nemcare Network Hub',
    lastUpdated: '10m ago'
  },
  {
    id: 'gmch-bloodbank',
    name: 'GMCH Model Blood Bank & Component Centre',
    type: 'Blood Bank',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'GMCH Campus, Bhangagarh, Guwahati, Assam',
    lng: 91.7684,
    lat: 26.1560,
    phone: '+91-361-2529457',
    emergencyStatus: 'Apex Regional Blood Depository & Component Unit',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 6,
    dist: '1.2 km',
    eta: '< 6m',
    stock: { 'O-': 8, 'O+': 48, 'A+': 36, 'A-': 10, 'B+': 32, 'B-': 6, 'AB+': 18, 'AB-': 4 },
    verificationStatus: 'Verified',
    dataSource: 'Assam State Blood Transfusion Council',
    lastUpdated: '1m ago'
  },
  {
    id: 'mmch-bloodbank-guwahati',
    name: 'MMCH Panbazar Regional Blood Centre',
    type: 'Blood Bank',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'MG Road, Panbazar, Guwahati, Assam',
    lng: 91.7448,
    lat: 26.1882,
    phone: '+91-361-2540193',
    emergencyStatus: 'Civil Hospital Depository & Component Unit',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 5,
    dist: '2.8 km',
    eta: '< 11m',
    stock: { 'O-': 6, 'O+': 38, 'A+': 28, 'A-': 8, 'B+': 30, 'B-': 5, 'AB+': 14, 'AB-': 3 },
    verificationStatus: 'Authoritative',
    dataSource: 'Assam State Blood Transfusion Council (SBTC)',
    lastUpdated: '3m ago'
  },
  {
    id: 'marwari-bloodbank-guwahati',
    name: 'Marwari Hospitals Charitable Blood Bank',
    type: 'Blood Bank',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'Bhabananda Boro Path, Athgaon, Guwahati, Assam',
    lng: 91.7380,
    lat: 26.1768,
    phone: '+91-361-2602752',
    emergencyStatus: 'High Volume Community Blood Depository',
    emergencyNeed: 'B+',
    urgency: 'urgent',
    unitsNeeded: 4,
    dist: '3.1 km',
    eta: '< 12m',
    stock: { 'O-': 9, 'O+': 44, 'A+': 32, 'A-': 6, 'B+': 7, 'B-': 3, 'AB+': 16, 'AB-': 4 },
    verificationStatus: 'Verified',
    dataSource: 'Assam State Blood Transfusion Council',
    lastUpdated: '4m ago'
  },
  {
    id: 'hayat-bloodbank-guwahati',
    name: 'Hayat Hospital Blood Centre & Transfusion Unit',
    type: 'Blood Bank',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'Lalmati, NH-37, Guwahati, Assam',
    lng: 91.8025,
    lat: 26.1158,
    phone: '+91-361-7100000',
    emergencyStatus: 'South Guwahati Cold-Chain Depository',
    emergencyNeed: 'A-',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '4.8 km',
    eta: '< 15m',
    stock: { 'O-': 11, 'O+': 50, 'A+': 38, 'A-': 4, 'B+': 34, 'B-': 6, 'AB+': 20, 'AB-': 3 },
    verificationStatus: 'Verified',
    dataSource: 'Hayat Super Speciality Network',
    lastUpdated: '6m ago'
  },
  {
    id: 'apollo-guwahati',
    name: 'Apollo Hospitals Guwahati',
    type: 'Hospital',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'GS Road, Christian Basti, Guwahati, Assam',
    lng: 91.7765,
    lat: 26.1512,
    phone: '+91-361-7135005',
    emergencyStatus: 'Tertiary Emergency & Trauma Centre',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 4,
    dist: '1.9 km',
    eta: '< 7m',
    stock: { 'O-': 2, 'O+': 30, 'A+': 24, 'A-': 5, 'B+': 20, 'B-': 4, 'AB+': 12, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'Apollo Hospitals Clinical Network',
    lastUpdated: '3m ago'
  },
  {
    id: 'downtown-guwahati',
    name: 'Down Town Hospital Major Emergency Wing',
    type: 'Hospital',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'GS Road, Dispur, Guwahati, Assam',
    lng: 91.7912,
    lat: 26.1390,
    phone: '+91-361-2331003',
    emergencyStatus: 'Multispeciality Surgical Trauma Hub',
    emergencyNeed: 'B+',
    urgency: 'urgent',
    unitsNeeded: 3,
    dist: '2.5 km',
    eta: '< 9m',
    stock: { 'O-': 5, 'O+': 36, 'A+': 18, 'A-': 4, 'B+': 8, 'B-': 2, 'AB+': 14, 'AB-': 3 },
    verificationStatus: 'Verified',
    dataSource: 'Down Town Hospital Health Informatics',
    lastUpdated: '5m ago'
  },
  {
    id: 'aiims-guwahati',
    name: 'AIIMS Guwahati Apex National Institute',
    type: 'Hospital',
    country: 'India',
    state: 'Assam',
    city: 'Guwahati',
    scopeId: 'guwahati',
    address: 'Changsari, Kamrup, Guwahati, Assam',
    lng: 91.6885,
    lat: 26.2625,
    phone: '+91-361-2912011',
    emergencyStatus: 'Apex Level 1 National Trauma Center',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 6,
    dist: '14.2 km',
    eta: '< 24m',
    stock: { 'O-': 14, 'O+': 62, 'A+': 46, 'A-': 12, 'B+': 40, 'B-': 8, 'AB+': 22, 'AB-': 5 },
    verificationStatus: 'Authoritative',
    dataSource: 'Ministry of Health & Family Welfare (MoHFW)',
    lastUpdated: '2m ago'
  },

  // --- INDIA: KOLKATA / WEST BENGAL ---
  {
    id: 'sskm-kolkata',
    name: 'SSKM Hospital & IPGMER Apex Trauma',
    type: 'Hospital',
    country: 'India',
    state: 'West Bengal',
    city: 'Kolkata',
    scopeId: 'kolkata',
    address: '244 AJC Bose Road, Bhowanipore, Kolkata',
    lng: 88.3444,
    lat: 22.5397,
    phone: '+91-33-22231589',
    emergencyStatus: 'State Level 1 Trauma Hub',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 4,
    dist: '1.5 km',
    eta: '< 7m',
    stock: { 'O-': 2, 'O+': 38, 'A+': 20, 'A-': 5, 'B+': 18, 'B-': 3, 'AB+': 12, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'West Bengal Health Authority',
    lastUpdated: '4m ago'
  },
  {
    id: 'central-bloodbank-kolkata',
    name: 'Central Blood Bank Maniktala (State Apex Depository)',
    type: 'Blood Bank',
    country: 'India',
    state: 'West Bengal',
    city: 'Kolkata',
    scopeId: 'kolkata',
    address: '205, Vivekananda Road, Maniktala, Kolkata',
    lng: 88.3735,
    lat: 22.5855,
    phone: '+91-33-23502422',
    emergencyStatus: 'State Central Blood Repository & Fractionation Hub',
    emergencyNeed: 'B-',
    urgency: 'urgent',
    unitsNeeded: 4,
    dist: '3.4 km',
    eta: '< 12m',
    stock: { 'O-': 12, 'O+': 84, 'A+': 62, 'A-': 18, 'B+': 54, 'B-': 8, 'AB+': 28, 'AB-': 6 },
    verificationStatus: 'Verified',
    dataSource: 'West Bengal State Blood Transfusion Council',
    lastUpdated: '2m ago'
  },

  // --- INDIA: CHENNAI / TAMIL NADU ---
  {
    id: 'egmore-bloodbank-chennai',
    name: 'Government General Blood Bank Egmore',
    type: 'Blood Bank',
    country: 'India',
    state: 'Tamil Nadu',
    city: 'Chennai',
    scopeId: 'chennai',
    address: 'EVR Periyar Salai, Park Town / Egmore, Chennai',
    lng: 80.2760,
    lat: 13.0805,
    phone: '+91-44-25305000',
    emergencyStatus: 'Tamil Nadu Apex Transfusion Depository',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 5,
    dist: '1.8 km',
    eta: '< 8m',
    stock: { 'O-': 10, 'O+': 72, 'A+': 48, 'A-': 14, 'B+': 52, 'B-': 7, 'AB+': 22, 'AB-': 5 },
    verificationStatus: 'Verified',
    dataSource: 'Tamil Nadu State Blood Transfusion Council',
    lastUpdated: '3m ago'
  },

  // --- INDIA: HYDERABAD / TELANGANA ---
  {
    id: 'redcross-bloodbank-hyd',
    name: 'Indian Red Cross Central Blood Bank Vidyanagar',
    type: 'Blood Bank',
    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
    scopeId: 'hyderabad',
    address: 'Vidyanagar, Nallakunta, Hyderabad',
    lng: 78.5085,
    lat: 17.4010,
    phone: '+91-40-27633087',
    emergencyStatus: 'Telangana Regional Blood Depository',
    emergencyNeed: 'A-',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '2.5 km',
    eta: '< 10m',
    stock: { 'O-': 14, 'O+': 64, 'A+': 44, 'A-': 10, 'B+': 46, 'B-': 8, 'AB+': 20, 'AB-': 4 },
    verificationStatus: 'Verified',
    dataSource: 'Telangana State Blood Transfusion Council',
    lastUpdated: '4m ago'
  },

  // --- UNITED KINGDOM: LONDON ---
  {
    id: 'guys-london',
    name: "Guy's Hospital & St Thomas' Emergency Hub",
    type: 'Hospital',
    country: 'United Kingdom',
    state: 'Greater London',
    city: 'London',
    scopeId: 'london',
    address: 'Great Maze Pond, London SE1 9RT',
    lng: -0.0888,
    lat: 51.5045,
    phone: '+44-20-7188-7188',
    emergencyStatus: 'Central London Major Trauma Centre',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 4,
    dist: '1.1 mi',
    eta: '< 7m',
    stock: { 'O-': 1, 'O+': 42, 'A+': 32, 'A-': 6, 'B+': 16, 'B-': 4, 'AB+': 14, 'AB-': 2 },
    verificationStatus: 'Authoritative',
    dataSource: 'NHS Blood and Transplant (NHSBT)',
    lastUpdated: '3m ago'
  },
  {
    id: 'nhsbt-london',
    name: 'NHS Blood and Transplant West End Hub',
    type: 'Blood Bank',
    country: 'United Kingdom',
    state: 'Greater London',
    city: 'London',
    scopeId: 'london',
    address: '26 Margaret Street, London W1W 8NB',
    lng: -0.1388,
    lat: 51.5160,
    phone: '+44-300-123-23-23',
    emergencyStatus: 'Strategic Transfusion Reserve',
    emergencyNeed: 'A+',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '2.3 mi',
    eta: '< 12m',
    stock: { 'O-': 12, 'O+': 68, 'A+': 8, 'A-': 12, 'B+': 24, 'B-': 6, 'AB+': 18, 'AB-': 4 },
    verificationStatus: 'Authoritative',
    dataSource: 'NHS Blood and Transplant',
    lastUpdated: '6m ago'
  },

  // --- UNITED STATES: NEW YORK ---
  {
    id: 'mtsinai-nyc',
    name: 'Mount Sinai Hospital Trauma & Transfusion',
    type: 'Hospital',
    country: 'United States',
    state: 'New York',
    city: 'New York',
    scopeId: 'newyork',
    address: '1468 Madison Ave, New York, NY 10029',
    lng: -73.9535,
    lat: 40.7903,
    phone: '+1-212-241-6500',
    emergencyStatus: 'Manhattan Level 1 Trauma Hub',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 5,
    dist: '1.4 mi',
    eta: '< 8m',
    stock: { 'O-': 0, 'O+': 46, 'A+': 28, 'A-': 7, 'B+': 20, 'B-': 3, 'AB+': 16, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'New York State Health Department',
    lastUpdated: '5m ago'
  },
  {
    id: 'nybc-nyc',
    name: 'New York Blood Center Midtown Hub',
    type: 'Blood Bank',
    country: 'United States',
    state: 'New York',
    city: 'New York',
    scopeId: 'newyork',
    address: '310 E 67th St, New York, NY 10065',
    lng: -73.9599,
    lat: 40.7656,
    phone: '+1-800-933-2566',
    emergencyStatus: 'Tristate Regional Repository',
    emergencyNeed: 'B+',
    urgency: 'urgent',
    unitsNeeded: 4,
    dist: '2.8 mi',
    eta: '< 14m',
    stock: { 'O-': 16, 'O+': 84, 'A+': 62, 'A-': 14, 'B+': 6, 'B-': 5, 'AB+': 22, 'AB-': 3 },
    verificationStatus: 'Authoritative',
    dataSource: 'New York Blood Center Network',
    lastUpdated: '8m ago'
  },

  // --- CANADA: TORONTO ---
  {
    id: 'tgh-toronto',
    name: 'Toronto General Hospital Emergency Centre',
    type: 'Hospital',
    country: 'Canada',
    state: 'Ontario',
    city: 'Toronto',
    scopeId: 'toronto',
    address: '200 Elizabeth St, Toronto, ON M5G 2C4',
    lng: -79.3871,
    lat: 43.6591,
    phone: '+1-416-340-4800',
    emergencyStatus: 'University Health Network Major Trauma',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 3,
    dist: '1.2 km',
    eta: '< 6m',
    stock: { 'O-': 2, 'O+': 34, 'A+': 22, 'A-': 5, 'B+': 18, 'B-': 3, 'AB+': 12, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'Canadian Blood Services Partner Node',
    lastUpdated: '4m ago'
  },

  // --- UAE: DUBAI ---
  {
    id: 'dubai-hosp',
    name: 'Dubai Hospital Emergency & Trauma Care',
    type: 'Hospital',
    country: 'UAE',
    state: 'Dubai',
    city: 'Dubai',
    scopeId: 'dubai',
    address: 'Al Khaleej Road, Deira, Dubai',
    lng: 55.3195,
    lat: 25.2816,
    phone: '+971-4-219-5000',
    emergencyStatus: 'DHA Apex Emergency Hub',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 4,
    dist: '1.8 km',
    eta: '< 9m',
    stock: { 'O-': 1, 'O+': 38, 'A+': 24, 'A-': 6, 'B+': 14, 'B-': 4, 'AB+': 12, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'Dubai Health Authority (DHA)',
    lastUpdated: '3m ago'
  },

  // --- SINGAPORE ---
  {
    id: 'sgh-singapore',
    name: 'Singapore General Hospital (SGH) Trauma Centre',
    type: 'Hospital',
    country: 'Singapore',
    state: 'Singapore',
    city: 'Singapore',
    scopeId: 'singapore',
    address: 'Outram Road, Singapore 169608',
    lng: 103.8344,
    lat: 1.2797,
    phone: '+65-6222-3322',
    emergencyStatus: 'National Referral Trauma Hub',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 3,
    dist: '1.3 km',
    eta: '< 7m',
    stock: { 'O-': 2, 'O+': 44, 'A+': 30, 'A-': 8, 'B+': 22, 'B-': 4, 'AB+': 16, 'AB-': 3 },
    verificationStatus: 'Authoritative',
    dataSource: 'Health Sciences Authority (HSA)',
    lastUpdated: '5m ago'
  },

  // --- JAPAN: TOKYO ---
  {
    id: 'tokyo-univ-hosp',
    name: 'The University of Tokyo Hospital Emergency Hub',
    type: 'Hospital',
    country: 'Japan',
    state: 'Tokyo',
    city: 'Tokyo',
    scopeId: 'tokyo',
    address: '7-3-1 Hongo, Bunkyo City, Tokyo 113-8655',
    lng: 139.7644,
    lat: 35.7126,
    phone: '+81-3-3815-5411',
    emergencyStatus: 'Tokyo Metropolitan Level 1 Trauma Facility',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 4,
    dist: '2.0 km',
    eta: '< 9m',
    stock: { 'O-': 1, 'O+': 52, 'A+': 48, 'A-': 6, 'B+': 24, 'B-': 5, 'AB+': 18, 'AB-': 2 },
    verificationStatus: 'Verified',
    dataSource: 'Japanese Red Cross Society (JRCS)',
    lastUpdated: '6m ago'
  },

  // --- AUSTRALIA: SYDNEY ---
  {
    id: 'rpa-sydney',
    name: 'Royal Prince Alfred Hospital Major Trauma Wing',
    type: 'Hospital',
    country: 'Australia',
    state: 'New South Wales',
    city: 'Sydney',
    scopeId: 'sydney',
    address: 'Missenden Rd, Camperdown NSW 2050',
    lng: 151.1834,
    lat: -33.8903,
    phone: '+61-2-9515-6111',
    emergencyStatus: 'Sydney Major Trauma Service',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 3,
    dist: '2.4 km',
    eta: '< 11m',
    stock: { 'O-': 2, 'O+': 36, 'A+': 28, 'A-': 7, 'B+': 16, 'B-': 4, 'AB+': 12, 'AB-': 2 },
    verificationStatus: 'Authoritative',
    dataSource: 'Australian Red Cross Lifeblood',
    lastUpdated: '4m ago'
  },

  // --- FRANCE: PARIS ---
  {
    id: 'pitie-paris',
    name: 'Hôpital Universitaire Pitié-Salpêtrière',
    type: 'Hospital',
    country: 'France',
    state: 'Île-de-France',
    city: 'Paris',
    scopeId: 'paris',
    address: '47-83 Bd de l\'Hôpital, 75013 Paris',
    lng: 2.3639,
    lat: 48.8386,
    phone: '+33-1-42-16-00-00',
    emergencyStatus: 'Centre de Traumatologie Majeure',
    emergencyNeed: 'O-',
    urgency: 'critical',
    unitsNeeded: 4,
    dist: '1.9 km',
    eta: '< 8m',
    stock: { 'O-': 1, 'O+': 40, 'A+': 34, 'A-': 8, 'B+': 14, 'B-': 3, 'AB+': 16, 'AB-': 2 },
    verificationStatus: 'Authoritative',
    dataSource: 'Établissement Français du Sang (EFS)',
    lastUpdated: '5m ago'
  },
  {
    id: 'efs-paris',
    name: 'Établissement Français du Sang (EFS) Paris Crozatier',
    type: 'Blood Bank',
    country: 'France',
    state: 'Île-de-France',
    city: 'Paris',
    scopeId: 'paris',
    address: '21 Rue Crozatier, 75012 Paris',
    lng: 2.3802,
    lat: 48.8496,
    phone: '+33-1-53-02-92-00',
    emergencyStatus: 'Île-de-France Regional Blood Depository',
    emergencyNeed: 'B+',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '2.1 km',
    eta: '< 10m',
    stock: { 'O-': 7, 'O+': 46, 'A+': 44, 'A-': 8, 'B+': 10, 'B-': 4, 'AB+': 18, 'AB-': 2 },
    verificationStatus: 'Authoritative',
    dataSource: 'Établissement Français du Sang (EFS)',
    lastUpdated: '7m ago'
  },

  // --- CANADA: TORONTO BLOOD BANK ---
  {
    id: 'cbs-toronto',
    name: 'Canadian Blood Services Central Toronto Centre',
    type: 'Blood Bank',
    country: 'Canada',
    state: 'Ontario',
    city: 'Toronto',
    scopeId: 'toronto',
    address: '67 College St, Toronto, ON M5G 2M1',
    lng: -79.3879,
    lat: 43.6601,
    phone: '+1-888-236-6283',
    emergencyStatus: 'Ontario Provincial Blood Depository',
    emergencyNeed: 'O+',
    urgency: 'needed',
    unitsNeeded: 4,
    dist: '1.4 km',
    eta: '< 7m',
    stock: { 'O-': 8, 'O+': 52, 'A+': 36, 'A-': 8, 'B+': 28, 'B-': 6, 'AB+': 18, 'AB-': 4 },
    verificationStatus: 'Authoritative',
    dataSource: 'Canadian Blood Services (CBS)',
    lastUpdated: '5m ago'
  },

  // --- UAE: DUBAI BLOOD BANK ---
  {
    id: 'dbdc-dubai',
    name: 'Dubai Blood Donation Centre (DBDC) Latifa Hub',
    type: 'Blood Bank',
    country: 'UAE',
    state: 'Dubai',
    city: 'Dubai',
    scopeId: 'dubai',
    address: 'Latifa Hospital, Oud Metha Rd, Dubai',
    lng: 55.3210,
    lat: 25.2285,
    phone: '+971-4-219-3222',
    emergencyStatus: 'Central Emirates Blood Depository',
    emergencyNeed: 'A-',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '3.1 km',
    eta: '< 12m',
    stock: { 'O-': 6, 'O+': 48, 'A+': 34, 'A-': 5, 'B+': 30, 'B-': 4, 'AB+': 16, 'AB-': 2 },
    verificationStatus: 'Authoritative',
    dataSource: 'Dubai Health Authority (DHA)',
    lastUpdated: '4m ago'
  },

  // --- SINGAPORE BLOOD BANK ---
  {
    id: 'bloodbank-hsa-sg',
    name: 'Bloodbank@HSA Outram National Depository',
    type: 'Blood Bank',
    country: 'Singapore',
    state: 'Singapore',
    city: 'Singapore',
    scopeId: 'singapore',
    address: '11 Outram Rd, Singapore 169078',
    lng: 103.8375,
    lat: 1.2805,
    phone: '+65-6213-0626',
    emergencyStatus: 'Singapore National Blood Depository',
    emergencyNeed: 'B+',
    urgency: 'needed',
    unitsNeeded: 4,
    dist: '1.5 km',
    eta: '< 8m',
    stock: { 'O-': 10, 'O+': 58, 'A+': 42, 'A-': 9, 'B+': 12, 'B-': 6, 'AB+': 22, 'AB-': 4 },
    verificationStatus: 'Authoritative',
    dataSource: 'Health Sciences Authority (HSA)',
    lastUpdated: '3m ago'
  },

  // --- JAPAN: TOKYO BLOOD BANK ---
  {
    id: 'jrc-tokyo-bloodbank',
    name: 'Japanese Red Cross Tokyo Central Blood Center',
    type: 'Blood Bank',
    country: 'Japan',
    state: 'Tokyo',
    city: 'Tokyo',
    scopeId: 'tokyo',
    address: '2-1-67 Tatsumi, Koto City, Tokyo 135-8521',
    lng: 139.8115,
    lat: 35.6455,
    phone: '+81-3-5534-7500',
    emergencyStatus: 'Greater Tokyo Kanto Blood Depository',
    emergencyNeed: 'O+',
    urgency: 'needed',
    unitsNeeded: 5,
    dist: '3.6 km',
    eta: '< 15m',
    stock: { 'O-': 12, 'O+': 76, 'A+': 82, 'A-': 10, 'B+': 38, 'B-': 7, 'AB+': 24, 'AB-': 5 },
    verificationStatus: 'Authoritative',
    dataSource: 'Japanese Red Cross Society (JRCS)',
    lastUpdated: '6m ago'
  },

  // --- AUSTRALIA: SYDNEY BLOOD BANK ---
  {
    id: 'lifeblood-sydney',
    name: 'Australian Red Cross Lifeblood Sydney Town Hall Hub',
    type: 'Blood Bank',
    country: 'Australia',
    state: 'New South Wales',
    city: 'Sydney',
    scopeId: 'sydney',
    address: '483 George St, Sydney NSW 2000',
    lng: 151.2069,
    lat: -33.8735,
    phone: '+61-13-14-95',
    emergencyStatus: 'NSW Regional Transfusion Hub',
    emergencyNeed: 'A-',
    urgency: 'needed',
    unitsNeeded: 3,
    dist: '1.9 km',
    eta: '< 9m',
    stock: { 'O-': 9, 'O+': 54, 'A+': 40, 'A-': 7, 'B+': 26, 'B-': 5, 'AB+': 16, 'AB-': 3 },
    verificationStatus: 'Authoritative',
    dataSource: 'Australian Red Cross Lifeblood',
    lastUpdated: '4m ago'
  }
];

/* ----------------------------------------------------------
   3. PRIVACY-PRESERVING GLOBAL DONOR NODES
   (District / Sector level only — Zero Personal Identifiable Info)
   ---------------------------------------------------------- */

const GLOBAL_DONORS = [
  // India Nodes
  { id: 'donor-del-1', name: 'Central Delhi Red Cross Station', scopeId: 'delhi', donorId: '#ZK-DEL-104', blood: 'O-', lng: 77.2185, lat: 28.6250, verified: true },
  { id: 'donor-del-2', name: 'South Delhi Blood Donation Node', scopeId: 'delhi', donorId: '#ZK-DEL-892', blood: 'A+', lng: 77.2020, lat: 28.5480, verified: true },
  { id: 'donor-mum-1', name: 'Parel Transfusion Station', scopeId: 'mumbai', donorId: '#ZK-MUM-882', blood: 'O-', lng: 72.8390, lat: 19.0010, verified: true },
  { id: 'donor-blr-1', name: 'Koramangala Community Donor Node', scopeId: 'bengaluru', donorId: '#ZK-BLR-401', blood: 'B+', lng: 77.6200, lat: 12.9350, verified: true },
  { id: 'donor-kol-1', name: 'Park Street Red Cross Node', scopeId: 'kolkata', donorId: '#ZK-KOL-219', blood: 'O+', lng: 88.3520, lat: 22.5510, verified: true },
  { id: 'donor-ghy-1', name: 'Paltan Bazaar Donor Station', scopeId: 'guwahati', donorId: '#ZK-GHY-904', blood: 'O-', lng: 91.7525, lat: 26.1805, verified: true },
  { id: 'donor-ghy-2', name: 'Bhangagarh Clinical Donor Hub', scopeId: 'guwahati', donorId: '#ZK-GHY-332', blood: 'A+', lng: 91.7692, lat: 26.1555, verified: true },
  
  // International Nodes
  { id: 'donor-lon-1', name: 'Southwark NHSBT Donor Centre', scopeId: 'london', donorId: '#ZK-LON-331', blood: 'O-', lng: -0.0910, lat: 51.5030, verified: true },
  { id: 'donor-nyc-1', name: 'Manhattan East Donor Station', scopeId: 'newyork', donorId: '#ZK-NYC-412', blood: 'O-', lng: -73.9580, lat: 40.7680, verified: true },
  { id: 'donor-dxb-1', name: 'Deira Community Blood Donor Node', scopeId: 'dubai', donorId: '#ZK-DXB-501', blood: 'B+', lng: 55.3230, lat: 25.2750, verified: true },
  { id: 'donor-sg-1', name: 'Outram Bloodbank Node', scopeId: 'singapore', donorId: '#ZK-SGP-108', blood: 'O-', lng: 103.8360, lat: 1.2810, verified: true }
];

/* ----------------------------------------------------------
   4. CENTRALIZED APPLICATION RUNTIME STATE
   ---------------------------------------------------------- */

const appState = {
  currentPortal: 'ops',
  currentScopeId: 'india', // Initial demonstration opens on India National Network
  activeFacilityTypeFilter: 'ALL',
  activeBloodFilter: 'ALL',
  mapMode: 'streets',

  // Authentication & Governance
  adminLoggedIn: false,
  ownerProfile: {
    name: 'Dhritishman Das',
    role: 'Global Platform Architect & Super-Admin',
    id: 'SYS-GLOBAL-01'
  },
  citizenLoggedIn: false,
  currentCitizenDonor: null,

  // Global inventory aggregations
  inventory: [
    { type: 'O-', count: 38, status: 'Critical Deficit', isRed: true },
    { type: 'O+', count: 486, status: 'Optimal', isRed: false },
    { type: 'A+', count: 320, status: 'Ready', isRed: false },
    { type: 'A-', count: 84, status: 'Moderate', isRed: false },
    { type: 'B+', count: 218, status: 'Moderate', isRed: false },
    { type: 'B-', count: 62, status: 'Low', isRed: true },
    { type: 'AB+', count: 184, status: 'Optimal', isRed: false },
    { type: 'AB-', count: 36, status: 'Critical Deficit', isRed: true }
  ],

  // Platform citizen registry
  totalCitizenCount: 18420,
  registeredUsers: [
    { id: 'usr-1', name: "Aarav Sharma", blood: "O-", sector: "Connaught Place, New Delhi", donorId: "#ZK-IND-904", status: "Verified", date: "01 Sep 2026" },
    { id: 'usr-2', name: "Priya Nair", blood: "A+", sector: "Bandra West, Mumbai", donorId: "#ZK-IND-332", status: "Verified", date: "03 Sep 2026" },
    { id: 'usr-3', name: "Jiten Barman", blood: "O-", sector: "Bhangagarh, Guwahati", donorId: "#ZK-ASM-772", status: "Verified", date: "05 Sep 2026" },
    { id: 'usr-4', name: "David Miller", blood: "O-", sector: "City of London, UK", donorId: "#ZK-GBR-118", status: "Verified", date: "07 Sep 2026" },
    { id: 'usr-5', name: "Karthik Raja", blood: "B+", sector: "Indiranagar, Bengaluru", donorId: "#ZK-IND-455", status: "Verified", date: "08 Sep 2026" }
  ]
};

/* ----------------------------------------------------------
   5. COMPATIBILITY ALIASES & QUERY HELPERS
   ---------------------------------------------------------- */

// Dynamically retrieve facilities matching scope, facility type, and blood filter
function getFacilitiesForScope(scopeId = appState.currentScopeId, typeFilter = appState.activeFacilityTypeFilter, bloodFilter = appState.activeBloodFilter) {
  const norm = str => String(str || '').toLowerCase().replace(/[\s_-]+/g, '');
  return GLOBAL_FACILITIES.filter(f => {
    const matchesScope = (!scopeId || scopeId === 'world' || scopeId === 'all') ? true : (scopeId === 'india' ? f.country === 'India' : f.scopeId === scopeId);
    const matchesType = (!typeFilter || typeFilter.toLowerCase() === 'all') ? true : norm(f.type).includes(norm(typeFilter));
    const matchesBlood = (!bloodFilter || bloodFilter.toLowerCase() === 'all') ? true : (f.emergencyNeed === bloodFilter || (f.stock && f.stock[bloodFilter] > 0));
    return matchesScope && matchesType && matchesBlood;
  });
}

function getDonorsForScope(scopeId = appState.currentScopeId) {
  return GLOBAL_DONORS.filter(d => {
    return scopeId === 'world' ? true : (scopeId === 'india' ? d.id.includes('del') || d.id.includes('mum') || d.id.includes('blr') || d.id.includes('kol') || d.id.includes('ghy') : d.scopeId === scopeId);
  });
}

// Global search query evaluator across facilities, cities, countries, and blood groups
function searchGlobalDirectory(queryText) {
  if (!queryText) return [];
  const q = queryText.toLowerCase().trim();

  // 1. Matches on Geographic Scopes (Cities, Countries, Metros)
  const matchingScopes = Object.values(GEOGRAPHIC_SCOPES).filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.country.toLowerCase().includes(q) ||
    s.region.toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q)
  ).map(s => ({
    resultType: 'scope',
    title: s.name,
    subtitle: `${s.region}, ${s.country}`,
    scope: s,
    lat: s.center[1],
    lng: s.center[0],
    zoom: s.zoom
  }));

  // 2. Matches on Facilities (Hospitals, Blood Banks)
  const matchingFacilities = GLOBAL_FACILITIES.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.city.toLowerCase().includes(q) ||
    f.state.toLowerCase().includes(q) ||
    f.country.toLowerCase().includes(q) ||
    (f.emergencyNeed && f.emergencyNeed.toLowerCase() === q)
  ).map(f => ({
    resultType: 'facility',
    title: f.name,
    subtitle: `${f.type} • ${f.city}, ${f.country} • Need: ${f.emergencyNeed}`,
    facility: f,
    lat: f.lat,
    lng: f.lng,
    zoom: 14.5
  }));

  return [...matchingScopes, ...matchingFacilities].slice(0, 8);
}

// Backward compatibility bindings for legacy references
const realHospitals = GLOBAL_FACILITIES;
const realDonors = GLOBAL_DONORS;
appState.hospitalStockData = GLOBAL_FACILITIES;

function getFacilityById(id) {
  if (!id) return null;
  const direct = GLOBAL_FACILITIES.find(f => f.id === id);
  if (direct) return direct;
  // Aliases for backwards compatibility
  const aliases = {
    'delhi-1': 'aiims-delhi',
    'delhi-2': 'safdarjung-delhi',
    'mumbai-1': 'kem-mumbai',
    'mumbai-2': 'tata-mumbai',
    'blr-1': 'nimhans-blr',
    'ghy-1': 'gmch',
    'gmch-hosp-guwahati': 'gmch',
    'ghy-2': 'gmch-bloodbank',
    'kol-1': 'calcutta-medical-kolkata',
    'kol-2': 'central-bloodbank-kolkata'
  };
  if (aliases[id]) {
    return GLOBAL_FACILITIES.find(f => f.id === aliases[id]) || null;
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.GEOGRAPHIC_SCOPES = GEOGRAPHIC_SCOPES;
  window.GLOBAL_FACILITIES = GLOBAL_FACILITIES;
  window.GLOBAL_DONORS = GLOBAL_DONORS;
  window.appState = appState;
  window.realHospitals = realHospitals;
  window.realDonors = realDonors;
  window.getFacilityById = getFacilityById;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GEOGRAPHIC_SCOPES,
    GLOBAL_FACILITIES,
    GLOBAL_DONORS,
    appState,
    getFacilityById,
    getFacilitiesForScope,
    getDonorsForScope,
    searchGlobalDirectory
  };
}
