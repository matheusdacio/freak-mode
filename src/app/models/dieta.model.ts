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

/** Um alimento lançado dentro de uma refeição (snapshot dos macros já multiplicados). */
export interface ItemRefeicao {
  readonly id: string;
  /** Referência ao alimento da biblioteca (se veio de lá). */
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

/** Uma refeição do dia (Café da manhã, Almoço...). */
export interface Refeicao {
  readonly id: string;
  nome: string;
  itens: ItemRefeicao[];
}

/** Registro de dieta de um dia. id = data no formato YYYY-MM-DD. */
export interface DiaDieta {
  readonly id: string;
  data: string;
  refeicoes: Refeicao[];
}

/** Metas diárias de macros. Documento único (id fixo 'metas'). */
export interface MetasDieta {
  readonly id: string;
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

/** Soma de macros (usada para totais do dia / por refeição). */
export interface Macros {
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}
