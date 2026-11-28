import { Routes } from '@angular/router';
import { authGuardFn } from '@auth0/auth0-angular';
import { LearningPageComponent } from './learning/components/learning-page/learning-page';
import { ProgressPageComponent } from './progress/components/progress-page/progress-page';

export const routes: Routes = [
  {
    path: 'learn',
    component: LearningPageComponent,
  },
  {
    path: 'progress',
    component: ProgressPageComponent,
    canActivate: [authGuardFn],
  },
];
