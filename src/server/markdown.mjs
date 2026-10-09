import { parse } from 'parse5';

// Negotiate only real public HTML representations; the CMS remains the source of truth.
export function preferredPageType(accept) {
  if (!accept?.trim()) return 'html';
  const ranges = accept.split(',').map((item, order) => {
    const [media, ...params] = item.trim().toLowerCase().split(';').map(s => s.trim());
    let q = 1;
    const weight = params.find(p => p.startsWith('q='));
    if (weight) {
      const value = Number(weight.slice(2));
      q = Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0;
    }
    return { media, order, q };
  });
  const match = type => {
    const [major] = type.split('/');
    const eligible = ranges.map(item => ({
      ...item,
      specificity: item.media === type ? 2 : item.media === major + '/*' ? 1 : item.media === '*/*' ? 0 : -1,
    })).filter(item => item.specificity >= 0);
    eligible.sort((a,b) => b.specificity - a.specificity || a.order - b.order);
    return eligible[0] || { q: 0, specificity: -1, order: Infinity };
  };
  const html = match('text/html');
  const markdown = match('text/markdown');
  if (!html.q && !markdown.q) return 'unacceptable';
  if (markdown.q > html.q) return 'markdown';
  if (markdown.q === html.q && markdown.q && markdown.specificity > html.specificity) return 'markdown';
  if (markdown.q === html.q && markdown.q && markdown.specificity === html.specificity && markdown.specificity === 2 && markdown.order < html.order) return 'markdown';
  return 'html';
}

const attribute = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const children = node => node.childNodes || [];
function find(node, name) {
  if (node.tagName === name) return node;
  for (const child of children(node)) {
    const result = find(child, name);
    if (result) return result;
  }
  return null;
}
const escapeMarkdown = value => value.replace(/([\\\\`*_[\]<>])/g, '\\$1');
const clean = value => value.replace(/[ \t\r\n]+/g, ' ').trim();
function publicHref(href, origin) {
  if (!href) return null;
  try {
    const url = new URL(href, origin);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
function excluded(node) {
  const classes = (attribute(node, 'class') || '').split(/\s+/);
  return ['script','style','svg','template','button','input','select','textarea'].includes(node.tagName) ||
    attribute(node, 'hidden') !== undefined || attribute(node, 'aria-hidden') === 'true' ||
    classes.includes('js-only') || classes.includes('project-art');
}
function inline(node, origin) {
  if (node.nodeName === '#text') return escapeMarkdown(node.value.replace(/\s+/g, ' '));
  if (excluded(node)) return '';
  if (node.tagName === 'br') return '  \n';
  const text = children(node).map(child => inline(child, origin)).join('');
  if (node.tagName === 'a') {
    const href = publicHref(attribute(node, 'href'), origin);
    const label = clean(text).replace(/\s*\n\s*/g, ' ');
    return href && label ? `[${label}](${href.replace(/[()]/g, char => encodeURIComponent(char))})` : label;
  }
  if (['strong','b'].includes(node.tagName)) return `**${clean(text)}**`;
  if (['em','i'].includes(node.tagName)) return `*${clean(text)}*`;
  if (node.tagName === 'code') return `\`${clean(text)}\``;
  return text;
}
function blocks(node, origin) {
  if (excluded(node)) return [];
  const name = node.tagName;
  if (/^h[1-6]$/.test(name || '')) return [`${'#'.repeat(Number(name[1]))} ${clean(inline(node, origin))}`];
  if (name === 'p' || name === 'a') {
    const text = clean(inline(node, origin));
    return text ? [text] : [];
  }
  if (name === 'pre') {
    const content = children(node).map(child => child.nodeName === '#text' ? child.value : children(child).map(n => n.value || '').join('')).join('').trim();
    return content ? [`\`\`\`\n${content}\n\`\`\``] : [];
  }
  if (name === 'ul' || name === 'ol') {
    return [children(node).filter(child => child.tagName === 'li').map((li, index) =>
      `${name === 'ol' ? String(index + 1) + '.' : '-'} ${clean(inline(li, origin))}`
    ).filter(Boolean).join('\n')].filter(Boolean);
  }
  if (name === 'blockquote') return [clean(inline(node, origin)).split('\n').map(line => '> ' + line).join('\n')];
  if (name === 'table') return [clean(inline(node, origin))];
  return children(node).flatMap(child => blocks(child, origin));
}

export function htmlToMarkdown(html, origin = 'https://omaryusuf.se') {
  const main = find(parse(html), 'main');
  if (!main) return '';
  const content = blocks(main, origin).filter(Boolean);
  const firstHeading = content.findIndex(item => item.startsWith('# '));
  if (firstHeading > 0) content.unshift(content.splice(firstHeading, 1)[0]);
  return content.join('\n\n').trim() + '\n';
}

function withVary(headers, field) {
  const existing = headers.get('Vary');
  if (!existing) headers.set('Vary', field);
  else if (!existing.split(',').some(token => token.trim().toLowerCase() === field.toLowerCase())) headers.set('Vary', existing + ', ' + field);
}
export async function negotiatePublicPage(request, response) {
  if (!/^text\/html(?:;|$)/i.test(response.headers.get('Content-Type') || '') || !['GET','HEAD'].includes(request.method)) return response;
  const headers = new Headers(response.headers);
  withVary(headers, 'Accept');
  const type = preferredPageType(request.headers.get('Accept'));
  if (type === 'unacceptable') {
    return new Response(request.method === 'HEAD' ? null : 'Available representations: text/html, text/markdown.', {
      status: 406, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Vary': headers.get('Vary'), 'Cache-Control': 'no-store' },
    });
  }
  if (type === 'markdown') {
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    headers.delete('Content-Length');
    const markdown = request.method === 'HEAD' ? null : htmlToMarkdown(await response.text(), new URL(request.url).origin);
    return new Response(markdown, { status: response.status, headers });
  }
  return new Response(response.body, { status: response.status, headers });
}
