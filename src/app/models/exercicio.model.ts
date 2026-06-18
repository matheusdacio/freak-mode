export interface Exercicio {
  readonly id: string;
  nome: string;
  /** Quantidade de séries a executar */
  series: number;
  /** Repetições padrão por série (pré-preenchido na execução) */
  reps?: number;
}
