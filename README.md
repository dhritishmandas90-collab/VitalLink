# VitalLink — Global Smart Blood Network & Emergency Cartographic Grid

VitalLink is a production-grade, human-engineered GIS emergency blood dispatch platform. It connects emergency medical centers, blood banks, authenticated citizens, and cold-chain courier logistics across India and international healthcare hubs (Asia, Europe, North America, Middle East, Oceania).

Built with high-performance WebGL & MapLibre GL JS cartography, Zero-Knowledge privacy architecture, calibrated audio synthesizer telemetry, and a focused healthcare CAD design system.

---

## 📁 Repository File Structure

```
vitallink-prototype/
├── index.html               # Main semantic HTML5 application & multi-portal layout
├── package.json             # NPM metadata, automated test scripts & start commands
├── vercel.json              # Vercel production hosting & static routing headers
├── .gitignore               # Standard ignore rules (OS, node, logs, temporary files)
├── README.md                # Comprehensive system documentation & architecture guide
│
├── css/                     # Modular Stylesheets
│   ├── style.css            # Core design system, CAD color tokens, typography, maps & modals
│   └── responsive.css       # Multi-tier responsive rules (Desktop, Tablet 768px, Mobile <768px)
│
├── js/                      # Modular Application Architecture
│   ├── state.js             # Global state, geographic scopes (17 regions), 24 facilities, ZK donors
│   ├── map.js               # MapLibre GL JS engine, OSM & Satellite basemaps, clamped zoom, clustering
│   ├── app.js               # Global search, emergency queue, audio feedback, and portal routing
│   ├── donor.js             # Citizen & Donor Hub, Digital Health Pass, smart AI recommendations
│   └── admin.js             # Platform Owner command console, real-time inventory & SOS broadcast
│
└── tests/                   # Automated Verification Test Suite
    └── test-lifecycle.js    # 12-step headless DOM automated lifecycle verification script
```

---

## 🧭 System Portals & Capabilities

### 1. 🗺️ Live Operations Center (`Ops Portal`)
- **MapLibre GL JS Engine**: Unrestricted worldwide navigation from continental scale (`1.5`) down to high-precision street level (`18.0`).
- **Dual Basemap Switching**: Instant, zero-jitter toggling between OpenStreetMap Vector Street Basemap (`STREETS`) and high-resolution Esri World Imagery + Labels (`SATELLITE`) with exact camera preservation.
- **Clamped Google Maps Zoom Controls**:
  - Zoom In disabled at `18.0`; subsequent commands are silently rejected without intrusive popups.
  - Zoom Out disabled at `1.5`; silently rejected.
  - Re-enables dynamically as soon as zoom moves away from boundaries.
  - Keyboard shortcuts (`+`/`=` to zoom in, `-`/`_` to zoom out).
- **Cluster Unclustering**: At macro zoom (`< 7`), individual pins are cleanly aggregated into cluster count circles. When zooming into a region (`>= 7`), individual high-contrast CAD hospital and donor pins smoothly appear.
- **Single Active Popup & Route Transit**: Clicking any facility focuses the location, opens a single detailed card, draws the active transit corridor from the nearest sector donor station, and syncs with the left sidebar queue.
- **Universal Global Search**: Fast debounced search across all 17 geographic scopes, facilities, and blood groups.

### 2. 🛡️ Platform Owner Console (`Admin Portal`)
- **Access**: Authenticated Platform Owner interface (`Dhritishman Das`).
- **Real-Time Regional Stock Matrix**: Interactive inventory management across all 8 blood groups (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`) with 1-click baseline restock and instant sync with Live Operations.
- **Emergency SOS Broadcast**: Super-admin priority broadcast that automatically selects an emergency node, authorizes deployment, transitions to Live Operations, and animates the live transit route.
- **Audit Directory & Right to Erasure**: Privacy-compliant management of registered citizens with medical clearance verification and permanent record deletion controls.

### 3. 🩸 Citizen & Donor Hub (`Citizen Portal`)
- **Zero-Knowledge Privacy Shield**: Tokenizes personal phone numbers and emails into cryptographic tokens (e.g. `#ZK-DEL-842`, `#ZK-LON-309`). No raw user identities are leaked.
- **Digital Health Blood Donor Pass**: Official credential card displaying verified blood group, donor status tier, donation counts, and life impact metrics.
- **Smart AI Recommendation Engine**: Live compatibility matching tailored to the user's active geographic region and urgent hospital deficits.
- **Appointment Scheduling**: Real-time appointment booking at verified regional transfusion centres.
- **One-Click Demo Profiles**: Quick-test presets for multiple global cities (Delhi, Mumbai, London, Guwahati).

---

## 🚀 Getting Started

### Local Setup
No build steps or complex dependencies required. Simply open `index.html` in any modern browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

Or start a local development server:

```bash
# Using Node.js (via package.json)
npm start

# Or using Python 3
python3 -m http.server 8080
```

Visit `http://localhost:8080`.

---

## 🧪 Automated Testing & Verification

Run the full 12-step end-to-end automated test suite:

```bash
# Run test suite
npm test
# Or directly with node:
node tests/test-lifecycle.js
```

Verify JavaScript syntax across all modules:

```bash
npm run check
```

---

## 🌐 Deployment

The application is statically hosted and fully configured for zero-configuration deployments:
- **Vercel**: Configured via `vercel.json` with clean static caching headers.
- **GitHub Pages / Netlify**: Drop the repository as a static site root.
