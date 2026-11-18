# Phase 10: dependency security

Measured with `npm audit` on 2026-11-18 in `src/backend` and `src/frontend`.

| Package set | Critical | High | Moderate | Low |
|---|---|---|---|---|
| Backend, production dependencies | 0 | 0 | 1 (uuid) | 0 |
| Backend, all | 0 | 0 | 1 | 0 |
| Frontend, production dependencies | 0 | 0 | 2 (react-router, react-router-dom) | 0 |
| Frontend, all (with build tools) | 0 | 1 (vite, build only) | 3 | 0 |

Every remaining fix is a major-version upgrade. None was made: the prompt forbids uncontrolled major upgrades, and each needs its own testing (react-router 7 changes routing; vite 6 or later changes the build). The vite and esbuild issues concern the development server (path traversal in its optimized files, editor launching, cross-site reads of the dev server), which is not deployed. The react-router finding is in production code: an open redirect when a path with a backslash reaches `<Link>` or `useNavigate`, and an SSR issue that does not apply (the app renders in the browser only). Whether any screen passes a path taken from a query string to them was not audited: NOT VERIFIED.

## Gate added

CI now runs `npm audit --omit=dev --audit-level=critical` for both packages and fails on a critical finding in a production dependency. It exits 0 today.

## Recommendation for the owner (not done)

Schedule the react-router and vite upgrades as their own change with the browser suites (Phase 9 UI, 232 scenarios) as the check. uuid's moderate finding is a missing bounds check in v3, v5 and v6 when a buffer is passed. The backend imports only `v4` (searched in `src/backend/src`: five files, all `import { v4 as uuidv4 }`), so the affected functions are not called; low urgency.

E-011 stays REQUIRES BUSINESS DECISION with this note.
