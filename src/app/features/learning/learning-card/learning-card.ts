import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { OnChanges } from '@angular/core';
import type { LearningCard } from '../../../core/models/learning-card.model';

@Component({
  selector: 'app-learning-card',
  standalone: true,
  templateUrl: './learning-card.html',
  styleUrl: './learning-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningCardComponent implements OnChanges {
  readonly card = input.required<LearningCard>();
  readonly answerSelected = output<{ selectedAnswer: string; isCorrect: boolean }>();

  protected readonly selectedAnswer = signal<string | null>(null);
  protected readonly isCorrect = computed(
    () => this.selectedAnswer() === this.card().correctAnswer,
  );

  ngOnChanges(): void {
    this.selectedAnswer.set(null);
  }

  protected selectAnswer(answer: string): void {
    if (this.selectedAnswer() !== null) {
      return;
    }

    this.selectedAnswer.set(answer);
    this.answerSelected.emit({ selectedAnswer: answer, isCorrect: this.isCorrect() });
  }
}
