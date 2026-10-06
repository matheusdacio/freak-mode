import { Exercicio } from '@models/exercicio.model';

export type Unidade = 'reps' | 'min';

export function unidade(ex: Pick<Exercicio, 'unidade'> | undefined): Unidade {
  return ex?.unidade ?? 'reps';
}

/** "6-8", "15", "8+", "até 12" ou "" (sem a unidade). */
export function faixaTexto(ex: Exercicio, sep = '-'): string {
  const min = ex.repsMin ?? ex.reps;
  const max = ex.repsMax ?? ex.reps;
  if (min && max) return min === max ? `${min}` : `${min}${sep}${max}`;
  if (min) return `${min}+`;
  if (max) return `até ${max}`;
  return '';
}

/** "6–8 reps", "15 min" ou "". */
export function faixaLabel(ex: Exercicio): string {
  const faixa = faixaTexto(ex, '–');
  return faixa ? `${faixa} ${unidade(ex)}` : '';
}

/**
 * Série contabilizada como feita: peso e reps preenchidos. Em exercício por tempo
 * (simulador de escada) basta o tempo, porque nem toda máquina tem nível.
 */
export function serieFeita(
  serie: { peso: number | null; reps: number | null },
  ex?: Pick<Exercicio, 'unidade'>,
): boolean {
  if (serie.reps === null) return false;
  return unidade(ex) === 'min' || serie.peso !== null;
}
