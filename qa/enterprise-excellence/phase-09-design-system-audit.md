# Phase 9: design system audit

Written by hand in Phase 9 (2026-11-16) from a read of `src/frontend/src/theme/index.js`, a static count over the screen files, and the measurements in `qa/results/ui-audit.json`. The interface library is Material UI; it was kept, and nothing was added beside it. There is no TypeScript.

## Position before Phase 9

- One theme file set the brand colours, the typeface and a few component defaults. Screens took what they wanted from it and set the rest themselves.
- The default status colours of the library (orange, light blue, light green) were used for text and for white text on colour. Measured: 1,751 texts under 4.5 to 1 on 130 screens.
- The focus ring of the theme was overridden by component styles on menu items, chips and filled buttons.
- No named tokens: a screen that wanted "the colour for a problem" wrote a colour.
- Required fields were marked by typing an asterisk into the label.
- Touch sizes were the library's dense defaults: 458 targets under 24 by 24 on a phone.

## What Phase 9 put in the theme

All of it is in the existing theme file. No second styling system and no dependency was added.

| Token group (`tokens` in `theme/index.js`) | Values | Used for |
|---|---|---|
| `brand` | steel `#1E3A5F`, light, dark, orange `#FF6B35` | Unchanged brand colours. The orange is kept for marks and large figures; it is not used for body text, where it fails contrast |
| `ink` | primary `#1A1A2E`, secondary `#666687`, muted `#6B6B85` | Text. Each reads at 4.5 to 1 or better on white and on the page background |
| `surface` | page, paper, sunken, divider | Backgrounds and lines |
| `status` | good, attention, problem, information, neutral; each with `main`, `tint`, `ink` | One meaning, one colour. `main` reads on white; `ink` reads on `tint` |
| `radius` | control 6, surface 8, card 12 | Corners |
| `space` | page 3, section 3, card 2, field 2, tight 1 (units of 8 pixels) | Spacing by use |
| `layout` | menu width 260, top bar 64, readable width 1440 | The shell |
| `focusRing` | 2 pixels, steel | One ring for every control |
| `touchTarget` | 40 | The smallest target where a hand is busy |

The palette of the theme carries the same colours (`palette.success`, `warning`, `error`, `info` each with `tint` and `ink`), so a screen that uses the library's `color="warning"` gets the corrected colour without being edited.

Component defaults set once: the focus ring that component styles cannot override, with a white ring where the control is itself steel; minimum sizes for icon buttons, small buttons and chips that act; table header weight and colour; dialog, card and alert corners; the skip link; no animation when the person has asked for less motion; print rules that leave the menu and the top bar off the paper.

## Measured effect

| Measure | Before | Now |
|---|---:|---:|
| Texts under 4.5 to 1 | 1,751 on 130 screens | 17 on 4 of 154 screens |
| Controls with no visible focus ring among the first twenty stops of the shell | Several (menu items, chips, filled buttons) | 0 (scenario) |
| Touch targets under 24 by 24 on a phone | 458 | 3 |
| Required fields marked by a typed asterisk | 22 | 0 |

## What is not consistent yet

| Item | Size | Disposition |
|---|---|---|
| Screen files that set a colour of their own | 94 files, 92 colours | V-035, Phase 12. Not changed: replacing them changes the look of a third of the product and Phase 9 forbids an uncontrolled redesign. The 17 hard-to-read texts that remain are all of this kind (V-011) |
| Tables built by hand | 109 files; 3 use the shared table | V-036, Phase 12 |
| Three kinds of loading indicator (spinner, bar, skeleton) | 173 files | Not merged. Each screen says it is loading; the scenarios check that a slow list says so |
| Order of buttons in dialogs (Cancel left or right) | About 100 dialogs | Not changed. The application's own question box puts Cancel first and the action last, in the action's colour |
| Page headers: some screens use a steel banner, some a plain heading | All screens | Not changed. Every page now has one main heading whichever style it uses |
| Typography sizes set on the element | Many | Not counted |

## Brand

Steel blue, the orange mark, the Inter typeface and the name are unchanged. Colours were darkened only where text failed contrast, and the status colours keep their hue (green, amber, red, blue).

## Not verified

- No designer reviewed the result. No picture-by-picture comparison of every screen before and after was made; the main screens were looked at by eye at desktop and phone size during the work, and the measurements above cover the rest.
- Dark mode does not exist and was not added.
- Printing was checked for the order page and the shipment papers, not for every screen.
