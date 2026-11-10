import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import type { LearningCard } from '../../../core/models/learning-card.model';
import { LearningCardComponent } from './learning-card';

describe('LearningCardComponent', () => {
  const card: LearningCard = {
    type: 'name-to-symbol',
    elementId: 8,
    prompt: 'What is the symbol for Oxygen?',
    options: ['H', 'O', 'He', 'Li'],
    correctAnswer: 'O',
  };
  let fixture: ComponentFixture<LearningCardComponent>;
  let element: HTMLElement;

  function buttons(): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll('button'));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LearningCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(LearningCardComponent);
    fixture.componentRef.setInput('card', card);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('reveals the correct answer and emits the result after an incorrect selection', () => {
    const emitted = vi.fn();
    fixture.componentInstance.answerSelected.subscribe(emitted);

    buttons()[0].click();
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'The correct answer is O.',
    );
    expect(emitted).toHaveBeenCalledExactlyOnceWith({ selectedAnswer: 'H', isCorrect: false });
  });

  it('accepts only one answer for the current card', () => {
    const emitted = vi.fn();
    fixture.componentInstance.answerSelected.subscribe(emitted);

    buttons()[0].click();
    fixture.detectChanges();
    expect(buttons().every((button) => button.disabled)).toBe(true);
    // Dispatch directly to also verify the handler guards against repeat events.
    buttons()[1].dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(emitted).toHaveBeenCalledExactlyOnceWith({ selectedAnswer: 'H', isCorrect: false });
    expect(element.querySelector('[role="status"]')?.textContent).toContain('You selected H.');
  });
});
