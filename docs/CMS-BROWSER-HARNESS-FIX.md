# CMS browser flow correction

This incremental patch applies after the unified PR #2 package and the card-export and back-to-top test fixes. It changes only test code, the CMS test runner, and this note. No application code, dependencies, migrations, or generated assets change.

## Reported failures and correction

| Scenario | Cause in the test flow | Correction |
| --- | --- | --- |
| `asset-archive-recovery-and-locked-win-preview` | The test clicked Archive immediately after Save metadata, before the response and replacement form had completed. Archive could capture the previous CAS version and receive a legitimate 409 conflict instead of the expected gallery. | Wait for a successful metadata POST, completion, and replacement of the old form before archiving. HTTP conflicts still fail the test; they are not silently retried. |
| `builtin-resource-publication` | The broad media selector matched both the sidebar button and the detail view's Back button. Selecting the resource tab already starts opening the media gallery. | Open the resource tab once, then wait for the gallery. Scope subsequent asset selection to the gallery. |
| `custom-card-visible-transform-export` | Reload opens the pages library, where no wins navigation button exists. | Open the resources tab before selecting the wins entry in the sidebar. |
| `distinct-font-replacement-and-history` | The test read upload metadata through a browser Response body which Chromium reported as evicted from its inspector cache. | Keep the real UI upload and check its status and request ID, wait for the UI's upload completion, then retrieve the matching committed metadata through a fresh authenticated read-only API request. Never repeat an upload to obtain its response. |

`CMSBrowserQA` provides these three shared helpers so the main CMS suite and review suites use the same ordering. Existing publication, exact font bytes, history, card text, transform, export, and media visibility assertions remain in place. No forced clicks, arbitrary timeout increases, or weakened result assertions were introduced.

## Regression tests

`tests/test_cms_browser_helpers.py` runs automatically through `scripts/test-cms.mjs`, including explicit suite selections and compatibility runs. It contains nine checks:

- Three browser checks render the actual product library functions in isolated DOM fixtures. Delayed navigation is controlled by the fixture, not presented as a full editor E2E run. They cover duplicate media buttons, initial pages-to-wins navigation, and avoiding redundant media requests.
- Six controlled transport checks cover metadata acknowledgement plus form replacement, HTTP 409, evicted upload response bodies, rejected uploads, a missing persisted upload, and a failed metadata read. These use mocks deliberately; the normal CMS suites still perform real Worker requests.

The previous selector behavior was reproduced against the actual library HTML. Extracting the old test operations into the helpers made all nine regression checks fail; the corrected helpers pass them. Cache eviction is deliberately injected in these tests, not claimed as a naturally reproduced macOS cache event.

An additional real local Worker/D1/R2 probe verified the sequence: upload 201, metadata save 200, stale-version archive 409, current-version archive 200, and unarchive 200. Gallery membership and saved metadata were checked. This verifies the CAS mechanism behind the race, not the precise timing of the user's browser run.

## Verification boundary

On the corrected project, build, lint and 149 Node/Worker tests passed. The nine new helper tests passed through the real CMS runner, and all 14 existing isolated Chromium module scenarios passed, including export and decoding of all 240 cards. Python syntax compilation passed for the changed tests.

Full navigational editor E2E is not certified by those results. Direct navigation to the local Worker was attempted and blocked in the execution environment with `ERR_BLOCKED_BY_ADMINISTRATOR`. Run the full commands below on the local machine or CI. Firefox/WebKit compatibility also requires that run.

A `cms_failure` record with operation `public` and code `unexpected` can be intentional: `tests/worker.test.mjs` injects an asset-binding exception and asserts a safe 503 response. The record's shape was reproduced with that test passing. An isolated record without its surrounding test output does not prove its origin or a new application failure.

## Apply and rerun

From the repository root, with the existing virtual environment and dependencies:

```bash
unzip -o ~/Downloads/o-y-a-cms-browser-flow-fix-20260914.zip -d . &&
source .test-venv/bin/activate &&
npm run quality &&
npm run test:cms &&
npm run test:cms:compat &&
npm run edge:check
```

To investigate just the reported CMS scenarios first, use `npm run test:cms` after a successful build. It now includes the helper regressions, the existing module checks, and all four navigational CMS suites.

No manual file deletion, dependency reinstall, database reset or remote migration is required. Do not unpack the older unified package over this patch afterward: it would restore the old test files.
