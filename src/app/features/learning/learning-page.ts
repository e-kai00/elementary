import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CHEMICAL_ELEMENTS } from '../../core/data/chemical-elements.data';
import {
  generateAtomicNumberCard,
  generateCategoryCard,
  generateGroupCard,
  generateNameCard,
  generateSymbolCard,
} from '../../core/learning-card-generator';
import type { LearningCard } from '../../core/models/learning-card.model';
import { LearningCardComponent } from './learning-card/learning-card';

const cardGenerators = [
  { type: 'name-to-symbol', generate: generateSymbolCard },
  { type: 'symbol-to-name', generate: generateNameCard },
  { type: 'name-to-atomic-number', generate: generateAtomicNumberCard },
  { type: 'name-to-group', generate: generateGroupCard },
  { type: 'name-to-category', generate: generateCategoryCard },
] as const;

@Component({
  selector: 'app-learning-page',
  standalone: true,
  imports: [LearningCardComponent],
  templateUrl: './learning-page.html',
  styleUrl: './learning-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPageComponent {
  protected readonly currentCard = signal<LearningCard>(this.generateCard());
  protected readonly answered = signal(false);

  protected nextCard(): void {
    if (!this.answered()) {
      return;
    }

    this.currentCard.set(this.generateCard(this.currentCard()));
    this.answered.set(false);
  }

  private generateCard(previous?: LearningCard): LearningCard {
    const choices = CHEMICAL_ELEMENTS.flatMap((element) =>
      cardGenerators.map(({ type, generate }) => ({ element, type, generate })),
    ).filter(
      ({ element, type }) => element.atomicNumber !== previous?.elementId || type !== previous.type,
    );
    const choice = choices[Math.floor(Math.random() * choices.length)];
    return choice.generate(choice.element, CHEMICAL_ELEMENTS);
  }
}
