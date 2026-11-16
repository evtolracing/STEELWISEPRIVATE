# Phase 9: responsive design

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

## What was measured

Every screen at three sizes (`qa/sim/ui-audit.cjs`): desktop 1440 by 900, tablet 768 by 1024, phone 390 by 844. The scenarios add a large desktop (1920 wide) and a small phone (360 wide) on the main screens.

| Size | Screens | Wider than the window, before | Now | Page errors |
|---|---:|---:|---:|---:|
| desktop (1440) | 154 | 0 of 130 | 0 | 0 |
| tablet (768) | 154 | 0 of 130 | 0 | 0 |
| phone (390) | 154 | 0 of 130 | 0 | 0 |

Touch targets under 24 by 24 at phone size: 458 before, 3 now (`/freight/planner` textbox "Search" 16 by 40; `/executive/digital-twin` slider "Time offset" 20 by 20; `/pos/retail` textbox "Search products, SKU, barcode" 14 by 40). The three that remain are text boxes and a slider measured by their inner part; the area that takes the touch is larger.

## What changed

- The menu is a fixed column from 1200 pixels up and a drawer below that. The drawer is a navigation landmark, keeps the keyboard inside it while open and closes on Escape or on a choice (V-015).
- The top bar keeps the search at every size; the shortcut hint and the branch chip give way first.
- Minimum touch sizes are set once in the theme for icon buttons, small buttons and chips that act (V-034).
- Wide tables scroll inside their own frame, so the page itself never scrolls sideways.

## Scenarios

| Scenario | Checks | Result |
|---|---:|---|

## Not verified

- No real phone, tablet or shop terminal was used: sizes were emulated in one browser engine (Chromium). Safari on an iPad and a touch terminal on the floor are NOT VERIFIED.
- Landscape phones, browser zoom at 200% and 400% (WCAG 1.4.10) beyond what a 390-pixel window shows, and screens between the three sizes were not measured one by one.
- The 58 sample screens were measured for overflow and target size like the rest, and not judged for layout quality: they are to be rebuilt.

