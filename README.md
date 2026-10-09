# VitalLink — login-first website

Rebuilt from the supplied flowchart on 8 October 2026, preserving the map repairs and existing operations, citizen, and owner features.

## Flow

- Enter website → shared login page.
- Owner login → Admin Panel.
- Registered citizen login → My Dashboard.
- New user → Create account → login → My Dashboard.
- Sign out → login. Guest dashboard URLs and Back navigation return to login.
- Live Operations, map dispatch, SOS broadcasts, inventory changes, verification, and registry deletion are restricted to the administrator. Citizens stay in My Dashboard.

The new entry page is responsive and includes keyboard-accessible forms, inline validation, password visibility, and sample account buttons. Administrator and citizen accounts are routed automatically from their credentials.

## Try it

Open `index.html`, or run `python3 -m http.server 8080` in this directory and visit http://localhost:8080. Use the Citizen demo button, then select Sign in. The owner signs in using their administrator credentials. You can also register a sample account and sign in with its email or mobile number.

Citizen demo: username `Dhiman` (or `dhiman@vitallink.org`), password `123456789`, blood group `B+`.

## Prototype boundaries

Authentication and role routing are implemented in the browser, not enforced by a server. The legacy prototype password hash is not suitable for real authentication. Use sample details only. Registration records and credential hashes are retained in sessionStorage in the same browser tab; sign-in sessions reset on reload. Closing the tab ends this temporary storage. If storage is unavailable, accounts work only until the page reloads. This is not a live medical or emergency service.

External MapLibre, tile, and font providers require internet access. No backend database, real notifications, or cross-device accounts were added.

## Verify

`npm test` runs the existing lifecycle, repair, and map regression suites plus 23 login and role checks. `npm run check` checks all seven JavaScript modules. Automated checks pass. Tests use a mock DOM and map; live browser rendering was not verified in this environment.

Manual checks: register a sample account, return to login, sign in, confirm Live Operations and Emergency SOS are absent, sign out, try browser Back, then sign in with the owner account and confirm it opens Admin Panel.

## Source

- `js/entry.js`: login-first routing, registration, feedback, tab account storage.
- `css/entry.css`: responsive entry page and account forms.
- `js/app.js`, `js/admin.js`, `js/donor.js`: integration with existing dashboards and logout.
- `js/map.js`: retained map fixes.
- `tests/test-entry-flow.js`: flowchart regression coverage.

Citizen donation recommendations now select a donation centre for scheduling instead of dispatching couriers. Citizen blood requests are local demo drafts and do not send notifications or alter inventory. The public Admin demo button and displayed owner credentials were removed. These browser role checks are prototype controls, not tamper-resistant server authorization.

## QA fixes — 9 October 2026

Hospital registration now checks normalized names, emails and phone numbers across account types. Hospital phone login is supported. Ambiguous identifiers from older saved data are rejected with guidance to use a unique identifier. Hospital passwords are stored using the same prototype hash as citizens; legacy plaintext records are migrated on load. This hash is a weak client-side placeholder and is not production authentication.

Donation appointments persist against the citizen account within the same tab, survive sign-out and reload, and do not count as completed donations or award lives-saved/XP credit. Impossible dates are rejected. Storage failures show a temporary-data warning.

The test command now also runs tests/test-qa-fixes.js, covering hospital accounts, collisions, password migration, bookings, request lifecycle, storage failures and malformed saved data. The syntax check includes hospital.js. Browser layout and live map rendering remain unverified.
