import { escape } from '../templates/components.mjs';

// One design powers the studio, receipt and downloadable image.
export function defaultWinDesign(card) {
  return { html: `<article class="win-design" style="box-sizing:border-box;background:#fffdf6;color:#20261e;width:600px;min-height:400px;padding:38px;font-family:Arial,sans-serif;border-radius:3px 3px 24px 3px;display:flex;flex-direction:column"><p style="font-size:11px;font-weight:700;letter-spacing:1.4px;margin:0 0 30px">EN LITEN VINST FRÅN OMAR</p><h2 data-card-text style="font-size:34px;line-height:1.22;font-weight:800;letter-spacing:-1px;overflow-wrap:anywhere;margin:0 0 30px;flex:1">${escape(card.text).replaceAll('\n', '<br>')}</h2><div style="border-top:1px dashed #c6cbae;padding-top:17px;display:flex;justify-content:space-between;gap:15px;font-size:12px"><span>Att betala</span><strong>0 SEK</strong></div><p style="font-size:11px;color:#62694f;margin:22px 0 0">Spara känslan. Kvittot är valfritt.</p></article>`, css: '', project: null };
}
