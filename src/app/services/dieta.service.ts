import { inject, Injectable } from '@angular/core';
import { DbService } from '@services/db.service';
import {
  Alimento,
  DiaDieta,
  ItemRefeicao,
  Macros,
  MetasDieta,
  Refeicao,
} from '@models/dieta.model';

function uid(): string {
  return crypto.randomUUID();
}

const REFEICOES_PADRAO = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar'];
const METAS_ID = 'metas-dieta';
const METAS_PADRAO: MetasDieta = {
  id: METAS_ID,
  kcal: 2000,
  proteina: 150,
  carbo: 200,
  gordura: 60,
};

@Injectable({ providedIn: 'root' })
export class DietaService {
  private readonly db = inject(DbService);

  /** Data de hoje no formato YYYY-MM-DD (local). */
  hoje(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ---- Biblioteca de alimentos ----
  async listarAlimentos(): Promise<Alimento[]> {
    const todos = await this.db.getAll<Alimento>('alimentos');
    return todos.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  novoAlimento(dados: Omit<Alimento, 'id'>): Alimento {
    return { id: uid(), ...dados };
  }

  async salvarAlimento(alimento: Alimento): Promise<void> {
    await this.db.put('alimentos', alimento);
  }

  async removerAlimento(id: string): Promise<void> {
    await this.db.delete('alimentos', id);
  }

  // ---- Metas ----
  async obterMetas(): Promise<MetasDieta> {
    const m = await this.db.get<MetasDieta>('config', METAS_ID);
    return m ?? { ...METAS_PADRAO };
  }

  async salvarMetas(metas: MetasDieta): Promise<void> {
    await this.db.put('config', { ...metas, id: METAS_ID });
  }

  // ---- Dia de dieta ----
  /** Busca o dia; se não existir, retorna um novo (não persistido) com refeições padrão. */
  async obterDia(data: string): Promise<DiaDieta> {
    const existente = await this.db.get<DiaDieta>('dieta', data);
    if (existente) return existente;
    return {
      id: data,
      data,
      refeicoes: REFEICOES_PADRAO.map((nome) => ({ id: uid(), nome, itens: [] })),
    };
  }

  async salvarDia(dia: DiaDieta): Promise<void> {
    await this.db.put('dieta', dia);
  }

  // ---- Helpers de macros ----
  /** Cria um item de refeição a partir de um alimento e quantidade (multiplicador). */
  criarItem(alimento: Alimento, quantidade: number): ItemRefeicao {
    const q = quantidade > 0 ? quantidade : 1;
    return {
      id: uid(),
      alimentoId: alimento.id,
      nome: alimento.nome,
      porcao: alimento.porcao,
      quantidade: q,
      kcal: Math.round(alimento.kcal * q),
      proteina: this.arred(alimento.proteina * q),
      carbo: this.arred(alimento.carbo * q),
      gordura: this.arred(alimento.gordura * q),
    };
  }

  totaisRefeicao(ref: Refeicao): Macros {
    return this.somar(ref.itens);
  }

  totaisDia(dia: DiaDieta): Macros {
    return this.somar(dia.refeicoes.flatMap((r) => r.itens));
  }

  private somar(itens: ItemRefeicao[]): Macros {
    return itens.reduce<Macros>(
      (acc, i) => ({
        kcal: acc.kcal + (i.kcal || 0),
        proteina: this.arred(acc.proteina + (i.proteina || 0)),
        carbo: this.arred(acc.carbo + (i.carbo || 0)),
        gordura: this.arred(acc.gordura + (i.gordura || 0)),
      }),
      { kcal: 0, proteina: 0, carbo: 0, gordura: 0 },
    );
  }

  private arred(n: number): number {
    return Math.round(n * 10) / 10;
  }
}
