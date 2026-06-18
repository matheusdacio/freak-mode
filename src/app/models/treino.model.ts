import { Exercicio } from '@models/exercicio.model';

export interface Treino {
  readonly id: string;
  nome: string;
  exercicios: Exercicio[];
  ordem?: number;
  capa?: string;
}
