import { CHEMICAL_ELEMENTS } from './data/chemical-elements.data';
import {
  generateAtomicNumberCard,
  generateCategoryCard,
  generateGroupCard,
  generateNameCard,
  generateSymbolCard,
} from './learning-card-generator';

describe('learning card generators', () => {
  const oxygen = CHEMICAL_ELEMENTS[7];
  const cases = [
    {
      generate: generateSymbolCard,
      type: 'name-to-symbol',
      prompt: 'What is the symbol for Oxygen?',
      correctAnswer: 'O',
    },
    {
      generate: generateNameCard,
      type: 'symbol-to-name',
      prompt: 'Which element has the symbol O?',
      correctAnswer: 'Oxygen',
    },
    {
      generate: generateAtomicNumberCard,
      type: 'name-to-atomic-number',
      prompt: 'What is the atomic number of Oxygen?',
      correctAnswer: '8',
    },
    {
      generate: generateGroupCard,
      type: 'name-to-group',
      prompt: 'Which group does Oxygen belong to?',
      correctAnswer: '16',
    },
    {
      generate: generateCategoryCard,
      type: 'name-to-category',
      prompt: 'Which category does Oxygen belong to?',
      correctAnswer: 'Nonmetal',
    },
  ];

  it.each(cases)('generates a valid $type card', ({ generate, type, prompt, correctAnswer }) => {
    const card = generate(oxygen, CHEMICAL_ELEMENTS);

    expect(card).toMatchObject({ type, elementId: 8, prompt, correctAnswer });
    expect(card.options).toHaveLength(4);
    expect(new Set(card.options).size).toBe(4);
    expect(card.options).toContain(correctAnswer);
  });

  it.each(cases)('rejects insufficient distinct answers for $type', ({ generate }) => {
    const alternatives = CHEMICAL_ELEMENTS.slice(0, 2);
    const elements = [oxygen, ...alternatives, ...alternatives];

    expect(() => generate(oxygen, elements)).toThrowError(
      'A learning card requires at least three distinct incorrect answers.',
    );
  });

  it('does not modify or reorder the supplied dataset', () => {
    const elements = CHEMICAL_ELEMENTS.map((element) => ({ ...element }));
    const original = elements.map((element) => ({ ...element }));

    for (const { generate } of cases) {
      generate(oxygen, elements);
    }

    expect(elements).toEqual(original);
  });

  it('formats a hyphenated category as a human-readable label', () => {
    const sodium = CHEMICAL_ELEMENTS[10];
    const card = generateCategoryCard(sodium, CHEMICAL_ELEMENTS);

    expect(card.correctAnswer).toBe('Alkali metal');
  });

  it('rejects a target with no group', () => {
    expect(() => generateGroupCard({ ...oxygen, group: null }, CHEMICAL_ELEMENTS)).toThrowError(
      'Cannot generate a group card for Oxygen: group is null.',
    );
  });

  it('does not treat a null group as an available answer', () => {
    const elements = [
      oxygen,
      CHEMICAL_ELEMENTS[0],
      CHEMICAL_ELEMENTS[1],
      { ...CHEMICAL_ELEMENTS[3], group: null },
    ];

    expect(() => generateGroupCard(oxygen, elements)).toThrowError(
      'A learning card requires at least three distinct incorrect answers.',
    );
  });
});
