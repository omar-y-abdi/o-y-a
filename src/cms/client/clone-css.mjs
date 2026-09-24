function escapedEnd(source, at) {
  at++;
  let count = 0;
  while (count < 6 && /[0-9a-f]/i.test(source[at] ?? '')) { at++; count++; }
  if (count && /\s/.test(source[at] ?? '')) return at + 1;
  return count ? at : Math.min(at + 1, source.length);
}

function identEnd(source, at) {
  while (at < source.length) {
    const code = source.charCodeAt(at);
    if (source[at] === '\\') { at = escapedEnd(source, at); continue; }
    if (code >= 128 || /[-_a-z0-9]/i.test(source[at])) { at++; continue; }
    break;
  }
  return at;
}

function decodeIdent(source) {
  let value = '';
  for (let at = 0; at < source.length;) {
    if (source[at] !== '\\') { value += source[at++]; continue; }
    const start = ++at;
    let count = 0;
    while (count < 6 && /[0-9a-f]/i.test(source[at] ?? '')) { at++; count++; }
    if (count) {
      const point = Number.parseInt(source.slice(start, at), 16);
      value += String.fromCodePoint(point && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? point : 0xfffd);
      if (/\s/.test(source[at] ?? '')) at++;
    } else if (at < source.length) value += source[at++];
  }
  return value;
}

function skipQuoted(source, at) {
  const quote = source[at++];
  while (at < source.length) {
    if (source[at] === '\\') { at = escapedEnd(source, at); continue; }
    if (source[at++] === quote) break;
  }
  return at;
}

function skipComment(source, at) {
  const end = source.indexOf('*/', at + 2);
  return end < 0 ? source.length : end + 2;
}

const lookup = (ids, key) => ids instanceof Map ? ids.get(key) : ids.has(key) ? key : undefined;

function localUrl(source, at, ids) {
  const before = source[at - 1], code = before?.charCodeAt(0) ?? 0;
  if (before && (before === '\\' || code >= 128 || /[-_a-z0-9]/i.test(before))) return null;
  let open = identEnd(source, at);
  if (decodeIdent(source.slice(at, open)).toLowerCase() !== 'url') return null;
  while (/\s/.test(source[open] ?? '')) open++;
  if (source[open] !== '(') return null;
  let end = open + 1, quote = '';
  while (end < source.length) {
    const char = source[end];
    if (quote) {
      if (char === '\\') { end = escapedEnd(source, end); continue; }
      if (char === quote) quote = '';
      end++; continue;
    }
    if (char === '"' || char === "'") { quote = char; end++; continue; }
    if (char === ')') break;
    end++;
  }
  if (source[end] !== ')') return null;
  let raw = source.slice(open + 1, end).trim();
  const quoted = (raw[0] === '"' || raw[0] === "'") && raw.at(-1) === raw[0];
  raw = quoted ? raw.slice(1, -1) : raw.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!raw.startsWith('#')) return { end: end + 1 };
  return { end: end + 1, mapped: lookup(ids, decodeIdent(raw.slice(1))) };
}

function scan(source, ids, selectors) {
  const edits = [];
  let matched = false;
  for (let at = 0; at < source.length;) {
    if (source[at] === '/' && source[at + 1] === '*') { at = skipComment(source, at); continue; }
    if (source[at] === '"' || source[at] === "'") { at = skipQuoted(source, at); continue; }
    if (!selectors) {
      const ref = localUrl(source, at, ids);
      if (ref) {
        if (ref.mapped) { matched = true; edits.push([at, ref.end, 'url(#' + CSS.escape(ref.mapped) + ')']); }
        at = ref.end; continue;
      }
    } else if (source[at] === '#') {
      const end = identEnd(source, at + 1);
      if (end > at + 1) {
        const key = decodeIdent(source.slice(at + 1, end)), mapped = lookup(ids, key);
        if (mapped) { matched = true; if (mapped !== key) edits.push([at, end, '#' + CSS.escape(mapped)]); }
        at = end; continue;
      }
    }
    at++;
  }
  for (const [start, end, value] of edits.reverse()) source = source.slice(0, start) + value + source.slice(end);
  return { source, matched };
}

// Clone remapping only needs local fragment URLs and selector IDs. The full
// css-tree parser remains authoritative on server validation/resource paths.
export const mapCloneCss = (source, ids, selectors = false) => scan(source, ids, selectors).source;
export const hasCloneSelector = (source, ids) => scan(source, ids, true).matched;
