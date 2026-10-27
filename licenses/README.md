# Third-party notices and provenance

[The tracked full notices](../THIRD-PARTY-LICENSES.txt) cover the website, CMS,
Worker packages, SKIFT libraries and esbuild. The build copies that file to
`dist/THIRD-PARTY-LICENSES.txt`. SKIFT also has its own self-contained
[tracked notice](../games/skift/THIRD-PARTY-LICENSES.txt), copied into both game
distributions. These notices supplement the linked `.LEGAL.txt` bundle comments.
Development-only test and deployment tools are not shipped as application code.
The inventory conservatively includes some dependency code removed by bundling.

`inventory.json` records installed versions, full license sources and their
SHA-256 digests. `scripts/third-party-notices.mjs` rejects missing texts, version
drift and unknown packages in the browser and Worker bundle graphs. Changing a
dependency requires reviewing its license and bundled dependencies, updating this
inventory and the full texts together, and passing the GitHub build gates.
Do not replace full notices with SPDX identifiers or silence a failed check.

GrapesJS ships prebundled dependencies. Its `grapes.mjs.map` contains the embedded
source, including Backbone, Backbone.Undo, CodeMirror, codemirror-formatting,
Promise Polyfill and Underscore. The map also identifies these adapted vendors:

| Embedded code | Provenance and full notice |
| --- | --- |
| `src/utils/cash-dom.ts` | Header attributes Cash under MIT. [Cash upstream license blob](https://github.com/fabiospampinato/cash/blob/master/license), Git blob `8a0fdeb821c0e44ab96abcb87d54e978d42b1281`, retained in [cash.txt](cash.txt). The adaptation does not declare an exact upstream release. |
| `src/utils/ColorPicker.ts` | Header identifies Spectrum 1.8.0 and author Brian Grinstead; its CSS identifies 1.8.1. [Spectrum 1.8.1 license](https://github.com/bgrins/spectrum/blob/1.8.1/LICENSE), blob `c85f8b05e521629ccfa991e0370e68c3c3d07eca`, retained in [spectrum.txt](spectrum.txt), includes the copyright holder and full MIT terms. |
| TinyColor inside `ColorPicker.ts` | Embedded header identifies TinyColor 1.1.2 and Brian Grinstead. [Upstream 1.1.2 license](https://github.com/bgrins/TinyColor/blob/1.1.2/LICENSE), blob `d3d5bcdd6bd7c06544c5ff6e302f4d5325fa5cf9`, retained in [tinycolor.txt](tinycolor.txt). |
| `codemirror-formatting@1.0.0` | Package declares MIT but contains no LICENSE file. Its [upstream README](https://github.com/artf/codemirror-formatting/blob/master/README.md) identifies the CodeMirror 2 formatting addon with a module loader. The [CodeMirror v2.38 license](https://github.com/codemirror/codemirror5/blob/9ba175787b8c48a479ffedcb23e8ff80c3085c85/LICENSE), blob `3916e96b2dd2b96c863f9cd8e9709109f67512ed`, is retained in [codemirror-2.txt](codemirror-2.txt). The package source is hash-pinned; no additional fork copyright is invented. |

The GrapesJS ESM bundle, source map and distributed CSS are hash-pinned so an
embedded-code update cannot silently inherit this review. Backbone.Undo's full
MIT notice is extracted from its packaged README, where upstream publishes it.
These source records describe the material inspected; they are not a blanket
legal opinion or evidence about assets uploaded separately through the CMS.

The editor imports GrapesJS's same-version `dist/grapes.min.js` distribution through the bundler's CommonJS interop. This uses upstream's optimized artifact without changing vendor code. Its JavaScript and source map are pinned alongside the ESM files. The notice regression compares every common source-map input byte and permits only the ESM underscore export barrels and the UMD entry wrapper to differ; it also checks the actual CMS build graph uses the reviewed optimized entry. Full tracked notices remain part of the distribution, independent of minified comments.
