import { Routes } from '@angular/router';
import { authResolveGuard } from './core/guards/auth-resolve.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'patient',
    loadComponent: () => import('./shared/layout/app-shell/app-shell').then((m) => m.AppShell),
    data: { role: 'patient' },
    canActivate: [authResolveGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/patient/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'medications',
        loadComponent: () =>
          import('./features/patient/medications/medications').then((m) => m.Medications),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/patient/history/history').then((m) => m.History),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/patient/profile/profile').then((m) => m.Profile),
      },
    ],
  },
  {
    path: 'doctor',
    loadComponent: () => import('./shared/layout/app-shell/app-shell').then((m) => m.AppShell),
    data: { role: 'doctor' },
    canActivate: [authResolveGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/doctor/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/doctor/patients/patients').then((m) => m.Patients),
      },
      {
        path: 'prescribe',
        loadComponent: () =>
          import('./features/doctor/prescribe/prescribe').then((m) => m.Prescribe),
      },
      {
        path: 'medications',
        loadComponent: () =>
          import('./features/doctor/medications/medications').then((m) => m.Medications),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/doctor/profile/profile').then((m) => m.Profile),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
