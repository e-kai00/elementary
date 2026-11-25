import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, NEVER, Subject, of, throwError } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { UserApiService } from './core/api/user-api.service';
import type { ElementaryUser } from './core/api/user.model';
import { CHEMICAL_ELEMENTS } from './learning/data/chemical-elements.data';
import type { CompletedLearningSession } from './learning/models/learning-session.model';
import { LearningSessionApiService } from './learning/services/learning-session-api.service';
import {
  appendPendingGuestSession,
  clearPendingGuestSessions,
  getPendingGuestSessions,
} from './learning/utils/pending-guest-session';

describe('App', () => {
  const backendUser: ElementaryUser = {
    id: '0f24a2a7-7619-43d6-ad54-be3aef11f3e3',
    username: null,
    name: null,
    email: null,
    created_at: '2026-01-01T12:00:00Z',
  };
  const userApi = { getMe: vi.fn(() => of(backendUser)) };
  const sessionApi = { saveSession: vi.fn(() => NEVER) };
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
    userApi.getMe.mockReset().mockReturnValue(of(backendUser));
    sessionApi.saveSession.mockClear();
    clearPendingGuestSessions();
    appendPendingGuestSession(pendingSession);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: auth },
        { provide: UserApiService, useValue: userApi },
        { provide: LearningSessionApiService, useValue: sessionApi },
      ],
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

  it('connects after sign-in, shows loading and success, and resets on sign-out', () => {
    expect(userApi.getMe).not.toHaveBeenCalled();
    const response = new Subject<ElementaryUser>();
    userApi.getMe.mockReturnValueOnce(response);
    auth.isAuthenticated$.next(true);
    fixture.detectChanges();
    expect(element.querySelector('nav')?.textContent).toContain('Connecting to Elementary');
    auth.isAuthenticated$.next(true);
    expect(userApi.getMe).toHaveBeenCalledTimes(1);

    response.next(backendUser);
    fixture.detectChanges();
    expect(element.querySelector('nav')?.textContent).toContain('Account connected.');

    auth.isAuthenticated$.next(false);
    response.next(backendUser);
    fixture.detectChanges();
    expect(element.querySelector('nav')?.textContent).not.toContain('Account connected.');
    expect(getPendingGuestSessions()).toEqual([pendingSession]);
  });

  it('keeps learning and pending sessions available after an API failure', async () => {
    await TestBed.inject(Router).navigateByUrl('/learn');
    userApi.getMe.mockReturnValueOnce(throwError(() => new Error('API unavailable')));
    auth.isAuthenticated$.next(true);
    await fixture.whenStable();

    expect(element.querySelector('.auth-message')?.textContent).toContain('continue learning');
    expect(element.querySelector('app-learning-page .start-session')).not.toBeNull();
    expect(getPendingGuestSessions()).toEqual([pendingSession]);

    auth.isAuthenticated$.next(false);
    auth.isAuthenticated$.next(true);
    fixture.detectChanges();
    expect(element.querySelector('nav')?.textContent).toContain('Account connected.');
  });

  it('does not duplicate backend checks or uploads when the app component is recreated', () => {
    auth.isAuthenticated$.next(true);
    fixture.detectChanges();
    fixture.destroy();
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(userApi.getMe).toHaveBeenCalledTimes(1);
    expect(sessionApi.saveSession).toHaveBeenCalledExactlyOnceWith(pendingSession);
    expect(getPendingGuestSessions()).toEqual([pendingSession]);
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
