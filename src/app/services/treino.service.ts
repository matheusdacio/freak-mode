import { computed, inject, Injectable, signal } from '@angular/core';
import { Treino } from '@models/treino.model';
import { Exercicio } from '@models/exercicio.model';
import { DbService } from '@services/db.service';
import { FICHA_VERSAO, treinosFichaProfessor } from '../data/treino-seed';

function uid(): string {
  return crypto.randomUUID();
}

@Injectable({ providedIn: 'root' })
export class TreinoService {
  private readonly db = inject(DbService);

  readonly treinos = signal<Treino[]>([]);
  readonly carregado = signal(false);

  /** Treinos em uso (lista principal). */
  readonly ativos = computed(() => this.treinos().filter(t => !t.arquivado));
  readonly arquivados = computed(() => this.treinos().filter(t => t.arquivado));

  /** A ficha do professor já foi importada (ao menos um dos treinos A a E existe). */
  readonly fichaImportada = computed(() => {
    const ids = new Set(this.treinos().map(t => t.id));
    return treinosFichaProfessor().some(t => ids.has(t.id));
  });

  /** A ficha no código foi corrigida depois da importação. */
  readonly fichaDesatualizada = computed(() => {
    const porId = new Map(this.treinos().map(t => [t.id, t]));
    return treinosFichaProfessor().some(t => {
      const gravado = porId.get(t.id);
      return !!gravado && (gravado.fichaVersao ?? 1) < FICHA_VERSAO;
    });
  });

  async carregar(): Promise<void> {
    const lista = await this.db.getAll<Treino>('treinos');

    const comOrdem = lista
      .filter(t => t.ordem !== undefined)
      .sort((a, b) => a.ordem! - b.ordem!);
    const semOrdem = lista
      .filter(t => t.ordem === undefined)
      .sort((a, b) => a.nome.localeCompare(b.nome));
    const ordenados = [...comOrdem, ...semOrdem];

    const updates: Promise<void>[] = [];
    for (let i = 0; i < ordenados.length; i++) {
      if (ordenados[i].ordem !== i) {
        ordenados[i] = { ...ordenados[i], ordem: i };
        updates.push(this.db.put('treinos', ordenados[i]));
      }
    }
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    this.treinos.set(ordenados);
    this.carregado.set(true);

    // Ficha corrigida no código: aplica sozinho, sem esperar um toque, para o próximo
    // treino já abrir certo. A regravação sobe a versão, então a recarga não repete.
    if (this.fichaDesatualizada()) {
      await this.gravarFicha(true);
      await this.carregar();
    }
  }

  async obter(id: string): Promise<Treino | undefined> {
    return this.db.get<Treino>('treinos', id);
  }

  async salvar(treino: Treino): Promise<void> {
    await this.db.put('treinos', treino);
    await this.carregar();
  }

  async criar(nome: string): Promise<Treino> {
    const treino: Treino = {
      id: uid(),
      nome: nome.trim(),
      exercicios: [],
      ordem: this.treinos().length,
    };
    await this.salvar(treino);
    return treino;
  }

  async remover(id: string): Promise<void> {
    await this.db.delete('treinos', id);
    await this.carregar();
  }

  /** Reordena os treinos ativos; os arquivados ficam depois deles. */
  async reordenar(lista: Treino[]): Promise<void> {
    const completa = [...lista, ...this.arquivados()];
    await Promise.all(completa.map((t, i) => this.db.put('treinos', { ...t, ordem: i })));
    await this.carregar();
  }

  async arquivar(treino: Treino, arquivado: boolean): Promise<void> {
    await this.salvar({ ...treino, arquivado: arquivado || undefined });
  }

  /**
   * Grava os treinos da ficha. O que é do usuário (capa, posição, arquivado) fica; nome,
   * exercícios e observações vêm da ficha. Com `apenasExistentes`, não ressuscita um
   * treino da ficha que o usuário excluiu.
   */
  private async gravarFicha(apenasExistentes: boolean): Promise<void> {
    const atuais = new Map(this.treinos().map(t => [t.id, t]));
    await Promise.all(
      treinosFichaProfessor()
        .filter(t => !apenasExistentes || atuais.has(t.id))
        .map(t => {
          const atual = atuais.get(t.id);
          return this.db.put('treinos', {
            ...t,
            ordem: atual?.ordem ?? t.ordem,
            capa: atual?.capa,
            arquivado: atual?.arquivado,
          });
        }),
    );
  }

  /** Primeira importação: grava A a E e arquiva os treinos que estavam em uso. */
  async importarFichaProfessor(): Promise<void> {
    const idsFicha = new Set(treinosFichaProfessor().map(t => t.id));
    const outros = this.treinos().filter(t => !idsFicha.has(t.id));
    await Promise.all([
      this.gravarFicha(false),
      ...outros.map((t, i) =>
        this.db.put('treinos', { ...t, arquivado: true, ordem: idsFicha.size + i }),
      ),
    ]);
    await this.carregar();
  }

  novoExercicio(nome: string, series: number): Exercicio {
    return { id: uid(), nome: nome.trim(), series };
  }
}
