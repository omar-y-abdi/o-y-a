# Implementation plan

Goal: make an original, joyful, accessible personal website and verify both behavior and its actual appearance.

1. Foundation and content: assert the required generated routes exist, observe failure, implement the static builder and semantic templates. Verify every page has a unique title, canonical and one h1. Use only verified public content.
2. Interaction: test card lookup and cycling including invalid inputs before implementing. Build the tactile machine, share card and bubble break with pointer/keyboard parity. Verify rapid repeat, reduced motion, no-JS and clipboard failure.
3. Privacy and edge: test consent and strict event validation before implementing analytics. Test HTTPS/www canonicalization, unknown hosts, 404 and headers. Ship the same worker handler used by the preview harness, while labeling native-runtime gaps.
4. Visual review: render desktop, mobile, wide, narrow and legal/404 views in Chromium. Inspect the screenshots; fix real layout defects. Capture and review receipt, preferences, bubble and project demo states.
5. Release: run clean build, syntax checks, unit/HTTP/E2E/accessibility audits; collect lab metrics and inventories. Commit a clean local repository; package source, static site and visual evidence. Do not label remote repo, DNS, TLS, CI or deployment as successful without corresponding tool evidence.
