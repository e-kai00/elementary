import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'learn',
    loadComponent: () =>
      import('./learning/components/learning-page/learning-page').then(
        (module) => module.LearningPageComponent,
      ),
  },
];
