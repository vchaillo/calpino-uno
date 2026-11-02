# Calpino Uno

A responsive, French-language Formula 1 explorer for every season from 1950 to the current year. Independent fan project, not affiliated with Formula 1.

## Features

- Season calendar, circuit locations and race winners.
- Driver and constructor championships with proportional points bars.
- Race results, grid positions, laps, finishing status, qualifying and sprint results.
- Search and filters; favorites, watched races and watchlist across seasons.
- Google authentication and UID-scoped Firestore collection, profile and preferences, with optional legacy import.
- In-memory request cache, request deduplication, race-condition protection and explicit error/retry states.

## Data

[Jolpica F1](https://github.com/jolpica/jolpica-f1) provides the Ergast-compatible API. Data completeness varies by season and session. Results appear when published by the API; this is not a live timing app. Browser requests use the browser-managed User-Agent. Public F1 archives need no API key; account access uses Firebase Authentication and Cloud Firestore.

## Development

Serve this folder with any static HTTP server, for example `python3 -m http.server 8000`. No build dependencies. Validate JavaScript with `node --check app.js`.

## Deployment

The GitHub Actions workflow deploys public files to GitHub Pages on every push to `main`. Select **GitHub Actions** as the Pages source in repository settings.

Personal lists synchronize through Firebase. Finish the console configuration and deploy the Firestore rules using [FIREBASE_SETUP.md](FIREBASE_SETUP.md); GitHub Pages deployment does not deploy Firebase rules.

## Career statistics

The Statistics tab uses a compact snapshot adapted from [F1DB](https://github.com/f1db/f1db), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution, source version and latest completed race date appear in the UI. The deployment regenerates the snapshot from the latest F1DB release on each push and when the hourly release check detects new data. No additional data license restrictions are introduced by this adaptation.

Records: world titles, Grand Prix wins, poles (not merely grid position), sprint wins, podiums, fastest laps, race starts, completed laps, grand slams and win percentage (minimum 20 starts for records). Driver profiles include season-by-season statistics. Laps led are unavailable in this source and explicitly marked; completed laps are not presented as laps led. Raw points and win rates need era context.

Run `python3 scripts/refresh-statistics.py` to refresh the local snapshot.

## Accounts and cloud data

Google sign-in replaces the demo account. The editable name, favorite team, collection flags, theme and per-view layouts are stored under the authenticated UID in Firestore. Snapshots synchronize changes across devices; transaction writes keep watched/watchlist exclusive and preserve concurrent collection changes. Logout and account changes unsubscribe old listeners and immediately clear all personal state. Late callbacks from another UID are ignored. Data is cached only in memory, while Firebase Auth manages its own session persistence.

Legacy browser data is imported only after the user chooses the destination account on the profile page. Successful imports merge existing cloud records and remove the old browser data. Failed imports remain retryable and do not erase the local originals. Email addresses, demo sessions and anonymous visit logs are excluded from migration.

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for console steps, rules, tests and the data schema. `npm test` validates account switching and migration logic. `npm run test:rules` uses a local demo emulator and validates owner-only access and field constraints.

## Cockpit navigation

The edge-to-edge hero uses an industrial driver's-eye cockpit illustration with native year digits and interactive paddles. Click the screen to choose a year, scroll over it to step seasons, or use left/right keys outside form inputs, dialogs and the map. The upper dashboard shows the next race, local start time, days remaining, published-race progress and championship top three. The display is archive navigation, not live telemetry. Animations respect reduced motion.

## Tables and session availability

All rendered tables offer keyboard-accessible column buttons with ascending/descending sorting and aria-sort indicators. Numbers, qualifying times and text are compared appropriately; unavailable values stay last and existing row actions remain attached. Sprint stays disabled until published SprintResults are found for that race, and is disabled for pre-2021 seasons. Yellow SVG trophies identify race/sprint winners and completed-season champions. Interface surfaces use square corners while team markers and mechanical drawings remain circular.

## Circuit archive

Circuit profiles cover 78 circuits and 160 historical layouts using F1DB race metadata and SVG outlines by Jules Roy / F1DB (CC BY 4.0). The outline is selected by the race season and round; directory cards show the newest layout. Outlines are adapted to a consistent red contour style. Dates and length/turn counts follow each selected layout. Race counts and winner records include completed World Championship Grands Prix since 1950, excluding sprints and canceled events. Shared-car winners remain individually attributed.

Circuit opening dates are shown only where verified from the circuit's official history (Silverstone, Monza, Spa); other profiles explicitly distinguish the first F1 event from the site's creation date. Statistics and drawings refresh in deployment along with the career snapshot.

## Annual calendar and flags

The Calendar tab shows all twelve months, Monday-first, with race dates and accessible links opening race details. It follows the selected season and supports existing search/filters. Calendar placement uses each published race date. Country flags use bundled flag-icons SVG assets (MIT) rather than emoji fonts. Legacy browser data can be explicitly imported into the authenticated account on the same GitHub Pages origin.

## Layouts, loading and circuit world map

Grand Prix, collection and circuit directory views offer gallery/list buttons with independent account preferences. Lists preserve race actions and circuit profiles, and reuse accessible table sorting. Season changes keep the previous card/row geometry as neutral placeholders until the matching request generation finishes; placeholder results are inert and hidden from assistive technology while the status announces loading. Independent collection, statistics and circuit views remain usable.

The circuit directory begins with an equirectangular SVG world map using real F1DB coordinates. Nearby circuits are clustered; selecting a cluster zooms and lists its members. Map controls, dragging and keyboard arrows move the viewport; points and cluster members open the existing circuit profiles. Search filters both the directory and the map. The bundled world outline is adapted from Natural Earth 1:110m country geometries (public domain): https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson. No external map tiles, API key or map tracking are required.

### Champions timeline

World champion entries use F1DB's explicit `championshipWon` field. Championship points and the margin to the runner-up retain each era's official dropped-score rules. The first race weekend marked as won identifies the title-deciding Grand Prix; this may include a sprint. Unfinished championships are excluded.

The helmet menu exposes the real profile, synchronized appearance and Firebase logout.

The cockpit illustration is a generated industrial driver's-eye sketch with a blank display, black/red bodywork and a pit-lane perspective. Native HTML overlays provide the animated year, wheel scroll, paddles and accessible season dialog.

### Compact season dashboard

The next-race summary uses the API's race start time in the visitor's timezone and a days-remaining countdown. Race progress counts published main-race results. The top three drivers show team emblems. Current emblems are local assets from Formula1.com; see `assets/teams/SOURCES.md`. Historical constructors without a verified emblem use their initials rather than a different team's logo. Career records use the last known constructor; champion timeline entries use that season's last constructor, and circuit winners use their last winning constructor on that circuit.

The steering-wheel display and paddles are the season controls. Left/right keyboard arrows also navigate seasons when focus is outside inputs, buttons, dialogs and the world map. Wheel zoom on the circuit map follows the pointer; it is limited to 1–16×. Marker hints appear on pointer hover or keyboard focus. The helmet menu's appearance switch saves an account preference in Firestore, or a temporary in-memory choice for guests.

### Constructor profiles and direct race navigation

Team names open constructor profiles from the driver and constructor standings and race results. Profiles cover 187 F1DB constructor identities with career totals, season results and driver history. An identity's results are kept separate from its predecessors and successors. Current colored team emblems and available historical marks are bundled locally with source attribution in `assets/teams/SOURCES.md`.

Race list rows open race details by click or Enter/Space. Circuit names, driver names, team names and collection actions remain independent controls and do not also open the row. Collection icons expose their labels and state through accessible names and `aria-pressed`.

## Statistics freshness and expanded records

GitHub Actions checks the latest F1DB release every hour (minute 17 UTC; scheduled runs can be delayed by GitHub). It compares the upstream release tag with the deployed `data/statistics-meta.json`; scheduled deployments run only when that tag changes. Pushes and manual runs rebuild regardless. Statistics, constructor profiles and circuit records are generated together from the same release.

The statistics client revalidates its snapshot every five minutes while that tab is visible and when returning to the tab. Cache-busted requests prevent an old browser response from surviving a new deployment. A coverage warning compares the snapshot date against the selected season's latest Jolpica result. F1DB publication can follow Jolpica; the site displays that source delay instead of claiming immediate live updates.

Records now include second/third places, hat tricks, distinct winning circuits/constructors, winning seasons, maximum wins in one season and consecutive championship Grand Prix wins. Shared-car driver wins retain individual attribution. Nations aggregate driver results by nationality. Constructor, engine and tyre tables use F1DB entity totals and season records. StatsF1 inspired the exploration categories; its tables and protected editorial text are not scraped or republished. Unsupported statistics such as laps led are still explicitly unavailable.

Navigation lives in the header, with a separate animated hamburger panel below 1100px. The helmet remains dedicated to the account menu. Current transparent logos render without a tile background; white backgrounds on legacy raster logos are keyed out with a native SVG filter.
