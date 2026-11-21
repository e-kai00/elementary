import { CHEMICAL_ELEMENTS } from '../data/chemical-elements.data';
import type { CompletedLearningSession } from '../models/learning-session.model';
import {
  appendPendingGuestSession,
  clearPendingGuestSessions,
  getPendingGuestSessions,
  PENDING_GUEST_SESSIONS_KEY,
} from './pending-guest-session';

describe('pending guest session storage', () => {
  const session: CompletedLearningSession = {
    id: crypto.randomUUID(),
    levelId: 1,
    completedAt: '2026-11-09T12:00:00.000Z',
    answers: CHEMICAL_ELEMENTS.slice(0, 10).map((element) => ({
      elementId: element.atomicNumber,
      cardType: 'name-to-symbol',
      selectedAnswer: element.symbol,
      correctAnswer: element.symbol,
      isCorrect: true,
    })),
  };

  afterEach(() => {
    clearPendingGuestSessions();
  });

  it('retains multiple sessions without duplicate IDs and can clear the collection', () => {
    expect(getPendingGuestSessions()).toEqual([]);
    const anotherSession = { ...session, id: crypto.randomUUID() };

    expect(appendPendingGuestSession(session)).toBe(true);
    expect(appendPendingGuestSession(anotherSession)).toBe(true);
    expect(appendPendingGuestSession(session)).toBe(true);

    expect(getPendingGuestSessions()).toEqual([session, anotherSession]);
    expect(sessionStorage.getItem(PENDING_GUEST_SESSIONS_KEY)).toBe(
      JSON.stringify([session, anotherSession]),
    );

    expect(clearPendingGuestSessions()).toBe(true);
    expect(getPendingGuestSessions()).toEqual([]);
  });

  it('handles malformed or invalid data and does not persist incomplete sessions', () => {
    const incomplete = { ...session, answers: session.answers.slice(0, 9) };
    expect(appendPendingGuestSession(incomplete)).toBe(false);
    expect(sessionStorage.getItem(PENDING_GUEST_SESSIONS_KEY)).toBeNull();

    for (const stored of [
      '{broken',
      'null',
      '{}',
      JSON.stringify([{ ...session, answers: [{}] }]),
      JSON.stringify([incomplete]),
      JSON.stringify([{ ...session, completedAt: 'invalid' }]),
    ]) {
      sessionStorage.setItem(PENDING_GUEST_SESSIONS_KEY, stored);

      expect(getPendingGuestSessions()).toEqual([]);
      expect(sessionStorage.getItem(PENDING_GUEST_SESSIONS_KEY)).toBe(stored);
    }

    sessionStorage.setItem(PENDING_GUEST_SESSIONS_KEY, JSON.stringify([session, {}, session]));
    expect(getPendingGuestSessions()).toEqual([session]);
  });

  it('preserves a previously stored single session when appending to the collection', () => {
    sessionStorage.setItem(PENDING_GUEST_SESSIONS_KEY, JSON.stringify(session));
    expect(getPendingGuestSessions()).toEqual([session]);

    const anotherSession = { ...session, id: crypto.randomUUID() };
    appendPendingGuestSession(anotherSession);

    expect(getPendingGuestSessions()).toEqual([session, anotherSession]);
  });
});
