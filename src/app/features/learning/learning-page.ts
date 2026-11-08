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
import { LEARNING_LEVELS } from './learning-levels.config';
import type { LearningLevel } from './learning-levels.config';

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
  protected readonly levels = LEARNING_LEVELS;
  protected readonly selectedLevel = signal<LearningLevel>(LEARNING_LEVELS[0]);
  protected readonly currentCard = signal<LearningCard>(this.generateCard());
  protected readonly answered = signal(false);

  protected selectLevel(levelId: string): void {
    const level = this.levels.find((candidate) => candidate.id === Number(levelId));
    if (!level) {
      return;
    }

    this.selectedLevel.set(level);
    this.currentCard.set(this.generateCard(this.currentCard()));
    this.answered.set(false);
  }

  protected nextCard(): void {
    if (!this.answered()) {
      return;
    }

    this.currentCard.set(this.generateCard(this.currentCard()));
    this.answered.set(false);
  }

  private generateCard(previous?: LearningCard): LearningCard {
    const allowedGenerators = cardGenerators.filter(({ type }) =>
      this.selectedLevel().cardTypes.includes(type),
    );
    const choices = CHEMICAL_ELEMENTS.flatMap((element) =>
      allowedGenerators.map(({ type, generate }) => ({ element, type, generate })),
    ).filter(
      ({ element, type }) => element.atomicNumber !== previous?.elementId || type !== previous.type,
    );
    const choice = choices[Math.floor(Math.random() * choices.length)];
    return choice.generate(choice.element, CHEMICAL_ELEMENTS);
  }
}
