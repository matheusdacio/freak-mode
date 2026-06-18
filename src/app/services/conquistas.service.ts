import { inject, Injectable } from '@angular/core';
import { Sessao } from '@models/sessao.model';
import { DbService } from '@services/db.service';

export interface Conquista {
  id: string;
  emoji: string;
  titulo: string;
  descricao: string;
  conquistada: boolean;
}

interface DefConquista {
  id: string;
  emoji: string;
  titulo: string;
  descricao: string;
  totalMeta?: number;
  streakMeta?: number;
}

const DEFINICOES: DefConquista[] = [
  { id: 'primeiro', emoji: '🏅', titulo: 'Primeiro Treino', descricao: 'Concluiu a primeira sessão', totalMeta: 1 },
  { id: 'cinco', emoji: '💪', titulo: 'Em Ritmo', descricao: '5 sessões concluídas', totalMeta: 5 },
  { id: 'dez', emoji: '🔥', titulo: 'Consistente', descricao: '10 sessões concluídas', totalMeta: 10 },
  { id: 'vinte-cinco', emoji: '⚡', titulo: 'Dedicado', descricao: '25 sessões concluídas', totalMeta: 25 },
  { id: 'cinquenta', emoji: '🏆', titulo: 'Lenda', descricao: '50 sessões concluídas', totalMeta: 50 },
  { id: 'streak-3', emoji: '📅', titulo: '3 Dias Seguidos', descricao: 'Treinou 3 dias consecutivos', streakMeta: 3 },
  { id: 'streak-7', emoji: '🌟', titulo: 'Semana Guerreira', descricao: '7 dias consecutivos de treino', streakMeta: 7 },
];

function calcularStreak(sessoes: Sessao[]): number {
  const datas = new Set(
    sessoes
      .filter((s): s is Sessao & { data: string } => typeof s.data === 'string')
      .map(s => s.data),
  );
  if (!datas.size) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (datas.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

@Injectable({ providedIn: 'root' })
export class ConquistasService {
  private readonly db = inject(DbService);

  async computar(): Promise<{ conquistas: Conquista[]; streak: number; totalSessoes: number }> {
    const todas = await this.db.getAll<Sessao>('sessoes');
    const sessoes = todas.filter(s => s.status !== 'rascunho');
    const total = sessoes.length;
    const streak = calcularStreak(sessoes);

    const conquistas: Conquista[] = DEFINICOES.map(d => ({
      id: d.id,
      emoji: d.emoji,
      titulo: d.titulo,
      descricao: d.descricao,
      conquistada:
        d.totalMeta !== undefined
          ? total >= d.totalMeta
          : streak >= (d.streakMeta ?? 0),
    }));

    return { conquistas, streak, totalSessoes: total };
  }
}
