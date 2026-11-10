import type { CardType } from './learning-card.model';

export interface LearningSessionAnswer {
  readonly elementId: number;
  readonly cardType: CardType;
  readonly selectedAnswer: string;
  readonly correctAnswer: string;
  readonly isCorrect: boolean;
}

export interface CompletedLearningSession {
  readonly id: string;
  readonly levelId: number;
  readonly completedAt: string;
  readonly answers: readonly LearningSessionAnswer[];
}
