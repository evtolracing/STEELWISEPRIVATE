# Phase 9: component inventory

Written by `qa/tools/phase9-docs.cjs` from a static read of `src/frontend/src`. All measurements were taken on a local machine against a local database whose name contains `qa`.

404 JavaScript and JSX files, 154 of them under `pages/` and `apps/`. The interface library is Material UI throughout; no other component framework is present and none was added. There is no TypeScript.

## Shared components

| Component | Files that use it | Note |
|---|---:|---|
| `components/common/FileUploadZone.jsx` | 12 |  |
| `components/common/StatusChip.jsx` | 12 | One chip for record states |
| `components/layout/Sidebar.jsx` | 11 | The menu. A navigation landmark at every size |
| `components/common/DataTable.jsx` | 2 | The shared table. Used by few screens (V-036) |
| `components/layout/AppLayout.jsx` | 2 | The shell: title, focus on a change of page, the role gate |
| `components/common/AskHost.jsx` | 1 | New in Phase 9. Draws the questions and messages of utils/ask.js |
| `components/common/ErrorBoundary.jsx` | 1 | Catches a crash in a screen |
| `components/common/NotBuiltNotice.jsx` | 1 | New in Phase 9. The notice a control with nothing behind it answers with |
| `components/common/NotFoundPage.jsx` | 1 | New in Phase 9 |
| `components/common/RetentionNotice.jsx` | 1 |  |
| `components/common/RouteErrorPage.jsx` | 1 | What a screen shows when it fails to draw |
| `components/common/SampleScreen.jsx` | 1 | The standing notice on a sample screen |
| `components/common/UnsavedWorkGuard.jsx` | 1 | New in Phase 9. Asks before typed work is lost |
| `components/layout/ChangePasswordDialog.jsx` | 1 |  |
| `components/layout/CutoffClockChip.jsx` | 1 |  |
| `components/layout/CutoffClockPopover.jsx` | 1 |  |
| `components/layout/GlobalSearch.jsx` | 1 | New in Phase 9. The search in the top bar |
| `components/layout/HeaderAIAssistant.jsx` | 1 |  |
| `components/layout/MobileRepLayout.jsx` | 1 |  |
| `components/layout/PrintQueueDrawer.jsx` | 1 |  |
| `components/layout/TopBar.jsx` | 1 |  |
| `components/layout/VoiceSettingsDialog.jsx` | 1 |  |
| `components/common/ConfirmDialog.jsx` | 0 | A confirmation with named buttons |
| `components/common/DateRangePicker.jsx` | 0 |  |
| `components/common/EmptyState.jsx` | 0 | Says there is nothing to list |
| `components/common/LoadingOverlay.jsx` | 0 |  |
| `components/common/SearchInput.jsx` | 0 |  |

## Shared helpers added in Phase 9

| Helper | Purpose | Used by |
|---|---|---:|
| `utils/activateOnKey.js` | Enter and Space open what a click opens | 72 files |
| `utils/notBuilt.js` | A control with nothing behind it says so | 51 files |
| `utils/ask.js` | The application's own question and message boxes | 9 files |
| `config/roleAccess.js` | What each role may open, and where it starts | 6 files |

## Material UI components by use

| Component | Files importing it |
|---|---:|
| Box | 246 |
| Typography | 242 |
| Chip | 219 |
| Paper | 209 |
| Button | 205 |
| Alert | 174 |
| Divider | 162 |
| TextField | 157 |
| Grid | 154 |
| IconButton | 154 |
| MenuItem | 122 |
| Table | 111 |
| TableBody | 111 |
| TableCell | 111 |
| TableRow | 111 |
| TableHead | 109 |
| Card | 107 |
| CardContent | 107 |
| Avatar | 104 |
| Tooltip | 102 |
| Dialog | 102 |
| DialogTitle | 102 |
| DialogContent | 102 |
| Stack | 101 |
| DialogActions | 100 |
| CircularProgress | 98 |
| TableContainer | 92 |
| FormControl | 89 |
| Select | 86 |
| InputLabel | 84 |

## Repeated patterns

| Pattern | Files | Position |
|---|---:|---|
| A table built by hand | 109 | 3 use the shared table. Sorting, paging and the empty state differ from list to list (V-036, Phase 12). Names, headings and keyboard row opening were made the same everywhere by codemod |
| A dialog | 100 | The 12 form dialogs the scenarios open each have a name, keep focus and close on Escape with nothing sent. The others were measured for names and labels only. Buttons are not in one order everywhere; not changed |
| A colour set in the file | 94 | 91 different colours where the theme has a token (V-035, Phase 12) |
| The browser's confirm, alert or prompt | 0 | 26 before Phase 9 (V-008, V-009) |
| A loading indicator | 173 | Three kinds in use; not merged |

## Position

Phase 9 did not merge components. Its instruction forbids a rebuild and an uncontrolled redesign, and merging 100 hand-built tables is both. What it did is make the behaviours a user depends on the same everywhere, in place, and hold each with a static check that fails when a new screen breaks the rule: a name on every control, a heading on every page, keyboard opening on every clickable row, an answer from every button, no browser boxes.

