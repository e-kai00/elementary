import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';

import { routes } from './app.routes';
import { auth0Settings } from './core/auth/auth.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAuth0({
      domain: auth0Settings.domain,
      clientId: auth0Settings.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: auth0Settings.audience,
      },
      errorPath: '/learn',
    }),
  ],
};
