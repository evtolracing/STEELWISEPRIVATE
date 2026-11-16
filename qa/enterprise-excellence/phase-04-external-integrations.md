# Phase 4: external integrations

What this system is connected to outside itself, what it is not, and what was and was not tested. No real payment, shipment, customer message or provider call was made in this phase. Every outside address in the QA server points at a stand-in started by the test itself (`qa/tools/start-qa-server.sh`), with keys that are not real.

## 1. Connected

| Service | Use | State | Tested how |
|---|---|---|---|
| PostgreSQL (Supabase) | All data | In use | Locally, against `steelwise_qa` and the 85-branch copy. The host's database was not touched |
| Host (Vercel) | Runs the server and the screens | In use | NOT VERIFIED from here: time limits, number of instances, scheduled triggers |
| AI providers (DeepSeek, OpenAI, Anthropic) | The assistant | Set up if a key is present | Stand-in: success, error, hang, wrong key, breaker. Real providers NOT EXECUTED |
| Speech (ElevenLabs) | Read-aloud | Set up if a key is present | The same |
| Partner systems | Partner API in, events out | Available; no partner is known to be using it | A test partner of each kind, and a test receiver |

## 2. Not connected

| Service | What the system does instead | Decision needed |
|---|---|---|
| Email | Nothing is emailed. The counter "email receipt" route answers 501 | Owner decision 5: later. Which provider |
| Text messages | Nothing is sent | The same |
| Card processor | Counter: staff type the approval code from the terminal. Invoices: staff record a payment with a reference. Web shop: the payment method chosen is a note on the order and no payment is taken (H-013) | Whether web customers pay by card; which processor |
| Carrier rating, labels, tracking | Typed by staff; a carrier may report status through the partner API | Which carriers, if any |
| Tax service | Rates kept in this system | Whether a service is wanted |
| Accounting | Nothing is posted | Which system; export or live link |

These are one finding, H-015 (REQUIRES BUSINESS DECISION). They were not built or simulated in this phase: building a connection to a provider nobody has chosen would be invention, and a simulated provider presented as an integration would be the mock-only behaviour the phase rules forbid.

## 3. Payments

| Question | Answer | Evidence |
|---|---|---|
| Is any order marked paid on the word of a browser? | No | Web checkout records no payment at all (`services/ecomService.js`); a counter card sale needs an approval code entered by a signed-in member of staff (`routes/quickSale.js`); invoice payments are recorded by staff with the amount checked against the balance by the server and the database |
| Can a payment be recorded twice? | No | Row lock and database check; "ten copies of one payment at the same moment record one payment"; Phase 3 |
| Do invoice, payments and balance agree? | Yes, on every record made in the tests | "after everything above, the books still reconcile"; `db-facts` |
| Authorisation, capture, decline, 3-D Secure, refund through a processor, late or duplicate notifications | NOT EXECUTED: no processor | H-013, H-015 |

## 4. Ecommerce, counter and customer portal

| Subject | State | Evidence |
|---|---|---|
| Price, tax and stock shown in the shop | The server's, not the browser's | Sweep "Web checkout uses the system price"; "One customer, one price in every sales channel" (47 checks) |
| Duplicate checkout | One order | Request key; Phase 3; `ui-shop` |
| Counter sale to stock, invoice and payment | One transaction; a repeat is the same sale | "a counter sale reaches stock, billing and payment in one step…" |
| A customer's own system (partner API) | Reads its orders, shipments, invoices and documents; raises a request for quote; accepts or declines a quote | "request for quote to payment: every module holds the same facts at the end"; "what a partner reads equals what staff see" |
| Guest checkout, abandoned carts, shop stock going stale between cart and checkout | Not audited in this phase | Phase 5 handoff |

## 5. Shipping and carriers

| Subject | State | Evidence |
|---|---|---|
| A carrier reads its loads | Only shipments assigned to it; no prices | "a carrier sees only its own loads, and no prices" |
| A carrier reports picked up, in transit, delayed, exception, delivered, proof of delivery | Through the same steps as the shipping desk; never dispatches; refused before dispatch | "a carrier reports delivery through the partner API…" |
| Duplicate and late reports | Recognised; an older status after delivery is refused | "a carrier reports delivered twice, and again late…" |
| Events to the customer and the carrier | Dispatched, delivered, exception, delayed | Events group |
| Rates, labels, tracking numbers from a carrier service, address checks, pickups | NOT EXECUTED: no carrier service | H-015 |
| No real shipment was created | Confirmed: all on the QA database | — |

## 6. Purchasing and suppliers

| Subject | State | Evidence |
|---|---|---|
| A supplier reads purchase orders placed with it and acknowledges them | Works; audited as `PO_ACKNOWLEDGED` | "a supplier reads and acknowledges only purchase orders placed with it" |
| Shipping notices from a supplier, corrective actions, scorecard, document upload | 501: not built (H-014) | "services that are not connected say so…" |
| Receiving against a purchase order, partial receipts, substitutions, supplier invoices | Receiving creates stock (Phase 3). Matching a receipt to a purchase order line is not built | I-007, already recorded; the purchasing phase |

## 7. Notifications

No email, text or push is sent by this system, and there is no in-app notification list. Partner events (section "event reliability") are the only messages that leave. Customer-facing notifications are a Phase 5 subject and depend on H-015.

## 8. Realtime

There is no socket, no server-sent stream and no polling loop for business data. A screen shows what the server had when it loaded and when the user presses Refresh. Stale-view, reconnect and missed-event scenarios are NOT APPLICABLE. What exists instead: the newest answer wins on the Shipping list (H-009), and a stale edit of an order is refused on the API (G-020).

## 9. Import and export

| Subject | State |
|---|---|
| Stock upload from a spreadsheet | Tested in Phase 3: each failed row is reported and good rows are kept |
| Document upload and download | Sweep "Documents" (11 checks); partner download is isolated |
| Large files, interrupted uploads, formula injection in exported spreadsheets, exports of personal data | Not audited in this phase; listed as unverified |

## 10. Conditions for connecting a provider later

Each new connection must: call through `lib/outbound.js`; never run inside a database transaction; have a sandbox account used by the tests; verify inbound notifications by signature and time, store the provider's event id under a unique rule, and apply the change in the same transaction; and appear on the Integrations screen with its state.
