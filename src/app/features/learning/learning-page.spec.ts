import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { LearningCardComponent } from './learning-card/learning-card';
import { LearningPageComponent } from './learning-page';

describe('LearningPageComponent', () => {
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
