export function readConsent(cookies) {
  const values = cookies.split(';').map(item => item.trim()).filter(item => item.startsWith('oy_privacy='));
  if (values.length !== 1) return null;
  return ({ 'oy_privacy=v1.allow':'allow', 'oy_privacy=v1.deny':'deny' })[values[0]] ?? null;
}
export function consentCookie(choice, secure = true) {
  if (choice !== 'allow' && choice !== 'deny') throw new TypeError('Invalid consent choice');
  return `oy_privacy=v1.${choice}; Path=/; Max-Age=15552000; SameSite=Lax${secure ? '; Secure' : ''}`;
}
