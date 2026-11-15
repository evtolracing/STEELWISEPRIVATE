# Phase 7: routing and bill of material review

## 1. What the product calls a BOM is a routing

`BomRecipe` with `BomOperation` rows (`routes/bomV1.js`, screens `/bom` and `/boms`) is a named, versioned list of steps for a material: step name, kind of work center, sequence, set-up minutes, run minutes, tolerances. It holds no materials and no quantities. A true bill of material, and material requirements worked out from one, do not exist. Both are recorded NOT APPLICABLE in group 2 with the evidence (no table, no address), and raised as finding L-024.

## 2. Routing rules (finding L-011)

| Rule | Before | Now |
|---|---|---|
| A step has a name, a kind of work center that is on file, its own sequence number, and times that are not negative | Any values saved; duplicate sequence numbers accepted | Refused with the field named |
| Draft, review, in use, retired | Any status could be set directly | Conditional updates; each move is from the one status it may come from |
| Putting into use | A routing with no steps could go into use | Needs at least one step on a kind of work center on file |
| A new version | Edited in place | A separate draft; the version in use is untouched until the new one is put into use |
| Putting a routing on a job | Any routing, including a draft | Only one in use; the job records the routing and its version |
| Who may change a routing | Any staff login | Production management and administrators; sales can read (group 2) |
| The routing offered for a material | Included retired ones | One in use; a retired one only when asked for |

## 3. No invented figures (finding L-010)

The "suggest a routing" address used to return steps with set-up and run minutes and tolerances that were built into the code. It now names steps only, with times 0 and tolerances empty, and says so. The instruction forbids inventing processing methods and yield assumptions; none are on file, so none are shown.

## 4. Not verified, and why

- Processing recipes (`routes/processingRecipes.js`, 12 rows in the QA seed) are read by order entry. Their write addresses have no success-path test. NOT VERIFIED.
- Whether the routings on the live database have steps and kinds of work center that exist. NOT VERIFIED: no access.

## 5. Evidence

Group 1: "a routing goes draft, review, in use; only a routing in use can be put on a job", "a routing step must have a name...", "a routing with no steps cannot go into use, and a new version is a separate draft". Group 2: "the routing offered for a material is one that is in use", "a suggested routing names steps only", "sales staff can read routings but cannot create, change or put one into use". Each fix was removed in the mutation run and a scenario failed (`phase-07-regression-results.md`).
