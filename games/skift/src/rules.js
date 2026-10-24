/** Game rules are renderer-independent. Seconds, world metres and integer scores. */
export const SAVE_KEY = 'oy-skift-v1';
export const UPGRADES = ['dash', 'pulse', 'shield'];
export function createRun(difficulty = 'normal', checkpoint = null) {
  if (['normal','assist'].includes(checkpoint?.difficulty)) difficulty=checkpoint.difficulty;
  const maxHp = difficulty === 'assist' ? 8 : 5;
  return { difficulty: difficulty === 'assist' ? 'assist' : 'normal', sector: checkpoint?.sector ?? 0,
    hp: maxHp, maxHp, score: checkpoint?.score ?? 0, time: checkpoint?.time ?? 0,
    sectorTime: 0, hits: 0, kills: 0, scrap: 0, combo: 0, comboTime: 0,
    dashCooldown: 0, pulseCooldown: 0, dashing: 0, invulnerable: 1.2,
    cells: new Set(), upgrades: [...(checkpoint?.upgrades ?? [])],
    bossDefeated: false, dead: false, won: false, ended: false,
  };
}
export function tick(s, dt) {
  if (!Number.isFinite(dt) || dt <= 0 || s.dead || s.won || s.ended) return;
  s.time += dt; s.sectorTime += dt;
  for (const key of ['dashCooldown','pulseCooldown','dashing','invulnerable','comboTime']) s[key] = Math.max(0, s[key]-dt);
  if (!s.comboTime) s.combo = 0;
}
export const dashDelay = s => s.upgrades.includes('dash') ? 0.65 : 1.05;
export const pulseDelay = s => s.upgrades.includes('pulse') ? 1.8 : 2.7;
export function dash(s) {
  if (s.dead || s.won || s.ended || s.dashCooldown > 0) return false;
  s.dashing = 0.19; s.dashCooldown = dashDelay(s); s.invulnerable = Math.max(s.invulnerable, 0.28); return true;
}
export function pulse(s) {
  if (s.dead || s.won || s.ended || s.pulseCooldown > 0) return false;
  s.pulseCooldown = pulseDelay(s); return true;
}
export function hurt(s, amount = 1) {
  if (s.dead || s.won || s.ended || s.invulnerable > 0 || s.dashing > 0) return false;
  s.hp = Math.max(0, s.hp - Math.max(0, amount)); s.hits++; s.combo = 0; s.comboTime = 0;
  s.invulnerable = s.difficulty === 'assist' ? 1.65 : 1.15;
  s.dead = s.hp === 0; return true;
}
export function award(s, points, chain = true) {
  if (s.dead || s.won || s.ended) return;
  if (chain) { s.combo = Math.min(8, s.combo + 1); s.comboTime = 4.5; }
  s.score += Math.round(Math.max(0, points) * (1 + Math.max(0,s.combo-1)*0.2));
}
export function collect(s, id) {
  if (s.cells.has(id) || s.dead || s.ended) return false;
  s.cells.add(id); award(s, 350); s.hp=Math.min(s.maxHp,s.hp+1); return true;
}
export function finishSector(s) {
  if (s.dead || s.ended || s.cells.size < 3 || (s.sector === 2 && !s.bossDefeated)) return false;
  award(s, 1000 + Math.max(0, Math.round(150-s.sectorTime))*10 + (s.hits===0 ? 800 : 0), false);
  s.ended = true; if (s.sector === 2) s.won = true; return true;
}
export function upgrade(s, id) {
  if (!UPGRADES.includes(id) || s.upgrades.includes(id)) return false;
  s.upgrades.push(id); if (id === 'shield') { s.maxHp += 2; s.hp = s.maxHp; } return true;
}
export function nextSector(s) {
  if (!s.ended || s.won || s.sector >= 2) return false;
  s.sector++; s.hp=s.maxHp; s.sectorTime=0; s.hits=0; s.cells.clear(); s.ended=false;
  s.dashCooldown=0; s.pulseCooldown=0; s.dashing=0; s.invulnerable=1.2; s.combo=0; return true;
}
const finite = (n, min, max, fallback=0) => Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : fallback;
export function sanitizeSave(input) {
  const empty={version:1,unlocked:0,best:0,wins:0,checkpoint:null,settings:{language:'sv',sound:true,music:true,quality:'eco',motion:true,difficulty:'normal'}};
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.version!==1) return empty;
  empty.unlocked=Math.floor(finite(input.unlocked,0,2)); empty.best=Math.floor(finite(input.best,0,1e8)); empty.wins=Math.floor(finite(input.wins,0,1e6));
  const c=input.checkpoint;
  if (c && Number.isInteger(c.sector) && c.sector>=0 && c.sector<=2 && c.sector<=empty.unlocked) {
    empty.checkpoint={difficulty:['normal','assist'].includes(c.difficulty)?c.difficulty:(input.settings?.difficulty==='assist'?'assist':'normal'),sector:c.sector,score:Math.floor(finite(c.score,0,1e8)),time:finite(c.time,0,1e7),upgrades:[...new Set(Array.isArray(c.upgrades)?c.upgrades.filter(x=>UPGRADES.includes(x)):[])].slice(0,2)};
  }
  const p=input.settings;
  if(p && typeof p==='object') {
    if(['sv','en'].includes(p.language))empty.settings.language=p.language;
    if(['eco','smooth'].includes(p.quality))empty.settings.quality=p.quality;
    if(['normal','assist'].includes(p.difficulty))empty.settings.difficulty=p.difficulty;
    for(const k of ['sound','music','motion'])if(typeof p[k]==='boolean')empty.settings[k]=p[k];
  }
  return empty;
}
export function loadSave(storage) { try { return sanitizeSave(JSON.parse(storage.getItem(SAVE_KEY))); } catch { return sanitizeSave(null); } }
export function saveRun(storage, data) { try { storage.setItem(SAVE_KEY,JSON.stringify(sanitizeSave(data))); return true; } catch { return false; } }
export const rank = score => score>=18000?'S':score>=13000?'A':score>=8500?'B':'C';
export const clock = seconds => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
