# Coffee Intelligence Dashboard UI Design

## Goal

Upgrade the Beijing coffee map from a functional dashboard into a polished hybrid experience: a glowing map radar with high-end magazine-style panels and a small cafe-themed favicon. The result should feel more distinctive and interactive while preserving the current data flow and map behavior.

## Scope

In scope:

- Restyle the top filter/search controls as a branded intelligence console.
- Restyle the leaderboard as a coffee signal feed.
- Restyle the detail card as a cafe dossier.
- Add lightweight ambient map overlays such as vignette, radial glow, or subtle radar scan effects.
- Add a cafe-themed favicon and reference it from `index.html`.
- Preserve existing search, filter, selection, hover popup, and mobile bottom-sheet behavior.

Out of scope:

- New data fields or API changes.
- Route planning, user accounts, saved lists, or game progression.
- Replacing MapLibre or changing the base map provider.
- Large map-layer rewrites beyond small visual refinements.

## Visual Direction

The chosen direction is a mixed style:

- Keep the current glowing map and emoji orbit effects as the visual foundation.
- Make UI panels feel like premium coffee magazine cards with refined typography, subtle borders, warm highlights, and stronger hierarchy.
- Add a small amount of radar/control-room motion to reinforce the “coffee signal intelligence” theme without overwhelming usability.

The target mood is “city cafe intelligence dashboard,” not full cyberpunk chaos.

## Component Design

### App Shell

`App.tsx` remains the composition layer. It should continue to wire data from `useMapData()` into `MapView`, `FilterBar`, `Leaderboard`, and `DetailCard`.

Add only presentational shell elements here, such as fixed ambient overlays or layout wrappers. Business logic should stay in hooks and components.

### FilterBar

Transform `FilterBar` into the primary command console.

Expected changes:

- Add stronger title treatment: Chinese title plus an English signal-style subtitle such as `BEIJING CAFE SIGNAL`.
- Make the search input feel like a command palette with larger hit area, refined border, and focused glow.
- Keep all existing filter modes and labels.
- Restyle filter buttons as premium capsule controls with a clear active state.
- Preserve the dark-mode toggle behavior, but make the button visually consistent with the control console.

### Leaderboard

Transform `Leaderboard` into a “top coffee signals” feed.

Expected changes:

- Header should communicate curated signal ranking rather than a plain list.
- Top three entries get stronger visual treatment with warm highlights and rank badges.
- Each row should show name, district, brand/category, and score clearly.
- Hover and selected states should feel like a signal lock-on.
- Keep the current maximum list source from `filtered.slice(0, 50)` in `App.tsx`.

### DetailCard

Transform `DetailCard` into a cafe dossier.

Expected changes:

- Header emphasizes cafe name and score/signal strength.
- Existing brand, category, and district tags remain visible but better grouped.
- Radar chart remains a central visual element.
- Six existing stats remain, restyled as compact dashboard metrics.
- Recommendation, style, and crowd sections become clear intelligence summary blocks.
- Address, phone, hours, update time, and source stay at the bottom as lower-priority metadata.

### MapView

Keep existing MapLibre behavior and glowing point system.

Expected changes:

- Preserve existing point, halo, cluster, emoji marker, popup, and selection interactions.
- Avoid rewriting the map source/layer setup unless needed for visual cleanup.
- Ambient effects can be added with CSS overlay elements outside the MapLibre canvas rather than additional map layers.

### Favicon

Add a cafe-themed favicon.

Recommended implementation:

- Create `public/favicon.svg` with a dark circular background and warm coffee cup/steam motif.
- Add a matching `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` entry in `index.html`.

SVG is preferred over `.ico` because it is crisp at multiple sizes and matches the current Vite static asset workflow. This implementation will ship the SVG favicon only.

## Responsiveness

Desktop:

- Filter console remains top-left.
- Detail card or signal feed remains right-side.
- Status remains low-visual-weight and should not compete with controls.

Mobile:

- Preserve current bottom-sheet-style right panel behavior.
- Keep controls usable with touch-sized inputs and buttons.
- Avoid overlays or animations that block map gestures.

## Interaction Requirements

The following behavior must continue working:

- Search filters cafes by name, brand, and address.
- Filter capsules update the displayed cafes.
- Clicking a cafe point or leaderboard item selects it.
- Selecting a cafe opens the detail card.
- Closing the detail card returns to the leaderboard.
- Hover popups on map points and emoji markers remain safe and readable.

## Validation Plan

Automated checks:

- Run `npm run lint`.
- Run `npm run build`.

Manual browser checks:

- Start `npm run dev`.
- Confirm favicon appears in the browser tab.
- Confirm desktop layout remains usable.
- Confirm mobile-width layout keeps controls and bottom panel usable.
- Test search, filter selection, leaderboard selection, map point selection, hover popup, and detail close.

## Implementation Notes

Prefer targeted component styling changes over new abstractions. Keep the current component boundaries unless a component becomes difficult to read. Do not introduce new dependencies for visual effects; Tailwind classes and small CSS additions in `src/index.css` are sufficient.
