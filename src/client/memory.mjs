export const drawings = [
    '<circle cx="30" cy="30" r="13"/><path d="M30 5v6m0 38v6M5 30h6m38 0h6M12 12l5 5m26 26 5 5m0-36-5 5M17 43l-5 5"/>',
    '<path d="M12 22h30v22q-15 10-30 0zM42 26h8q12 12-8 13M20 14v-4m12 4V8"/>',
    '<path d="m34 5-20 28h14l-3 22 22-31H33z"/>',
    '<path d="M30 21C7-6 0 37 22 30 0 52 40 63 31 39c16 23 41-14 10-10 25-17-6-42-11-8Z"/><circle cx="30" cy="30" r="5"/>',
    '<path d="M30 50 9 29C-3 9 22 0 30 17 38 0 63 9 51 29Z"/>',
    '<path d="m19 17-12 13 12 13m22-26 12 13-12 13M34 12 26 48"/>'
  ];
export function memoryCards() {
  return Array.from({ length: 12 }, (_, index) => `<button type="button" class="memory-card" data-memory-card="${index}" disabled aria-label="Vänd kort ${index + 1}" aria-pressed="false"><span class="memory-back" aria-hidden="true">?</span><span class="memory-front memory-color-${index % 6}" aria-hidden="true"><svg data-memory-symbol width="52" height="52" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawings[index % 6]}</svg></span></button>`).join('');
}
