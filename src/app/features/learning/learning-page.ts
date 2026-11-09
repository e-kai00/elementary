import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import type { LearningCard } from '../../core/models/learning-card.model';
import type {
  CompletedLearningSession,
  LearningSessionAnswer,
} from '../../core/models/learning-session.model';
import { appendPendingGuestSession } from '../../core/utils/pending-guest-session';
import { LearningCardComponent } from './learning-card/learning-card';
import { LEARNING_LEVELS } from './learning-levels.config';
import type { LearningLevel } from './learning-levels.config';
import { LearningQuestionQueueService } from './learning-question-queue.service';

@Component({
  selector: 'app-learning-page',
  standalone: true,
  imports: [LearningCardComponent],
  templateUrl: './learning-page.html',
  styleUrl: './learning-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPageComponent {
  private readonly questions = inject(LearningQuestionQueueService);
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('screenHeading');

  protected readonly levels = LEARNING_LEVELS;
  protected readonly sessionLength = 10;
  protected readonly selectedLevel = signal<LearningLevel>(LEARNING_LEVELS[0]);
  protected readonly screen = signal<'selection' | 'session' | 'results'>('selection');
  protected readonly currentCard = signal<LearningCard | null>(null);
  protected readonly cardNumber = signal(1);
  protected readonly answered = signal(false);
  protected readonly answers = signal<readonly LearningSessionAnswer[]>([]);
  protected readonly completedSession = signal<CompletedLearningSession | null>(null);
  protected readonly retentionMessage = signal<string | null>(null);
  protected readonly correctCount = computed(
    () => this.answers().filter((answer) => answer.isCorrect).length,
  );
  protected readonly incorrectCount = computed(() => this.answers().length - this.correctCount());
  protected readonly accuracy = computed(() =>
    Math.round((this.correctCount() / this.sessionLength) * 100),
  );

  protected selectLevel(levelId: string): void {
    const level = this.levels.find((candidate) => candidate.id === Number(levelId));
    if (level) {
      this.selectedLevel.set(level);
    }
  }

  protected startSession(): void {
    this.completedSession.set(null);
    this.retentionMessage.set(null);
    this.answers.set([]);
    this.cardNumber.set(1);
    this.answered.set(false);
    this.currentCard.set(this.questions.nextCard(this.selectedLevel()));
    this.screen.set('session');
    this.focusHeading();
  }

  protected recordAnswer(answer: { selectedAnswer: string; isCorrect: boolean }): void {
    const card = this.currentCard();
    if (this.screen() !== 'session' || this.answered() || card === null) {
      return;
    }

    this.answers.update((answers) => [
      ...answers,
      {
        elementId: card.elementId,
        cardType: card.type,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: card.correctAnswer,
        isCorrect: answer.isCorrect,
      },
    ]);
    this.answered.set(true);

    if (this.answers().length === this.sessionLength) {
      const session: CompletedLearningSession = {
        id: crypto.randomUUID(),
        levelId: this.selectedLevel().id,
        completedAt: new Date().toISOString(),
        answers: this.answers(),
      };
      this.completedSession.set(session);
      this.retentionMessage.set(
        appendPendingGuestSession(session)
          ? 'Completed sessions are temporarily retained in this tab, including after page reloads.'
          : 'This session could not be temporarily retained in this tab.',
      );
    }
  }

  protected nextCard(): void {
    if (this.screen() !== 'session' || !this.answered()) {
      return;
    }

    if (this.cardNumber() === this.sessionLength) {
      this.screen.set('results');
      this.focusHeading();
      return;
    }

    this.currentCard.set(this.questions.nextCard(this.selectedLevel()));
    this.cardNumber.update((number) => number + 1);
    this.answered.set(false);
    this.focusHeading();
  }

  protected chooseLevel(): void {
    this.focusHeading();
    this.screen.set('selection');
    this.currentCard.set(null);
    this.answers.set([]);
    this.cardNumber.set(1);
    this.answered.set(false);
  }

  private focusHeading(): void {
    this.heading()?.nativeElement.focus();
  }
}
