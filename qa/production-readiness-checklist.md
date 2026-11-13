# Production readiness checklist

"Verified" means there is evidence in this repository. "Not verified" means it may well be in place but nobody has shown it.

| Requirement | State | Evidence or what is missing |
|---|---|---|
| Essential workflows complete | Verified on the test database | 150 of 150 simulated jobs, `test-execution-results.md` |
| Critical tests pass | Verified | 47 unit tests, run on every pull request |
| Stock and money reconcile | Verified on the test database | 0 problems across three cycles |
| Security controls enforced | Verified on the test database | `security-readiness-report.md` |
| The tested code is what is live | **No** | Pull request 30 is not merged; three database updates are pending |
| Production configuration reviewed | Not verified | Environment settings are the owner's; values were not read |
| Monitoring and alerts | Partly | Request log and health check exist. No error tracking or alerting (E-017) |
| Database backups | **Not verified** | Depends on the database host's plan. Needed from the owner: is point-in-time recovery on, and how many days are kept |
| A restore has been tested | **No** | A backup is not counted until it has been restored once into a scratch database |
| Recovery time and data-loss targets set | **No** | Business decision |
| Deploy rollback understood | Partly | The host keeps earlier deployments and can promote one back. Database updates are additive, so older code keeps working. Not rehearsed |
| Staging environment | **No** | Tests run locally. A staging copy of production does not exist |
| Outside services validated | **No** | No card processor, email or text provider connected |
| Performance at 80 branches | Verified locally, one open item | `performance-benchmarks.md`; operations cockpit about 1 s at volume (E-023) |
| Lint gate | **No** | No lint configuration (E-016) |
| Incident runbook | **No** | Not written |

## Needed from the owner

1. Confirm the database plan's backup setting and retention.
2. Approve a restore test into a scratch database.
3. Decide whether to add a staging copy.
4. Decide on a linter, an error-tracking service and a shared rate-limit store. Each is a new dependency or service.
