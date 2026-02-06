# SteelWise — Alro Steel Board Presentation & Live Demo Playbook

**Classification:** Board-Level | Confidential  
**Prepared for:** Alro Steel Executive Leadership  
**Date:** February 2026  
**Duration:** 30 minutes (10 min narrative + 20 min live demo)

---

## A) EXECUTIVE NARRATIVE (10 MINUTES)

### Slide 1: Where Alro Is Today

Alro Steel operates over 70 locations across 12 states. You are one of the largest distributors of metals, industrial plastics, and specialty alloys in North America. Your people are good. Your relationships are deep. Your service centers have earned their reputation through decades of reliability.

None of that is in question.

What is in question is whether the infrastructure underneath — the disconnected spreadsheets, the legacy ERP bolted to paper traveler tickets, the phone-and-email quoting process, the truck dispatch that lives in someone's head — whether that infrastructure can carry you through the next five years.

The honest answer: it cannot.

### Slide 2: Where Complexity Is Increasing

Three forces are compressing your operating margins simultaneously:

1. **Customer expectations are accelerating.** Your largest accounts — automotive, aerospace, defense — now expect real-time order status, certified traceability, and sub-24-hour quote turnaround. They will move to whoever provides it first.

2. **Workforce replacement is slowing.** The plant manager who knows every cut list and every truck route by memory is retiring. The next hire will not carry 30 years of tribal knowledge. You need systems that encode that knowledge, not people who hoard it.

3. **Commodity volatility is widening.** LME swings, scrap surcharges, freight rate instability — the margin between a profitable job and a loss is now measured in hours, not days. Manual pricing reviews cannot keep pace.

### Slide 3: Why Existing Systems Can't Scale

Your current stack is not "bad." It was built for a different era:

- **Quoting** happens in email and Excel. There is no feedback loop between what was quoted and what was actually produced. Margin leakage is invisible until month-end.
- **Shop floor scheduling** is a whiteboard and a dispatcher's judgment. When two service centers compete for the same saw time, nobody knows until the truck is late.
- **Quality and traceability** are manual. MTRs are PDFs in a folder. When a customer asks "show me the chain of custody from melt to delivery," the answer takes hours, not seconds.
- **Logistics** is a phone call to a freight broker. You have no visibility into carrier performance, no automated rate comparison, no exception management until the driver calls in late.

These are not failures. They are the natural ceiling of disconnected systems.

### Slide 4: What This Platform Changes

SteelWise is not another software layer on top of your existing tools. It is the **operating brain** that connects every function in a service center into a single, continuous workflow:

- An RFQ arrives → AI normalizes the material spec → Pricing engine applies live commodity rates, margin targets, and customer tier rules → Capacity planner checks saw/shear availability → **Promise date is generated in minutes, not days.**
- A work order drops to the shop floor → Operator sees their queue, scans material → Quality checks embed at each station → Packaging generates certified labels → **Truck dispatches with the right paperwork, on the right dock, at the right time.**
- Executive opens their cockpit → They see throughput per center, margin by product family, on-time delivery rate, freight cost per ton → **They simulate "what if we shift 20% of bar stock processing from Jackson to Detroit?" and see the impact in real-time.**

This is not theoretical. The system is built. The demo is live.

### Slide 5: Why This Is Inevitable

Every metals distributor in North America will have a system like this within 10 years. The only question is: does Alro build it, buy it off the shelf, or get beaten to it by a competitor who did?

The off-the-shelf option does not exist. SAP, Oracle, and Epicor do not understand the difference between processing a plate versus a coil versus a bar. They cannot model multi-step cutting, heat-lot traceability, or drop-tag recovery in a single pass. This is domain-specific software for metals service centers.

**The choice is not "should we modernize." The choice is "do we want to control the system that runs our business, or let someone else control it for us."**

---

## B) LIVE DEMO FLOW (20 MINUTES)

### Step 1: RFQ Intake & AI Normalization (2 min)
**Screen:** Sales → RFQ Inbox  
**Route:** `/sales/rfq-inbox`

**What you show:**
- Incoming RFQ email with free-text material description
- AI parses "50 pcs 4140 HT 2" round bar 12ft" into structured spec: Grade 4140, Shape Round Bar, Diameter 2.000", Length 144", Condition Heat Treated, Qty 50
- Line items auto-mapped to product catalog
- Customer tier and history pulled automatically

**Why it matters:**
*"Your sales reps spend 40% of their time just interpreting what the customer wants. This does it in seconds and eliminates misquotes from misread specs."*

