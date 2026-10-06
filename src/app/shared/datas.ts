/**
 * Datas no formato local YYYY-MM-DD. O app só conhece dias, nunca horas, por isso
 * toda conta é feita sobre os componentes da data (imune a fuso horário).
 */

export function hojeLocal(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dias de calendário desde 1970-01-01. */
export function diasDesdeEpoca(data: string): number {
  const [a, m, d] = data.split('-').map(Number);
  return Math.round(Date.UTC(a, m - 1, d) / 86400000);
}

export function dataDeDias(dias: number): string {
  const d = new Date(dias * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function diaSemana(data: string): string {
  // 1970-01-01 foi uma quinta-feira (índice 4)
  return DIAS_SEMANA[(((diasDesdeEpoca(data) + 4) % 7) + 7) % 7];
}

/** "05/10" */
export function labelCurta(data: string): string {
  const [, m, d] = data.split('-');
  return `${d}/${m}`;
}

/** "hoje", "ontem", "há 3 dias" (até 6 dias) ou "seg 05/10". */
export function labelRelativa(data: string, hoje = hojeLocal()): string {
  const diff = diasDesdeEpoca(hoje) - diasDesdeEpoca(data);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff > 1 && diff < 7) return `há ${diff} dias`;
  return `${diaSemana(data)} ${labelCurta(data)}`;
}

/** Segunda-feira da semana que contém o dia, em dias desde a época. */
export function inicioSemana(dias: number): number {
  return dias - ((((dias + 3) % 7) + 7) % 7);
}
