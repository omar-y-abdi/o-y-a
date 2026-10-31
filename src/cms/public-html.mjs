import { parseFragment } from 'parse5';

// Publication/build projection only. Editor keys remain in the raw project;
// public frame-ID markers and all other source bytes retain their meaning.
export function stripNodeKeys(html) {
  if (!/data-cms-node/i.test(html)) return html;
  const tree = parseFragment(html, { scriptingEnabled: false, sourceCodeLocationInfo: true });
  const pending = [tree], ranges = new Map();
  while (pending.length) {
    const node = pending.pop(), location = node.sourceCodeLocation?.attrs?.['data-cms-node'];
    if (location) {
      const start = location.startOffset - (html[location.startOffset - 1] === ' ' ? 1 : 0);
      ranges.set(start, location.endOffset);
    }
    for (const child of node.childNodes ?? []) pending.push(child);
    if (node.content) pending.push(node.content);
  }
  // Frame and main were independently validated. Do not impose a new combined
  // node limit here, or repeatedly slice an increasingly large output string.
  const parts = [];
  let end = 0;
  for (const [start, next] of [...ranges].sort(([left], [right]) => left - right)) {
    parts.push(html.slice(end, start));
    end = next;
  }
  parts.push(html.slice(end));
  return parts.join('');
}
