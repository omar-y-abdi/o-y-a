import { tokenize, tokenTypes as T } from 'css-tree/tokenizer';
export { tokenTypes } from 'css-tree/tokenizer';

const closing = new Map([[T.Function, T.RightParenthesis], [T.LeftParenthesis, T.RightParenthesis], [T.LeftSquareBracket, T.RightSquareBracket], [T.LeftCurlyBracket, T.RightCurlyBracket]]);
const closers = new Set(closing.values());

// Consumers need immutable source spans and bracket partners, not the parser's
// mutable TokenStream cursor, lookahead, lookup, buffer and diagnostic methods.
// Lexing remains css-tree's; this index never interprets CSS text itself.
export function cssTokenIndex(source) {
  const tokens = [], stack = [];
  const fail = () => { throw new Error('Stilmallen innehåller obalanserade avgränsare.'); };
  tokenize(source, (type, start, end) => {
    const index = tokens.length;
    tokens.push({ type, start, end });
    if (closing.has(type)) stack.push(index);
    else if (closers.has(type)) {
      const opener = stack.pop();
      if (opener === undefined || closing.get(tokens[opener].type) !== type) fail();
      tokens[opener].pair = index;
    }
  });
  if (stack.length) fail();
  return {
    tokenCount: tokens.length,
    getTokenType: index => tokens[index]?.type ?? T.EOF,
    getTokenStart: index => tokens[index]?.start ?? source.length,
    getTokenEnd: index => tokens[index]?.end ?? source.length,
    getBlockTokenPairIndex: index => tokens[index]?.pair ?? -1,
    isBlockOpenerTokenType: type => closing.has(type),
    isBlockCloserTokenType: type => closers.has(type),
  };
}
