import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { LearningCardComponent } from './learning-card/learning-card';
import { LearningPageComponent } from './learning-page';

describe('LearningPageComponent', () => {
  it('restricts cards to the selected level and resets the current answer state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/learn', LearningPageComponent);
    const element = harness.routeNativeElement!;
    const cardComponent = harness.routeDebugElement!.query(By.directive(LearningCardComponent))
      .componentInstance as LearningCardComponent;
    const nextButton = element.querySelector<HTMLButtonElement>('.next-card')!;

    element.querySelector<HTMLButtonElement>('app-learning-card button')!.click();
    harness.detectChanges();
    expect(nextButton.disabled).toBe(false);

    const levelSelect = element.querySelector<HTMLSelectElement>('#learning-level')!;
    levelSelect.value = '2';
    levelSelect.dispatchEvent(new Event('change'));
    harness.detectChanges();

    expect(cardComponent.card().type).toBe('symbol-to-name');
    expect(nextButton.disabled).toBe(true);
    expect(element.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(
      Array.from(element.querySelectorAll<HTMLButtonElement>('app-learning-card button')).every(
        (button) => !button.disabled,
      ),
    ).toBe(true);

    element.querySelector<HTMLButtonElement>('app-learning-card button')!.click();
    harness.detectChanges();
    nextButton.click();
    harness.detectChanges();

    expect(cardComponent.card().type).toBe('symbol-to-name');
  });

  it('allows advancing after an answer and resets the card answer state', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/learn', LearningPageComponent);
    const element = harness.routeNativeElement!;
    const cardComponent = harness.routeDebugElement!.query(By.directive(LearningCardComponent))
      .componentInstance as LearningCardComponent;
    const originalCard = cardComponent.card();
    const nextButton = element.querySelector<HTMLButtonElement>('.next-card')!;

    expect(nextButton.disabled).toBe(true);

    element.querySelector<HTMLButtonElement>('app-learning-card button')!.click();
    harness.detectChanges();

    expect(nextButton.disabled).toBe(false);
    expect(element.querySelector('[role="status"]')?.textContent?.trim()).not.toBe('');

    nextButton.click();
    harness.detectChanges();

    expect(cardComponent.card()).not.toBe(originalCard);
    expect(nextButton.disabled).toBe(true);
    expect(element.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    const answerButtons = element.querySelectorAll<HTMLButtonElement>('app-learning-card button');
    expect(Array.from(answerButtons).every((button) => !button.disabled)).toBe(true);
  });
});
