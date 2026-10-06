export interface Exercicio {
  readonly id: string;
  nome: string;
  /** Quantidade de séries a executar */
  series: number;
  /** (legado) Repetições padrão por série. Mantido por compatibilidade. */
  reps?: number;
  /** Faixa de repetições alvo — mínimo (ex: 8 em "8–12"). */
  repsMin?: number;
  /** Faixa de repetições alvo — máximo (ex: 12 em "8–12"). */
  repsMax?: number;
  /** Detalhe da execução que não cabe na faixa de reps (ex: "cada lado", série combinada). */
  obs?: string;
  /** Como a série é medida: repetições (padrão) ou minutos (ex: simulador de escada). */
  unidade?: 'reps' | 'min';
}
