# Phase 10: authentication review

Scope: staff and customer sign-in (`src/backend/src/routes/auth.js`, `middleware/auth.js`), the user screen's login fields (`routes/users.js`), and the frontend's handling of the token (`hooks/useAuth.jsx`, `ChangePasswordDialog.jsx`). Partner tokens are in `phase-10-api-security.md`.

## How a sign-in works now

1. `POST /api/auth/login` with email and password. A missing, empty or non-text field is refused 400 without a server error.
2. If the login is paused (`lockedUntil` in the future) the password is not compared and the answer is the same sentence as a wrong password.
3. The password is compared with bcrypt. An address with no login is compared against a hash nobody has, so the time is the same (Y-003).
4. A wrong password adds one to `failedLoginCount`. The tenth in a row sets `lockedUntil` 15 minutes ahead, with a conditional update so a burst records one pause, one `LOGIN_LOCKED` history line and one alert (Y-002).
5. A right password clears the count and answers a token signed HS256 with `userId`, `role` and a session mark `sv` taken from `tokensValidAfter`.
6. Every request: the token is verified with HS256 only (Y-007), must carry a text `userId` (Y-018), the login must exist and be switched on (403 if switched off), and the session mark must equal the login's current mark (401 `SESSION_ENDED` otherwise, Y-001).

## What ends a sign-in

| Event | Effect | Scenario (group 1) |
|---|---|---|
| The person changes their password | Every other token refused; this device gets a fresh token | "Changing your password ends every other sign-in ..." |
| An administrator resets it | Every token refused | "An administrator resetting a password ends every sign-in" |
| The login is switched off | 403 on the next request | "A switched-off login cannot sign in ..." |
| The login is removed (switched off, not deleted) | Old token refused | "Removing a login ... ends its sign-ins" |
| Sign out everywhere (`POST /api/auth/logout-all`, in the profile menu) | Every token refused | "Sign out everywhere ..." |
| Role taken away | Next request uses the new role | "A role taken away takes effect on the next request" |

## Register

`POST /api/auth/register` is open only while no login exists (first set-up). With a signed-in caller it follows the Users screen's rules (Y-013): the caller's organization only, no customer roles (they are tied to an account on the Users screen), no role the caller may not grant, first and last name required, and a history line. Tested by "Registering a login is closed once the first login exists ..." and "The owner registering a login cannot place it in another organization ...".

## Password rules

At least 8 characters; the current password is needed to change it. Not changed in this phase: no complexity or breach-list rule, no second factor. Those are a business decision (recorded in `phase-10-report.md` under what Phase 11 or the owner decides).

## Results

Group 1 of `qa/sim/phase10-security.mjs`: 36 scenarios. Unit tests in `src/backend/test/securityRules.test.js` for the session mark, the algorithm and the pause. Proof by removal: Y-001, Y-001s, Y-002, Y-002s, Y-003, Y-007, Y-013, Y-013b, Y-015, Y-018 each make a named test fail when taken out (`qa/results/phase10-mutations.json`).

## Not verified

- Behaviour behind the host's proxy: the lockout does not use the address, so it is not affected; the per-address limit is (E-014).
- Token life on the host: `JWT_EXPIRES_IN` is the owner's setting; the code default is 24 hours.
