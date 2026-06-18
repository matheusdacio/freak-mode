/** Registro de uma série individual feita durante a execução. */
export interface RegistroSerie {
  peso: number | null;
  reps: number | null;
}

/** Execução de um exercício dentro de uma sessão. */
export interface ItemSessao {
  readonly exercicioId: string;
  /** Nome capturado no momento da execução (histórico não muda se o exercício for editado depois). */
  nomeExercicio: string;
  series: RegistroSerie[];
  notas: string;
}

/** Uma sessão = uma execução completa de um treino. */
export interface Sessao {
  readonly id: string;
  readonly treinoId: string;
  /** Ordem incremental da sessão para aquele treino (1ª, 2ª, 3ª...). Usada nos relatórios. */
  ordem: number;
  itens: ItemSessao[];
  /** Data de início da sessão no formato YYYY-MM-DD. Usada para cálculo de streak. */
  data?: string;
  /**
   * 'rascunho': em andamento, não conta nas métricas.
   * 'concluida': finalizada, conta em tudo.
   * undefined: sessão antiga (compatibilidade) — tratada como concluída.
   */
  status?: 'rascunho' | 'concluida';
}
