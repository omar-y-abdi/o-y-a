import { LEVELS, blocked } from '../../games/skift/src/levels.js';

// Read-only diagnostics choose a route; all movement and combat use real keys.
// This deliberately does not expose or mutate the game's private state.
function route(start, target) {
  const goal = [Math.round(target.x), Math.round(target.z)];
  const first = [Math.round(start.x), Math.round(start.z)], queue = [first], seen = new Map([[first.join(), null]]);
  for (const point of queue) {
    if (point[0] === goal[0] && point[1] === goal[1]) {
      const path = [];
      for (let key = point.join(); key; key = seen.get(key)) path.unshift(key.split(',').map(Number));
      return path.slice(1);
    }
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const next = [point[0] + dx, point[1] + dz], key = next.join();
      if (seen.has(key) || blocked(LEVELS[0], next[0], next[1], 0.85)) continue;
      seen.set(key, point.join()); queue.push(next);
    }
  }
  throw new Error(`No keyboard route from ${JSON.stringify(start)} to ${JSON.stringify(target)}`);
}

export async function completeFirstDistrict(page) {
  const held = new Set();
  async function keys(next) {
    for (const key of held) if (!next.includes(key)) { await page.keyboard.up(key); held.delete(key); }
    for (const key of next) if (!held.has(key)) { await page.keyboard.down(key); held.add(key); }
  }
  let goal = '', path = [], state;
  const deadline = Date.now() + 120_000;
  try {
    while (Date.now() < deadline) {
      state = await page.evaluate(() => window.__SKIFT__.snapshot());
      if (state.mode === 'sector' && state.sector === 0) return state;
      if (state.mode !== 'play' || state.sector !== 0) throw new Error(`Unexpected game state: ${JSON.stringify(state)}`);
      const target = state.objective, nextGoal = JSON.stringify(target);
      if (goal !== nextGoal) { path = route(state.player, target); goal = nextGoal; }
      while (path.length && Math.hypot(path[0][0] - state.player.x, path[0][1] - state.player.z) < 0.75) path.shift();
      const next = path[0] ?? [target.x, target.z], dx = next[0] - state.player.x, dz = next[1] - state.player.z, distance = Math.hypot(dx, dz), inputs = [];
      if (distance > 0.35) {
        const x = (dx - dz) / Math.SQRT2, y = (dx + dz) / Math.SQRT2;
        if (x / distance > 0.32) inputs.push('d');
        if (x / distance < -0.32) inputs.push('a');
        if (y / distance > 0.32) inputs.push('s');
        if (y / distance < -0.32) inputs.push('w');
      }
      if (state.enemies.some(enemy => !enemy.dead && Math.hypot(enemy.x - state.player.x, enemy.z - state.player.z) < 3.5) || state.bullets > 0) inputs.push('j');
      await keys(inputs);
      await page.waitForTimeout(80);
    }
    throw new Error(`District did not complete through native input: ${JSON.stringify(state)}`);
  } finally { await keys([]); }
}
