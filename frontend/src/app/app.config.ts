import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';

import { routes } from './app.routes';
import { apiBaseUrl, auth0Settings } from './core/auth/auth.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    provideAuth0({
      domain: auth0Settings.domain,
      clientId: auth0Settings.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: auth0Settings.audience,
      },
      errorPath: '/learn',
      httpInterceptor: {
        allowedList: [
          {
            uri: `${apiBaseUrl}/api/*`,
            tokenOptions: { authorizationParams: { audience: auth0Settings.audience } },
          },
        ],
      },
    }),
  ],
};
