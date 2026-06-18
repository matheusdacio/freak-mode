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
    loadComponent: () =>
      import('./pages/treinos.component').then(m => m.TreinosComponent),
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
