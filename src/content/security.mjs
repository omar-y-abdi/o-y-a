import { site } from './site.mjs';

const DAY_MS = 86_400_000;
const LIFETIME_DAYS = 180;

// RFC 9116 security.txt. The caller passes the time, so the body is a pure
// function of `now`: Expires lies 180 days ahead, truncated to UTC midnight.
export function securityTxt(now) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new TypeError('securityTxt needs a valid Date');
  const end = new Date(now.getTime() + LIFETIME_DAYS * DAY_MS);
  const expires = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())).toISOString().replace('.000Z', 'Z');
  return [
    `Contact: ${site.origin}/kontakt/`,
    `Expires: ${expires}`,
    'Preferred-Languages: sv, en',
    `Canonical: ${site.origin}/.well-known/security.txt`,
  ].join('\n') + '\n';
}
