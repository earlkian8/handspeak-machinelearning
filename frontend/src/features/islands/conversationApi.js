import { fetchJson, postJson } from '../../lib/api';

export const startConversationSession = ({ userId, islandId }) =>
  postJson('/api/conversation/session/start', {
    user_id: userId,
    island_id: islandId,
  });

export const submitConversationAttempt = ({ sessionId, promptId, userId, frames }) =>
  postJson('/api/conversation/session/submit', {
    session_id: sessionId,
    prompt_id: promptId,
    user_id: userId ?? null,
    frames,
  });

export const listIslandPrompts = (islandId) =>
  fetchJson(`/api/conversation/islands/${islandId}/prompts`);

export const getConversationSession = (sessionId) =>
  fetchJson(`/api/conversation/session/${sessionId}`);
