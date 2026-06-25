/** Alimento cadastrado na biblioteca (macros por porção). Reutilizável nas refeições. */
export interface Alimento {
  readonly id: string;
  nome: string;
  /** Descrição da porção de referência, ex: "100g", "1 fatia", "1 unidade". */
  porcao: string;
  kcal: number;
  proteina: number; // g
  carbo: number;    // g
  gordura: number;  // g
}

/** Um alimento dentro de uma refeição do plano (snapshot dos macros já multiplicados). */
export interface ItemRefeicao {
  readonly id: string;
  alimentoId?: string;
  nome: string;
  porcao: string;
  /** Multiplicador da porção (ex: 1.5 = uma porção e meia). */
  quantidade: number;
  /** Totais já multiplicados pela quantidade. */
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

/** Uma refeição do plano (Café da manhã, Almoço...). */
export interface Refeicao {
  readonly id: string;
  nome: string;
  itens: ItemRefeicao[];
}

/** Plano de dieta FIXO — vale para todos os dias. Documento único (id 'plano'). */
export interface DietaPlano {
  readonly id: string;
  refeicoes: Refeicao[];
}

/** Adesão de um dia: quais itens do plano foram realmente comidos. id = YYYY-MM-DD. */
export interface DiaAdesao {
  readonly id: string;
  data: string;
  /** ids dos itens do plano marcados como comidos nesse dia. */
  comidos: string[];
}

/** Metas diárias de macros. Documento único (id 'metas-dieta'). */
export interface MetasDieta {
  readonly id: string;
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

/** Soma de macros (totais do plano / consumido / por refeição). */
export interface Macros {
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}
