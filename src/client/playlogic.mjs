import { t } from './copy.mjs';

export function bubbleComment(times, remaining) {
  if (!remaining) return t('runtime.bubble.comment.complete');
  if (times.length < 2) return t('runtime.bubble.comment.noRush');
  const recent = times.slice(-5);
  const average = (recent.at(-1)-recent[0])/(recent.length-1);
  const group = average < 450 ? 'fast' : average > 2200 ? 'slow' : 'steady';
  return t(`runtime.bubble.comment.${group}.${remaining % 3}`);
}
export function fikaResult(elapsed) {
  const seconds = (Math.max(0,elapsed)/1000).toFixed(2).replace('.',',');
  const error = Math.abs(elapsed-5000);
  const comment = error <= 150 ? t('runtime.fika.comment.target')
    : error <= 600 ? t('runtime.fika.comment.close')
    : elapsed < 3500 ? t('runtime.fika.comment.early')
    : elapsed < 5000 ? t('runtime.fika.comment.slightlyEarly')
    : elapsed < 7500 ? t('runtime.fika.comment.late')
    : t('runtime.fika.comment.veryLate');
  return { seconds, comment };
}
export function shuffledPairs(random = Math.random) {
  const values = [...Array(6).keys(), ...Array(6).keys()];
  for (let i=values.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
  return values;
}
