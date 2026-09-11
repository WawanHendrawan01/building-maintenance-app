# Special Project V1

## Files
Created: special-project-module.js, special-project-module.css, special-project.firestore-rules.txt, tests/special-project.test.cjs, this report.
Modified: index.html (navigation/container/script/style) and service-worker.js (cache version/new assets).
Firebase initialization, auth, PR, other modules and legacy Project are unchanged. Legacy Project uses localStorage project_records and remains intact; no migration.

## Features / filters
Create/list/detail/update project, 10 summary cards, progress bars, status/overdue badges, budget variance and completion. Forms include all requested header/location/responsibility/schedule/purpose/outcome fields. actual_cost is the canonical final actual cost. Project title is optional beside required name.
Filters: keyword, project number/name, area, location, type, category, status, priority, PIC, vendor, created/start/target date ranges, progress range, overdue only, completed only and reset.
Responsive scoped CSS follows existing purple/white design, with two-column mobile summaries, single-column forms and horizontal table scrolling.

## Schema / history
special_projects/{SP-YYYY-XXXX}: header fields plus attachments, completion_remark, updated_by, revision.
special_project_counters/{YYYY}: last_number. Firestore transaction atomically allocates counter and project, checks existing number and prevents overwrite. Concurrent clients rely on Firestore transaction retries.
Subcollections progress_history, status_history and general_history use random IDs, authenticated UID and server timestamps. Each update appends progress/general history; status history is appended when status changes. General history stores before/after changes. All writes commit atomically. Revision guard rejects stale edits.
Progress is 0–100; Completed requires date/final result and sets 100%. Progress 100% alone does not complete. Overdue uses local calendar day and excludes Completed/Cancelled. Variance = budget - actual cost.

## PR and attachments
linked_pr_numbers and team_members are deduplicated arrays. PR numbers are checked against existing purchase_requests documents within the transaction and displayed in detail. Direct PR-detail navigation deferred: existing module has no public detail API.
attachments: [] reserves metadata. Future entries may use name/category/url/mime_type/size/uploaded_by/uploaded_at. Upload explicitly deferred: existing upload requires Firebase Storage; no reusable Drive/Apps Script upload solution found. Core functionality needs no attachments or Storage.

## Manual Firestore configuration
Merge special-project.firestore-rules.txt inside the existing database documents match, preserving other rules. It requires authentication, validates project status/progress/cost, preserves identity, disables project/counter deletion and history update/delete. Check existing wildcard allows: permissions are additive and broad grants can defeat these restrictions.
Current deployed rules are not in this workspace. Rules are NOT deployed or emulator-tested. Existing authenticated PR read permission is required. No composite indexes or duplicate initialization needed. Transactions require network; offline writes are not supported. PWA shell caches both new assets.

## Tests
Run node tests/special-project.test.cjs.
Passed with mock Firestore: create/defaults, unique sequential numbers, all text/select/date/progress filters, overdue/today/closed exclusions, date/progress/cost validation, update/completion, append history counts, budget variance, PR existence, atomic failure, stale edits and auth guards.
Syntax checks and static navigation/container checks performed. Live Firebase permissions, concurrent transaction retries, interactive browser/console, mobile rendering, installed PWA update and full existing-module regression remain unverified; validate in authenticated staging after merging rules. Mock tests do not replace those checks.

## Deferred / unrelated
Deferred: uploads, direct PR-detail navigation, complex relations and procurement automation. No new dependency/framework/backend, migration or deployment.
Existing server.js treats raw URLs with query strings as filenames and can return 404 for versioned CSS/JS. Left untouched per scope; use a static server supporting query strings for browser validation.
Static HTML inspection also found a pre-existing duplicate monthly-maintenance ID. It is left unchanged; the new special-project ID is unique.
