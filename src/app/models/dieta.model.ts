/** Uma opção de alimento dentro de um componente (substituível por outra). */
export interface OpcaoAlimento {
  readonly id: string;
  nome: string;
  /** Porção de referência, ex: "2 fatias (50g)". */
  porcao: string;
  kcal: number;
  proteina: number; // g
  carbo: number;    // g
  gordura: number;  // g
}

/** Um componente da refeição (ex: Carboidrato, Proteína) com suas opções de substituição. */
export interface Componente {
  readonly id: string;
  nome: string;
  opcoes: OpcaoAlimento[];
}

/** Uma refeição do plano (Café da manhã, Almoço...). */
export interface RefeicaoPlano {
  readonly id: string;
  nome: string;
  horario?: string;
  componentes: Componente[];
}

/** Linha da rotação semanal sugerida (proteína/carbo principal do dia). */
export interface RotacaoDia {
  dia: string;
  proteina: string;
  carboidrato: string;
}

/** Regra de progressão de calorias conforme a evolução do peso. */
export interface RegraProgressao {
  situacao: string;
  ajuste: string;
}

/** Categoria de alimentos-base para manter em casa. */
export interface CategoriaBasicos {
  categoria: string;
  itens: string;
}

/** Orientações gerais do plano (estratégia, rotação semanal, progressão). */
export interface OrientacoesPlano {
  estrategia?: string;
  basicos?: CategoriaBasicos[];
  rotacaoSemanal?: RotacaoDia[];
  progressao?: RegraProgressao[];
  observacao?: string;
}

/** Plano de dieta FIXO — vale todo dia. Documento único (id 'plano'). */
export interface DietaPlano {
  readonly id: string;
  refeicoes: RefeicaoPlano[];
  orientacoes?: OrientacoesPlano;
}

/** Adesão de um dia: qual opção foi escolhida em cada componente. id = YYYY-MM-DD. */
export interface DiaAdesao {
  readonly id: string;
  data: string;
  /** componenteId -> opcaoId escolhida nesse dia. */
  escolhas: Record<string, string>;
}

/** Metas diárias de macros. Documento único (id 'metas-dieta'). */
export interface MetasDieta {
  readonly id: string;
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

/** Soma de macros. */
export interface Macros {
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}
