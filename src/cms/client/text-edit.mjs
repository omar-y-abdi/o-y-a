function content(html) {
  const template = document.createElement('template'); template.innerHTML = html;
  return template;
}
function segments(root) {
  const values = []; let offset = 0;
  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE || node.nodeName === 'BR') {
      const value = node.nodeName === 'BR' ? '\n' : node.data;
      values.push({ node, value, start: offset, end: offset + value.length }); offset += value.length;
    } else for (const child of node.childNodes) visit(child);
  }
  visit(root); return values;
}
export function editableText(html) {
  return segments(content(html).content).map(item => item.value).join('');
}

// Apply only the changed text range. Do not flatten spans, links, emphasis, IDs
// or their CSS into one plaintext component when an inspector value changes.
export function replaceEditableText(html, value) {
  const template = content(html), root = template.content;
  const original = segments(root).map(item => item.value).join('');
  const next = value.replaceAll('\r\n', '\n');
  if (next === original) return html;
  let prefix = 0, suffix = 0;
  while (prefix < original.length && prefix < next.length && original[prefix] === next[prefix]) prefix++;
  if (prefix && /[\uD800-\uDBFF]/.test(original[prefix - 1])) prefix--;
  while (suffix < original.length - prefix && suffix < next.length - prefix && original[original.length - suffix - 1] === next[next.length - suffix - 1]) suffix++;
  if (suffix && /[\uDC00-\uDFFF]/.test(original[original.length - suffix])) suffix--;
  const end = original.length - suffix, marker = document.createComment('text-edit');
  const anchor = segments(root).find(item => item.end >= prefix);
  if (!anchor) root.append(marker);
  else if (anchor.node.nodeType === Node.TEXT_NODE) anchor.node.splitText(prefix - anchor.start).before(marker);
  else if (prefix === anchor.end) anchor.node.after(marker);
  else anchor.node.before(marker);
  for (const item of segments(root)) {
    const from = Math.max(prefix, item.start), to = Math.min(end, item.end);
    if (from >= to) continue;
    if (item.node.nodeName === 'BR') item.node.remove();
    else item.node.data = item.value.slice(0, from - item.start) + item.value.slice(to - item.start);
  }
  const inserted = next.slice(prefix, next.length - suffix).split('\n');
  marker.replaceWith(...inserted.flatMap((line, index) => [...(index ? [document.createElement('br')] : []), document.createTextNode(line)]));
  return template.innerHTML;
}
