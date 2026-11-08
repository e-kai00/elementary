import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'learn',
    loadComponent: () =>
      import('./features/learning/learning-page').then((module) => module.LearningPageComponent),
  },
];
