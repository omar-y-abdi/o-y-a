# PR #2 review remediation

Reviewed baseline: `d0295e5653d6402c54f64f7449053c51663e89df`.
All work is performed solo. Production publication is outside this repair.

## Reproduction ledger

| Finding | Independent baseline reproduction | Repair / verification |
| --- | --- | --- |
| R1 | Same-profile B save deletes A's IndexedDB recovery record; reload loses A. | Pending: independent session records and acknowledged-generation deletion. |
| R2 | Empty title blocks recovery with 422; error is in hidden loading panel. | Pending: safe editable drafts distinct from publishable content. |
| R3 | Authenticated validation accepts the supplied noscript marker payload. | Pending: browser-equivalent parser and trusted fallback boundary. |
| R4 | Definitive 413 reuses rejected description and request ID after correction. | Pending: definitive rejection versus unknown commit outcome. |
| R5 | Local D1 accepts a 3,059,673-byte cards row, beyond hosted limits. Hosted consequence is documentation-derived. | Pending: bounded individual public card records and hosted boundary check. |
| R6 | Font replacement retains the previous font ID; replacement stays private. | Pending: typed resource references. |
| R7 | Replacing the built-in icon leaves the original head URL; upload remains private. | Pending: explicit global resource slots and rendering consumers. |
| R8 | Database-only extensionless route returns 404. | Pending: shared canonical route resolver. |
| R9 | Extensionless and own-origin missing links pass validation. | Pending: route/resource/fragment validation. |
| R10 | Stale rename silently unarchives another tab's resource. | Pending: metadata version preconditions. |
| R11 | Removing privacy-title leaves a dangling accessible-name reference and passes validation. | Pending: ID-reference graph validation. |
| R12 | Cloned anchor still points into the original section. | Pending: subtree ID/reference remapping. |
| R13 | Old cached facts accept content rejected by a simulated new template contract. Conditional release issue confirmed. | Pending: policy/contract cache identity and compatibility rehearsal. |

Two negative controls also reproduced: ordinary clone styles survive, and mobile CSS remains breakpoint-specific. Preserve both behaviors.

Baseline evidence: isolated local Worker/browser probes in `output/review-pr2`, `output/review-references`, and failing assertions in `tests/cms-review.test.mjs`. No staging or production content changed for reproduction.

## Operational checks

Investigate the review's additional diagnosis, backup/import, resource-growth and browser-compatibility gates separately. Record measured results and any deployment-only boundaries here; do not treat an untested concern as a reproduced defect.

Sources: [owner review](https://github.com/omar-y-abdi/o-y-a/pull/2), [hosted D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [parse5 scripting mode](https://parse5.js.org/interfaces/parse5.ParserOptions.html).
