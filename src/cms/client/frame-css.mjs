import { tokenize, TokenStream, tokenTypes as T } from 'css-tree/tokenizer';
import { ident, string, url } from 'css-tree/utils';
import { selectorId, checkAttributeIds } from '../frame-id-selectors.mjs';

const groups = new Set(['media', 'supports', 'container', 'layer', 'starting-style']);
const fail = () => { throw new Error('Sidramens CSS kan inte kopplas säkert till sidans ID:n. Ångra den senaste stiländringen.'); };

// The server owns full AST validation. In the browser, edit token spans in
// validated/imported or Grapes-exported CSS without another CSSOM roundtrip or
// shipping the complete grammar. Colours, comments and strings keep their bytes.
export function mapFrameCss(source, ids) {
  if (!source || !ids.size) return source;
  // Idless public nodes receive a temporary editor ID before this boundary.
  // Only server publication needs the separate null-target marker format.
  for (const target of ids.values()) if (typeof target?.id !== 'string' || !target.id) fail();
  const stream = new TokenStream(source, tokenize), edits = [];
  const type = index => Number.isInteger(index) ? stream.getTokenType(index) : T.EOF;
  const text = index => Number.isInteger(index) ? source.slice(stream.getTokenStart(index), stream.getTokenEnd(index)) : '';
  const ignored = index => [T.WhiteSpace, T.Comment].includes(type(index));
  const close = index => { const pair = stream.getBlockTokenPairIndex(index); if (pair < index) fail(); return pair; };
  const edit = (from, to, value) => edits.push({ start: stream.getTokenStart(from), end: stream.getTokenEnd(to), value });
  for (let index = 0; index < stream.tokenCount; index++) if ([T.BadString, T.BadUrl].includes(type(index))) fail();
  const mappedUrl = value => {
    if (!value.startsWith('#') || !ids.has(value.slice(1))) return null;
    return url.encode('#' + ids.get(value.slice(1)).id);
  };
  function attribute(start, end) {
    const tokens = [];
    for (let index = start + 1; index < end; index++) if (!ignored(index)) tokens.push(index);
    let cursor = 0, name = '';
    if (type(tokens[cursor]) === T.Ident || text(tokens[cursor]) === '*') name += text(tokens[cursor++]);
    if (text(tokens[cursor]) === '|' && text(tokens[cursor + 1]) !== '=') {
      name += '|'; cursor++;
      if (type(tokens[cursor]) !== T.Ident) fail();
      name += text(tokens[cursor++]);
    }
    if (!name) fail();
    let matcher = null, value = null, flags = null, valueIndex;
    if (cursor + 1 === tokens.length && type(tokens[cursor]) === T.Ident) flags = text(tokens[cursor++]);
    else if (cursor < tokens.length) {
      matcher = text(tokens[cursor++]);
      if (['^', '$', '*', '~', '|'].includes(matcher)) matcher += text(tokens[cursor++]);
      if (!['=', '^=', '$=', '*=', '~=', '|='].includes(matcher)) fail();
      valueIndex = tokens[cursor++];
      if (type(valueIndex) === T.String) value = { type: 'String', value: string.decode(text(valueIndex)) };
      else if (type(valueIndex) === T.Ident) value = { type: 'Identifier', name: text(valueIndex) };
      else fail();
      if (cursor < tokens.length) { if (type(tokens[cursor]) !== T.Ident) fail(); flags = text(tokens[cursor++]); }
    }
    if (cursor !== tokens.length) fail();
    const node = { type: 'AttributeSelector', name: { name }, matcher, value, flags };
    checkAttributeIds(node, ids, source.slice(stream.getTokenStart(start), stream.getTokenEnd(end)));
    const target = ids.get(selectorId(node));
    if (target) edit(valueIndex, valueIndex, string.encode(target.id));
  }
  function selectors(start, end) {
    for (let index = start; index < end; index++) {
      if (type(index) === T.LeftSquareBracket) { const last = close(index); attribute(index, last); index = last; }
      else if (type(index) === T.Hash) {
        const target = ids.get(ident.decode(text(index).slice(1)));
        if (target) edit(index, index, '#' + ident.encode(target.id));
      }
    }
  }
  function values(start, end, conditions = false) {
    for (let index = start; index < end; index++) {
      if (type(index) === T.LeftCurlyBracket) fail();
      if (conditions && type(index) === T.LeftParenthesis) {
        const last = close(index);
        let condition = true;
        for (let part = index + 1; part < last; part++) {
          if (!ignored(part) && ![T.Ident, T.Function, T.LeftParenthesis].includes(type(part))) condition = false;
          if (stream.isBlockOpenerTokenType(type(part))) part = close(part);
        }
        // A declaration feature or general-enclosed value is not a selector
        // query, even if a literal function in it happens to be called selector.
        values(index + 1, last, condition); index = last;
      } else if (type(index) === T.Url) {
        const replacement = mappedUrl(url.decode(text(index)));
        if (replacement !== null) edit(index, index, replacement);
      } else if (type(index) === T.Function) {
        const name = text(index).slice(0, -1).toLowerCase();
        if (conditions) {
          const last = close(index);
          // Feature dispatch uses raw names. Other functions are general-
          // enclosed values, even when named url or an escaped selector.
          if (name === 'selector') selectors(index + 1, last);
          else values(index + 1, last);
          index = last;
        } else if (name === 'url') {
          const last = close(index), parts = [];
          for (let part = index + 1; part < last; part++) if (!ignored(part)) parts.push(part);
          if (parts.length !== 1 || type(parts[0]) !== T.String) fail();
          const replacement = mappedUrl(string.decode(text(parts[0])));
          if (replacement !== null) edit(index, last, replacement);
          index = last;
        }
      }
    }
  }
  function delimiter(start, end, braces) {
    for (let index = start; index < end; index++) {
      if (type(index) === T.Semicolon || braces && type(index) === T.LeftCurlyBracket) return index;
      if (stream.isBlockOpenerTokenType(type(index))) index = close(index);
      else if (stream.isBlockCloserTokenType(type(index))) fail();
    }
    return end;
  }
  function declarationValue(start, end) {
    let index = start;
    // Match css-tree's accepted declaration prefixes, including its historical
    // property hacks. Anything else is an unsupported nested rule, not a value.
    if (type(index) === T.Delim && ['*', '$', '+', '#', '/'].includes(text(index))) {
      const slash = text(index++) === '/';
      if (slash && text(index) === '/') index++;
    }
    if (![T.Ident, T.Hash].includes(type(index++))) fail();
    while (index < end && ignored(index)) index++;
    if (type(index++) !== T.Colon) fail();
    return index;
  }
  function block(start, end, declarations = false) {
    for (let index = start; index < end;) {
      if (ignored(index) || type(index) === T.Semicolon) { index++; continue; }
      if (type(index) === T.AtKeyword) {
        const rawName = text(index).slice(1).toLowerCase(), name = ident.decode(rawName).toLowerCase(), edge = delimiter(index + 1, end, true);
        if (!groups.has(name) && !['font-face', 'keyframes', '-webkit-keyframes'].includes(name)) fail();
        values(index + 1, edge, rawName === 'supports');
        if (edge === end) fail();
        if (type(edge) === T.LeftCurlyBracket) {
          const last = close(edge);
          let styleBlock = rawName === 'font-face' || groups.has(rawName) && rawName !== 'layer' && declarations;
          if (!groups.has(rawName) && rawName !== 'font-face') {
            // css-tree's generic at-rule parser (including keyframes and
            // escaped names) distinguishes its block by the first nested rule.
            styleBlock = true;
            for (let part = edge + 1; part < last; part++) if ([T.LeftCurlyBracket, T.AtKeyword].includes(type(part))) { styleBlock = false; break; }
          }
          block(edge + 1, last, styleBlock);
          index = last + 1;
        } else index = edge + 1;
      } else if (declarations && !(type(index) === T.Delim && text(index) === '&')) {
        const edge = delimiter(index, end, false);
        values(declarationValue(index, edge), edge); index = edge + 1;
      } else {
        const edge = delimiter(index, end, true);
        if (edge === end || type(edge) !== T.LeftCurlyBracket) fail();
        const last = close(edge);
        selectors(index, edge); block(edge + 1, last, true); index = last + 1;
      }
    }
  }
  block(0, stream.tokenCount);
  return edits.sort((left, right) => right.start - left.start).reduce((result, item) => result.slice(0, item.start) + item.value + result.slice(item.end), source);
}
