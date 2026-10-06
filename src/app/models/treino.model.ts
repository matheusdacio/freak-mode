import { Exercicio } from '@models/exercicio.model';

export interface Treino {
  readonly id: string;
  nome: string;
  exercicios: Exercicio[];
  ordem?: number;
  capa?: string;
  /** Orientação geral do treino (ex: descanso entre séries), exibida na execução. */
  obs?: string;
  /** Treino fora da rotação atual: sai da lista principal, mas mantém o histórico. */
  arquivado?: boolean;
  /** Versão da ficha do professor que gerou este treino (só nos treinos importados). */
  fichaVersao?: number;
}
