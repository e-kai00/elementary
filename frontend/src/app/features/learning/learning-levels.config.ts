import type { CardType } from '../../core/models/learning-card.model';

export interface LearningLevel {
  readonly id: number;
  readonly name: string;
  readonly cardTypes: readonly CardType[];
}

export const LEARNING_LEVELS: readonly LearningLevel[] = [
  { id: 1, name: 'Element Symbols', cardTypes: ['name-to-symbol'] },
  { id: 2, name: 'Element Names', cardTypes: ['symbol-to-name'] },
  { id: 3, name: 'Atomic Numbers', cardTypes: ['name-to-atomic-number'] },
  { id: 4, name: 'Periodic Table Groups', cardTypes: ['name-to-group'] },
  { id: 5, name: 'Element Categories', cardTypes: ['name-to-category'] },
  {
    id: 6,
    name: 'Mixed Practice',
    cardTypes: [
      'name-to-symbol',
      'symbol-to-name',
      'name-to-atomic-number',
      'name-to-group',
      'name-to-category',
    ],
  },
];
