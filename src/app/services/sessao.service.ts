import { inject, Injectable } from '@angular/core';
import { Treino } from '@models/treino.model';
import { Exercicio } from '@models/exercicio.model';
import { ItemSessao, RegistroSerie, Sessao } from '@models/sessao.model';
import { DbService } from '@services/db.service';
import { hojeLocal } from '../shared/datas';

function uid(): string {
  return crypto.randomUUID();
}

/** Nome comparável entre treinos: maiúsculas, sem acento, espaços normalizados. */
function chaveNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

interface Referencia {
  peso: number | null;
  reps: number | null;
}

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly db = inject(DbService);

  private todas(): Promise<Sessao[]> {
    return this.db.getAll<Sessao>('sessoes');
  }

  private concluidasDe(todas: Sessao[], treinoId: string): Sessao[] {
    return todas
      .filter((s) => s.treinoId === treinoId && s.status !== 'rascunho')
      .sort((a, b) => a.ordem - b.ordem);
  }

  async obter(id: string): Promise<Sessao | undefined> {
    return this.db.get<Sessao>('sessoes', id);
  }

  /** Sessões concluídas de um treino, da mais antiga para a mais recente. */
  async porTreino(treinoId: string): Promise<Sessao[]> {
    return this.concluidasDe(await this.todas(), treinoId);
  }

  /** Todas as sessões concluídas (todos os treinos). */
  async concluidas(): Promise<Sessao[]> {
    return (await this.todas()).filter((s) => s.status !== 'rascunho');
  }

  /** Última sessão concluída de um treino. */
  async ultima(treinoId: string): Promise<Sessao | undefined> {
    return this.concluidasDe(await this.todas(), treinoId).at(-1);
  }

  /** Retorna o rascunho em andamento para um treino, se existir. */
  async buscarRascunho(treinoId: string): Promise<Sessao | undefined> {
    return (await this.todas())
      .filter((s) => s.treinoId === treinoId && s.status === 'rascunho')
      .sort((a, b) => b.ordem - a.ordem)
      .at(0);
  }

  /** Concluídas da mais recente para a mais antiga; sessões antigas sem data vão para o fim. */
  private recentesPrimeiro(todas: Sessao[]): Sessao[] {
    return todas
      .filter((s) => s.status !== 'rascunho')
      .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? '') || b.ordem - a.ordem);
  }

  /**
   * Última referência de cada série de um exercício: peso e reps da vez mais recente em
   * que aquela série foi preenchida, em qualquer sessão concluída. Casa pelo id do
   * exercício ou pelo nome, para a carga sobreviver à troca de ficha (a "Cadeira flexora"
   * do treino novo herda a do treino antigo). Uma sessão em que o exercício ficou em
   * branco não apaga a referência: ela só muda quando outro valor é preenchido.
   */
  private referencias(ex: Exercicio, recentesPrimeiro: Sessao[]): Referencia[] {
    const chave = chaveNome(ex.nome);
    const itens: ItemSessao[] = [];
    for (const s of recentesPrimeiro) {
      for (const item of s.itens) {
        if (item.exercicioId === ex.id || chaveNome(item.nomeExercicio) === chave) itens.push(item);
      }
    }
    return Array.from({ length: ex.series }, (_, idx) => {
      const ref: Referencia = { peso: null, reps: null };
      for (const item of itens) {
        if (item.series.length === 0) continue;
        // série além das que existiam naquela vez: herda a última daquela vez
        const serie = item.series[Math.min(idx, item.series.length - 1)];
        if (ref.peso === null && serie.peso != null) ref.peso = serie.peso;
        if (ref.reps === null && serie.reps != null) ref.reps = serie.reps;
        if (ref.peso !== null && ref.reps !== null) break;
      }
      return ref;
    });
  }

  private montarItens(treino: Treino, todas: Sessao[], preencherPeso: boolean): ItemSessao[] {
    const recentes = this.recentesPrimeiro(todas);
    return treino.exercicios.map((ex) => {
      const series: RegistroSerie[] = this.referencias(ex, recentes).map((ref) => ({
        peso: preencherPeso ? ref.peso : null,
        reps: ref.reps ?? ex.repsMin ?? ex.reps ?? null,
        pesoAnterior: ref.peso,
      }));
      return { exercicioId: ex.id, nomeExercicio: ex.nome, series, notas: '' };
    });
  }

  /**
   * Monta uma nova sessão a partir do treino atual. O peso começa VAZIO (sessão nova e
   * limpa), com a última carga conhecida em `pesoAnterior`, exibida apagada como
   * referência. As reps já vêm pré-preenchidas com as da última vez.
   */
  async novaSessao(treino: Treino): Promise<Sessao> {
    const todas = await this.todas();
    const anterior = this.concluidasDe(todas, treino.id).at(-1);
    return {
      id: uid(),
      treinoId: treino.id,
      ordem: anterior ? anterior.ordem + 1 : 1,
      itens: this.montarItens(treino, todas, false),
      data: hojeLocal(),
      status: 'rascunho',
    };
  }

  /** Sessão concluída numa data passada, já preenchida com as últimas cargas conhecidas. */
  async criarRetroativo(treino: Treino, data: string): Promise<Sessao> {
    const todas = await this.todas();
    const anterior = this.concluidasDe(todas, treino.id).at(-1);
    const sessao: Sessao = {
      id: uid(),
      treinoId: treino.id,
      ordem: anterior ? anterior.ordem + 1 : 1,
      itens: this.montarItens(treino, todas, true),
      data,
      status: 'concluida',
    };
    await this.db.put('sessoes', sessao);
    return sessao;
  }

  async salvar(sessao: Sessao): Promise<void> {
    await this.db.put('sessoes', sessao);
  }

  async remover(id: string): Promise<void> {
    await this.db.delete('sessoes', id);
  }
}
