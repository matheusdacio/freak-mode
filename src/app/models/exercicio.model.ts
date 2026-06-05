export interface Exercicio {
  readonly id: string;
  nome: string;
  /** Quantidade de séries a executar */
  series: number;
}
