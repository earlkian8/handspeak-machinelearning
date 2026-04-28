import { postJson, fetchJson } from './api';

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('handspeak_user') || 'null');
    return u?.id ?? null;
  } catch { return null; }
}

export async function recordActivity({ activityType, score, total, misses, streak }) {
  const userId = getUserId();
  if (!userId) return null;
  try {
    return await postJson('/api/rewards/activity', {
      user_id: userId,
      activity_type: activityType,
      score: score ?? null,
      total: total ?? null,
      misses: misses ?? null,
      streak: streak ?? null,
    });
  } catch { return null; }
}

export async function getAchievements() {
  const userId = getUserId();
  if (!userId) return [];
  try {
    return await fetchJson(`/api/rewards/achievements/${userId}`);
  } catch { return []; }
}
