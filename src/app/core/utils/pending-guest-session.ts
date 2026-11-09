import type { CardType } from '../models/learning-card.model';
import type {
  CompletedLearningSession,
  LearningSessionAnswer,
} from '../models/learning-session.model';

// Retain the existing key so a previously saved single session is preserved.
export const PENDING_GUEST_SESSIONS_KEY = 'elementary.pending-guest-session';

export function appendPendingGuestSession(session: CompletedLearningSession): boolean {
  if (!isCompletedSession(session)) {
    return false;
  }

  try {
    const sessions = getPendingGuestSessions();
    if (sessions.some((pending) => pending.id === session.id)) {
      return true;
    }

    sessionStorage.setItem(PENDING_GUEST_SESSIONS_KEY, JSON.stringify([...sessions, session]));
    return true;
  } catch {
    return false;
  }
}

export function getPendingGuestSessions(): readonly CompletedLearningSession[] {
  try {
    const stored = sessionStorage.getItem(PENDING_GUEST_SESSIONS_KEY);
    if (stored === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    const candidates: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    const sessions = new Map<string, CompletedLearningSession>();
    for (const session of candidates) {
      if (isCompletedSession(session) && !sessions.has(session.id)) {
        sessions.set(session.id, session);
      }
    }
    return [...sessions.values()];
  } catch {
    return [];
  }
}

export function clearPendingGuestSessions(): boolean {
  try {
    sessionStorage.removeItem(PENDING_GUEST_SESSIONS_KEY);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAnswer(value: unknown): value is LearningSessionAnswer {
  const cardTypes: readonly CardType[] = [
    'name-to-symbol',
    'symbol-to-name',
    'name-to-atomic-number',
    'name-to-group',
    'name-to-category',
  ];

  return (
    isRecord(value) &&
    typeof value['elementId'] === 'number' &&
    cardTypes.some((type) => type === value['cardType']) &&
    typeof value['selectedAnswer'] === 'string' &&
    typeof value['correctAnswer'] === 'string' &&
    typeof value['isCorrect'] === 'boolean'
  );
}

function isCompletedSession(value: unknown): value is CompletedLearningSession {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    value['id'].length > 0 &&
    typeof value['levelId'] === 'number' &&
    Number.isInteger(value['levelId']) &&
    value['levelId'] > 0 &&
    typeof value['completedAt'] === 'string' &&
    !Number.isNaN(Date.parse(value['completedAt'])) &&
    Array.isArray(value['answers']) &&
    value['answers'].length === 10 &&
    value['answers'].every(isAnswer)
  );
}
