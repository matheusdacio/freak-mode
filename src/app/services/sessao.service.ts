import { inject, Injectable } from '@angular/core';
import { Treino } from '@models/treino.model';
import { ItemSessao, RegistroSerie, Sessao } from '@models/sessao.model';
import { DbService } from '@services/db.service';

function uid(): string {
  return crypto.randomUUID();
}

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly db = inject(DbService);

  /** Sessões concluídas de um treino, ordenadas da mais antiga para a mais recente. */
  async porTreino(treinoId: string): Promise<Sessao[]> {
    const todas = await this.db.getAll<Sessao>('sessoes');
    return todas
      .filter(s => s.treinoId === treinoId && s.status !== 'rascunho')
      .sort((a, b) => a.ordem - b.ordem);
  }

  private async ultima(treinoId: string): Promise<Sessao | undefined> {
    const lista = await this.porTreino(treinoId);
    return lista.at(-1);
  }

  /** Retorna o rascunho em andamento para um treino, se existir. */
  async buscarRascunho(treinoId: string): Promise<Sessao | undefined> {
    const todas = await this.db.getAll<Sessao>('sessoes');
    return todas
      .filter(s => s.treinoId === treinoId && s.status === 'rascunho')
      .sort((a, b) => b.ordem - a.ordem)
      .at(0);
  }

  /**
   * Monta uma nova sessão a partir do treino atual, pré-preenchendo peso/reps
   * com os valores da última sessão concluída (ou com as reps padrão do exercício).
   */
  async novaSessao(treino: Treino): Promise<Sessao> {
    const anterior = await this.ultima(treino.id);
    const proximaOrdem = anterior ? anterior.ordem + 1 : 1;

    const itens: ItemSessao[] = treino.exercicios.map((ex) => {
      const itemAnterior = anterior?.itens.find((i) => i.exercicioId === ex.id);
      const series: RegistroSerie[] = Array.from({ length: ex.series }, (_, idx) => {
        const ref = itemAnterior?.series[idx];
        return {
          peso: ref?.peso ?? null,
          reps: ref?.reps ?? (ex.reps && ex.reps > 0 ? ex.reps : null),
        };
      });
      return { exercicioId: ex.id, nomeExercicio: ex.nome, series, notas: '' };
    });

    return {
      id: uid(),
      treinoId: treino.id,
      ordem: proximaOrdem,
      itens,
      data: new Date().toISOString().slice(0, 10),
      status: 'rascunho',
    };
  }

  async salvar(sessao: Sessao): Promise<void> {
    await this.db.put('sessoes', sessao);
  }

  async remover(id: string): Promise<void> {
    await this.db.delete('sessoes', id);
  }
}
