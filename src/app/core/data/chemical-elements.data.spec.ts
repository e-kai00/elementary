import { CHEMICAL_ELEMENTS } from './chemical-elements.data';

describe('CHEMICAL_ELEMENTS', () => {
  it('contains exactly 20 elements ordered by atomic numbers 1 through 20', () => {
    expect(CHEMICAL_ELEMENTS).toHaveLength(20);
    expect(CHEMICAL_ELEMENTS.map((element) => element.atomicNumber)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
  });

  it('contains unique chemical symbols', () => {
    const symbols = CHEMICAL_ELEMENTS.map((element) => element.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it('contains the correct facts for Oxygen, Sodium, and Calcium', () => {
    expect(CHEMICAL_ELEMENTS.find((element) => element.atomicNumber === 8)).toEqual({
      atomicNumber: 8,
      symbol: 'O',
      name: 'Oxygen',
      group: 16,
      period: 2,
      category: 'nonmetal',
    });
    expect(CHEMICAL_ELEMENTS.find((element) => element.atomicNumber === 11)).toEqual({
      atomicNumber: 11,
      symbol: 'Na',
      name: 'Sodium',
      group: 1,
      period: 3,
      category: 'alkali-metal',
    });
    expect(CHEMICAL_ELEMENTS.find((element) => element.atomicNumber === 20)).toEqual({
      atomicNumber: 20,
      symbol: 'Ca',
      name: 'Calcium',
      group: 2,
      period: 4,
      category: 'alkaline-earth-metal',
    });
  });
});
