# Phase 7: work centers and their capabilities

## 1. What is on a work center record

| Field | Meaning | Used by |
|---|---|---|
| Kind (`WorkCenterType`) | Saw, shear, slitter and so on, as the branch defines them | Scheduling, step start, routing steps |
| Branch | Where the machine is | Every check: a job's steps run at the branch of its plan, which is its work center's branch |
| On or off line | Whether it takes work | Scheduling, job creation, step start |
| Capacity (free-form) | Hours per day; a thickness limit where one was entered | The planner's utilisation figure; the thickness check in scheduling |
| Linked asset | The maintenance record of the machine | Lockout |

No machine capability was invented. Before this phase the code filled in a thickness limit of 6 inches and other defaults for a work center that had none on file (finding L-010). Now a work center reports only what is on its record, and where no thickness limit is recorded the scheduling answer says "thickness was not checked" (group 3).

## 2. Rules added (findings L-015, L-016)

| Rule | Evidence |
|---|---|
| Hours per day must be a real figure between 0 and 24 | Group 3 "a work center's working hours must be a real figure" |
| The kind of a work center cannot be changed, and it cannot be switched off or moved, while open steps sit on it | Same scenario; 409 names how many steps |
| A work center with history is switched off, never deleted | Group 7 |
| A machine with an open maintenance order that locks it out, or recorded out of service or on a safety hold, is given no work and cannot have a step started | Group 3, two scenarios; the answer names the machine and the maintenance order |
| Finishing the maintenance releases it | Same |
| Both addresses that change a work center (`/api/work-centers` and the dispatch address) apply the same checks | Group 3 |

The lockout is a software interlock on the schedule and on the start button. It is not a safety system and controls no equipment. No equipment is connected (finding L-030).

## 3. Operators (finding L-014, L-022)

An operator has a home branch, skills, and certifications by kind of work center with an expiry date. Now enforced: a certification is for a kind on file and cannot expire before it was issued; an inactive operator, one from another branch, or one whose certification for that kind has lapsed cannot start a step; a clocked-on operator cannot be made inactive, deleted or moved; pay rate and emergency contact are sent to managers only.

Decided by the owner on 2026-11-15 (decision 9, L-022) and kept per kind of work center: "An operator needs a current certification to run it" (an operator with none on file is refused; off by default), "One operator may run two steps at once" (off by default), a labor rate for job cost (empty until the owner enters it, hidden from the floor), and an inspection checklist (empty: the standard list is used). A maximum shift length is still not on file and was not invented.

## 4. Gaps

- No screen sets hours per day; it is set through the address only. Recorded with L-025.
- Shifts: the `Shift` table exists with no rows in the QA seed and nothing schedules against it (L-025).
- Lending an operator to another branch is not provided for (group 7, recorded as the current rule under owner decision 2).
- Real machine limits on the live database: NOT VERIFIED.
