import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { apiBaseUrl } from '../../core/auth/auth.config';
import { CHEMICAL_ELEMENTS } from '../data/chemical-elements.data';
import type { CompletedLearningSession } from '../models/learning-session.model';
import { LearningSessionApiService } from './learning-session-api.service';

describe('LearningSessionApiService', () => {
  const url = `${apiBaseUrl}/api/learning-sessions`;
  const session: CompletedLearningSession = {
    id: crypto.randomUUID(),
    levelId: 1,
    completedAt: '2026-01-01T12:00:00Z',
    answers: CHEMICAL_ELEMENTS.slice(0, 10).map((element) => ({
      elementId: element.atomicNumber,
      cardType: 'name-to-symbol',
      selectedAnswer: element.symbol,
      correctAnswer: element.symbol,
      isCorrect: true,
    })),
  };
  let service: LearningSessionApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LearningSessionApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the completed session unchanged and returns the saved session', async () => {
    const result = firstValueFrom(service.saveSession(session));
    const request = http.expectOne({ method: 'POST', url });
    expect(request.request.body).toEqual(session);
    request.flush(session);
    expect(await result).toEqual(session);
  });

  it('gets the completed session collection', async () => {
    const result = firstValueFrom(service.getSessions());
    const request = http.expectOne({ method: 'GET', url });
    request.flush([session]);
    expect(await result).toEqual([session]);
  });

  it.each([
    { method: 'POST', status: 409, statusText: 'Conflict' },
    { method: 'GET', status: 401, statusText: 'Unauthorized' },
  ])('propagates HTTP $status errors from $method', async ({ method, status, statusText }) => {
    const result =
      method === 'POST'
        ? firstValueFrom(service.saveSession(session))
        : firstValueFrom(service.getSessions());
    const error = { detail: 'Request failed' };
    const rejection = expect(result).rejects.toMatchObject({ status, error });
    http.expectOne({ method, url }).flush(error, { status, statusText });
    await rejection;
  });
});