### Step 2: Pricing & Margin Preview (2 min)
**Screen:** Sales → Quote Builder  
**Route:** `/sales/rfq-inbox` → Quote Builder panel

**What you show:**
- Live commodity base price pulled from pricing engine
- Processing cost auto-calculated from BOM (saw time, labor, consumables)
- Margin target overlay showing green/yellow/red by line item
- Customer-specific pricing tier applied automatically
- One-click "Send Quote" with professional PDF

**Why it matters:**
*"This quote was generated with live market data, real processing costs, and your exact margin targets. No one had to look up a price sheet. No one had to call the plant to check capacity."*

### Step 3: Capacity-Aware Promise Date (2 min)
**Screen:** Planning → Schedule  
**Route:** `/schedule`

**What you show:**
- Gantt view of service center capacity
- The new order slotted into available saw/shear/plasma windows
- Drag-and-drop rescheduling with automatic conflict detection
- Promise date calculated from actual machine availability, not guesswork

**Why it matters:**
*"When you promise a date today, you're guessing. This promise date is backed by real machine availability across your entire service center."*

### Step 4: Shop Floor Visibility (3 min)
**Screen:** Service Center → Shop Floor Queue  
**Route:** `/shopfloor`

**What you show:**
- Work center selection (Saw #1, Shear #2, etc.)
- Operator queue with prioritized job list
- Material scan → job verification → start/stop tracking
- Real-time status flowing back to the order board
- Time tracking per operation

**Why it matters:**
*"Your operators see exactly what to cut, in what order, with what material. When they scan and start, the customer can see progress in real-time. No more phone calls asking 'where's my order.'"*

### Step 5: Quality & Traceability (2 min)
**Screen:** Production Quality → Traceability  
**Route:** `/production-quality/trace`

**What you show:**
- Full heat-to-delivery traceability chain
- Embedded quality checks at each production step
- MTR linkage from source mill to final package
- One-click compliance certificate generation

**Why it matters:**
*"When your aerospace customer asks for the full chain of custody, you pull it up in three seconds. This is what wins contract renewals."*

### Step 6: Packaging & Custody (2 min)
**Screen:** Drop Tag Engine → Packaging Queue  
**Route:** `/drop-tags/queue`

**What you show:**
- Items ready for packaging with material details
- Drop tag generation with QR code and heat/lot info
- Apply station — scan tag, scan material, confirm match
- Staging board showing dock assignments
- Chain of custody audit trail

**Why it matters:**
*"Every piece of material leaving your dock has a certified identity. No more misshipments. No more 'we sent the wrong MTR.' The tag IS the traceability."*

### Step 7: Logistics & Delivery (2 min)
**Screen:** Freight & Delivery → Shipment Planner  
**Route:** `/freight/planner`

**What you show:**
- Multi-carrier freight comparison with live rates
- Route optimization across stops
- Tracking board with real-time shipment status
- Exception inbox for delivery problems
- Proof of delivery capture

**Why it matters:**
*"You're spending 8-12% of revenue on freight and managing it by phone. This platform compares rates, optimizes routes, and catches exceptions before your customer calls to complain."*

### Step 8: Margin Actuals vs. Quote (2 min)
**Screen:** Sales → Sales Dashboard  
**Route:** `/sales/dashboard`

**What you show:**
- Quoted margin vs. actual margin by job
- Where margin leaked: material waste, overtime, freight overrun
- Trend by customer, product family, service center
- Drill-down to individual line items

**Why it matters:**
*"For the first time, you can see exactly where you made money and where you lost it — not at month-end, but in real-time. This is how you protect margin across 70 locations."*

### Step 9: Executive Cockpit & Simulation (3 min)
**Screen:** Executive → Executive Cockpit  
**Route:** `/executive/cockpit`

**What you show:**
- KPI tiles: throughput, OTD, margin, utilization, safety
- Service center comparison heat map
- What-if simulation: "Move 30% of plate processing from Plant A to Plant B"
- Forecast explorer with demand trend overlays
- Decision log — every strategic decision tracked with outcome

**Why it matters:**
*"This is your war room. Every number is live. Every decision is logged. When the board asks 'why did margin drop in Q3,' you don't dig through spreadsheets — you show them exactly what happened and what you did about it."*

---

## C) "DAY IN THE LIFE" SCENARIOS

### Sales Rep — Maria, 7:30 AM

**Before SteelWise:**
Maria arrives, opens Outlook, finds 14 RFQs from overnight. She manually types each one into a spreadsheet, cross-references the price sheet (which is 3 weeks old), calls the plant to check if they can cut 2" 4140 round this week, waits 45 minutes for a callback, then sends a quote that may or may not be profitable. By noon, she's quoted 6 of the 14.

**After SteelWise:**
Maria opens the RFQ Inbox. All 14 are already parsed and structured. She reviews the AI normalization, adjusts one line item where the customer's spec was ambiguous, and clicks "Generate Quote." Pricing is live. Capacity is confirmed. She sends all 14 quotes before her first coffee is cold. Her dashboard shows her pipeline, win rate, and margin performance in real-time.

**Impact:** 3x faster quoting. Zero pricing errors. Maria spends her time selling, not typing.

### Plant Manager — Dave, 6:00 AM

**Before SteelWise:**
Dave walks the floor, checks the whiteboard, talks to each operator, mentally prioritizes the day. He finds out at 10 AM that a rush order came in at 8 PM last night — nobody told him. He scrambles to reshuffle the saw schedule, pulls an operator off a low-priority job, and calls the customer to push back delivery on something else. By 3 PM, two trucks are waiting because packaging didn't know the order was expedited.

**After SteelWise:**
Dave opens the Ops Cockpit on his tablet. He sees the rush order flagged at the top of the queue, already slotted into saw time with the original schedule adjusted. His operators' queues are updated. Packaging knows exactly when the job will land and which dock to stage it on. Dave's job today is exception management — handling the two things the system flagged as needing human judgment, not firefighting the whole floor.

**Impact:** Zero surprise orders. 40% less rescheduling. Dave manages by exception, not by crisis.

### Quality Manager — Rachel, 8:00 AM

**Before SteelWise:**
Rachel gets a call from a defense contractor: "We need the full chain of custody for order #47832, every MTR, every quality check, by end of day or we pull the contract." Rachel spends 4 hours tracking paper traveler tags, cross-referencing PDF MTRs in a shared drive, calling the floor to find out which heat lot was used on a specific cut, and manually assembling a compliance package.

**After SteelWise:**
Rachel types the order number into Traceability Search. The complete chain appears: melt source, heat number, MTR (linked), inbound inspection result, production quality checks at each station, packaging custody events, shipping documents, proof of delivery. She generates a certified compliance PDF and sends it to the customer in 8 minutes.

**Impact:** Audit response in minutes, not hours. Contract retention secured. Compliance becomes a competitive advantage, not a burden.

### Executive — Tom, VP of Operations, 9:00 AM Monday

**Before SteelWise:**
Tom's Monday starts with a 2-hour operations review where each plant manager dials in and reads numbers off their own spreadsheet. The numbers don't match corporate's. Half the discussion is about what the real numbers are. Tom makes decisions based on feel, experience, and the last person he talked to.

**After SteelWise:**
Tom opens the Executive Cockpit. Every service center's KPIs are live: throughput per ton, on-time delivery, margin by product family, machine utilization, safety incidents. He runs a simulation: "If we add a second shift at the Detroit center, what happens to throughput and margin?" The answer is instant. He logs his decision with rationale. The board can see it at their next review.

**Impact:** Decisions based on data, not anecdote. Strategy driven by simulation, not spreadsheets. Accountability is automatic.

---

## D) FINANCIAL & STRATEGIC IMPACT

### Margin Protection: $4.2M–$8.5M annually
- **Commodity timing:** Real-time LME/surcharge integration prevents quoting on stale prices. At 70 locations with 200+ quotes/day, even 0.5% margin recovery = $4.2M/year on $840M revenue.
- **Processing cost accuracy:** Actual saw time, material yield, and labor rates embedded in every quote eliminates the "gut feel" pricing that erodes margin on complex jobs.
- **Quote-to-actual visibility:** Identifying margin leakage by customer, product, and service center lets you reprice systematically, not reactively.

### Freight Savings: $2.1M–$3.8M annually
- **Multi-carrier comparison:** Automated rate shopping across carriers saves 8-15% on freight spend.
- **Route optimization:** Consolidating stops and optimizing load sequencing reduces empty miles.
- **Exception management:** Catching late deliveries and accessorial charges before they become customer credits.
- At estimated freight spend of $25M–$30M, a 10% reduction = $2.5M–$3.0M.

### Scrap & Rework Reduction: $1.8M–$3.2M annually
- **Correct spec from the start:** AI normalization eliminates miscuts from misread specs.
- **Quality gates at each station:** Embedded inspections catch defects before they propagate downstream.
- **Drop tag identity:** Material is never mis-labeled or mis-shipped.
- At industry average 3-5% scrap rate on $840M material throughput, a 30% reduction = $1.8M–$3.2M.

### RFQ Response Time: Revenue Acceleration
- **Current:** 4-24 hours for a standard quote. Complex quotes take 2-3 days.
- **With SteelWise:** Under 15 minutes for standard, under 2 hours for complex.
- **Revenue impact:** First-to-quote wins 60-70% of the time in commodity metals. Faster quotes = more wins at better margins.
- Estimated incremental revenue capture: $12M–$20M over 3 years.

### Headcount Pressure Relief
- This is NOT about layoffs. This is about scaling without proportional hiring.
- **Current pain:** Every new location requires 2-3 additional admin/coordination staff. With SteelWise, that drops to 0-1.
- **Retirement risk:** When a 30-year plant manager retires, their knowledge leaves with them. SteelWise encodes operational knowledge in the system.
- **Estimated savings:** $1.2M/year in avoided new hires for growth, plus $800K/year in reduced training time.

### Total Estimated Impact: $10M–$17M annually at full deployment

---

## E) COMPETITIVE MOAT EXPLANATION

### Why Competitors Can't Copy This Easily

1. **Domain depth takes years.** Understanding the difference between processing a 4140 heat-treated round bar versus a 304 stainless plate versus an aluminum extrusion — and encoding that into pricing, scheduling, quality, and logistics — requires deep domain expertise. Generic ERP vendors have spent decades NOT solving this. They won't start now for one customer segment.

2. **Integration is the product.** The value is not in any single module. It is in the fact that the RFQ flows into pricing flows into scheduling flows into shop floor flows into quality flows into packaging flows into shipping flows into margin analysis — unbroken. Replicating this requires rebuilding every connection, not just every screen.

3. **The last mile is custom.** Every metals service center has slightly different processes: different cutting tolerances, different quality standards, different packaging requirements. A system that can adapt to those differences while maintaining a common core is extraordinarily difficult to build from scratch.

### Data Compounds Over Time

- Every quote improves the pricing model.
- Every job teaches the capacity planner what "realistic" looks like for that machine and material combination.
- Every quality defect refines the inspection protocol.
- Every freight shipment improves carrier scoring and rate prediction.
- After 12 months, your system knows your business better than any new hire ever could. After 36 months, it is irreplaceable.

### Switching Cost Increases Naturally

This is not vendor lock-in by contract. This is operational lock-in by value:
- Retraining 70 locations off a system they use every day is a 12-18 month project.
- The historical data — margin trends, quality patterns, carrier performance — cannot be migrated to a generic ERP without losing its meaning.
- The operational workflows (scheduling rules, pricing tiers, quality gates) are embedded in the system. Rebuilding them elsewhere is rebuilding the business.

### AI Improves With Scale

- More locations = more data = better demand forecasts.
- More customers = better pricing predictions.
- More shipments = better carrier performance models.
- **The system gets smarter every day it runs.** A competitor starting from zero has years of data disadvantage.

---

## F) OBJECTIONS & RESPONSES

### "We already have systems that work."

**Response:** You have systems that function. They do not work together. Your ERP tracks inventory but doesn't know what the shop floor is doing. Your quoting tool doesn't know what the plant can deliver. Your quality records are PDFs in a folder that no one can search. The issue is not that individual tools are bad — it's that the gaps between them are where you lose money, time, and customers. SteelWise closes those gaps.

### "This is too big. We can't do all of this at once."

**Response:** Correct. You shouldn't. The rollout is designed in phases. Phase 1 is one service center, one shift, core workflow: order intake through shipping. That's 90 days. If it doesn't prove value in that window, you stop. But here's the reality — every company that pilots this in one center expands, because the operators in Center B see what Center A has and they demand it.

### "The risk of disruption is too high."

**Response:** The system runs alongside your existing tools, not instead of them. During Phase 1, your current ERP stays running. Operators use SteelWise for the new workflow while the old system runs in parallel as a safety net. There is no big-bang cutover. There is a gradual shift as confidence builds. The real risk is NOT disruption from adopting this. The real risk is the slow-motion disruption of losing customers to competitors who quote faster, deliver more reliably, and prove traceability on demand.

### "What if adoption is slow?"

**Response:** Adoption is driven by two things: the system has to make people's jobs easier, and leadership has to signal that this is the standard. SteelWise is designed for the operator first — the person standing at the saw at 6 AM. Their interface is a simple queue: what to cut, in what order, with what material. Scan and go. It is simpler than the whiteboard they use today. For adoption to fail, the system would need to make their job harder, and it does the opposite.

### "Should we build this ourselves? Or buy off the shelf?"

**Response:** Building from scratch means 3-5 years, $10M–$20M in engineering costs, and the ongoing burden of maintaining a custom software team. Off the shelf does not exist for this problem — SAP and Oracle do not understand metals processing, and the ERP vendors who claim to serve metals distributors offer inventory and accounting, not integrated shop floor execution with AI pricing and traceability.

SteelWise is a third option: a purpose-built platform designed specifically for metals service centers, delivered as a turnkey system with customization for your specific processes. You get the benefits of custom without the cost and timeline of building from zero.

---

## G) LICENSING & ROLLOUT STRATEGY

### Phase 1: Pilot (90 Days)
- **Scope:** One service center, core workflow (order → schedule → shop floor → packaging → ship)
- **Investment:** Pilot license at $15K/month for the center
- **Success criteria:** 80%+ operator adoption, measurable improvement in quote speed or OTD
- **Risk:** Minimal — existing systems stay running in parallel

### Phase 2: Regional Expansion (Months 4-9)
- **Scope:** Expand to 5-8 service centers in one geographic region
- **Investment:** Per-location licensing at $12K/month/center (volume discount)
- **Additional modules:** Freight optimization, executive cockpit, partner API
- **Success criteria:** Cross-center scheduling, regional margin visibility

### Phase 3: Enterprise Rollout (Months 10-24)
- **Scope:** All 70+ locations
- **Investment:** Enterprise license negotiation — estimated $600K–$900K/year
- **Enterprise lock-in incentives:**
  - 3-year term: 20% discount
  - 5-year term: 35% discount + priority feature development
  - Co-development rights on industry-specific AI models
- **Additional modules:** AI-powered demand forecasting, digital twin simulation, supplier/customer portals

### Expansion Roadmap (Years 2-3)
- **Customer self-service portal:** Let Alro's largest accounts submit RFQs, check order status, and download compliance docs directly
- **Supplier integration:** Automated PO dispatch, ASN receipt, and inbound quality scoring
- **Carrier API:** Real-time tracking integration with major freight carriers
- **Predictive maintenance:** Machine downtime prediction from production data patterns
- **Acquisition playbook:** When Alro acquires a new service center, the SteelWise deployment becomes the standard Day 1 onboarding process — reducing integration time from 12 months to 90 days

---

## H) CLOSE & CALL TO ACTION

### Why Waiting Is Riskier Than Acting

Every month without this system is a month where:
- Quotes are slower than they need to be, and you lose bids you should have won.
- Margin leaks invisibly through stale pricing and untracked processing costs.
- A customer asks for traceability documentation and your team spends hours assembling what should take minutes.
- A retiring plant manager takes another year of institutional knowledge out the door.
- A competitor invests in exactly this kind of system and starts taking your accounts.

The cost of delay is not zero. It compounds.

### Proposed Next Steps

| Timeline | Action | Owner |
|----------|--------|-------|
| Week 1 | Executive alignment meeting — confirm pilot location and scope | VP Operations |
| Week 2 | Technical assessment — network, hardware, integration points | IT Director + SteelWise team |
| Week 3-4 | Configuration workshop — pricing rules, quality gates, workflow mapping | Plant Manager + SteelWise team |
| Month 2 | Operator training and parallel operation begins | Site supervisor |
| Month 3 | Full pilot operation, Phase 1 metrics review | Steering committee |
| Month 4 | Go/no-go decision for Phase 2 regional expansion | Executive sponsor |

### Executive Ownership

This project requires a named executive sponsor — not IT, not a project manager. A senior operator who understands the floor and has the authority to say "this is how we work now." Without that, every software project stalls in committee.

**Recommended:** VP of Operations or SVP of Service Center Operations.

### The Bottom Line

SteelWise is not software you're buying. It is the operating system for how Alro runs its service centers. It is the difference between a $840M distributor that operates like 70 separate businesses, and a $840M platform that operates as one intelligent network.

The system is built. The demo is live. The only question is whether Alro moves first, or waits until a competitor forces the conversation.

**We recommend moving first.**

---

*End of Board Presentation Playbook*
