export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth-metal'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide';

export interface ChemicalElement {
  /** Stable identifier for the element. */
  atomicNumber: number;
  symbol: string;
  name: string;
  /** May be null because conventional groups for lanthanides and actinides vary. */
  group: number | null;
  period: number;
  category: ElementCategory;
}
