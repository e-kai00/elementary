import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly actionFailed = signal(false);

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
