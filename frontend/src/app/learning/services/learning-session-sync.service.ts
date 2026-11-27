import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import {
  catchError,
  concatMap,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  from,
  map,
  mergeMap,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { UserApiService } from '../../core/api/user-api.service';
import type { CompletedLearningSession } from '../models/learning-session.model';
import {
  appendPendingGuestSession,
  claimPendingGuestSession,
  getPendingGuestSessions,
  removePendingGuestSession,
} from '../utils/pending-guest-session';
import { LearningSessionApiService } from './learning-session-api.service';

@Injectable({ providedIn: 'root' })
export class LearningSessionSyncService {
  private readonly auth = inject(AuthService);
  private readonly userApi = inject(UserApiService);
  private readonly sessionApi = inject(LearningSessionApiService);
  private readonly connectionStatus = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly apiStatus = this.connectionStatus.asReadonly();

  private readonly syncRequests = new Subject<void>();
  private readonly scheduledIds = new Set<string>();
  // null means guest; an empty string blocks uploads while a signed-in identity is unavailable.
  private ownerId: string | null = null;

  constructor() {
    this.auth.isAuthenticated$
      .pipe(
        distinctUntilChanged(),
        switchMap((authenticated) =>
          authenticated
            ? this.auth.user$.pipe(
                map((user) => user?.sub || ''),
                startWith(''),
              )
            : of(null),
        ),
        distinctUntilChanged(),
        // Switching identity unsubscribes the entire concatMap queue, including buffered uploads.
        switchMap((ownerId) => {
          this.ownerId = ownerId;
          this.connectionStatus.set(ownerId === null ? 'idle' : 'loading');
          if (!ownerId) {
            return EMPTY;
          }
          return this.userApi.getMe().pipe(
            switchMap(() => {
              this.connectionStatus.set('ready');
              return this.syncRequests.pipe(
                startWith(undefined),
                mergeMap(() => from(getPendingGuestSessions())),
                filter(
                  (session) =>
                    !this.scheduledIds.has(session.id) &&
                    claimPendingGuestSession(session.id, ownerId),
                ),
                tap((session) => this.scheduledIds.add(session.id)),
                concatMap((session) =>
                  defer(() => this.sessionApi.saveSession(session)).pipe(
                    tap(() => removePendingGuestSession(session.id)),
                    catchError(() => EMPTY),
                    finalize(() => this.scheduledIds.delete(session.id)),
                  ),
                ),
              );
            }),
            catchError(() => {
              this.connectionStatus.set('error');
              return EMPTY;
            }),
            finalize(() => this.scheduledIds.clear()),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  retainSession(session: CompletedLearningSession): boolean {
    const retained = appendPendingGuestSession(session, this.ownerId);
    if (retained) {
      this.syncPendingSessions();
    }
    return retained;
  }

  syncPendingSessions(): void {
    if (this.connectionStatus() === 'ready') {
      this.syncRequests.next();
    }
  }
}
