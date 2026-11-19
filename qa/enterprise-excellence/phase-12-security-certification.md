# Phase 12: security and AI assistant certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

## Revalidation in this phase: 11 of 11 scenarios pass

| ID | Scenario | Result | Checks |
|---|---|---|---|
| SC-01 | Security 1: authentication. No token, a forged token, an expired token and a token signed another way are all refused | pass | 22 |
| SC-02 | Security 2: sessions. A role claimed in the token is ignored and a switched-off login stops at once | pass | 4 |
| SC-03 | Security 3: roles. Each department is refused the changes that belong to another | pass | 11 |
| SC-04 | Security 4 and 5: customer accounts and branches. Nobody reads or changes another account's or another branch's records | pass | 27 |
| SC-06 | Security 6: the dispatch board lists stop at the branch (V-028) | pass | 6 |
| SC-07 | Security 7: API. Bad input is the caller's error and carries no internals | pass | 12 |
| SC-08 | Security 8: the database. The application's own connection cannot change history, the guards or the schema | pass | 10 |
| SC-09 | Security 9: files. A document is read only through the signed-in download, by people of its branch | pass | 6 |
| SC-10 | Security 10: secrets. No secret is in an answer, in the page bundle, or in the repository | pass | 4 |
| SC-11 | Security 11: webhooks and partner keys. A partner needs its key, stays in its scope, and a forged delivery signature does not verify | pass | 6 |
| SC-12 | Security 12: financial permissions and the audit trail hold together | pass | 5 |

### SC-01: Security 1: authentication. No token, a forged token, an expired token and a token signed another way are all refused

- pass: no token: /api/orders is refused (401)
- pass: no token: /api/ledger/reports/trial-balance is refused (401)
- pass: no token: /api/users is refused (401)
- pass: a token signed with another secret: /api/orders is refused (401)
- pass: a token signed with another secret: /api/ledger/reports/trial-balance is refused (401)
- pass: a token signed with another secret: /api/users is refused (401)
- pass: an expired token: /api/orders is refused (401)
- pass: an expired token: /api/ledger/reports/trial-balance is refused (401)
- pass: an expired token: /api/users is refused (401)
- pass: a token with algorithm none: /api/orders is refused (401)
- pass: a token with algorithm none: /api/ledger/reports/trial-balance is refused (401)
- pass: a token with algorithm none: /api/users is refused (401)
- pass: a token signed HS512: /api/orders is refused (401)
- pass: a token signed HS512: /api/ledger/reports/trial-balance is refused (401)
- pass: a token signed HS512: /api/users is refused (401)
- pass: a token naming a user that does not exist: /api/orders is refused (401)
- pass: a token naming a user that does not exist: /api/ledger/reports/trial-balance is refused (401)
- pass: a token naming a user that does not exist: /api/users is refused (401)
- pass: a token with no user id: /api/orders is refused (401)
- pass: a token with no user id: /api/ledger/reports/trial-balance is refused (401)
- pass: a token with no user id: /api/users is refused (401)
- pass: a wrong password and an unknown address read the same (401 401)

### SC-02: Security 2: sessions. A role claimed in the token is ignored and a switched-off login stops at once

- pass: a token that claims SUPER_ADMIN for a sales representative is still a sales representative (403)
- pass: the new login works
- pass: switched off, the same token is refused on the next request
- pass: and it cannot sign in again

### SC-03: Security 3: roles. Each department is refused the changes that belong to another

