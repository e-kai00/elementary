export type CardType =
  | 'name-to-symbol'
  | 'symbol-to-name'
  | 'name-to-atomic-number'
  | 'name-to-group'
  | 'name-to-category';

export interface LearningCard {
  type: CardType;
    /** References ChemicalElement.atomicNumber. */
  elementId: number;
  prompt: string;
  options: readonly [string, string, string, string];
  correctAnswer: string;
}
