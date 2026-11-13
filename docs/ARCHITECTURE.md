# Source layout

`src/` contains shared source, copied into each generated browser build:

| Directory | Responsibility |
| --- | --- |
| `pages/` | Popup, library and settings entry pages; page controllers |
| `components/` | Reusable part form, part list rendering and DOM helpers |
| `core/` | Data model, validation, totals, browser messaging, serialized storage, formatting |
| `background/` | Runtime message routing and floating capture window creation |
| `capture/` | Product and selected-variant extraction |
| `content/` | MakerBazar-only floating button |
| `settings/` | Theme persistence and settings navigation |
| `styles/` | Base, library, forms, popup, theme and settings styles; `main.css` imports them |
| `assets/icons/` | Icon source and browser-ready images |

`dist/chrome/` and `dist/firefox/` are development install folders. `dist/firefox-release/` is the modern Firefox signing build. All are generated: edit `src/`, then rebuild. The obsolete `firefox-legacy` alias is removed during builds. Root manifest locations remain unchanged.

`artifacts/` holds generated ZIPs and UI screenshots; it is ignored by Git. Packaging recreates ZIPs so moved or deleted files cannot linger in them. `scripts/` holds build, package and browser integration tooling; `tests/` holds data-model tests; `docs/` holds project and installation information.

## Popup sizing and initialization
The toolbar popup uses explicit 460 × 560 pixel intrinsic dimensions. Avoid `max-height: 100vh` and `max-width: 100vw` on the popup body: during browser popup auto-sizing, viewport-dependent constraints can create a circular measurement and collapse the popup. Fields scroll inside the form while the Save action stays in place.

The form mounts as soon as storage is read. Product capture then fills it asynchronously, unless the user has started editing. Loading and failure messages are visible independently of capture. Extension storage keys and the Firefox extension ID remain unchanged during the reorganization.
