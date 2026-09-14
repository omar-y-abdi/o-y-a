import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from './http.mjs';

const keySets = new Map();

export function accessConfig(env) {
  const team = env.CMS_ACCESS_TEAM;
  const audience = env.CMS_ACCESS_AUD;
  const email = env.CMS_ADMIN_EMAIL;
  if (typeof team !== 'string' || !/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/.test(team)
    || typeof audience !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(audience)
    || typeof email !== 'string' || !/^[A-Za-z0-9.!#$%&'+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    throw new HttpError(503, 'Ägarens säkra inloggning är inte konfigurerad.');
  }
  return { team, audience, email: email.toLowerCase() };
}

function remoteKeys(team) {
  if (!keySets.has(team)) {
    if (keySets.size >= 4) keySets.clear();
    keySets.set(team, createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`), { timeoutDuration: 5000 }));
  }
  return keySets.get(team);
}

export async function authenticateAdmin(request, env, { jwks } = {}) {
  const config = accessConfig(env);
  const cookies = (request.headers.get('Cookie') ?? '').split(';').map(value => value.trim()).filter(value => value.startsWith('CF_Authorization='));
  const token = request.headers.get('Cf-Access-Jwt-Assertion') ?? (cookies.length === 1 ? cookies[0].slice('CF_Authorization='.length) : null);
  if (!token || token.length > 16384) throw new HttpError(401, 'Logga in med ditt ägarkonto för att fortsätta.');
  try {
    const { payload } = await jwtVerify(token, jwks ?? remoteKeys(config.team), {
      issuer: config.team,
      audience: config.audience,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email'],
      maxTokenAge: '1h',
      clockTolerance: 5,
    });
    if (payload.type !== 'app' || typeof payload.email !== 'string' || payload.email.toLowerCase() !== config.email
      || typeof payload.sub !== 'string' || !payload.sub || payload.exp - payload.iat > 3660) {
      throw new Error('Owner identity required');
    }
    return { email: config.email, subject: payload.sub };
  } catch {
    throw new HttpError(401, 'Inloggningen är ogiltig eller har gått ut. Ditt utkast finns kvar.');
  }
}
