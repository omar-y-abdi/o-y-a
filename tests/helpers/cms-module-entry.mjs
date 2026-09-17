import { remapClone } from '../../src/cms/client/clone.mjs';
import { editableText, replaceEditableText } from '../../src/cms/client/text-edit.mjs';
import { createEditor } from '../../src/cms/client/editor.mjs';
import { componentInspector } from '../../src/cms/client/inspector.mjs';
import { loadCards } from '../../src/client/cards.mjs';
import { loadCopy } from '../../src/client/copy.mjs';
import { renderWin, exportWin, disposeWin } from '../../src/client/win.mjs';
import { previewData } from '../../src/client/previewdata.mjs';
import { nudgeComponent } from '../../src/cms/client/position.mjs';
import { captureEditorView, restoreEditorView, centerOffset } from '../../src/cms/client/view-state.mjs';
import { synchronizeSharedPageClient } from '../../src/cms/client/shared-project.mjs';
import { materializeManagedSvg } from '../../src/cms/client/managed-svg-source.mjs';

globalThis.cmsTest = { remapClone, editableText, replaceEditableText, createEditor, componentInspector, loadCards, loadCopy, renderWin, exportWin, disposeWin, previewData, nudgeComponent, captureEditorView, restoreEditorView, centerOffset, synchronizeSharedPageClient, materializeManagedSvg };
