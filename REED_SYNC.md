# Reed ingestion and daily activation

Status: implementation checkpoint; no scheduler or Edge Function deployed. Hosting remains deferred. No live Reed call has been made for verification.

The administrator chooses Construction or Technology. Imports fetch search pages (100/page) and then full job details. Existing source IDs are updated atomically without changing IDs, staff closure, curated requirements or consultant stages. Hidden salaries stay null; salary unit/currency are retained rather than assumed annual GBP. Invalid expiry values fail the record; normalised expiry dates exclude expired roles from matching/discovery and reject new interests. Staff status remains separate from expiry.

Classification is deliberately conservative title matching, not an evaluated AI classifier. Some relevant roles will be excluded. Review representative Reed results before acceptance and expand the controlled role vocabulary based on evidence. The default technology search is `software`; comprehensive Technology coverage and a reviewed search-query set remain open.

Each import is bounded to 90 seconds and 200 search results from the UI/daily endpoint (maximum 500 for validated server calls). Caps and any failures are reported as partial, never a full refresh. Vacancies missing from a partial search are not deleted or closed. Resuming beyond the cap, durable sync-run monitoring, concurrent-run leases and rematching refreshed requirements remain open before D4/D5 acceptance. No automatic retry loop spends provider quota.

## Staging activation and checks

1. Deploy the application and apply canonical migrations to isolated staging. Configure Worker `REED_API_KEY` and a strong `CRON_SECRET` through secure environment settings.
2. Deploy `supabase/functions/reed-sync` into the isolated staging project. It checks its own long bearer secret; `verify_jwt=false` is intentional. Set `UKTL_CRON_SECRET` to the Worker secret and `UKTL_SITE_ORIGIN` to the exact HTTPS staging origin. It only calls that configured origin, refuses redirects and attempts both sectors independently.
3. Manually invoke it using the secret from a secure operator environment. Missing/wrong credentials must return 401; partial/upstream failures must return 503. A dispatcher 200 is not proof of complete job-board coverage or acceptable matching.
4. Verify salary units, dates, detail text, source links and sector accuracy against actual provider responses. Re-run to prove deduplication and updates. Close a role as staff and verify it stays closed. Set an isolated test role's expiry to yesterday and verify it cannot appear in discovery or accept an interest.
5. Only after these checks, enable pg_cron/pg_net, provision the two Vault entries named in `supabase/reed-schedule.sql`, and execute that operator script. It schedules 05:00 UTC daily. Inspect `cron.job_run_details` AND `net._http_response`: enqueue success alone does not prove HTTP/import success. Test a failed provider response and alert handling before production.
6. Stop the schedule with `select cron.unschedule('uktl-reed-daily');` when needed. Do not point staging at production data.

References: https://www.reed.co.uk/developers/jobseeker and https://supabase.com/docs/guides/functions/schedule-functions.
