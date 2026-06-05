import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/treinos.component').then((m) => m.TreinosComponent),
  },
  {
    path: 'treino/:id',
    loadComponent: () =>
      import('./pages/treino-editor.component').then((m) => m.TreinoEditorComponent),
  },
  {
    path: 'treino/:id/executar',
    loadComponent: () =>
      import('./pages/execucao.component').then((m) => m.ExecucaoComponent),
  },
  {
    path: 'treino/:id/historico',
    loadComponent: () =>
      import('./pages/historico.component').then((m) => m.HistoricoComponent),
  },
  { path: '**', redirectTo: '' },
];
