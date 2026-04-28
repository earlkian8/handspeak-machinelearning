const PREFIX = 'handspeak_daily_';

export function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayKey() {
  return `${PREFIX}${getTodayString()}`;
}

export function isTodayComplete() {
  try { return localStorage.getItem(getTodayKey()) === 'done'; } catch { return false; }
}

export function markTodayComplete() {
  try { localStorage.setItem(getTodayKey(), 'done'); } catch {}
}

export function computeStreak() {
  try {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (localStorage.getItem(key) === 'done') {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  } catch { return 0; }
}

function dateSeed(dateStr) {
  return parseInt(dateStr.replace(/-/g, ''), 10);
}

function seededShuffle(arr, seed) {
  let s = seed;
  const rand = () => {
    s = Math.imul(s, 1664525) + 1013904223;
    return ((s >>> 0) / 0x100000000);
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDailyWords(allWords, count = 5) {
  if (!allWords?.length) return [];
  const seed = dateSeed(getTodayString());
  const shuffled = seededShuffle(allWords, seed);
  return shuffled.slice(0, count);
}
