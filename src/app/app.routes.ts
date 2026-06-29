import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs.component').then(m => m.TabsComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/treinos.component').then(m => m.TreinosComponent),
      },
      {
        path: 'dieta',
        loadComponent: () =>
          import('./pages/dieta.component').then(m => m.DietaComponent),
      },
      {
        path: 'corpo',
        loadComponent: () =>
          import('./pages/corpo.component').then(m => m.CorpoComponent),
      },
      {
        path: 'calendario',
        loadComponent: () =>
          import('./pages/calendario.component').then(m => m.CalendarioComponent),
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./pages/config.component').then(m => m.ConfigComponent),
      },
    ],
  },
  {
    path: 'treino/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/treino-editor.component').then(m => m.TreinoEditorComponent),
  },
  {
    path: 'treino/:id/executar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/execucao.component').then(m => m.ExecucaoComponent),
  },
  {
    path: 'treino/:id/historico',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/historico.component').then(m => m.HistoricoComponent),
  },
  { path: '**', redirectTo: '' },
];
