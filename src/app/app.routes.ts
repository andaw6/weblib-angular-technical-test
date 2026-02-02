import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@app/features/server-management/server-management.component').then(
        (c) => c.ServerManagementComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
