import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { apiBaseUrl } from '../auth/auth.config';
import type { ElementaryUser } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);

  getMe(): Observable<ElementaryUser> {
    return this.http.get<ElementaryUser>(`${apiBaseUrl}/api/me`);
  }
}
