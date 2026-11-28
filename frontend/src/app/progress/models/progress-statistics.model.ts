export interface LevelProgressStatistics {
  readonly levelId: number;
  readonly levelName: string;
  readonly completedSessions: number;
  readonly questionsAnswered: number;
  readonly correctAnswers: number;
  readonly accuracyPercentage: number;
}

export interface ProgressStatistics {
  readonly totalCompletedSessions: number;
  readonly totalQuestionsAnswered: number;
  readonly totalCorrectAnswers: number;
  readonly overallAccuracyPercentage: number;
  readonly perLevel: readonly LevelProgressStatistics[];
}
