import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { CHEMICAL_ELEMENTS } from './learning/data/chemical-elements.data';
import type { CompletedLearningSession } from './learning/models/learning-session.model';
import {
  appendPendingGuestSession,
  clearPendingGuestSessions,
  getPendingGuestSessions,
} from './learning/utils/pending-guest-session';

describe('App', () => {
  const auth = {
    isLoading$: of(false),
    isAuthenticated$: new BehaviorSubject(false),
    user$: of({ name: 'A learner' }),
    error$: new Subject<Error>(),
    loginWithRedirect: vi.fn(() => of(void 0)),
    logout: vi.fn(() => of(void 0)),
  };
  const pendingSession: CompletedLearningSession = {
    id: crypto.randomUUID(),
    levelId: 1,
    completedAt: '2026-11-14T12:00:00.000Z',
    answers: CHEMICAL_ELEMENTS.slice(0, 10).map((element) => ({
      elementId: element.atomicNumber,
      cardType: 'name-to-symbol',
      selectedAnswer: element.symbol,
      correctAnswer: element.symbol,
      isCorrect: true,
    })),
  };
  let fixture: ComponentFixture<App>;
  let element: HTMLElement;

  function clickAccountAction(label: string): void {
    Array.from(element.querySelectorAll<HTMLButtonElement>('nav button'))
      .find((button) => button.textContent?.trim() === label)!
      .click();
  }

  beforeEach(async () => {
    auth.isAuthenticated$.next(false);
    auth.loginWithRedirect.mockReset().mockReturnValue(of(void 0));
    auth.logout.mockReset().mockReturnValue(of(void 0));
    clearPendingGuestSessions();
    appendPendingGuestSession(pendingSession);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: AuthService, useValue: auth }],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    clearPendingGuestSessions();
  });

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render title', () => {
    expect(element.querySelector('h1')?.textContent).toContain('Elementary');
  });

  it.each([
    { action: 'Create account', authorizationParams: { screen_hint: 'signup' } },
    { action: 'Log in', authorizationParams: undefined },
  ])(
    'requests $action with a return route and preserves completed sessions',
    async ({ action, authorizationParams }) => {
      await TestBed.inject(Router).navigateByUrl('/learn');
      await fixture.whenStable();

      clickAccountAction(action);

      expect(auth.loginWithRedirect).toHaveBeenCalledExactlyOnceWith({
        appState: { target: '/learn' },
        ...(authorizationParams ? { authorizationParams } : {}),
      });
      expect(getPendingGuestSessions()).toEqual([pendingSession]);

      // Model recreating the app on return; actual callback exchange belongs to the SDK.
      fixture.destroy();
      auth.isAuthenticated$.next(true);
      fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      expect(getPendingGuestSessions()).toEqual([pendingSession]);
    },
  );

  it('logs out to Elementary without deleting completed sessions', () => {
    auth.isAuthenticated$.next(true);
    fixture.detectChanges();

    clickAccountAction('Log out');

    expect(auth.logout).toHaveBeenCalledExactlyOnceWith({
      logoutParams: { returnTo: window.location.origin },
    });
    expect(getPendingGuestSessions()).toEqual([pendingSession]);
  });

  it.each(['redirect', 'callback'])(
    'keeps guest learning accessible after a %s error',
    async (source) => {
      await TestBed.inject(Router).navigateByUrl('/learn');
      await fixture.whenStable();
      if (source === 'redirect') {
        auth.loginWithRedirect.mockReturnValueOnce(throwError(() => new Error('Sign-in failed')));
        clickAccountAction('Log in');
      } else {
        auth.error$.next(new Error('access_denied'));
      }
      await fixture.whenStable();

      expect(element.querySelector('.auth-message')?.textContent).toContain(
        'continue learning as a guest',
      );
      expect(element.querySelector('app-learning-page .start-session')).not.toBeNull();
      expect(getPendingGuestSessions()).toEqual([pendingSession]);
    },
  );
});
