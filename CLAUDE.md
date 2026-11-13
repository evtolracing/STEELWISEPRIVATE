# STEELWISE: instructions for every session

Read these before changing anything:

1. `qa/ENGINEERING-STANDARD.md`: the owner's permanent engineering and quality standard. It governs all work.
2. `qa/phase-reports/`: the latest phase gate report says exactly where to resume.
3. `qa/engineering-quality-findings.md` and `qa/defect-register.md`: every finding and its disposition.
4. `qa/module-quality-scorecard.md`, `qa/ticket-traceability.md`, `qa/test-execution-results.md`.

Hard rules for this repository:

- Frontend is JavaScript/JSX with React and Material UI. No TypeScript.
- All testing runs on a local database whose name contains `qa` (`qa/README.md`). Never run simulations against production.
- Every database change ships with a SQL Editor file made by `npm run db:sql-editor -- <migration>` in `src/backend`, tested by running it twice on a copy. The owner applies database updates himself.
- Merge only when the owner says so. Environment settings on the host are the owner's.
- Never claim a test passed unless it was run in this session. Mark anything else NOT VERIFIED.
- A fix is not finished until an automated check exists that fails without it.
