import { tokenize, tokenTypes as T } from 'css-tree/tokenizer';
import { ident, string, url as cssUrl } from 'css-tree/utils';

// Tokenization preserves authored CSS and ignores comments/literal strings.
// The caller knows whether the input is a selector, declaration or font value.
export function mapCssReferences(source, { url = value => value, font, selector } = {}) {
  const edits = [], functions = [];
  const replace = (start, end, original, mapped, encode) => { if (mapped !== original) edits.push([start, end, encode(mapped)]); };
  tokenize(source, (type, start, end) => {
    const raw = source.slice(start, end);
    if (type === T.Function) functions.push(ident.decode(raw.slice(0, -1)).toLowerCase());
    if (type === T.LeftParenthesis) functions.push('');
    if (type === T.RightParenthesis) functions.pop();
    if (type === T.Url) { const value = cssUrl.decode(raw); replace(start, end, value, url(value), cssUrl.encode); }
    if (type === T.String) {
      const value = string.decode(raw);
      if (['url', 'image-set', '-webkit-image-set'].includes(functions.at(-1))) replace(start, end, value, url(value), string.encode);
      else if (font) replace(start, end, value, font(value), string.encode);
    }
    if (font && type === T.Ident) { const value = ident.decode(raw); replace(start, end, value, font(value), ident.encode); }
    if (selector && type === T.Hash) { const value = ident.decode(raw.slice(1)); replace(start, end, value, selector(value), value => '#' + ident.encode(value)); }
  });
  for (const [start, end, value] of edits.reverse()) source = source.slice(0, start) + value + source.slice(end);
  return source;
}
