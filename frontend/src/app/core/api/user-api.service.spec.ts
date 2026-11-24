import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Auth0ClientService, AuthService, AuthState } from '@auth0/auth0-angular';
import { firstValueFrom, of } from 'rxjs';

import { appConfig } from '../../app.config';
import { apiBaseUrl, auth0Settings } from '../auth/auth.config';
import { UserApiService } from './user-api.service';
import type { ElementaryUser } from './user.model';

describe('UserApiService with Auth0 HTTP configuration', () => {
  const auth0Client = { getTokenSilently: vi.fn() };
  let http: HttpTestingController;

  beforeEach(() => {
    auth0Client.getTokenSilently.mockReset().mockResolvedValue('test-access-token');
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: Auth0ClientService, useValue: auth0Client },
        { provide: AuthService, useValue: { isLoading$: of(false) } },
        { provide: AuthState, useValue: { setAccessToken: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the current user with an access token for the Elementary audience', async () => {
    const user: ElementaryUser = {
      id: '0f24a2a7-7619-43d6-ad54-be3aef11f3e3',
      username: null,
      name: null,
      email: null,
      created_at: '2026-01-01T12:00:00Z',
    };
    const result = firstValueFrom(TestBed.inject(UserApiService).getMe());
    await Promise.resolve();

    const request = http.expectOne(`${apiBaseUrl}/api/me`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-access-token');
    expect(auth0Client.getTokenSilently).toHaveBeenCalledExactlyOnceWith({
      authorizationParams: { audience: auth0Settings.audience },
    });
    request.flush(user);
    expect(await result).toEqual(user);
  });

  it.each([
    'https://unrelated.example/api/me',
    `${apiBaseUrl}.example/api/me`,
    `${apiBaseUrl}/public/info`,
    '/api/me',
  ])('does not attach an access token to %s', async (url) => {
    const result = firstValueFrom(TestBed.inject(HttpClient).get(url));
    const request = http.expectOne(url);
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(auth0Client.getTokenSilently).not.toHaveBeenCalled();
    request.flush({});
    await result;
  });
});
