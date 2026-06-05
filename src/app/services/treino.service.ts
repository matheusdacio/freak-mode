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
    lista.sort((a, b) => a.nome.localeCompare(b.nome));
    this.treinos.set(lista);
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
    const treino: Treino = { id: uid(), nome: nome.trim(), exercicios: [] };
    await this.salvar(treino);
    return treino;
  }

  async remover(id: string): Promise<void> {
    await this.db.delete('treinos', id);
    await this.carregar();
  }

  novoExercicio(nome: string, series: number): Exercicio {
    return { id: uid(), nome: nome.trim(), series };
  }
}
