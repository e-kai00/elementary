import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { apiBaseUrl } from '../../core/auth/auth.config';
import type { CompletedLearningSession } from '../models/learning-session.model';

@Injectable({ providedIn: 'root' })
export class LearningSessionApiService {
  private readonly http = inject(HttpClient);

  saveSession(session: CompletedLearningSession): Observable<CompletedLearningSession> {
    return this.http.post<CompletedLearningSession>(`${apiBaseUrl}/api/learning-sessions`, session);
  }

  getSessions(): Observable<CompletedLearningSession[]> {
    return this.http.get<CompletedLearningSession[]>(`${apiBaseUrl}/api/learning-sessions`);
  }
}
