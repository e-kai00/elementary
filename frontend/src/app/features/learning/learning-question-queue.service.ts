import { Injectable } from '@angular/core';
import { CHEMICAL_ELEMENTS } from '../../core/data/chemical-elements.data';
import {
  generateAtomicNumberCard,
  generateCategoryCard,
  generateGroupCard,
  generateNameCard,
  generateSymbolCard,
} from '../../core/learning-card-generator';
import type { ChemicalElement } from '../../core/models/chemical-element.model';
import type { CardType, LearningCard } from '../../core/models/learning-card.model';
import { shuffle } from '../../core/utils/shuffle';
import type { LearningLevel } from './learning-levels.config';

interface Question {
  readonly element: ChemicalElement;
  readonly type: CardType;
}

interface QuestionQueue {
  remaining: Question[];
  lastQuestion?: Question;
}

type CardGenerator = (
  target: ChemicalElement,
  elements: readonly ChemicalElement[],
) => LearningCard;

const cardGenerators = {
  'name-to-symbol': generateSymbolCard,
  'symbol-to-name': generateNameCard,
  'name-to-atomic-number': generateAtomicNumberCard,
  'name-to-group': generateGroupCard,
  'name-to-category': generateCategoryCard,
} satisfies Record<CardType, CardGenerator>;

@Injectable({ providedIn: 'root' })
export class LearningQuestionQueueService {
  private readonly queues = new Map<number, QuestionQueue>();

  nextCard(level: LearningLevel): LearningCard {
    const queue: QuestionQueue = this.queues.get(level.id) ?? { remaining: [] };

    if (queue.remaining.length === 0) {
      queue.remaining = CHEMICAL_ELEMENTS.flatMap((element) =>
        level.cardTypes.map((type) => ({ element, type })),
      );

      shuffle(queue.remaining);

      // checks whether the first question of the new cycle matches the last question of the previous cycle. 
      // if so, swap with another one to avoid an immediate repeat.
      const first = queue.remaining[0];
      if (
        queue.remaining.length > 1 &&
        first.element.atomicNumber === queue.lastQuestion?.element.atomicNumber &&
        first.type === queue.lastQuestion.type
      ) {
        const swapIndex = 1 + Math.floor(Math.random() * (queue.remaining.length - 1));
        [queue.remaining[0], queue.remaining[swapIndex]] = [
          queue.remaining[swapIndex],
          queue.remaining[0],
        ];
      }
    }

    const question = queue.remaining.shift()!;
    queue.lastQuestion = question;
    this.queues.set(level.id, queue);
    return cardGenerators[question.type](question.element, CHEMICAL_ELEMENTS);
  }
}
