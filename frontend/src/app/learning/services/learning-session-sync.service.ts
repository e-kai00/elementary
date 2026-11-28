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
import type { Observable } from 'rxjs';

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
  // null means confirmed guest; undefined means the authenticated subject is unresolved.
  private ownerId: string | null | undefined;

  constructor() {
    this.observeAuthentication();
  }

  retainSession(session: CompletedLearningSession): boolean {
    if (this.ownerId === undefined) {
      return false;
    }
    const retained = appendPendingGuestSession(session, this.ownerId);
    if (retained && this.connectionStatus() === 'ready') {
      this.syncRequests.next();
    }
    return retained;
  }

  private observeAuthentication(): void {
    this.auth.isAuthenticated$
      .pipe(
        distinctUntilChanged(),
        tap((authenticated) => {
          this.ownerId = authenticated ? undefined : null;
        }),
        switchMap((authenticated) =>
          authenticated
            ? this.auth.user$.pipe(
                map((user) => (user?.sub?.trim() ? user.sub : undefined)),
                startWith(undefined),
              )
            : of(null),
        ),
        distinctUntilChanged(),
        // Switching identity cancels the entire connection and upload queue.
        switchMap((ownerId) => this.connectAndSync(ownerId)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private connectAndSync(ownerId: string | null | undefined): Observable<CompletedLearningSession> {
    this.connectionStatus.set(ownerId === null ? 'idle' : 'loading');
    if (!ownerId) {
      // Keep a previously known owner during a temporary profile gap.
      return EMPTY;
    }
    this.ownerId = ownerId;
    return this.userApi.getMe().pipe(
      tap(() => this.connectionStatus.set('ready')),
      switchMap(() => this.processPendingSessions(ownerId)),
      catchError(() => {
        this.connectionStatus.set('error');
        return EMPTY;
      }),
      finalize(() => this.scheduledIds.clear()),
    );
  }

  private processPendingSessions(ownerId: string): Observable<CompletedLearningSession> {
    return this.syncRequests.pipe(
      startWith(undefined),
      mergeMap(() => from(getPendingGuestSessions())),
      filter(
        (session) =>
          !this.scheduledIds.has(session.id) && claimPendingGuestSession(session.id, ownerId),
      ),
      tap((session) => this.scheduledIds.add(session.id)),
      concatMap((session) => this.uploadSession(session)),
    );
  }

  private uploadSession(session: CompletedLearningSession): Observable<CompletedLearningSession> {
    return defer(() => this.sessionApi.saveSession(session)).pipe(
      tap(() => removePendingGuestSession(session.id)),
      catchError(() => EMPTY),
      finalize(() => this.scheduledIds.delete(session.id)),
    );
  }
}
