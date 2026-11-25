import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { catchError, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';

import { UserApiService } from './core/api/user-api.service';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly userApi = inject(UserApiService);
  protected readonly actionFailed = signal(false);
  protected readonly apiStatus = toSignal(
    this.auth.isAuthenticated$.pipe(
      distinctUntilChanged(),
      switchMap((authenticated) =>
        authenticated
          ? this.userApi.getMe().pipe(
              map(() => 'ready' as const),
              startWith('loading' as const),
              catchError(() => of('error' as const)),
            )
          : of('idle' as const),
      ),
    ),
    { initialValue: 'idle' },
  );

  protected logIn(signUp = false): void {
    this.actionFailed.set(false);
    this.auth
      .loginWithRedirect({
        appState: { target: this.router.url },
        ...(signUp ? { authorizationParams: { screen_hint: 'signup' } } : {}),
      })
      .subscribe({ error: () => this.actionFailed.set(true) });
  }

  protected logOut(): void {
    this.actionFailed.set(false);
    this.auth
      .logout({ logoutParams: { returnTo: window.location.origin } })
      .subscribe({ error: () => this.actionFailed.set(true) });
  }
}
