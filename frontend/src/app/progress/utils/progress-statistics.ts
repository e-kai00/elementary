import { LEARNING_LEVELS } from '../../learning/config/learning-levels.config';
import type { CompletedLearningSession } from '../../learning/models/learning-session.model';
import type { ProgressStatistics } from '../models/progress-statistics.model';

export function calculateProgressStatistics(
  sessions: readonly CompletedLearningSession[],
): ProgressStatistics {
  const perLevel = LEARNING_LEVELS.map((level) => ({
    levelId: level.id,
    levelName: level.name,
    completedSessions: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
  }));
  let totalQuestionsAnswered = 0;
  let totalCorrectAnswers = 0;

  for (const session of sessions) {
    const questions = session.answers.length;
    const correct = session.answers.filter((answer) => answer.isCorrect).length;
    totalQuestionsAnswered += questions;
    totalCorrectAnswers += correct;

    const level = perLevel.find((entry) => entry.levelId === session.levelId);
    if (level) {
      level.completedSessions++;
      level.questionsAnswered += questions;
      level.correctAnswers += correct;
    }
  }

  return {
    totalCompletedSessions: sessions.length,
    totalQuestionsAnswered,
    totalCorrectAnswers,
    overallAccuracyPercentage: accuracyPercentage(totalCorrectAnswers, totalQuestionsAnswered),
    perLevel: perLevel.map((level) => ({
      ...level,
      accuracyPercentage: accuracyPercentage(level.correctAnswers, level.questionsAnswered),
    })),
  };
}

function accuracyPercentage(correct: number, questions: number): number {
  return questions === 0 ? 0 : Math.round((correct / questions) * 100);
}
