import { TestBed } from '@angular/core/testing';
import { CHEMICAL_ELEMENTS } from '../../core/data/chemical-elements.data';
import { LEARNING_LEVELS } from './learning-levels.config';
import { LearningQuestionQueueService } from './learning-question-queue.service';

describe('LearningQuestionQueueService', () => {
  it.each(LEARNING_LEVELS)('exhausts each shuffled cycle without repeats for $name', (level) => {
    const questions = TestBed.inject(LearningQuestionQueueService);
    const cycleLength = CHEMICAL_ELEMENTS.length * level.cardTypes.length;
    const cycles: string[][] = [];

    for (let cycle = 0; cycle < 2; cycle++) {
      const keys = Array.from({ length: cycleLength }, () => {
        const card = questions.nextCard(level);
        expect(level.cardTypes).toContain(card.type);
        return `${card.elementId}:${card.type}`;
      });
      expect(new Set(keys).size).toBe(cycleLength);
      cycles.push(keys);
    }

    expect(new Set(cycles[1])).toEqual(new Set(cycles[0]));
    expect(cycles[1][0]).not.toBe(cycles[0][cycleLength - 1]);
  });

  it('keeps the unused questions for each level when switching levels', () => {
    const questions = TestBed.inject(LearningQuestionQueueService);
    const firstHalf = Array.from({ length: 10 }, () => questions.nextCard(LEARNING_LEVELS[0]));
    const otherLevel = Array.from({ length: 10 }, () => questions.nextCard(LEARNING_LEVELS[1]));
    const secondHalf = Array.from({ length: 10 }, () => questions.nextCard(LEARNING_LEVELS[0]));

    expect(new Set([...firstHalf, ...secondHalf].map((card) => card.elementId)).size).toBe(20);
    expect(otherLevel.every((card) => card.type === 'symbol-to-name')).toBe(true);
  });

  it('prevents a boundary repeat even when the shuffle puts the previous question first', () => {
    const questions = TestBed.inject(LearningQuestionQueueService);
    const level = LEARNING_LEVELS[0];
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const firstCycle = Array.from({ length: 20 }, () => questions.nextCard(level));
      // This shuffle keeps the dataset order, putting the previous final question first.
      random.mockReturnValue(0.999999);
      const firstOfNextCycle = questions.nextCard(level);

      expect(firstOfNextCycle.elementId).not.toBe(firstCycle[19].elementId);
    } finally {
      random.mockRestore();
    }
  });
});