- pass: an operator takes a payment: refused (403 Orders, quotes, customers and invoices can only be changed by sales staff or a manager. Your role (OPERATO)
- pass: an operator writes an order: refused (403 Orders, quotes, customers and invoices can only be changed by sales staff or a manager. Your role (OPERATO)
- pass: a sales representative adjusts stock: refused (403 Stock records can only be changed by warehouse, production, quality staff or a manager. Your role (SALES_R)
- pass: an operator dispatches a shipment: refused (403 Shipments can only be changed by warehouse, sales staff or a manager. Your role (OPERATOR_SAW) can view th)
- pass: a receiving clerk issues a credit: refused (403 Credits, refunds, cancelling an invoice, voiding a sale, recording a lost load and changing tax rates need)
- pass: a CSR writes a journal entry: refused (403 The financial ledger can only be changed by the CFO or a manager. Your role (CSR) can view them.)
- pass: a branch manager closes a month: refused (403 This needs the CFO or an administrator.)
- pass: a branch manager makes an administrator: refused (403 A branch manager cannot grant that role.)
- pass: an auditor changes an order: refused (403 Your role (AUDITOR) can view records and cannot change them.)
- pass: a scheduler changes a price: refused (403 Changing a product needs a manager, the inventory manager or a buyer.)
- pass: nothing was changed by any of them

### SC-04: Security 4 and 5: customer accounts and branches. Nobody reads or changes another account's or another branch's records

- pass: SALES_REP of the other branch cannot open orders (404)
- pass: SALES_REP of the other branch cannot open shipments (404)
- pass: SALES_REP of the other branch cannot open invoices (404)
- pass: SALES_REP of the other branch cannot open coils (404)
- pass: BRANCH_MANAGER of the other branch cannot open orders (404)
- pass: BRANCH_MANAGER of the other branch cannot open shipments (404)
- pass: BRANCH_MANAGER of the other branch cannot open invoices (404)
- pass: BRANCH_MANAGER of the other branch cannot open coils (404)
- pass: INVENTORY_MANAGER of the other branch cannot open orders (404)
- pass: INVENTORY_MANAGER of the other branch cannot open shipments (404)
- pass: INVENTORY_MANAGER of the other branch cannot open invoices (403)
- pass: INVENTORY_MANAGER of the other branch cannot open coils (404)
- pass: SHIPPING_COORDINATOR of the other branch cannot open orders (404)
- pass: SHIPPING_COORDINATOR of the other branch cannot open shipments (404)
- pass: SHIPPING_COORDINATOR of the other branch cannot open invoices (403)
- pass: SHIPPING_COORDINATOR of the other branch cannot open coils (404)
- pass: and cannot change them (404,404,400,404)
- pass: the other branch's lists do not carry them
- pass: a customer login reads its own orders (200)
- pass: a customer login is refused /api/orders (403)
- pass: a customer login is refused /api/customers (403)
- pass: a customer login is refused /api/invoices (403)
- pass: a customer login is refused /api/users (403)
- pass: a customer login is refused /api/ledger/status (403)
- pass: a customer login is refused /api/orders/:id (403)
- pass: a customer login is refused /api/customers/:id (403)
- pass: and cannot read another account's saved preferences (403)

### SC-06: Security 6: the dispatch board lists stop at the branch (V-028)

- pass: asking for another branch's work centers returns none of them (200; 0 of 7 of the other branch's work centers returned)
- pass: the list with no branch named holds only the person's own (200)
- pass: queue: nothing of the other branch's floor (400)
- pass: stats: nothing of the other branch's floor (200)
- pass: operators: nothing of the other branch's floor (200)
- pass: a work center cannot be made at another branch (403 That record belongs to another branch.)

### SC-07: Security 7: API. Bad input is the caller's error and carries no internals

- pass: GET /api/orders/not-a-uuid: not a server error and no internals (404 {"error":"Order not found"})
- pass: GET /api/orders?status=CONFIRMED'%20OR%201=1--: not a server error and no internals (400 {"error":"Invalid orderType or status filter"})
- pass: GET /api/orders?limit=999999999: not a server error and no internals (200 [{"id":"5e54c44e-a1e9-4cc4-ae15-a1361c377dcc","orderNumber":"SO-02611","orderType":"SO","buyerId":"d)
- pass: GET /api/orders?limit=-5&offset=abc: not a server error and no internals (400 {"error":"limit must be a whole number, zero or more"})
- pass: GET /api/coils/%00: not a server error and no internals (400 {"error":"That address is not valid."})
- pass: GET /api/ledger/entries/%%%: not a server error and no internals (400 {"error":"The address is not valid: it has a % that is not followed by two hexadecimal digits.","cod)
- pass: POST /api/orders: not a server error and no internals (400 {"error":"lines must be a list"})
- pass: POST /api/customers: not a server error and no internals (400 {"error":"A customer needs a code and a name"})
- pass: PUT /api/orders/99999999999999999999999999999999: not a server error and no internals (404 {"error":"Order not found"})
- pass: a customer whose code is not text is refused, not saved as "[object Object]" (AA-011) (400 {"error":"A customer needs a code and a name"})
- pass: a six-megabyte body is refused (413)
- pass: answers carry a request id and the safety headers (95bf08e6-e962-4949-badd-3d97f48e4d6f nosniff)

### SC-08: Security 8: the database. The application's own connection cannot change history, the guards or the schema

- pass: cannot change a posted journal line (LEDGER_IMMUTABLE: the lines of a posted journal entry cannot be added, changed or removed)
- pass: cannot delete audit history (permission denied for table AuditLog)
- pass: cannot empty the audit log (permission denied for table AuditLog)
- pass: cannot rewrite the record of applied updates (permission denied for table _prisma_migrations)
- pass: cannot make a table (permission denied for schema public)
- pass: cannot drop a guard (must be owner of relation JournalLine)
- pass: cannot switch triggers off for the session (permission denied to set parameter "session_replication_role")
- pass: cannot make itself a superuser (permission denied to alter role)
- pass: cannot read password hashes of the database roles (permission denied for table pg_authid)
- pass: the role has no superuser, create-database, create-role or bypass rights ([{"rolsuper":false,"rolcreatedb":false,"rolcreaterole":false,"rolbypassrls":false}])

### SC-09: Security 9: files. A document is read only through the signed-in download, by people of its branch

- pass: a PDF is uploaded against the order (201)
- pass: no sign-in, no download
- pass: a customer login of another account cannot download it (403)
- pass: its own branch downloads it as an attachment (200 attachment; filename="p12-cert.pdf")
- pass: the stored file is not served at its own address (404)
- pass: a script dressed as a PDF with a path in its name is refused (400)

### SC-10: Security 10: secrets. No secret is in an answer, in the page bundle, or in the repository

- pass: no answer carries a secret
- pass: the built pages hold no server secret (4.5 MB read)
- pass: no .env file with values is tracked (.env.example,src/backend/.env.example,src/frontend/.env.example)
- pass: no connection string with a password to a remote host, API key or long-lived token is in the repository

### SC-11: Security 11: webhooks and partner keys. A partner needs its key, stays in its scope, and a forged delivery signature does not verify

- pass: with its token the partner reads its own orders
- pass: without a token it is refused
- pass: it is refused a scope it was not given
- pass: a partner token is not a staff token
- pass: a staff token is not a partner token
- pass: the scheduled address refuses a wrong secret (401)

### SC-12: Security 12: financial permissions and the audit trail hold together

- pass: finance writes an entry (201 )
- pass: the person who wrote it cannot post it (403 An entry is posted by someone other than the person who wrote it.)
- pass: a second finance person posts it (200 )
- pass: both acts are in the audit trail under their own names (2 lines, 2 people)
- pass: an administrator who is not the owner or CFO cannot stop the ledger (403)

## AI assistants (section 18): 9 of 9 scenarios pass

The assistant was tested, not assumed: what it is given by role and branch, forged roles, injected instructions, invented figures, the audit trail, failures of the AI service, and the streaming route. **The AI service itself was a stand-in**: what a real model answers to a hostile prompt was not and cannot be tested here. What was tested is what the server sends to the model and what it will accept, which is where the control lies: the model is given only data the person may already see, and it has no ability to change anything.

| ID | Scenario | Result | Checks |
|---|---|---|---|
| AI-01 | AI 1: only signed-in employees can reach an assistant; customer and partner logins cannot | pass | 9 |
| AI-02 | AI 2: ledger figures go to the model only for finance, leadership and the auditor; a branch manager gets the branch; nobody else gets any | pass | 14 |
| AI-03 | AI 3: the assistant hands the model nothing the person could not read on a screen | pass | 6 |
| AI-04 | AI 4: no message, however it is written, makes the assistant change a record | pass | 6 |
| AI-05 | AI 5: no figure is invented by the server | pass | 5 |
| AI-06 | AI 6: use of the assistant is in the audit trail, without the text of the question | pass | 2 |
| AI-07 | AI 7: bad requests to the assistant are refused cleanly | pass | 6 |
| AI-08 | AI 8: the streaming assistant obeys the same rules | pass | 5 |
| AI-09 | AI 9: the other AI helpers change nothing and invent no record | pass | 4 |

### AI-01: AI 1: only signed-in employees can reach an assistant; customer and partner logins cannot

- pass: /api/ai/assistant: no sign-in, no answer (401)
- pass: /api/ai/assistant: a customer login is refused (403)
- pass: /api/ai/chat: no sign-in, no answer (401)
- pass: /api/ai/chat: a customer login is refused (403)
- pass: /api/executive/ai/query: no sign-in, no answer (401)
- pass: /api/executive/ai/query: a customer login is refused (403)
- pass: /api/ai/quote-assistant: no sign-in, no answer (401)
- pass: /api/ai/quote-assistant: a customer login is refused (403)
- pass: the executive assistant route is refused to an operator (403)

### AI-02: AI 2: ledger figures go to the model only for finance, leadership and the auditor; a branch manager gets the branch; nobody else gets any

- pass: a sales representative is answered (200 )
- pass: a sales representative: ledger figures are not handed to the model ({"model":"deepseek-chat","messages":[{"role":"system","content":"You are SteelWise AI, the intelligent voice a)
- pass: an operator is answered (200 )
- pass: an operator: ledger figures are not handed to the model ({"model":"deepseek-chat","messages":[{"role":"system","content":"You are SteelWise AI, the intelligent voice a)
- pass: a warehouse clerk is answered (200 )
- pass: a warehouse clerk: ledger figures are not handed to the model ({"model":"deepseek-chat","messages":[{"role":"system","content":"You are SteelWise AI, the intelligent voice a)
- pass: the CFO is answered (200 )
- pass: the CFO: ledger figures are handed to the model ({"model":"deepseek-chat","messages":[{"role":"system","content":"You are SteelWise AI, the intelligent voice a)
- pass: the auditor is answered (200 )
- pass: the auditor: ledger figures are handed to the model ({"model":"deepseek-chat","messages":[{"role":"system","content":"You are SteelWise AI, the intelligent voice a)
- pass: the receivables figure given for the CFO is the figure on the report (234967.38)
- pass: a branch manager gets own-branch figures and is told so ({"model":"deepseek-chat","messages":[{"role":"system","content":"You are SteelWise AI, the intelligent voice a)
- pass: and no other branch's sales are in it (QA Branch 40 (MIXED))
- pass: each of these reads and refusals is in the audit log (7)

### AI-03: AI 3: the assistant hands the model nothing the person could not read on a screen

- pass: answered (200 )
- pass: nothing of the other branch's sale is in the context
- pass: nor its stock item (P11-MWMXFR5R-76)
- pass: the assistant gives an operator no staff directory the API refuses them (API 200; 0 addresses handed over)
- pass: no password or token field is ever in the context
- pass: a sales representative is not handed item cost

### AI-04: AI 4: no message, however it is written, makes the assistant change a record

- pass: every message is answered without a server error (200,200,200,200,200,200,200,200)
- pass: the forged conversation is answered or refused, not a server error (400)
- pass: a message from the browser is never forwarded to the model as a system or tool message (0 system, 0 tool)
- pass: and the forged claim to be the CFO brings no ledger figures
- pass: nothing in the database changed ([7757,1306,55,26,"19385048.8078",4793,1023] -> [7757,1306,55,26,"19385048.8078",4793,1023])
- pass: the model is given no tool it could call

### AI-05: AI 5: no figure is invented by the server

- pass: when the AI service fails the assistant says it could not answer (502 {"error":"The assistant could not answer.","requestId":"06ab8222-3cd7-4df4-a7a9-77ff96a96b38"})
- pass: the failure carries the request id and no internals ({"error":"The assistant could not answer.","requestId":"06ab8222-3cd7-4df4-a7a9-77ff96a96b38"})
- pass: when the AI service does not answer in time the assistant says so (502 {"error":"The assistant could not answer.","requestId":"a9bdbcd8-0c55-4d2f-8019-75cd91b2cb49"})
- pass: the executive question route gives no invented analysis (501 {"error":"The executive question box is not built. It gives no analysis and no figures.","sample":true,"us)
- pass: a question about something that does not exist is still only given what is on file

### AI-06: AI 6: use of the assistant is in the audit trail, without the text of the question

- pass: the question is recorded with who asked and what kinds of records were read (1)
- pass: the words of the question are not stored

### AI-07: AI 7: bad requests to the assistant are refused cleanly

- pass: no message: 400
- pass: no body: 400
- pass: a body of the wrong shape is the caller's error, not a server error (400)
- pass: messages with nothing usable in them are refused, not a server error (400)
- pass: a very long message is refused or cut, never an error or a hang (400)
- pass: the model is not sent an unbounded message (0)

### AI-08: AI 8: the streaming assistant obeys the same rules

- pass: the stream answers (200)
- pass: a sales representative's stream is given no ledger figures
- pass: a customer login is refused the stream (403)
- pass: a forged system message is not forwarded on the stream either
- pass: when the AI service fails mid-stream the person is told it failed, without the service's own message (event: meta data: {"queryTypes":["orders"],"hasDbData":true}  event: error data: {"error":"The assistant could)

### AI-09: AI 9: the other AI helpers change nothing and invent no record

- pass: /api/ai/quote-assistant is not a server error (200 )
- pass: /api/ai/analyze-product is not a server error (400 Product specs are required)
- pass: /api/v1/ai/work-order-optimize is not a server error (404 )
- pass: no quote, order, work order or job was made by them

## Defects found and corrected in this phase

| Finding | Severity | Status | Area | What is open |
|---|---|---|---|---|
| AA-001 | P2 | VERIFIED FIXED | Home dashboard; sign-in check | With no database configured GET /api/dashboard answered 200 with invented figures (125,000 lb on hand, orders SO-1001 and SO-1002 for "ABC Manufacturing" and "XYZ Industr |
| AA-002 | P1 | VERIFIED FIXED | Executive cockpit | POST /api/executive/ai/query answered every question with a written analysis that nothing had worked out ("Detroit is at 97% utilization", a margin forecast of 22.8%, "co |
| AA-003 | P1 | VERIFIED FIXED | Assistant in the top bar | The conversation sent by the browser was forwarded to the AI service as it came. A request could include messages marked "system" or "tool", which the model treats with t |
| AA-004 | P2 | VERIFIED FIXED | Assistant in the top bar | Asking the assistant left no line in the audit trail unless the question was about the ledger. When the AI service failed in the middle of a streamed answer, the service' |
| AA-005 | P3 | VERIFIED FIXED | Platform | A zero byte in an address (GET /api/coils/%00) was passed to the database, which refuses it, and the person got "server error" (500). |

Process-level checks: 23 of 23 pass (`qa/results/phase12-process.json`): in production mode another website is given no permission to read answers; with no database every signed-in route answers 503; a polite stop loses no request.

## Earlier suites, rerun in the gate

- Phase 10 security: 277 of 277 pass, 889 checks
- sweep: 20 groups pass, 0 fail
- Branch boundary: 39 checks, 0 problems
- Phase 11 "Tenant, branch, RBAC and AI security": 41 scenarios pass

## Not done, and not claimed

- No outside penetration test and no dependency audit by a third party.
- On the live database the application still connects as the owner of the tables until update 17 is applied and the server is pointed at the limited role (Y-008, W-014): the protection of financial history proved here is **NOT VERIFIED on live**.
- No table-by-table audit of tenant id columns (E-019).
- Secrets on the host are the owner's and were not read.

## Open findings

| Finding | Severity | Status | Area | What is open |
|---|---|---|---|---|
| B-017 | P2 | REQUIRES BUSINESS DECISION | Database | A third of the schema is design that was never built (see X-009). |
| B-019 | P1 | BLOCKED | Platform | Everything happens only when someone opens a screen or presses a button. |
| C-009 | P2 | REQUIRES BUSINESS DECISION | Access control | The core order-to-cash and shop records are held; the rest are not. |
| E-011 | P1 | REQUIRES BUSINESS DECISION | Platform | Known vulnerabilities in installed packages: backend 8 (1 critical, 4 high), frontend 11 (4 high) |
| E-015 | P1 | FIXED — NOT VERIFIED | Platform | No evidence that a backup has ever been restored |
| E-017 | P2 | REQUIRES BUSINESS DECISION | Platform | No error tracking or alerting service; logs only |
| E-019 | P2 | REQUIRES BUSINESS DECISION | Database | Some tables carry a tenant id; whether every query honours it has not been audited |
| G-003 | P2 | REQUIRES BUSINESS DECISION | Database | Most of the 217 are in the 93 tables that hold no rows and belong to modules that are designed but not built (X-009, B-017). |
| G-011 | P2 | FIXED — NOT VERIFIED | Platform | History can be rewritten by any code with database access. |
| G-015 | P2 | BLOCKED | Platform | Unknown. |
| H-012 | P2 | REQUIRES BUSINESS DECISION | Platform | With N instances a limit is up to N times its number, and the report shows the calls of the instance that answered. |
| H-015 | P2 | REQUIRES BUSINESS DECISION | Platform | Not connected. Since Phase 4 the integration report lists each one with its state and what happens without it. |
| W-014 | P1 | FIXED — NOT VERIFIED | Financial ledger; database | Posted entries are protected by database triggers. A database superuser, or the owner of the tables, can switch triggers off for a session (session_replication_role) or d |
| Y-008 | P1 | FIXED — NOT VERIFIED | Database | The application connects as the database owner (a superuser on QA, the table owner on the host). That role can switch off the journal guards for a session, drop them, rew |
| Y-009 | P2 | FIXED — NOT VERIFIED | Database | The application's connection could create and drop tables and functions in the public schema. |
