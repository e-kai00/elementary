import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { LEARNING_LEVELS } from '../../../learning/config/learning-levels.config';
import type { CompletedLearningSession } from '../../../learning/models/learning-session.model';
import { LearningSessionApiService } from '../../../learning/services/learning-session-api.service';
import { calculateProgressStatistics } from '../../utils/progress-statistics';

@Component({
  selector: 'app-progress-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './progress-page.html',
  styleUrl: './progress-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPageComponent {
  private readonly auth = inject(AuthService);
  private readonly sessionApi = inject(LearningSessionApiService);

  protected readonly history = toSignal(this.loadHistory(), {
    initialValue: { status: 'loading' as const, sessions: [] },
  });

  protected readonly statistics = computed(() => {
    const history = this.history();
    return history.status === 'loaded' ? calculateProgressStatistics(history.sessions) : null;
  });

  private loadHistory() {
    return combineLatest([this.auth.isAuthenticated$, this.auth.user$]).pipe(
      map(([authenticated, user]) => (authenticated ? user?.sub : null)),
      distinctUntilChanged(),
      switchMap((ownerId) =>
        ownerId
          ? this.sessionApi.getSessions().pipe(
              map((sessions) => ({ status: 'loaded' as const, sessions })),
              startWith({ status: 'loading' as const, sessions: [] }),
              catchError(() => of({ status: 'error' as const, sessions: [] })),
            )
          : of({
              status: ownerId === null ? ('signed-out' as const) : ('loading' as const),
              sessions: [],
            }),
      ),
    );
  }

  protected levelName(levelId: number): string {
    return LEARNING_LEVELS.find((level) => level.id === levelId)?.name ?? 'Unknown level';
  }

  protected correctAnswers(session: CompletedLearningSession): number {
    return session.answers.filter((answer) => answer.isCorrect).length;
  }

  protected completionDate(completedAt: string): string {
    return new Date(completedAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
