import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import type {
  CompletedLearningSession,
  LearningSessionAnswer,
} from '../../core/models/learning-session.model';
import {
  clearPendingGuestSessions,
  getPendingGuestSessions,
} from '../../core/utils/pending-guest-session';
import { LearningCardComponent } from './learning-card/learning-card';
import { LearningPageComponent } from './learning-page';
import { LearningQuestionQueueService } from './learning-question-queue.service';

describe('LearningPageComponent', () => {
  let harness: RouterTestingHarness;
  let element: HTMLElement;

  function currentCard() {
    const component = harness.routeDebugElement!.query(By.directive(LearningCardComponent))
      .componentInstance as LearningCardComponent;
    return component.card();
  }

  beforeEach(async () => {
    clearPendingGuestSessions();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/learn', LearningPageComponent);
    element = harness.routeNativeElement!;
    element.querySelector<HTMLButtonElement>('.start-session')!.click();
    harness.detectChanges();
  });

  afterEach(() => {
    clearPendingGuestSessions();
    vi.restoreAllMocks();
  });

  it('restricts cards to the selected level and resets the current answer state', () => {
    element.querySelector<HTMLButtonElement>('app-learning-card button')!.click();
    harness.detectChanges();
    expect(element.querySelector<HTMLButtonElement>('.next-card')!.disabled).toBe(false);

    element.querySelector<HTMLButtonElement>('.choose-level')!.click();
    harness.detectChanges();
    const levelSelect = element.querySelector<HTMLSelectElement>('#learning-level')!;
    levelSelect.value = '2';
    levelSelect.dispatchEvent(new Event('change'));
    element.querySelector<HTMLButtonElement>('.start-session')!.click();
    harness.detectChanges();

    expect(currentCard().type).toBe('symbol-to-name');
    expect(getPendingGuestSessions()).toEqual([]);
    expect(element.querySelector<HTMLButtonElement>('.next-card')!.disabled).toBe(true);
    expect(element.querySelector('app-learning-card [role="status"]')?.textContent?.trim()).toBe(
      '',
    );
    expect(
      Array.from(element.querySelectorAll<HTMLButtonElement>('app-learning-card button')).every(
        (button) => !button.disabled,
      ),
    ).toBe(true);

    element.querySelector<HTMLButtonElement>('app-learning-card button')!.click();
    harness.detectChanges();
    element.querySelector<HTMLButtonElement>('.next-card')!.click();
    harness.detectChanges();

    expect(currentCard().type).toBe('symbol-to-name');
  });

  it('allows advancing after an answer and resets the card answer state', () => {
    const originalCard = currentCard();
    const nextButton = element.querySelector<HTMLButtonElement>('.next-card')!;

    expect(nextButton.disabled).toBe(true);

    element.querySelector<HTMLButtonElement>('app-learning-card button')!.click();
    harness.detectChanges();

    expect(nextButton.disabled).toBe(false);
    expect(
      element.querySelector('app-learning-card [role="status"]')?.textContent?.trim(),
    ).not.toBe('');

    nextButton.click();
    harness.detectChanges();

    expect(currentCard()).not.toBe(originalCard);
    expect(element.querySelector('.progress')?.textContent).toContain('Card 2 of 10');
    expect(nextButton.disabled).toBe(true);
    expect(element.querySelector('app-learning-card [role="status"]')?.textContent?.trim()).toBe(
      '',
    );
    const answerButtons = element.querySelectorAll<HTMLButtonElement>('app-learning-card button');
    expect(Array.from(answerButtons).every((button) => !button.disabled)).toBe(true);
  });

  it('scores exactly ten answers and continues the queue in another session', async () => {
    const seenQuestions = new Set<string>();
    const draw = vi.spyOn(TestBed.inject(LearningQuestionQueueService), 'nextCard');
    const uuid = vi.spyOn(crypto, 'randomUUID');
    const savedSessions: CompletedLearningSession[] = [];

    for (let session = 0; session < 2; session++) {
      const expectedAnswers: LearningSessionAnswer[] = [];
      for (let index = 0; index < 10; index++) {
        const card = currentCard();
        const key = `${card.elementId}:${card.type}`;
        expect(seenQuestions.has(key)).toBe(false);
        seenQuestions.add(key);
        expect(element.querySelector('.progress')?.textContent).toContain(
          `Card ${index + 1} of 10`,
        );

        const answer =
          session === 1 || index < 7
            ? card.correctAnswer
            : card.options.find((option) => option !== card.correctAnswer)!;
        expectedAnswers.push({
          elementId: card.elementId,
          cardType: card.type,
          selectedAnswer: answer,
          correctAnswer: card.correctAnswer,
          isCorrect: answer === card.correctAnswer,
        });
        const button = Array.from(
          element.querySelectorAll<HTMLButtonElement>('app-learning-card button'),
        ).find((option) => option.textContent?.trim() === answer)!;
        button.click();
        await harness.fixture.whenStable();

        if (index < 9) {
          expect(getPendingGuestSessions()).toEqual(savedSessions);
        }

        const next = element.querySelector<HTMLButtonElement>('.next-card')!;
        expect(next.disabled).toBe(false);
        if (index === 9) {
          expect(next.textContent?.trim()).toBe('View results');
        }
        next.click();
        await harness.fixture.whenStable();
      }

      expect(element.querySelector('app-learning-card')).toBeNull();
      expect(element.querySelector('.results')?.textContent).toContain('Element Symbols');
      expect(element.querySelector('.correct-count')?.textContent).toBe(session === 0 ? '7' : '10');
      expect(element.querySelector('.incorrect-count')?.textContent).toBe(
        session === 0 ? '3' : '0',
      );
      expect(element.querySelector('.accuracy')?.textContent).toBe(session === 0 ? '70%' : '100%');
      // The initial question was drawn before this spy; viewing results draws no extra card.
      expect(draw).toHaveBeenCalledTimes(session === 0 ? 9 : 19);
      expect(uuid).toHaveBeenCalledTimes(session + 1);

      const stored = getPendingGuestSessions();
      const saved = stored[session];
      expect(saved).toEqual({
        id: uuid.mock.results[session].value,
        levelId: 1,
        completedAt: expect.any(String),
        answers: expectedAnswers,
      });
      expect(new Date(saved!.completedAt).toISOString()).toBe(saved!.completedAt);
      savedSessions.push(saved);
      expect(stored).toEqual(savedSessions);

      if (session === 0) {
        element.querySelector<HTMLButtonElement>('.start-session')!.click();
        await harness.fixture.whenStable();
        expect(element.querySelector<HTMLButtonElement>('.next-card')!.disabled).toBe(true);
        expect(getPendingGuestSessions()).toEqual(savedSessions);
      }
    }

    element.querySelector<HTMLButtonElement>('.choose-level')!.click();
    await harness.fixture.whenStable();
    expect(element.querySelector('select')).not.toBeNull();
    expect(element.querySelector('app-learning-card')).toBeNull();
    expect(getPendingGuestSessions()).toEqual(savedSessions);
  });

  it('uses the same application question queue after navigating away and back', async () => {
    const questions = TestBed.inject(LearningQuestionQueueService);
    const draw = vi.spyOn(questions, 'nextCard');
    await harness.navigateByUrl('/');
    await harness.navigateByUrl('/learn', LearningPageComponent);
    element = harness.routeNativeElement!;

    expect(element.querySelector('#learning-level')).not.toBeNull();
    expect(draw).not.toHaveBeenCalled();
    element.querySelector<HTMLButtonElement>('.start-session')!.click();
    harness.detectChanges();

    expect(draw).toHaveBeenCalledTimes(1);
    expect(element.querySelector('.progress')?.textContent).toContain('Card 1 of 10');
  });
});
