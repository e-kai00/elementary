import type { ChemicalElement } from './models/chemical-element.model';
import type { LearningCard } from './models/learning-card.model';
import { shuffle } from './utils/shuffle';

export function generateSymbolCard(
  target: ChemicalElement,
  availableElements: readonly ChemicalElement[],
): LearningCard {
  return {
    type: 'name-to-symbol',
    elementId: target.atomicNumber,
    prompt: `What is the symbol for ${target.name}?`,
    options: createOptions(
      target.symbol,
      availableElements.map((element) => element.symbol),
    ),
    correctAnswer: target.symbol,
  };
}

export function generateNameCard(
  target: ChemicalElement,
  availableElements: readonly ChemicalElement[],
): LearningCard {
  return {
    type: 'symbol-to-name',
    elementId: target.atomicNumber,
    prompt: `Which element has the symbol ${target.symbol}?`,
    options: createOptions(
      target.name,
      availableElements.map((element) => element.name),
    ),
    correctAnswer: target.name,
  };
}

export function generateAtomicNumberCard(
  target: ChemicalElement,
  availableElements: readonly ChemicalElement[],
): LearningCard {
  const correctAnswer = String(target.atomicNumber);

  return {
    type: 'name-to-atomic-number',
    elementId: target.atomicNumber,
    prompt: `What is the atomic number of ${target.name}?`,
    options: createOptions(
      correctAnswer,
      availableElements.map((element) => String(element.atomicNumber)),
    ),
    correctAnswer,
  };
}

export function generateGroupCard(
  target: ChemicalElement,
  availableElements: readonly ChemicalElement[],
): LearningCard {
  if (target.group === null) {
    throw new Error(`Cannot generate a group card for ${target.name}: group is null.`);
  }

  const correctAnswer = String(target.group);

  return {
    type: 'name-to-group',
    elementId: target.atomicNumber,
    prompt: `Which group does ${target.name} belong to?`,
    options: createOptions(
      correctAnswer,
      availableElements
        .filter((element) => element.group !== null)
        .map((element) => String(element.group)),
    ),
    correctAnswer,
  };
}

export function generateCategoryCard(
  target: ChemicalElement,
  availableElements: readonly ChemicalElement[],
): LearningCard {
  const correctAnswer = categoryLabel(target.category);

  return {
    type: 'name-to-category',
    elementId: target.atomicNumber,
    prompt: `Which category does ${target.name} belong to?`,
    options: createOptions(
      correctAnswer,
      availableElements.map((element) => categoryLabel(element.category)),
    ),
    correctAnswer,
  };
}

function categoryLabel(category: ChemicalElement['category']): string {
  const label = category.replaceAll('-', ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function createOptions(
  correctAnswer: string,
  availableAnswers: readonly string[],
): LearningCard['options'] {
  const incorrectAnswers = [
    ...new Set(availableAnswers.filter((answer) => answer !== correctAnswer)),
  ];

  if (incorrectAnswers.length < 3) {
    throw new Error('A learning card requires at least three distinct incorrect answers.');
  }

  shuffle(incorrectAnswers);
  const options: [string, string, string, string] = [
    correctAnswer,
    incorrectAnswers[0],
    incorrectAnswers[1],
    incorrectAnswers[2],
  ];
  shuffle(options);
  return options;
}
