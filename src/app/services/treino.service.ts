import { inject, Injectable, signal } from '@angular/core';
import { Treino } from '@models/treino.model';
import { Exercicio } from '@models/exercicio.model';
import { DbService } from '@services/db.service';

function uid(): string {
  return crypto.randomUUID();
}

@Injectable({ providedIn: 'root' })
export class TreinoService {
  private readonly db = inject(DbService);

  readonly treinos = signal<Treino[]>([]);
  readonly carregado = signal(false);

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

  async reordenar(lista: Treino[]): Promise<void> {
    await Promise.all(lista.map((t, i) => this.db.put('treinos', { ...t, ordem: i })));
    await this.carregar();
  }

  novoExercicio(nome: string, series: number): Exercicio {
    return { id: uid(), nome: nome.trim(), series };
  }
}
